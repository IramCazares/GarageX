document.addEventListener('DOMContentLoaded', function() {
    const carsTable = document.getElementById('carsTable').getElementsByTagName('tbody')[0];
    const addCarBtn = document.getElementById('addCarBtn');
    const carModal = document.getElementById('carModal');
    const modalTitle = document.getElementById('modalTitle');
    const carForm = document.getElementById('carForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeModalBtn = document.querySelector('.close-modal');
    
    let cars = [];
    let editingCarId = null;
    
    // Cargar autos al iniciar
    loadCars();
    
    // Evento para abrir modal de agregar auto
    addCarBtn.addEventListener('click', function() {
        editingCarId = null;
        modalTitle.textContent = 'Agregar Nuevo Auto';
        carForm.reset();
        document.getElementById('carId').value = '';
        carModal.style.display = 'block';
    });
    
    // Evento para cerrar modal
    function closeModal() {
        carModal.style.display = 'none';
    }
    
    cancelBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(e) {
        if (e.target === carModal) {
            closeModal();
        }
    });
    
    // Manejar envío del formulario
    carForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const brand = document.getElementById('brand').value.trim();
        const model = document.getElementById('model').value.trim();
        const year = document.getElementById('year').value;
        const kilometers = document.getElementById('kilometers').value || 0;
        
        // Validaciones
        let isValid = true;
        
        if (!brand) {
            showError('brandError', 'La marca es requerida');
            isValid = false;
        } else {
            hideError('brandError');
        }
        
        if (!model) {
            showError('modelError', 'El modelo es requerido');
            isValid = false;
        } else {
            hideError('modelError');
        }
        
        if (!year || year < 1900 || year > new Date().getFullYear() + 1) {
            showError('yearError', 'Ingresa un año válido');
            isValid = false;
        } else {
            hideError('yearError');
        }
        
        if (kilometers < 0) {
            showError('kilometersError', 'Los kilómetros no pueden ser negativos');
            isValid = false;
        } else {
            hideError('kilometersError');
        }
        
        if (!isValid) return;
        
        const carData = {
            marca: brand,
            modelo: model,
            año: year,
            kilometros: kilometers
        };
        
        if (editingCarId) {
            // Actualizar auto existente
            carData.id = editingCarId;
            updateCar(carData);
        } else {
            // Agregar nuevo auto
            addCar(carData);
        }
    });
    
    // Función para cargar autos
    function loadCars() {
        fetch('../../backend/api/cars.php')
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
            cell.colSpan = 5;
            cell.textContent = 'No tienes autos registrados. Agrega uno para comenzar.';
            cell.style.textAlign = 'center';
            return;
        }
        
        cars.forEach(car => {
            const row = carsTable.insertRow();
            
            row.insertCell(0).textContent = car.marca;
            row.insertCell(1).textContent = car.modelo;
            row.insertCell(2).textContent = car.año;
            row.insertCell(3).textContent = car.kilometros.toLocaleString();
            
            const actionsCell = row.insertCell(4);
            actionsCell.className = 'table-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-warning';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar';
            editBtn.addEventListener('click', () => editCar(car.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
            deleteBtn.addEventListener('click', () => deleteCar(car.id));
            
            const maintenanceBtn = document.createElement('button');
            maintenanceBtn.className = 'btn btn-primary';
            maintenanceBtn.innerHTML = '<i class="fas fa-tools"></i> Mantenimientos';
            maintenanceBtn.addEventListener('click', () => {
                window.location.href = `mantenimientos.html?carId=${car.id}`;
            });
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
            actionsCell.appendChild(maintenanceBtn);
        });
    }
    
    // Función para editar auto
    function editCar(carId) {
        const car = cars.find(c => c.id == carId);
        
        if (car) {
            editingCarId = carId;
            modalTitle.textContent = 'Editar Auto';
            
            document.getElementById('carId').value = car.id;
            document.getElementById('brand').value = car.marca;
            document.getElementById('model').value = car.modelo;
            document.getElementById('year').value = car.año;
            document.getElementById('kilometers').value = car.kilometros;
            
            carModal.style.display = 'block';
        }
    }
    
    // Función para agregar auto
    function addCar(carData) {
        fetch('../../backend/api/cars.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(carData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Auto agregado exitosamente');
                closeModal();
                loadCars();
                
                // Mostrar alertas de mantenimiento si existen
                if (data.alerts && data.alerts.length > 0) {
                    showMaintenanceAlerts(data.alerts);
                }
            } else {
                alert('Error al agregar auto: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al agregar auto');
        });
    }
    
    // Función para actualizar auto
    function updateCar(carData) {
        fetch(`../../backend/api/cars.php?id=${carData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(carData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Auto actualizado exitosamente');
                closeModal();
                loadCars();
                
                // Mostrar alertas de mantenimiento si existen
                if (data.alerts && data.alerts.length > 0) {
                    showMaintenanceAlerts(data.alerts);
                }
            } else {
                alert('Error al actualizar auto: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al actualizar auto');
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
    
    // Función para mostrar alertas de mantenimiento
    function showMaintenanceAlerts(alerts) {
        let alertMessage = 'Se recomiendan los siguientes mantenimientos:\n\n';
        
        alerts.forEach(alert => {
            alertMessage += `- ${alert.service}: ${alert.recommended_action}\n`;
            alertMessage += `  Kilómetros actuales: ${alert.current_km}\n`;
            alertMessage += `  Último servicio: ${alert.last_service_km} km\n`;
            alertMessage += `  Costo estimado: $${alert.estimated_cost}\n\n`;
        });
        
        alert(alertMessage);
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