(function() {
    'use strict';
    
    // Backend API base URL - will be replaced by extension
    const API_BASE_URL = '{{API_BASE_URL}}';
    
    let isSignUpMode = false;
    
    const messageEl = document.getElementById('message');
    const authForm = document.getElementById('authForm');
    const submitButton = document.getElementById('submitButton');
    const loginToggle = document.getElementById('loginToggle');
    const signupToggle = document.getElementById('signupToggle');
    const headerSubtext = document.getElementById('headerSubtext');
    const nameGroup = document.getElementById('nameGroup');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    function showMessage(text, type) {
        messageEl.textContent = text;
        messageEl.className = 'message ' + type + ' show';
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 5000);
    }

    function switchToLogin() {
        isSignUpMode = false;
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
        headerSubtext.textContent = 'Sign in to continue';
        submitButton.textContent = 'Sign In';
        nameGroup.style.display = 'none';
        confirmPasswordGroup.style.display = 'none';
        nameInput.removeAttribute('required');
        confirmPasswordInput.removeAttribute('required');
        authForm.reset();
    }

    function switchToSignUp() {
        isSignUpMode = true;
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        headerSubtext.textContent = 'Create your account';
        submitButton.textContent = 'Sign Up';
        nameGroup.style.display = 'block';
        confirmPasswordGroup.style.display = 'block';
        nameInput.setAttribute('required', 'required');
        confirmPasswordInput.setAttribute('required', 'required');
        authForm.reset();
    }

    // Toggle between login and sign up
    loginToggle.addEventListener('click', switchToLogin);
    signupToggle.addEventListener('click', switchToSignUp);

    // Handle form submission (login or sign up)
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const name = nameInput.value.trim();
        const confirmPassword = confirmPasswordInput.value;

        if (!email || !password) {
            showMessage('Please enter both email and password', 'error');
            return;
        }

        if (isSignUpMode) {
            if (!name) {
                showMessage('Please enter your full name', 'error');
                return;
            }
            if (password !== confirmPassword) {
                showMessage('Passwords do not match', 'error');
                return;
            }
            if (password.length < 8) {
                showMessage('Password must be at least 8 characters long', 'error');
                return;
            }
        }

        submitButton.disabled = true;
        submitButton.textContent = isSignUpMode ? 'Creating account...' : 'Signing in...';

        try {
            const endpoint = isSignUpMode ? '/api/signup' : '/api/login';
            const payload = isSignUpMode 
                ? { name, email, password }
                : { email, password };

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success && data.token) {
                // Show success message
                showMessage(isSignUpMode ? 'Account created! VS Code will detect the login automatically.' : 'Login successful! VS Code will detect the login automatically.', 'success');
                
                // The token is already stored on the server, VS Code will poll for it
                // Also try to open VS Code via URI scheme as a backup
                const callbackUrl = `vscode://reqbeam/callback?token=${encodeURIComponent(data.token)}`;
                try {
                    window.location.href = callbackUrl;
                } catch (e) {
                    console.error('Error with window.location:', e);
                }
                
                // Show success message that VS Code should detect it
                setTimeout(() => {
                    const container = document.querySelector('.login-container');
                    const infoDiv = document.createElement('div');
                    infoDiv.style.marginTop = '20px';
                    infoDiv.style.padding = '15px';
                    infoDiv.style.backgroundColor = '#e8f5e9';
                    infoDiv.style.borderRadius = '8px';
                    infoDiv.style.textAlign = 'center';
                    infoDiv.style.color = '#2e7d32';
                    infoDiv.innerHTML = '<p style="margin: 0; font-size: 14px;">✓ Login successful!<br>VS Code should detect the login automatically.<br>You can close this window.</p>';
                    container.appendChild(infoDiv);
                }, 500);
            } else {
                showMessage(data.error || (isSignUpMode ? 'Sign up failed. Please try again.' : 'Login failed. Please check your credentials.'), 'error');
                submitButton.disabled = false;
                submitButton.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
            }
        } catch (error) {
            showMessage('Network error. Please check your connection and try again.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
        }
    });
})();

