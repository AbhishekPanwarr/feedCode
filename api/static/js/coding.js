// DOM Elements
const codeEditor = document.getElementById('codeEditor');
const submitButton = document.getElementById('submitButton');
const loadingSpinner = document.getElementById('loadingSpinner');
const initialMessage = document.getElementById('initialMessage');
const feedbackWrapper = document.getElementById('feedbackWrapper');
const feedbackSmall = document.getElementById('feedbackSmall');
const toggleDetailed = document.getElementById('toggleDetailed');
const chevronIcon = document.getElementById('chevronIcon');
const toggleText = document.getElementById('toggleText');
const detailedFeedback = document.getElementById('detailedFeedback');
const feedbackDetailed = document.getElementById('feedbackDetailed');
const lineNumbers = document.getElementById('lineNumbers');

// State
let isLoading = false;
let showingDetailed = false;

// Get username from URL
const username = window.location.pathname.split('/')[2] || 'default';
const apiUrl = `/api/feedback/${username}`;

// Update line numbers
function updateLineNumbers() {
    const lines = codeEditor.value.split('\n').length;
    lineNumbers.innerHTML = Array(lines)
        .fill(0)
        .map((_, i) => `<div>${i + 1}</div>`)
        .join('');
}

// Handle tab key in editor
function handleTabKey(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;

        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
        updateLineNumbers();
    }
}

// Toggle detailed feedback
function toggleDetailedFeedback() {
    showingDetailed = !showingDetailed;
    detailedFeedback.classList.toggle('hidden', !showingDetailed);
    
    // Update button text and icon
    toggleText.textContent = showingDetailed ? 'Hide Detailed Feedback' : 'View Detailed Feedback';
    chevronIcon.innerHTML = showingDetailed 
        ? '<path d="m18 15-6-6-6 6"/>'
        : '<path d="m6 9 6 6 6-6"/>';
}

// Set loading state
function setLoading(loading) {
    isLoading = loading;
    // submitButton.disabled = loading;
    loadingSpinner.classList.toggle('hidden', !loading);
    
    if (loading) {
        initialMessage.classList.remove('hidden');
        feedbackWrapper.classList.add('hidden');
    }
}

// Update feedback display
function updateFeedbackDisplay(feedbackSmallText, feedbackDetailedText) {
    // Hide loading and initial message
    loadingSpinner.classList.add('hidden');
    initialMessage.classList.add('hidden');
    
    // Update feedback content
    feedbackSmall.textContent = feedbackSmallText;
    feedbackDetailed.textContent = feedbackDetailedText;
    
    // Show feedback wrapper
    feedbackWrapper.classList.remove('hidden');
    
    // Reset detailed view
    showingDetailed = false;
    detailedFeedback.classList.add('hidden');
    toggleText.textContent = 'View Detailed Feedback';
    chevronIcon.innerHTML = '<path d="m6 9 6 6 6-6"/>';
}

// Handle form submission
async function handleSubmit() {
    const code = codeEditor.value.trim();
    
    if (!code) {
        alert('Please enter some code before submitting.');
        return;
    }

    setLoading(true);
    
    try {
        const response = await fetch(apiUrl, {
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
        updateFeedbackDisplay(data.feedback_small, data.feedback_detailed);
        
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while getting feedback. Please try again.');
        setLoading(false);
    }
}

// Event Listeners
codeEditor.addEventListener('input', updateLineNumbers);
codeEditor.addEventListener('keydown', handleTabKey);
submitButton.addEventListener('click', handleSubmit);
toggleDetailed.addEventListener('click', toggleDetailedFeedback);

// Initialize line numbers
updateLineNumbers();

// Add keyboard shortcut for submit (Ctrl/Cmd + Enter)
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit();
    }
});