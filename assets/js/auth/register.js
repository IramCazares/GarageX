document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    // Validación en tiempo real
    nameInput.addEventListener('input', validateName);
    emailInput.addEventListener('input', validateEmail);
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);

    // Validación al enviar el formulario
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const isNameValid = validateName();
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        const termsChecked = document.getElementById('terms').checked;
        
        if (!termsChecked) {
            alert('Debes aceptar los términos y condiciones');
            return;
        }
        
        if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
            registerUser();
        }
    });

    function validateName() {
        const name = nameInput.value.trim();
        
        if (!name) {
            showError(nameError, 'El nombre es requerido');
            return false;
        } else if (name.length < 3) {
            showError(nameError, 'El nombre debe tener al menos 3 caracteres');
            return false;
        } else {
            hideError(nameError);
            return true;
        }
    }

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

    function validateConfirmPassword() {
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        
        if (!confirmPassword) {
            showError(confirmPasswordError, 'Confirma tu contraseña');
            return false;
        } else if (password !== confirmPassword) {
            showError(confirmPasswordError, 'Las contraseñas no coinciden');
            return false;
        } else {
            hideError(confirmPasswordError);
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

    function registerUser() {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Aquí iría la llamada a la API real
        console.log('Registrando usuario:', { name, email, password });
        
        // Simular respuesta exitosa
        setTimeout(() => {
            alert('Registro exitoso! Redirigiendo al login...');
            window.location.href = 'login.html';
        }, 1000);
    }
});