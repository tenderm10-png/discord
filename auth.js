// Автоматический вход - регистрация не требуется

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
});

function initializeAuth() {
    const authForm = document.getElementById('authForm');
    
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
    
    // Меняем текст кнопки
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.textContent = 'Enter';
    
    // Меняем заголовок
    const logoH1 = document.querySelector('.logo h1');
    const logoP = document.querySelector('.logo p');
    if (logoH1) logoH1.textContent = 'Welcome!';
    if (logoP) logoP.textContent = 'Click to enter - unique account will be created automatically';
    
    authForm.addEventListener('submit', handleSubmit);
}


async function handleSubmit(e) {
    e.preventDefault();
    
    // Автоматически создаем уникальный аккаунт для каждого пользователя
    const randomId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const email = `user${randomId}@auto.com`;
    
    // Создаем аккаунт автоматически
    await login(email, 'auto');
}

async function login(email, password) {
    // Создаем уникальный аккаунт для каждого пользователя
    const STORAGE_USERS = 'app_users';
    const usersStr = localStorage.getItem(STORAGE_USERS);
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    // Создаем уникальный ID на основе времени и случайного числа
    const uniqueId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const username = `User${uniqueId.substring(10, 16)}`;
    
    // Создаем нового пользователя
    const user = {
        id: uniqueId,
        username: username,
        email: email,
        password: password,
        avatar: username.charAt(0).toUpperCase(),
        status: 'Online',
        createdAt: new Date().toISOString()
    };
    
    users.push(user);
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    
    // Создаем токен и данные пользователя
    const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: 'Online'
    };
    
    const token = 'token_' + user.id;
    
    // Сохраняем в localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    showSuccess('Welcome! Redirecting...');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
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

