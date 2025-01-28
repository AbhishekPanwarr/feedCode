import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from flask import Flask, request, jsonify, make_response, render_template, redirect, url_for
from datetime import datetime
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from flask_pymongo import PyMongo
from email_validator import validate_email, EmailNotValidError
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from passlib.hash import sha256_crypt
from flask_cors import CORS
from dotenv import load_dotenv
import prompting
from calling import reasoning
import time
from cses_scraper import main

load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app, resources={r"/*": {"origins": f"{os.getenv('CLIENT_URL')}"}}, supports_credentials=True)
app.config["JWT_SECRET_KEY"] = f"{os.getenv('JWT_SECRET_KEY')}"
jwt = JWTManager(app)
uri = f'mongodb+srv://{os.getenv("MONGO_USER")}:{os.getenv("MONGO_PASSWORD")}@feedcodeusers.ujwgd.mongodb.net/?retryWrites=true&w=majority&appName=feedCodeUsers'
client = MongoClient(uri, server_api=ServerApi('1'))
mongo = client.get_database('FeedCode')
users_collection = mongo.get_collection('users')
solutions_db = mongo.get_collection('Solutions')

# Check MongoDB connection
@app.route('/ping-db', methods=['GET'])
def ping_db():
    client = MongoClient(uri, server_api=ServerApi('1'))
    try:
        client.admin.command('ping')
        return make_response(jsonify({"message": f"Pinged your deployment. You successfully connected to MongoDB!",}),201)
    except Exception as e:
        return make_response(jsonify({"message": f"connection failed",}),201)
    
    

@app.route("/")
def index():
    return f"FeedCode Index page"

@app.route("/login_page")
def login():
    return render_template("login.html")


@app.route("/login", methods=['POST'])
def loginUser():
    username = request.json.get("username")
    password = request.json.get("password")
    if sha256_crypt.verify(password, users_collection.find_one({"username":username})["password"]):

        _id = str(users_collection.find_one({"username":username})["_id"])
        access_token = create_access_token(identity=str(_id))
        response = make_response(jsonify({
            "message": "login successful",
            "status": "logged_in",
            "redirect" : url_for("codingPage", username=username)
        }),201)

        response.set_cookie('access_token', access_token, httponly=False, secure=False, samesite='None', domain='localhost', path='/')
        return response
    else:
        response = make_response(jsonify({
            "message": "login unsuccessful"
        }),400)

        return response


@app.route('/signup_page', methods=["GET"])
def signupPage():
    return render_template('signup.html') 


@app.route('/scrape', methods=["POST", "GET"])
def scrape():
    cses_username = request.json.get("cses_username", None)
    cses_password = request.json.get("cses_password", None)

    main(cses_username,cses_password)

    response = make_response(jsonify({
        "message": f"user solution successfully scrapped",
        "status" : "created",
    }),201)
    return response

@app.route('/generate-reasoning', methods=["POST", "GET"])
def get_reasoning():
    # Get all files sorted in reverse order and take first 5
    problem_names = sorted([sol for sol in os.listdir("./solved_problems")], reverse=True)[0:5]
    problem_names_db = []
    answers = []
    master_answers = []

    for problem in problem_names:
        name = problem.split(" ", 1)[1]  # Split only at first space
        name = name[:-2]  # Remove the .cc extension
        problem_names_db.append(name)

    print(problem_names_db)
    print(solutions_db)

    for problem_name in problem_names:
        with open(f"./solved_problems/{problem_name}") as sol:
            text = sol.read()
            answers.append(text)

    for problem in problem_names_db:
        document = solutions_db.find_one({'name':problem})
        if document:
            sol = document.get('answer', 'Answer not found')
        else:
            sol = 'Problem not found'
            
        master_answers.append(sol)
        
    prompt = prompting.prompt(tester_list=answers, master_list=master_answers)
    reasoning_gemini = reasoning(prompt)
    
    with open('userReasoning.txt','w') as myfile:
        myfile.write(reasoning_gemini[9:-4].strip())
    
    for problem_name in problem_names:
        try:
            os.remove(f'./solved_problems/{problem_name}')
        except FileNotFoundError:
            print("File does not exist")
        

    response = make_response(jsonify({
        "message": f"Reasoning saved",
        "status" : "Generated",
    }),201)
    return response

@app.route('/register', methods=["POST", "GET"])
def signupUser():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    reasoning_gemini  = ''
    with open("userReasoning.txt") as file:
        text = file.read()
        reasoning_gemini += text
    

    if not username or not password:
        return jsonify({
            "message": "Invalid request, please try again"
        }), 400
    
    users_collection = mongo.get_collection('users')

    if users_collection.find_one({"username": username}):

        return jsonify({
            "message": "user with the given username or email already exists"
        }), 400
    
    password = sha256_crypt.hash(password)
    

    _id = users_collection.insert_one({
        "username":username,
        "password": password,
        "created_at":datetime.now(),
        "reasoning": str(reasoning_gemini)
    }).inserted_id

    response = make_response(jsonify({
        "message": f"user with username: {username} created successfully",
        "status" : "created",
        "redirect" : url_for("login")
    }),201)

    return response


@app.route("/coding/<username>")
# @jwt_required()
def codingPage(username):
    return render_template('coding.html')


@app.route("/api/feedback/<username>", methods=["POST", "GET"])
def coding(username):
    users_collection = mongo.get_collection('users')

    user_dict = users_collection.find_one({"username": username})
    reason = user_dict["reasoning"]
    current_input = request.json.get("code", None)
    with open("prompt_LLM2.txt") as file:
        prompt = file.read()
    final_prompt_small = f"""
        {prompt}
        (1) Reasoning Dictionary:
        {reason}
        (2) Current User Code:
        {current_input}\n
        limit your response to 30 words
    """

    final_prompt_detailed = f"""
        {prompt}
        (1) Reasoning Dictionary:
        {reason}
        (2) Current User Code:
        {current_input}\n
    """

    feedback_gemini_small = reasoning(final_prompt_small)
    feedback_gemini = reasoning(final_prompt_detailed)
    response = make_response(jsonify({
        "message": "Feedback generated",
        "feedback_small": feedback_gemini_small,
        "feedback_detailed": feedback_gemini
    }),200)

    return response


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.getenv("PORT")))
