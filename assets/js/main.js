// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('php/api/auth.php?action=checkSession', {
            credentials: 'include' // Importante para enviar cookies
        });
        
        const data = await response.json();
        
        if (data.error) {
            window.location.href = 'login.html';
        } else {
            document.getElementById('usernameDisplay').textContent = `Bienvenido, ${data.username}`;
        }
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'login.html';
    }
});

// Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('php/api/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'logout'
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!data.error) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
});