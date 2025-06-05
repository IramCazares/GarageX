function handleLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    console.log("login form handler cargado 2")

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            action: 'login'
        };

        try {
            const response = await fetch('php/api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                loginUser(data);
                window.location.hash = '/dashboard';
            } else {
                document.getElementById('mensajeError').textContent = data.message;
                document.getElementById('mensajeError').classList.remove('d-none');
            }

        } catch (error) {
            console.error('Error:', error);
        }
    });
}


async function handleRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            confirm_password: document.getElementById('confirm_password').value,
            action: 'register'
        };

        try {
            const response = await fetch('php/api/auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                console.log('Usuario registrado exitosamente');
                window.location.hash = '/login';
            } else {
                document.getElementById('mensajeError').textContent = data.message;
                document.getElementById('mensajeError').classList.remove('d-none');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Error al registrar el usuario');
        }
    });
}
