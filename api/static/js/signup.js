const scrapeBtn = document.getElementById('scrapeBtn');
const reasoningBtn = document.getElementById('reasoningBtn');
const registerBtn = document.getElementById('registerBtn');
let scrapingComplete = true;
let reasoningComplete = false;

// Function to show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Function to clear error messages
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.style.display = 'none';
    });
}

// Function to validate inputs
function validateInputs() {
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    let csesUsername = document.getElementById('cses_username').value;
    let csesPassword = document.getElementById('cses_password').value;

    clearErrors();
    let isValid = true;

    if (!username) {
        showError('username-error', 'Username is required');
        isValid = false;
    }
    if (!password) {
        showError('password-error', 'Password is required');
        isValid = false;
    }
    if (!csesUsername) {
        showError('cses-username-error', 'CSES username is required');
        isValid = false;
    }
    if (!csesPassword) {
        showError('cses-password-error', 'CSES password is required');
        isValid = false;
    }

    return isValid;
}

// Scrape button click handler
scrapeBtn.addEventListener('click', async () => {
    if (!validateInputs()) return;

    const csesUsername = document.getElementById('cses_username').value;
    const csesPassword = document.getElementById('cses_password').value;

    scrapeBtn.disabled = true;
    scrapeBtn.textContent = 'Scraping...';

    try {
        const response = await fetch('/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cses_username: csesUsername,
                cses_password: csesPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            scrapeBtn.classList.add('success');
            scrapeBtn.textContent = 'Scraping Complete';
            reasoningBtn.disabled = false;
            scrapingComplete = true;
        } else {
            throw new Error(data.message || 'Scraping failed');
        }
    } catch (error) {
        showError('cses-username-error', error.message);
        scrapeBtn.textContent = 'Scrape';
        scrapeBtn.disabled = false;
    }
});

// Reasoning button click handler
reasoningBtn.addEventListener('click', async () => {
    if (!validateInputs() || !scrapingComplete) return;

    reasoningBtn.disabled = true;
    reasoningBtn.textContent = 'Generating...';

    try {
        const response = await fetch('/generate-reasoning', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cses_username: document.getElementById('cses_username').value
            })
        });

        const data = await response.json();

        if (response.ok) {
            reasoningBtn.classList.add('success');
            reasoningBtn.textContent = 'Reasoning Generated';
            registerBtn.disabled = false;
            reasoningComplete = true;
        } else {
            throw new Error(data.message || 'Reasoning generation failed');
        }
    } catch (error) {
        showError('cses-username-error', error.message);
        reasoningBtn.textContent = 'Generate Reasoning';
        reasoningBtn.disabled = false;
    }
});

// Register button click handler
registerBtn.addEventListener('click', async () => {
    if (!validateInputs() || !scrapingComplete || !reasoningComplete) return;

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    registerBtn.disabled = true;
    registerBtn.textContent = 'Registering...';

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful!');
            window.location.href = data.redirect // Redirect to login page
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    } catch (error) {
        showError('username-error', error.message);
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
    }
});