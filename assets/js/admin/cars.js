document.addEventListener('DOMContentLoaded', function() {
    const filterUser = document.getElementById('filterUser');
    const filterBrand = document.getElementById('filterBrand');
    const filterModel = document.getElementById('filterModel');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const carsTable = document.getElementById('carsTable').getElementsByTagName('tbody')[0];
    
    let cars = [];
    let users = [];
    let currentFilters = {
        user: null,
        brand: '',
        model: ''
    };
    
    // Cargar usuarios y autos al iniciar
    loadUsers();
    loadCars();
    
    // Evento para aplicar filtros
    applyFiltersBtn.addEventListener('click', function() {
        currentFilters = {
            user: filterUser.value || null,
            brand: filterBrand.value.trim(),
            model: filterModel.value.trim()
        };
        
        loadCars();
    });
    
    // Evento para resetear filtros
    resetFiltersBtn.addEventListener('click', function() {
        filterUser.value = '';
        filterBrand.value = '';
        filterModel.value = '';
        
        currentFilters = {
            user: null,
            brand: '',
            model: ''
        };
        
        loadCars();
    });
    
    // Función para cargar usuarios
    function loadUsers() {
        fetch('../../backend/api/users.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    users = data.data;
                    renderUserFilter();
                } else {
                    alert('Error al cargar usuarios: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar usuarios');
            });
    }
    
    // Función para renderizar el filtro de usuarios
    function renderUserFilter() {
        filterUser.innerHTML = '<option value="">Todos los usuarios</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.nombre} (${user.email})`;
            filterUser.appendChild(option);
        });
    }
    
    // Función para cargar autos
    function loadCars() {
        let url = '../../backend/api/cars.php';
        
        // Aplicar filtros si existen
        if (currentFilters.user || currentFilters.brand || currentFilters.model) {
            url += '?';
            const params = [];
            
            if (currentFilters.user) params.push(`user_id=${currentFilters.user}`);
            if (currentFilters.brand) params.push(`brand=${encodeURIComponent(currentFilters.brand)}`);
            if (currentFilters.model) params.push(`model=${encodeURIComponent(currentFilters.model)}`);
            
            url += params.join('&');
        }
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    cars = data.data;
                    renderCarsTable();
                } else {
                    alert('Error al cargar autos: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar autos');
            });
    }
    
    // Función para renderizar la tabla de autos
    function renderCarsTable() {
        carsTable.innerHTML = '';
        
        if (cars.length === 0) {
            const row = carsTable.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 7;
            cell.textContent = 'No hay autos que coincidan con los filtros.';
            cell.style.textAlign = 'center';
            return;
        }
        
        cars.forEach(car => {
            const row = carsTable.insertRow();
            
            row.insertCell(0).textContent = car.usuario_nombre || 'N/A';
            row.insertCell(1).textContent = car.marca;
            row.insertCell(2).textContent = car.modelo;
            row.insertCell(3).textContent = car.año;
            row.insertCell(4).textContent = car.kilometros.toLocaleString();
            
            const date = new Date(car.fecha_creacion);
            const formattedDate = date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            row.insertCell(5).textContent = formattedDate;
            
            const actionsCell = row.insertCell(6);
            actionsCell.className = 'table-actions';
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn btn-primary btn-sm';
            viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
            viewBtn.title = 'Ver Mantenimientos';
            viewBtn.addEventListener('click', () => {
                window.location.href = `maintenance.html?carId=${car.id}`;
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Eliminar';
            deleteBtn.addEventListener('click', () => deleteCar(car.id));
            
            actionsCell.appendChild(viewBtn);
            actionsCell.appendChild(deleteBtn);
        });
    }
    
    // Función para eliminar auto
    function deleteCar(carId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este auto? Todos sus mantenimientos también se eliminarán.')) {
            return;
        }
        
        fetch(`../../backend/api/cars.php?id=${carId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Auto eliminado exitosamente');
                loadCars();
            } else {
                alert('Error al eliminar auto: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al eliminar auto');
        });
    }
});