document.addEventListener('DOMContentLoaded', function() {
    // Toggle sidebar en móviles
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Toggle modo oscuro
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
        // Verificar preferencia del usuario
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Actualizar texto del botón
        updateThemeButton(savedTheme);
        
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            updateThemeButton(newTheme);
        });
    }
    
    function updateThemeButton(theme) {
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('span');
        
        if (theme === 'dark') {
            icon.classList.replace('fa-moon', 'fa-sun');
            text.textContent = 'Modo Claro';
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            text.textContent = 'Modo Oscuro';
        }
    }
    
    // Cerrar sesión
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Aquí iría la llamada a la API para cerrar sesión
            console.log('Cerrando sesión...');
            
            // Redirigir al login
            window.location.href = this.getAttribute('href');
        });
    }
});