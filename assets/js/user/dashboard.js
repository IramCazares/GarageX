document.addEventListener('DOMContentLoaded', function() {
    // Simular carga de datos del usuario
    loadUserData();
    
    // Simular carga de autos
    loadUserCars();
    
    // Simular carga de alertas
    loadAlerts();
    
    function loadUserData() {
        // En una aplicación real, esto vendría de una API
        const userData = {
            name: 'Juan Pérez',
            email: 'juan@example.com',
            avatar: '../../assets/images/user-avatar.jpg'
        };
        
        document.querySelector('.user-name').textContent = userData.name;
    }
    
    function loadUserCars() {
        // En una aplicación real, esto vendría de una API
        const cars = [
            {
                id: 1,
                marca: 'Toyota',
                modelo: 'Corolla',
                año: 2020,
                kilometros: 25000,
                imagen: '../../assets/images/car1.jpg',
                alerta: 'Cambio de aceite'
            },
            {
                id: 2,
                marca: 'Honda',
                modelo: 'Civic',
                año: 2018,
                kilometros: 42500,
                imagen: '../../assets/images/car2.jpg',
                alerta: 'Afinación general'
            }
        ];
        
        // Actualizar widget
        document.querySelector('.widget-value').textContent = cars.length;
    }
    
    function loadAlerts() {
        // En una aplicación real, esto vendría de una API
        const alerts = [
            {
                type: 'warning',
                title: 'Cambio de aceite próximo',
                description: 'Toyota Corolla - 500 km restantes',
                date: 'Hace 2 días'
            },
            {
                type: 'danger',
                title: 'Afinación general requerida',
                description: 'Honda Civic - 2,500 km excedidos',
                date: 'Hace 1 semana'
            },
            {
                type: 'info',
                title: 'Rotación de llantas próxima',
                description: 'Toyota Corolla - 1,200 km restantes',
                date: 'Hace 3 días'
            }
        ];
        
        // Actualizar widget
        document.querySelector('.widget-value.warning').textContent = alerts.length;
    }
});