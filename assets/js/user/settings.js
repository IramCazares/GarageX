document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const notificationsToggle = document.getElementById('notificationsToggle');
    const savePreferencesBtn = document.getElementById('savePreferencesBtn');
    
    // Cargar datos del usuario
    loadUserProfile();
    
    // Cargar preferencias
    loadPreferences();
    
    // Evento para guardar perfil
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('profileName').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        
        // Validaciones básicas
        if (!name || !email) {
            alert('Nombre y correo electrónico son requeridos');
            return;
        }
        
        // Aquí iría la llamada a la API para actualizar el perfil
        console.log('Actualizando perfil:', { name, email });
        
        // Simular respuesta exitosa
        setTimeout(() => {
            alert('Perfil actualizado exitosamente');
            document.querySelector('.user-name').textContent = name;
        }, 1000);
    });
    
    // Evento para cambiar contraseña
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validaciones
        let isValid = true;
        
        if (!currentPassword) {
            showError('currentPasswordError', 'La contraseña actual es requerida');
            isValid = false;
        } else {
            hideError('currentPasswordError');
        }
        
        if (!newPassword) {
            showError('newPasswordError', 'La nueva contraseña es requerida');
            isValid = false;
        } else if (newPassword.length < 6) {
            showError('newPasswordError', 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        } else {
            hideError('newPasswordError');
        }
        
        if (newPassword !== confirmPassword) {
            showError('confirmPasswordError', 'Las contraseñas no coinciden');
            isValid = false;
        } else {
            hideError('confirmPasswordError');
        }
        
        if (!isValid) return;
        
        // Aquí iría la llamada a la API para cambiar la contraseña
        console.log('Cambiando contraseña:', { currentPassword, newPassword });
        
        // Simular respuesta exitosa
        setTimeout(() => {
            alert('Contraseña cambiada exitosamente');
            passwordForm.reset();
        }, 1000);
    });
    
    // Evento para guardar preferencias
    savePreferencesBtn.addEventListener('click', function() {
        const darkModeEnabled = darkModeToggle.checked;
        const notificationsEnabled = notificationsToggle.value === 'enabled';
        
        // Guardar en localStorage
        localStorage.setItem('darkMode', darkModeEnabled ? 'dark' : 'light');
        localStorage.setItem('notifications', notificationsEnabled ? 'enabled' : 'disabled');
        
        // Aplicar modo oscuro/claro inmediatamente
        document.documentElement.setAttribute('data-theme', darkModeEnabled ? 'dark' : 'light');
        
        alert('Preferencias guardadas exitosamente');
    });
    
    // Función para cargar perfil de usuario
    function loadUserProfile() {
        // Aquí iría la llamada a la API para obtener los datos del usuario
        // Por ahora simulamos datos
        const userData = {
            name: 'Juan Pérez',
            email: 'juan@example.com'
        };
        
        document.getElementById('profileName').value = userData.name;
        document.getElementById('profileEmail').value = userData.email;
    }
    
    // Función para cargar preferencias
    function loadPreferences() {
        const darkMode = localStorage.getItem('darkMode') || 'light';
        const notifications = localStorage.getItem('notifications') || 'enabled';
        
        darkModeToggle.checked = darkMode === 'dark';
        notificationsToggle.value = notifications;
    }
    
    // Funciones auxiliares para mostrar/ocultar errores
    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.style.display = 'block';
    }
    
    function hideError(elementId) {
        const element = document.getElementById(elementId);
        element.textContent = '';
        element.style.display = 'none';
    }
});