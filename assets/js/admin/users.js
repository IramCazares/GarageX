document.addEventListener('DOMContentLoaded', function() {
    const usersTable = document.getElementById('usersTable').getElementsByTagName('tbody')[0];
    const addUserBtn = document.getElementById('addUserBtn');
    const userModal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const userForm = document.getElementById('userForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeModalBtn = document.querySelector('.close-modal');
    const passwordField = document.getElementById('passwordField');
    
    let users = [];
    let editingUserId = null;
    
    // Cargar usuarios al iniciar
    loadUsers();
    
    // Evento para abrir modal de agregar usuario
    addUserBtn.addEventListener('click', function() {
        editingUserId = null;
        modalTitle.textContent = 'Agregar Nuevo Usuario';
        userForm.reset();
        document.getElementById('userId').value = '';
        passwordField.style.display = 'block';
        document.getElementById('userPassword').required = true;
        userModal.style.display = 'block';
    });
    
    // Evento para cerrar modal
    function closeModal() {
        userModal.style.display = 'none';
    }
    
    cancelBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(e) {
        if (e.target === userModal) {
            closeModal();
        }
    });
    
    // Manejar envío del formulario
    userForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const role = document.getElementById('userRole').value;
        const password = document.getElementById('userPassword').value;
        
        // Validaciones
        let isValid = true;
        
        if (!name) {
            showError('nameError', 'El nombre es requerido');
            isValid = false;
        } else {
            hideError('nameError');
        }
        
        if (!email) {
            showError('emailError', 'El email es requerido');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError('emailError', 'Ingresa un email válido');
            isValid = false;
        } else {
            hideError('emailError');
        }
        
        if (!role) {
            showError('roleError', 'El rol es requerido');
            isValid = false;
        } else {
            hideError('roleError');
        }
        
        // Validar contraseña solo para nuevos usuarios
        if (!editingUserId && !password) {
            showError('passwordError', 'La contraseña es requerida');
            isValid = false;
        } else {
            hideError('passwordError');
        }
        
        if (!isValid) return;
        
        const userData = {
            nombre: name,
            email: email,
            rol: role
        };
        
        if (password) {
            userData.password = password;
        }
        
        if (editingUserId) {
            // Actualizar usuario existente
            userData.id = editingUserId;
            updateUser(userData);
        } else {
            // Agregar nuevo usuario
            addUser(userData);
        }
    });
    
    // Función para cargar usuarios
    function loadUsers() {
        fetch('../../backend/api/users.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    users = data.data;
                    renderUsersTable();
                } else {
                    alert('Error al cargar usuarios: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar usuarios');
            });
    }
    
    // Función para renderizar la tabla de usuarios
    function renderUsersTable() {
        usersTable.innerHTML = '';
        
        if (users.length === 0) {
            const row = usersTable.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5;
            cell.textContent = 'No hay usuarios registrados.';
            cell.style.textAlign = 'center';
            return;
        }
        
        users.forEach(user => {
            const row = usersTable.insertRow();
            
            row.insertCell(0).textContent = user.nombre;
            row.insertCell(1).textContent = user.email;
            
            const roleCell = row.insertCell(2);
            roleCell.textContent = user.rol === 'admin' ? 'Administrador' : 'Usuario';
            
            const date = new Date(user.fecha_registro);
            const formattedDate = date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            row.insertCell(3).textContent = formattedDate;
            
            const actionsCell = row.insertCell(4);
            actionsCell.className = 'table-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-warning btn-sm';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Editar';
            editBtn.addEventListener('click', () => editUser(user.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Eliminar';
            deleteBtn.addEventListener('click', () => deleteUser(user.id));
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    }
    
    // Función para editar usuario
    function editUser(userId) {
        const user = users.find(u => u.id == userId);
        
        if (user) {
            editingUserId = userId;
            modalTitle.textContent = 'Editar Usuario';
            
            document.getElementById('userId').value = user.id;
            document.getElementById('userName').value = user.nombre;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.rol;
            passwordField.style.display = 'block';
            document.getElementById('userPassword').required = false;
            
            userModal.style.display = 'block';
        }
    }
    
    // Función para agregar usuario
    function addUser(userData) {
        fetch('../../backend/api/users.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Usuario agregado exitosamente');
                closeModal();
                loadUsers();
            } else {
                alert('Error al agregar usuario: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al agregar usuario');
        });
    }
    
    // Función para actualizar usuario
    function updateUser(userData) {
        fetch(`../../backend/api/users.php?id=${userData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Usuario actualizado exitosamente');
                closeModal();
                loadUsers();
            } else {
                alert('Error al actualizar usuario: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al actualizar usuario');
        });
    }
    
    // Función para eliminar usuario
    function deleteUser(userId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Todos sus autos y mantenimientos también se eliminarán.')) {
            return;
        }
        
        fetch(`../../backend/api/users.php?id=${userId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Usuario eliminado exitosamente');
                loadUsers();
            } else {
                alert('Error al eliminar usuario: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al eliminar usuario');
        });
    }
    
    // Función para validar email
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
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