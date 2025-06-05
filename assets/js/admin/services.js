document.addEventListener('DOMContentLoaded', function() {
    const servicesTable = document.getElementById('servicesTable').getElementsByTagName('tbody')[0];
    const addServiceBtn = document.getElementById('addServiceBtn');
    const serviceModal = document.getElementById('serviceModal');
    const modalTitle = document.getElementById('modalTitle');
    const serviceForm = document.getElementById('serviceForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeModalBtn = document.querySelector('.close-modal');
    
    let services = [];
    let editingServiceId = null;
    
    // Cargar servicios al iniciar
    loadServices();
    
    // Evento para abrir modal de agregar servicio
    addServiceBtn.addEventListener('click', function() {
        editingServiceId = null;
        modalTitle.textContent = 'Agregar Nuevo Servicio';
        serviceForm.reset();
        document.getElementById('serviceId').value = '';
        serviceModal.style.display = 'block';
    });
    
    // Evento para cerrar modal
    function closeModal() {
        serviceModal.style.display = 'none';
    }
    
    cancelBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(e) {
        if (e.target === serviceModal) {
            closeModal();
        }
    });
    
    // Manejar envío del formulario
    serviceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('serviceName').value.trim();
        const interval = document.getElementById('serviceInterval').value;
        const cost = document.getElementById('serviceCost').value;
        const description = document.getElementById('serviceDescription').value.trim();
        
        // Validaciones
        let isValid = true;
        
        if (!name) {
            showError('nameError', 'El nombre del servicio es requerido');
            isValid = false;
        } else {
            hideError('nameError');
        }
        
        if (!interval || interval <= 0) {
            showError('intervalError', 'El intervalo debe ser mayor a 0');
            isValid = false;
        } else {
            hideError('intervalError');
        }
        
        if (!cost || cost < 0) {
            showError('costError', 'El costo debe ser mayor o igual a 0');
            isValid = false;
        } else {
            hideError('costError');
        }
        
        if (!isValid) return;
        
        const serviceData = {
            nombre: name,
            kilometros_intervalo: interval,
            costo_promedio: cost,
            descripcion: description || null
        };
        
        if (editingServiceId) {
            // Actualizar servicio existente
            serviceData.id = editingServiceId;
            updateService(serviceData);
        } else {
            // Agregar nuevo servicio
            addService(serviceData);
        }
    });
    
    // Función para cargar servicios
    function loadServices() {
        fetch('../../backend/api/services.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    services = data.data;
                    renderServicesTable();
                } else {
                    alert('Error al cargar servicios: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar servicios');
            });
    }
    
    // Función para renderizar la tabla de servicios
    function renderServicesTable() {
        servicesTable.innerHTML = '';
        
        if (services.length === 0) {
            const row = servicesTable.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5;
            cell.textContent = 'No hay servicios registrados.';
            cell.style.textAlign = 'center';
            return;
        }
        
        services.forEach(service => {
            const row = servicesTable.insertRow();
            
            row.insertCell(0).textContent = service.nombre;
            row.insertCell(1).textContent = service.kilometros_intervalo.toLocaleString();
            row.insertCell(2).textContent = `$${service.costo_promedio.toFixed(2)}`;
            row.insertCell(3).textContent = service.descripcion || '-';
            
            const actionsCell = row.insertCell(4);
            actionsCell.className = 'table-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-warning btn-sm';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Editar';
            editBtn.addEventListener('click', () => editService(service.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Eliminar';
            deleteBtn.addEventListener('click', () => deleteService(service.id));
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    }
    
    // Función para editar servicio
    function editService(serviceId) {
        const service = services.find(s => s.id == serviceId);
        
        if (service) {
            editingServiceId = serviceId;
            modalTitle.textContent = 'Editar Servicio';
            
            document.getElementById('serviceId').value = service.id;
            document.getElementById('serviceName').value = service.nombre;
            document.getElementById('serviceInterval').value = service.kilometros_intervalo;
            document.getElementById('serviceCost').value = service.costo_promedio;
            document.getElementById('serviceDescription').value = service.descripcion || '';
            
            serviceModal.style.display = 'block';
        }
    }
    
    // Función para agregar servicio
    function addService(serviceData) {
        fetch('../../backend/api/services.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(serviceData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Servicio agregado exitosamente');
                closeModal();
                loadServices();
            } else {
                alert('Error al agregar servicio: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al agregar servicio');
        });
    }
    
    // Función para actualizar servicio
    function updateService(serviceData) {
        fetch(`../../backend/api/services.php?id=${serviceData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(serviceData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Servicio actualizado exitosamente');
                closeModal();
                loadServices();
            } else {
                alert('Error al actualizar servicio: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al actualizar servicio');
        });
    }
    
    // Función para eliminar servicio
    function deleteService(serviceId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
            return;
        }
        
        fetch(`../../backend/api/services.php?id=${serviceId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Servicio eliminado exitosamente');
                loadServices();
            } else {
                alert('Error al eliminar servicio: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al eliminar servicio');
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