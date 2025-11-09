let isLoginMode = true;

// Функция для прямой регистрации аккаунта через код (без сервера)
function createAccountDirectly(username, email, password) {
    // Создаем ID пользователя
    const userId = Date.now().toString();
    
    // Создаем данные пользователя
    const userData = {
        id: userId,
        username: username,
        email: email,
        avatar: username.charAt(0).toUpperCase(),
        status: 'Online'
    };
    
    // Создаем токен
    const token = 'token_' + userId;
    
    // Сохраняем в localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // Если используется standalone версия с app_users
    const STORAGE_USERS = 'app_users';
    const usersStr = localStorage.getItem(STORAGE_USERS);
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    // Проверяем, нет ли уже такого пользователя
    if (users.find(u => u.email === email || u.username === username)) {
        console.warn('User already exists!');
        return false;
    }
    
    // Добавляем пользователя в список
    users.push({
        id: userId,
        username: username,
        email: email,
        password: password, // В реальном приложении нужно хешировать!
        avatar: username.charAt(0).toUpperCase(),
        status: 'Online',
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    
    console.log('Account created successfully!');
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('User ID:', userId);
    
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    // Автоматически создаем 2 тестовых аккаунта при загрузке
    const STORAGE_USERS = 'app_users';
    const usersStr = localStorage.getItem(STORAGE_USERS);
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    // Проверяем, есть ли уже пользователи
    const user1Exists = users.find(u => u.email === 'user1@test.com');
    const user2Exists = users.find(u => u.email === 'user2@test.com');
    
    if (!user1Exists) {
        createAccountDirectly('User1', 'user1@test.com', 'password123');
        // Очищаем токен после создания, чтобы не залогинило автоматически
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
    }
    
    if (!user2Exists) {
        createAccountDirectly('User2', 'user2@test.com', 'password123');
        // Очищаем токен после создания, чтобы не залогинило автоматически
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
    }
    
    initializeAuth();
});

function initializeAuth() {
    const authForm = document.getElementById('authForm');
    const switchLink = document.getElementById('switchLink');
    
    // Check if already logged in (only check, don't redirect immediately)
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    
    // Only redirect if we have both token and user data
    if (token && currentUser) {
        // Verify token is not expired by attempting to parse user data
        try {
            JSON.parse(currentUser);
            // Small delay to avoid redirect loops
            setTimeout(() => {
                window.location.replace('index.html');
            }, 100);
            return;
        } catch (e) {
            // Invalid user data, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
        }
    }
    
    authForm.addEventListener('submit', handleSubmit);
    switchLink.addEventListener('click', toggleMode);
}

function toggleMode(e) {
    e.preventDefault();
    
    isLoginMode = !isLoginMode;
    
    const usernameGroup = document.getElementById('usernameGroup');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const submitBtn = document.getElementById('submitBtn');
    const switchText = document.getElementById('switchText');
    const switchLink = document.getElementById('switchLink');
    
    if (isLoginMode) {
        usernameGroup.style.display = 'none';
        confirmPasswordGroup.style.display = 'none';
        submitBtn.textContent = 'Log In';
        switchText.textContent = 'Need an account?';
        switchLink.textContent = 'Register';
        document.querySelector('.logo h1').textContent = 'Welcome back!';
        document.querySelector('.logo p').textContent = "We're so excited to see you again!";
    } else {
        usernameGroup.style.display = 'block';
        confirmPasswordGroup.style.display = 'block';
        submitBtn.textContent = 'Register';
        switchText.textContent = 'Already have an account?';
        switchLink.textContent = 'Log In';
        document.querySelector('.logo h1').textContent = 'Create an account';
        document.querySelector('.logo p').textContent = 'Welcome to Discord Clone!';
    }
    
    // Clear any error messages
    removeMessage('error-message');
    removeMessage('success-message');
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!isLoginMode) {
        if (!username || username.trim().length < 3) {
            showError('Username must be at least 3 characters long');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
    }
    
    if (!email || !validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (!password || password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    if (isLoginMode) {
        await login(email, password);
    } else {
        await register(username, email, password);
    }
}

async function login(email, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.error || 'Login failed');
            return;
        }
        
        // Save token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        showSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please try again.');
    }
}

async function register(username, email, password) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.error || 'Registration failed');
            return;
        }
        
        // Save token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        showSuccess('Registration successful! Redirecting...');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showError('Network error. Please try again.');
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showError(message) {
    removeMessage('error-message');
    removeMessage('success-message');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message show';
    errorDiv.textContent = message;
    
    const form = document.getElementById('authForm');
    form.insertBefore(errorDiv, form.firstChild);
}

function showSuccess(message) {
    removeMessage('error-message');
    removeMessage('success-message');
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message show';
    successDiv.textContent = message;
    
    const form = document.getElementById('authForm');
    form.insertBefore(successDiv, form.firstChild);
}

function removeMessage(className) {
    const existingMessage = document.querySelector('.' + className);
    if (existingMessage) {
        existingMessage.remove();
    }
}

