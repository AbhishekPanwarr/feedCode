const questions = [
    "What is your greatest strength?",
    "What is your greatest weakness?",
    "Why should we hire you?",
    "Where do you see yourself in 5 years?",
    "What are your salary expectations?"
];

let currentQuestionIndex = 0;
const answers = [];

document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Get user details
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Store the answer for the current question
    answers[currentQuestionIndex] = document.getElementById('question-answer').value;

    // Send signup request to the backend
    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, answers })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.success) {
            // Redirect to questions page or another appropriate page
            window.location.href = "{{ url_for(login) }}";
        }
    })
    .catch(error => console.error('Error:', error));
});

// Function to update question and answer field
function updateQuestion() {
    document.getElementById('question-answer').value = answers[currentQuestionIndex] || '';
    document.getElementById('question-indicator').textContent = `Question ${currentQuestionIndex + 1}: ${questions[currentQuestionIndex]}`;
}

// Function to show the next question
function showNextQuestion() {
    answers[currentQuestionIndex] = document.getElementById('question-answer').value;
    currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
    updateQuestion();
}

// Function to show the previous question
function showPreviousQuestion() {
    answers[currentQuestionIndex] = document.getElementById('question-answer').value;
    currentQuestionIndex = (currentQuestionIndex - 1 + questions.length) % questions.length;
    updateQuestion();
}

// Initialize with the first question
updateQuestion();
