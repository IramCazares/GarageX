document.addEventListener('DOMContentLoaded', function() {
    const carSelect = document.getElementById('carSelect');
    const maintenanceAlerts = document.getElementById('maintenanceAlerts');
    const maintenanceTable = document.getElementById('maintenanceTable').getElementsByTagName('tbody')[0];
    const addMaintenanceBtn = document.getElementById('addMaintenanceBtn');
    const maintenanceModal = document.getElementById('maintenanceModal');
    const maintenanceModalTitle = document.getElementById('maintenanceModalTitle');
    const maintenanceForm = document.getElementById('maintenanceForm');
    const cancelMaintenanceBtn = document.getElementById('cancelMaintenanceBtn');
    const closeMaintenanceModalBtn = document.querySelector('#maintenanceModal .close-modal');
    
    let cars = [];
    let selectedCarId = null;
    let maintenances = [];
    let editingMaintenanceId = null;
    
    // Cargar autos al iniciar
    loadCars();
    
    // Evento para seleccionar auto
    carSelect.addEventListener('change', function() {
        selectedCarId = this.value;
        
        if (selectedCarId) {
            addMaintenanceBtn.disabled = false;
            loadMaintenances(selectedCarId);
            loadMaintenanceAlerts(selectedCarId);
        } else {
            addMaintenanceBtn.disabled = true;
            maintenanceAlerts.innerHTML = '';
            maintenanceTable.innerHTML = '';
        }
    });
    
    // Evento para abrir modal de agregar mantenimiento
    addMaintenanceBtn.addEventListener('click', function() {
        if (!selectedCarId) return;
        
        editingMaintenanceId = null;
        maintenanceModalTitle.textContent = 'Agregar Mantenimiento';
        maintenanceForm.reset();
        document.getElementById('maintenanceId').value = '';
        document.getElementById('selectedCarId').value = selectedCarId;
        
        // Establecer fecha actual por defecto
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('maintenanceDate').value = today;
        
        maintenanceModal.style.display = 'block';
    });
    
    // Evento para cerrar modal
    function closeMaintenanceModal() {
        maintenanceModal.style.display = 'none';
    }
    
    cancelMaintenanceBtn.addEventListener('click', closeMaintenanceModal);
    closeMaintenanceModalBtn.addEventListener('click', closeMaintenanceModal);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(e) {
        if (e.target === maintenanceModal) {
            closeMaintenanceModal();
        }
    });
    
    // Manejar envío del formulario
    maintenanceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const type = document.getElementById('maintenanceType').value;
        const date = document.getElementById('maintenanceDate').value;
        const kilometers = document.getElementById('maintenanceKilometers').value;
        const cost = document.getElementById('maintenanceCost').value;
        const comments = document.getElementById('maintenanceComments').value;
        const carId = document.getElementById('selectedCarId').value;
        
        // Validaciones
        let isValid = true;
        
        if (!type) {
            showError('typeError', 'El tipo de mantenimiento es requerido');
            isValid = false;
        } else {
            hideError('typeError');
        }
        
        if (!date) {
            showError('dateError', 'La fecha es requerida');
            isValid = false;
        } else {
            hideError('dateError');
        }
        
        if (!kilometers || kilometers < 0) {
            showError('kilometersError', 'Ingresa un valor válido para kilómetros');
            isValid = false;
        } else {
            hideError('kilometersError');
        }
        
        if (!isValid) return;
        
        const maintenanceData = {
            auto_id: carId,
            tipo: type,
            fecha: date,
            kilometros: kilometers,
            costo: cost || null,
            comentarios: comments || null
        };
        
        if (editingMaintenanceId) {
            // Actualizar mantenimiento existente
            maintenanceData.id = editingMaintenanceId;
            updateMaintenance(maintenanceData);
        } else {
            // Agregar nuevo mantenimiento
            addMaintenance(maintenanceData);
        }
    });
    
    // Función para cargar autos
    function loadCars() {
        fetch('../../backend/api/cars.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    cars = data.data;
                    renderCarSelect();
                    
                    // Si hay un carId en la URL, seleccionarlo automáticamente
                    const urlParams = new URLSearchParams(window.location.search);
                    const carIdFromUrl = urlParams.get('carId');
                    
                    if (carIdFromUrl && cars.some(car => car.id == carIdFromUrl)) {
                        carSelect.value = carIdFromUrl;
                        carSelect.dispatchEvent(new Event('change'));
                    }
                } else {
                    alert('Error al cargar autos: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar autos');
            });
    }
    
    // Función para renderizar el select de autos
    function renderCarSelect() {
        carSelect.innerHTML = '<option value="">Selecciona un auto</option>';
        
        cars.forEach(car => {
            const option = document.createElement('option');
            option.value = car.id;
            option.textContent = `${car.marca} ${car.modelo} (${car.año}) - ${car.kilometros.toLocaleString()} km`;
            carSelect.appendChild(option);
        });
    }
    
    // Función para cargar mantenimientos
    function loadMaintenances(carId) {
        fetch(`../../backend/api/maintenance.php?car_id=${carId}`)
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
            cell.colSpan = 6;
            cell.textContent = 'No hay mantenimientos registrados para este auto.';
            cell.style.textAlign = 'center';
            return;
        }
        
        maintenances.forEach(maintenance => {
            const row = maintenanceTable.insertRow();
            
            // Formatear fecha
            const date = new Date(maintenance.fecha);
            const formattedDate = date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            row.insertCell(0).textContent = formattedDate;
            
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
            
            row.insertCell(1).textContent = typeText;
            row.insertCell(2).textContent = maintenance.kilometros.toLocaleString();
            row.insertCell(3).textContent = maintenance.costo ? `$${maintenance.costo.toFixed(2)}` : '-';
            row.insertCell(4).textContent = maintenance.comentarios || '-';
            
            const actionsCell = row.insertCell(5);
            actionsCell.className = 'table-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-warning';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Editar';
            editBtn.addEventListener('click', () => editMaintenance(maintenance.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Eliminar';
            deleteBtn.addEventListener('click', () => deleteMaintenance(maintenance.id));
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    }
    
    // Función para cargar alertas de mantenimiento
    function loadMaintenanceAlerts(carId) {
        fetch(`../../backend/api/maintenance.php?car_id=${carId}&action=alerts`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderMaintenanceAlerts(data.alerts);
                } else {
                    maintenanceAlerts.innerHTML = '<div class="alert-item info">No hay alertas de mantenimiento para este auto.</div>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                maintenanceAlerts.innerHTML = '<div class="alert-item danger">Error al cargar alertas de mantenimiento.</div>';
            });
    }
    
    // Función para renderizar alertas de mantenimiento
    function renderMaintenanceAlerts(alerts) {
        maintenanceAlerts.innerHTML = '';
        
        if (!alerts || alerts.length === 0) {
            maintenanceAlerts.innerHTML = '<div class="alert-item info">No hay alertas de mantenimiento para este auto.</div>';
            return;
        }
        
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'maintenance-alert ' + (alert.priority === 'high' ? 'danger' : 'warning');
            
            alertDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <div class="maintenance-content">
                    <h4>${alert.service}</h4>
                    <p>${alert.message}</p>
                    <p>Kilómetros actuales: ${alert.current_kilometers.toLocaleString()}</p>
                    <p>Último servicio: ${alert.last_service_kilometers.toLocaleString()} km</p>
                    <p>Costo estimado: $${alert.estimated_cost.toFixed(2)}</p>
                </div>
            `;
            
            maintenanceAlerts.appendChild(alertDiv);
        });
    }
    
    // Función para editar mantenimiento
    function editMaintenance(maintenanceId) {
        const maintenance = maintenances.find(m => m.id == maintenanceId);
        
        if (maintenance) {
            editingMaintenanceId = maintenanceId;
            maintenanceModalTitle.textContent = 'Editar Mantenimiento';
            
            document.getElementById('maintenanceId').value = maintenance.id;
            document.getElementById('selectedCarId').value = maintenance.auto_id;
            document.getElementById('maintenanceType').value = maintenance.tipo;
            document.getElementById('maintenanceDate').value = maintenance.fecha;
            document.getElementById('maintenanceKilometers').value = maintenance.kilometros;
            document.getElementById('maintenanceCost').value = maintenance.costo || '';
            document.getElementById('maintenanceComments').value = maintenance.comentarios || '';
            
            maintenanceModal.style.display = 'block';
        }
    }
    
    // Función para agregar mantenimiento
    function addMaintenance(maintenanceData) {
        fetch('../../backend/api/maintenance.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(maintenanceData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Mantenimiento registrado exitosamente');
                closeMaintenanceModal();
                loadMaintenances(selectedCarId);
                loadMaintenanceAlerts(selectedCarId);
            } else {
                alert('Error al registrar mantenimiento: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al registrar mantenimiento');
        });
    }
    
    // Función para actualizar mantenimiento
    function updateMaintenance(maintenanceData) {
        fetch(`../../backend/api/maintenance.php?id=${maintenanceData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(maintenanceData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Mantenimiento actualizado exitosamente');
                closeMaintenanceModal();
                loadMaintenances(selectedCarId);
                loadMaintenanceAlerts(selectedCarId);
            } else {
                alert('Error al actualizar mantenimiento: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al actualizar mantenimiento');
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
                loadMaintenances(selectedCarId);
                loadMaintenanceAlerts(selectedCarId);
            } else {
                alert('Error al eliminar mantenimiento: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al eliminar mantenimiento');
        });
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