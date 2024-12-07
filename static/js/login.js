document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "logged_in") {
            // Redirect to the coding page if redirect URL is provided
            window.location.href = data.redirect;
        } else if (data.error) {
            // Handle error message
            alert(data.error);
        }
    })
    .catch(error => console.error('Error:', error));
});
