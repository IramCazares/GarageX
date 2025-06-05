document.addEventListener('DOMContentLoaded', function() {
    const reportType = document.getElementById('reportType');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const reportResults = document.getElementById('reportResults');
    const reportTitle = document.getElementById('reportTitle');
    const reportStats = document.getElementById('reportStats');
    const reportTable = document.getElementById('reportTable').getElementsByTagName('tbody')[0];
    const reportTableHeaders = document.getElementById('reportTableHeaders');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    
    // Establecer fechas por defecto (últimos 30 días)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    startDate.valueAsDate = lastMonth;
    endDate.valueAsDate = today;
    
    // Evento para generar reporte
    generateReportBtn.addEventListener('click', function() {
        const type = reportType.value;
        const start = startDate.value;
        const end = endDate.value;
        
        // Validar fechas
        if (start && end && new Date(start) > new Date(end)) {
            alert('La fecha de inicio no puede ser mayor a la fecha de fin');
            return;
        }
        
        generateReport(type, start, end);
    });
    
    // Evento para exportar a PDF
    exportPdfBtn.addEventListener('click', exportToPdf);
    
    // Función para generar reporte
    function generateReport(type, start, end) {
        // Mostrar carga
        generateReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        generateReportBtn.disabled = true;
        
        // Construir URL de la API
        let url = `../../backend/api/reports.php?type=${type}`;
        if (start) url += `&start_date=${start}`;
        if (end) url += `&end_date=${end}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderReport(type, data.data);
                    reportResults.style.display = 'block';
                } else {
                    alert('Error al generar reporte: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al generar reporte');
            })
            .finally(() => {
                generateReportBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Generar Reporte';
                generateReportBtn.disabled = false;
            });
    }
    
    // Función para renderizar el reporte
    function renderReport(type, data) {
        // Limpiar resultados anteriores
        reportStats.innerHTML = '';
        reportTable.innerHTML = '';
        
        // Configurar título del reporte
        let title = '';
        let headers = [];
        
        switch (type) {
            case 'users':
                title = 'Reporte de Usuarios Registrados';
                headers = ['Nombre', 'Email', 'Rol', 'Fecha Registro'];
                renderUsersReport(data);
                break;
            case 'maintenance':
                title = 'Reporte de Mantenimientos';
                headers = ['Auto', 'Tipo', 'Fecha', 'Kilómetros', 'Costo', 'Comentarios', 'Usuario'];
                renderMaintenanceReport(data);
                break;
            case 'services':
                title = 'Reporte de Servicios';
                headers = ['Servicio', 'Intervalo (km)', 'Costo Promedio', 'Total Realizados', 'Costo Total', 'Costo Promedio Real'];
                renderServicesReport(data);
                break;
        }
        
        // Agregar rango de fechas al título si existe
        if (data.stats.start_date || data.stats.end_date) {
            title += ` (${data.stats.start_date || 'Inicio'} - ${data.stats.end_date || 'Fin'})`;
        }
        
        reportTitle.textContent = title;
        
        // Configurar encabezados de la tabla
        reportTableHeaders.innerHTML = '';
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            reportTableHeaders.appendChild(th);
        });
    }
    
    // Función para renderizar reporte de usuarios
    function renderUsersReport(data) {
        // Mostrar estadísticas
        reportStats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total de Usuarios</h4>
                    <p>${data.stats.total}</p>
                </div>
                <div class="stat-card">
                    <h4>Administradores</h4>
                    <p>${data.stats.admins}</p>
                </div>
                <div class="stat-card">
                    <h4>Usuarios Regulares</h4>
                    <p>${data.stats.regular_users}</p>
                </div>
            </div>
        `;
        
        // Mostrar datos en tabla
        data.users.forEach(user => {
            const row = reportTable.insertRow();
            
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
        });
    }
    
    // Función para renderizar reporte de mantenimientos
    function renderMaintenanceReport(data) {
        // Mostrar estadísticas
        reportStats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total de Mantenimientos</h4>
                    <p>${data.stats.total}</p>
                </div>
                <div class="stat-card">
                    <h4>Costo Total</h4>
                    <p>$${data.stats.total_cost.toFixed(2)}</p>
                </div>
            </div>
            
            <h4>Distribución por Tipo</h4>
            <div class="stats-grid">
                ${Object.entries(data.stats.types_count).map(([type, count]) => `
                    <div class="stat-card">
                        <h4>${formatMaintenanceType(type)}</h4>
                        <p>${count}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Mostrar datos en tabla
        data.maintenances.forEach(maintenance => {
            const row = reportTable.insertRow();
            
            row.insertCell(0).textContent = `${maintenance.marca} ${maintenance.modelo} (${maintenance.año})`;
            row.insertCell(1).textContent = formatMaintenanceType(maintenance.tipo);
            
            const date = new Date(maintenance.fecha);
            const formattedDate = date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            row.insertCell(2).textContent = formattedDate;
            row.insertCell(3).textContent = maintenance.kilometros.toLocaleString();
            row.insertCell(4).textContent = maintenance.costo ? `$${maintenance.costo.toFixed(2)}` : '-';
            row.insertCell(5).textContent = maintenance.comentarios || '-';
            row.insertCell(6).textContent = maintenance.usuario_nombre;
        });
    }
    
    // Función para renderizar reporte de servicios
    function renderServicesReport(data) {
        // Mostrar estadísticas
        reportStats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total de Servicios</h4>
                    <p>${data.stats.total_services}</p>
                </div>
                <div class="stat-card">
                    <h4>Costo Total</h4>
                    <p>$${data.stats.total_cost.toFixed(2)}</p>
                </div>
            </div>
        `;
        
        // Mostrar datos en tabla
        data.services.forEach(service => {
            const row = reportTable.insertRow();
            
            row.insertCell(0).textContent = service.nombre;
            row.insertCell(1).textContent = service.kilometros_intervalo.toLocaleString();
            row.insertCell(2).textContent = `$${service.costo_promedio.toFixed(2)}`;
            row.insertCell(3).textContent = service.total_services;
            row.insertCell(4).textContent = service.total_cost ? `$${service.total_cost.toFixed(2)}` : '$0.00';
            row.insertCell(5).textContent = service.avg_cost ? `$${service.avg_cost.toFixed(2)}` : '-';
        });
    }
    
    // Función para formatear tipo de mantenimiento
    function formatMaintenanceType(type) {
        switch (type) {
            case 'cambio_aceite':
                return 'Cambio de aceite';
            case 'rotacion_llantas':
                return 'Rotación de llantas';
            case 'afinacion':
                return 'Afinación general';
            default:
                return type;
        }
    }
    
    // Función para exportar a PDF
    function exportToPdf() {
        // Mostrar mensaje de generación
        exportPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando PDF...';
        exportPdfBtn.disabled = true;
        
        // Usar html2canvas y jsPDF para generar el PDF
        const { jsPDF } = window.jspdf;
        
        // Crear un elemento temporal que contenga solo el reporte
        const reportElement = document.createElement('div');
        reportElement.className = 'pdf-report';
        reportElement.innerHTML = `
            <div class="pdf-header">
                <img src="../../assets/images/logo.png" alt="GarageX Logo" style="height: 50px;">
                <h2>${reportTitle.textContent}</h2>
                <p>Generado el ${new Date().toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                })}</p>
            </div>
            <div class="pdf-content">
                ${reportStats.innerHTML}
                ${document.querySelector('.table-container').innerHTML}
            </div>
            <div class="pdf-footer">
                <p>GarageX - Sistema de Gestión de Mantenimiento de Vehículos</p>
            </div>
        `;
        
        // Estilos para el PDF
        const style = document.createElement('style');
        style.textContent = `
            .pdf-report {
                font-family: Arial, sans-serif;
                padding: 20px;
            }
            .pdf-header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 20px;
            }
            .pdf-header h2 {
                margin: 10px 0;
                color: #333;
            }
            .pdf-content {
                margin: 20px 0;
            }
            .pdf-footer {
                text-align: center;
                margin-top: 20px;
                border-top: 1px solid #ddd;
                padding-top: 20px;
                font-size: 12px;
                color: #777;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            .stat-card {
                background-color: #f9f9f9;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-card h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #555;
            }
            .stat-card p {
                margin: 0;
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #3498db;
                color: white;
            }
            tr:nth-child(even) {
                background-color: #f2f2f2;
            }
        `;
        
        document.body.appendChild(style);
        document.body.appendChild(reportElement);
        
        html2canvas(reportElement).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            // Descargar el PDF
            const fileName = `Reporte_${reportType.value}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
            // Limpiar
            document.body.removeChild(reportElement);
            document.body.removeChild(style);
            
            // Restaurar botón
            exportPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Exportar a PDF';
            exportPdfBtn.disabled = false;
        });
    }
});