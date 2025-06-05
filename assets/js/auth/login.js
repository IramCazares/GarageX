document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Validación en tiempo real
    emailInput.addEventListener('input', validateEmail);
    passwordInput.addEventListener('input', validatePassword);

    // Validación al enviar el formulario
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        
        if (isEmailValid && isPasswordValid) {
            // Simular envío del formulario
            loginUser();
        }
    });

    function validateEmail() {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            showError(emailError, 'El correo electrónico es requerido');
            return false;
        } else if (!emailRegex.test(email)) {
            showError(emailError, 'Ingresa un correo electrónico válido');
            return false;
        } else {
            hideError(emailError);
            return true;
        }
    }

    function validatePassword() {
        const password = passwordInput.value.trim();
        
        if (!password) {
            showError(passwordError, 'La contraseña es requerida');
            return false;
        } else if (password.length < 6) {
            showError(passwordError, 'La contraseña debe tener al menos 6 caracteres');
            return false;
        } else {
            hideError(passwordError);
            return true;
        }
    }

    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }

    function hideError(element) {
        element.textContent = '';
        element.style.display = 'none';
    }

    function loginUser() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = document.querySelector('input[name="remember"]').checked;
        
        // Aquí iría la llamada a la API real
        console.log('Iniciando sesión con:', { email, password, remember });
        
        // Simular respuesta exitosa
        setTimeout(() => {
            // Redirigir al dashboard según el rol (simulado)
            const isAdmin = email === 'admin@garagex.com';
            if (isAdmin) {
                window.location.href = '../admin/dashboard.html';
            } else {
                window.location.href = '../user/dashboard.html';
            }
        }, 1000);
    }
});