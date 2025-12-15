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
    const headerTitle = document.getElementById('headerTitle');
    const headerSubtext = document.getElementById('headerSubtext');
    const modeLink = document.getElementById('modeLink');
    const nameGroup = document.getElementById('nameGroup');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const passwordRequirements = document.getElementById('passwordRequirements');
    const reqLength = document.getElementById('req-length');
    const reqUpper = document.getElementById('req-upper');
    const reqLower = document.getElementById('req-lower');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');
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

    function setRequirementState(itemEl, isValid) {
        if (!itemEl) return;
        const icon = itemEl.querySelector('.req-icon');
        if (isValid) {
            itemEl.classList.add('valid');
            if (icon) icon.textContent = '✓';
        } else {
            itemEl.classList.remove('valid');
            if (icon) icon.textContent = '○';
        }
    }

    function validatePassword(password) {
        const errors = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (password.length > 128) {
            errors.push('Password must be less than 128 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character (!@#$%^&*...)');
        }
        if (password.toLowerCase().includes('password')) {
            errors.push('Password cannot contain the word "password"');
        }
        if (/(.)\1{3,}/.test(password)) {
            errors.push('Password cannot contain the same character repeated 4 times or more');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    function updatePasswordRequirements(password) {
        if (!passwordRequirements || passwordRequirements.style.display === 'none') {
            return;
        }
        const lenOk = password.length >= 8;
        const upperOk = /[A-Z]/.test(password);
        const lowerOk = /[a-z]/.test(password);
        const numberOk = /[0-9]/.test(password);
        const specialOk = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        setRequirementState(reqLength, lenOk);
        setRequirementState(reqUpper, upperOk);
        setRequirementState(reqLower, lowerOk);
        setRequirementState(reqNumber, numberOk);
        setRequirementState(reqSpecial, specialOk);
    }

    function switchToLogin() {
        isSignUpMode = false;
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
        if (headerTitle) {
            headerTitle.textContent = 'Sign in to your account';
        }
        if (headerSubtext && modeLink) {
            headerSubtext.innerHTML = 'Or ';
            headerSubtext.appendChild(modeLink);
            modeLink.textContent = 'create a new account';
        }
        submitButton.textContent = 'Sign In';
        nameGroup.style.display = 'none';
        confirmPasswordGroup.style.display = 'none';
        if (passwordRequirements) {
            passwordRequirements.style.display = 'none';
        }
        nameInput.removeAttribute('required');
        confirmPasswordInput.removeAttribute('required');
        authForm.reset();
        updatePasswordRequirements('');
    }

    function switchToSignUp() {
        isSignUpMode = true;
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        if (headerTitle) {
            headerTitle.textContent = 'Create your account';
        }
        if (headerSubtext && modeLink) {
            headerSubtext.innerHTML = 'Or ';
            headerSubtext.appendChild(modeLink);
            modeLink.textContent = 'sign in to your existing account';
        }
        submitButton.textContent = 'Sign Up';
        nameGroup.style.display = 'block';
        confirmPasswordGroup.style.display = 'block';
        nameInput.setAttribute('required', 'required');
        confirmPasswordInput.setAttribute('required', 'required');
        if (passwordRequirements) {
            passwordRequirements.style.display = 'block';
        }
        authForm.reset();
        updatePasswordRequirements('');
    }

    // Toggle between login and sign up
    loginToggle.addEventListener('click', switchToLogin);
    signupToggle.addEventListener('click', switchToSignUp);
    if (modeLink) {
        modeLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (isSignUpMode) {
                switchToLogin();
            } else {
                switchToSignUp();
            }
        });
    }

    // Live password requirement updates (signup mode)
    passwordInput.addEventListener('input', () => {
        updatePasswordRequirements(passwordInput.value || '');
    });

    // Google OAuth configuration
    // Note: You'll need to replace this with your actual Google OAuth Client ID
    // Get it from: https://console.cloud.google.com/apis/credentials
    // For localhost testing, add http://localhost and http://localhost:PORT to authorized origins
    const GOOGLE_CLIENT_ID = '900779586767-28d4m48cbsoei4vjchl730b6as732kev.apps.googleusercontent.com'; // Replace with your actual Client ID
    
    // Initialize Google Sign-In when the script loads
    let googleInitialized = false;
    const googleButton = document.getElementById('googleButton');
    
    function initializeGoogleSignIn() {
        if (googleInitialized) return;
        
        // Check if Google Client ID is configured
        if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
            if (googleButton) {
                googleButton.style.display = 'none';
            }
            console.warn('Google OAuth Client ID not configured. Please set GOOGLE_CLIENT_ID in login.js');
            return;
        }
        
        // Wait for Google API to load
        if (typeof google === 'undefined' || !google.accounts) {
            setTimeout(initializeGoogleSignIn, 100);
            return;
        }

        try {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleSignIn,
                auto_select: false,
                cancel_on_tap_outside: true
            });

            // Render the button
            if (googleButton) {
                google.accounts.id.renderButton(
                    googleButton,
                    {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        text: 'signin_with',
                        width: '100%'
                    }
                );
            }

            googleInitialized = true;
        } catch (error) {
            console.error('Error initializing Google Sign-In:', error);
            if (googleButton) {
                googleButton.style.display = 'none';
            }
        }
    }

    async function handleGoogleSignIn(response) {
        try {
            // Decode the JWT token (simplified - in production, verify signature)
            const tokenParts = response.credential.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));
            
            const email = payload.email;
            const name = payload.name || payload.given_name || email.split('@')[0];
            const idToken = response.credential;

            if (!email) {
                showMessage('Failed to get email from Google account', 'error');
                return;
            }

            if (googleButton) {
                googleButton.style.pointerEvents = 'none';
                googleButton.style.opacity = '0.6';
            }

            // Send to backend (which proxies to auth server)
            const responseData = await fetch(`${API_BASE_URL}/api/google-oauth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken,
                    email,
                    name
                }),
            });

            const data = await responseData.json();

            if (responseData.ok && data.success && data.token) {
                showMessage('Login successful! VS Code will detect the login automatically.', 'success');
                
                // The token is already stored on the server, VS Code will poll for it
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
                showMessage(data.error || 'Google sign-in failed. Please try again.', 'error');
                if (googleButton) {
                    googleButton.style.pointerEvents = 'auto';
                    googleButton.style.opacity = '1';
                }
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            showMessage('Google sign-in error. Please try again.', 'error');
            if (googleButton) {
                googleButton.style.pointerEvents = 'auto';
                googleButton.style.opacity = '1';
            }
        }
    }

    // Initialize Google Sign-In when page loads
    window.addEventListener('load', () => {
        setTimeout(initializeGoogleSignIn, 500);
    });

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

            const passwordResult = validatePassword(password);
            if (!passwordResult.isValid) {
                showMessage(passwordResult.errors[0] || 'Password does not meet requirements', 'error');
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

