import os
from flask import Flask, request, jsonify, make_response, render_template, redirect, url_for
from datetime import datetime
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from flask_pymongo import PyMongo
from email_validator import validate_email, EmailNotValidError
from passlib.hash import sha256_crypt
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": f"{os.getenv('CLIENT_URL')}"}}, supports_credentials=True)
app.config["JWT_SECRET_KEY"] = f"{os.getenv('JWT_SECRET_KEY')}"

app.config['MONGO_URI'] = f"{os.getenv('MONGO_URI')}"

mongo = PyMongo(app)
jwt = JWTManager(app)


@app.route("/login_page")
def login():
    return render_template("login.html")


@app.route("/login", methods=['GET', 'POST'])
def loginUser():
    username = request.json.get("username")
    password = request.json.get("password")

    if sha256_crypt.verify(password, mongo.db.users.find_one({"username":username})["password"]):

        _id = str(mongo.db.users.find_one({"username":username})["_id"])
        access_token = create_access_token(identity=str(_id))

        response = make_response(jsonify({
            "message": "login successful",
            "access_token":access_token,
            "redirect" : url_for("coding", username=username)
        }),201)

        response.set_cookie('access_token', access_token, httponly=True, secure=False, samesite='None', domain='localhost', path='/')
        
        return response
    else:
        response = make_response(jsonify({
            "message": "login unsuccessful"
        }),400)

        return response


@app.route('/signup_page', methods=["GET"])
def signupPage():
    return render_template('signup.html') 

@app.route('/signup', methods=["POST", "GET"])
def signupUser():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    email = request.json.get("email", None)
    answers = request.json.get("answers", None)
     

    if not username or not password or not email:
        return jsonify({
            "message": "Invalid request, please try again"
        }), 400
    

    try:
        valid = validate_email(email)
        email = valid.email
    except EmailNotValidError as err:
        return jsonify({
            "error":str(err)
        }), 400
    
    users_collection = mongo.db.users

    if users_collection.find_one({"username": username}) or users_collection.find_one({"email": email}):

        return jsonify({
            "message": "user with the given username or email already exists"
        }), 400
    
    password = sha256_crypt.hash(password)
    

    _id = users_collection.insert_one({
        "username":username,
        "password": password,
        "email":email,
        "created_at":datetime.now(),
        "sol1": answers[0],
        "sol2": answers[1],
        "sol3": answers[2],
        "sol4": answers[3],
        "sol5": answers[4],
        "reasoning": "None" 
    }).inserted_id

    access_token = create_access_token(identity=str(_id))

    print(access_token, flush=True)

    response = make_response(jsonify({
        "message": f"user {username} created successfully",
        "access_token":access_token
    }),201)

    response.set_cookie('access_token', access_token, httponly=True, secure=True, samesite='strict')

    print(response, flush=True)
    print(url_for("login"))

    return response


@app.route("/coding/<username>")
def coding(username):
    return render_template('coding.html')

if __name__ == '__main__':
    app.run(debug=True, port=int(os.getenv("PORT")))