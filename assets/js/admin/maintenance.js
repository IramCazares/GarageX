document.addEventListener('DOMContentLoaded', function() {
    const filterUser = document.getElementById('filterUser');
    const filterCar = document.getElementById('filterCar');
    const filterType = document.getElementById('filterType');
    const filterStartDate = document.getElementById('filterStartDate');
    const filterEndDate = document.getElementById('filterEndDate');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const maintenanceTable = document.getElementById('maintenanceTable').getElementsByTagName('tbody')[0];
    
    let maintenances = [];
    let users = [];
    let cars = [];
    let currentFilters = {
        user: null,
        car: null,
        type: null,
        startDate: null,
        endDate: null
    };
    
    // Establecer fechas por defecto (últimos 30 días)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    filterStartDate.valueAsDate = lastMonth;
    filterEndDate.valueAsDate = today;
    currentFilters.startDate = lastMonth.toISOString().split('T')[0];
    currentFilters.endDate = today.toISOString().split('T')[0];
    
    // Cargar datos iniciales
    loadUsers();
    loadCars();
    loadMaintenances();
    
    // Eventos para filtros
    filterUser.addEventListener('change', function() {
        currentFilters.user = this.value || null;
        updateCarFilter();
    });
    
    applyFiltersBtn.addEventListener('click', function() {
        currentFilters = {
            user: filterUser.value || null,
            car: filterCar.value || null,
            type: filterType.value || null,
            startDate: filterStartDate.value || null,
            endDate: filterEndDate.value || null
        };
        
        loadMaintenances();
    });
    
    resetFiltersBtn.addEventListener('click', function() {
        filterUser.value = '';
        filterCar.value = '';
        filterType.value = '';
        
        // Restablecer fechas a los últimos 30 días
        filterStartDate.valueAsDate = lastMonth;
        filterEndDate.valueAsDate = today;
        
        currentFilters = {
            user: null,
            car: null,
            type: null,
            startDate: lastMonth.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
        };
        
        loadMaintenances();
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
    
    // Función para cargar autos
    function loadCars() {
        fetch('../../backend/api/cars.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    cars = data.data;
                    updateCarFilter();
                } else {
                    alert('Error al cargar autos: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar autos');
            });
    }
    
    // Función para actualizar el filtro de autos basado en el usuario seleccionado
    function updateCarFilter() {
        filterCar.innerHTML = '<option value="">Todos los autos</option>';
        
        const filteredCars = currentFilters.user 
            ? cars.filter(car => car.usuario_id == currentFilters.user)
            : cars;
        
        filteredCars.forEach(car => {
            const option = document.createElement('option');
            option.value = car.id;
            option.textContent = `${car.marca} ${car.modelo} (${car.año})`;
            filterCar.appendChild(option);
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
    
    // Función para cargar mantenimientos
    function loadMaintenances() {
        let url = '../../backend/api/maintenance.php?action=all';
        
        // Construir parámetros de filtro
        const params = [];
        
        if (currentFilters.user) params.push(`user_id=${currentFilters.user}`);
        if (currentFilters.car) params.push(`car_id=${currentFilters.car}`);
        if (currentFilters.type) params.push(`type=${currentFilters.type}`);
        if (currentFilters.startDate) params.push(`start_date=${currentFilters.startDate}`);
        if (currentFilters.endDate) params.push(`end_date=${currentFilters.endDate}`);
        
        if (params.length > 0) {
            url += '&' + params.join('&');
        }
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    maintenances = data.data;
                    renderMaintenancesTable();
                } else {
                    alert('Error al cargar mantenimientos: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar mantenimientos');
            });
    }
    
    // Función para renderizar la tabla de mantenimientos
    function renderMaintenancesTable() {
        maintenanceTable.innerHTML = '';
        
        if (maintenances.length === 0) {
            const row = maintenanceTable.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 7;
            cell.textContent = 'No hay mantenimientos que coincidan con los filtros.';
            cell.style.textAlign = 'center';
            return;
        }
        
        maintenances.forEach(maintenance => {
            const row = maintenanceTable.insertRow();
            
            row.insertCell(0).textContent = maintenance.usuario_nombre || 'N/A';
            row.insertCell(1).textContent = `${maintenance.marca} ${maintenance.modelo} (${maintenance.año})`;
            
            // Formatear tipo
            let typeText = '';
            switch (maintenance.tipo) {
                case 'cambio_aceite':
                    typeText = 'Cambio de aceite';
                    break;
                case 'rotacion_llantas':
                    typeText = 'Rotación de llantas';
                    break;
                case 'afinacion':
                    typeText = 'Afinación general';
                    break;
                default:
                    typeText = maintenance.tipo;
            }
            
            row.insertCell(2).textContent = typeText;
            
            // Formatear fecha
            const date = new Date(maintenance.fecha);
            const formattedDate = date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            row.insertCell(3).textContent = formattedDate;
            row.insertCell(4).textContent = maintenance.kilometros.toLocaleString();
            row.insertCell(5).textContent = maintenance.costo ? `$${maintenance.costo.toFixed(2)}` : '-';
            
            const actionsCell = row.insertCell(6);
            actionsCell.className = 'table-actions';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Eliminar';
            deleteBtn.addEventListener('click', () => deleteMaintenance(maintenance.id));
            
            actionsCell.appendChild(deleteBtn);
        });
    }
    
    // Función para eliminar mantenimiento
    function deleteMaintenance(maintenanceId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este mantenimiento?')) {
            return;
        }
        
        fetch(`../../backend/api/maintenance.php?id=${maintenanceId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Mantenimiento eliminado exitosamente');
                loadMaintenances();
            } else {
                alert('Error al eliminar mantenimiento: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al eliminar mantenimiento');
        });
    }
});