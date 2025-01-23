// DOM Elements
const codeEditor = document.getElementById('codeEditor');
const submitButton = document.getElementById('submitCode');
const feedbackContainer = document.getElementById('feedbackContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const lineNumbers = document.querySelector('.line-numbers');

// State
let isLoading = false;

// Line Numbers
function updateLineNumbers() {
    const lines = codeEditor.value.split('\n').length;
    lineNumbers.innerHTML = Array(lines)
        .fill(0)
        .map((_, i) => `<div>${i + 1}</div>`)
        .join('');
}

// API Functions
async function getFeedback(code) {
    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            throw new Error('Failed to get feedback');
        }

        const data = await response.json();
        return data.feedback;
    } catch (error) {
        console.error('Error getting feedback:', error);
        return [{
            type: 'error',
            message: 'Failed to get feedback. Please try again.'
        }];
    }
}

// UI Functions
function createFeedbackElement(feedback) {
    const feedbackItem = document.createElement('div');
    feedbackItem.className = `feedback-item ${feedback.type}`;

    const title = document.createElement('div');
    title.className = 'feedback-title';
    title.textContent = feedback.type === 'error' ? '❌ Error' : '✅ Success';

    const message = document.createElement('div');
    message.className = 'feedback-message';
    message.textContent = feedback.message;

    feedbackItem.appendChild(title);
    feedbackItem.appendChild(message);

    setTimeout(() => {
        feedbackItem.remove();
    }, 5000);

    return feedbackItem;
}

function updateFeedbackDisplay(feedbackItems) {
    feedbackItems.forEach(item => {
        const feedbackElement = createFeedbackElement(item);
        feedbackContainer.appendChild(feedbackElement);
    });
}

function setLoading(loading) {
    isLoading = loading;
    submitButton.disabled = loading;
    loadingOverlay.classList.toggle('hidden', !loading);
}

// Event Handlers
async function handleSubmit() {
    const code = codeEditor.value.trim();
    
    if (!code) {
        updateFeedbackDisplay([{
            type: 'error',
            message: 'Please enter some code before submitting.'
        }]);
        return;
    }

    setLoading(true);
    
    try {
        const feedback = await getFeedback(code);
        updateFeedbackDisplay(feedback);
    } catch (error) {
        console.error('Error:', error);
        updateFeedbackDisplay([{
            type: 'error',
            message: 'An unexpected error occurred. Please try again.'
        }]);
    } finally {
        setLoading(false);
    }
}

// Event Listeners
submitButton.addEventListener('click', handleSubmit);
codeEditor.addEventListener('input', updateLineNumbers);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateLineNumbers();
    
    // Enable tab key in textarea
    codeEditor.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
            updateLineNumbers();
        }
    });
});

// Optional: Add keyboard shortcut for submit (Ctrl/Cmd + Enter)
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit();
    }
});