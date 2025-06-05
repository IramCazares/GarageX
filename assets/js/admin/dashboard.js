document.addEventListener('DOMContentLoaded', function() {
    // Inicializar gráficos
    initUsersChart();
    initMaintenanceChart();
    
    // Cargar datos del dashboard
    loadDashboardData();
    
    function initUsersChart() {
        const ctx = document.getElementById('usersChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Usuarios Registrados',
                    data: [12, 19, 15, 20, 22, 24, 28],
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    function initMaintenanceChart() {
        const ctx = document.getElementById('maintenanceChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Cambio de aceite', 'Rotación de llantas', 'Afinación general', 'Otros'],
                datasets: [{
                    data: [45, 30, 15, 10],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(241, 196, 15, 0.7)',
                        'rgba(155, 89, 182, 0.7)'
                    ],
                    borderColor: [
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(241, 196, 15, 1)',
                        'rgba(155, 89, 182, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    function loadDashboardData() {
        // Aquí irían las llamadas a la API para obtener los datos del dashboard
        // Por ahora usamos datos simulados
        
        // Actualizar widgets
        document.querySelector('.widget-value').textContent = '24';
        document.querySelectorAll('.widget-value')[1].textContent = '42';
        document.querySelectorAll('.widget-value')[2].textContent = '128';
    }
});