document.addEventListener('DOMContentLoaded', function() {
    const carSelect = document.getElementById('carSelect');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const reportContainer = document.getElementById('reportContainer');
    const reportCarInfo = document.getElementById('reportCarInfo');
    const reportDate = document.getElementById('reportDate');
    const historyTable = document.getElementById('historyTable').getElementsByTagName('tbody')[0];
    
    let cars = [];
    let selectedCarId = null;
    let maintenances = [];
    
    // Cargar autos al iniciar
    loadCars();
    
    // Evento para seleccionar auto
    carSelect.addEventListener('change', function() {
        selectedCarId = this.value;
        
        if (selectedCarId) {
            exportPdfBtn.disabled = false;
            loadMaintenances(selectedCarId);
        } else {
            exportPdfBtn.disabled = true;
            reportContainer.style.display = 'none';
        }
    });
    
    // Evento para exportar a PDF
    exportPdfBtn.addEventListener('click', exportToPdf);
    
    // Función para cargar autos
    function loadCars() {
        fetch('../../backend/api/cars.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    cars = data.data;
                    renderCarSelect();
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
                    renderHistoryTable();
                    reportContainer.style.display = 'block';
                } else {
                    alert('Error al cargar mantenimientos: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar mantenimientos');
            });
    }
    
    // Función para renderizar la tabla de historial
    function renderHistoryTable() {
        historyTable.innerHTML = '';
        
        if (maintenances.length === 0) {
            const row = historyTable.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5;
            cell.textContent = 'No hay mantenimientos registrados para este auto.';
            cell.style.textAlign = 'center';
            return;
        }
        
        // Actualizar información del reporte
        const selectedCar = cars.find(car => car.id == selectedCarId);
        reportCarInfo.textContent = `${selectedCar.marca} ${selectedCar.modelo} (${selectedCar.año}) - ${selectedCar.kilometros.toLocaleString()} km`;
        
        const today = new Date();
        reportDate.textContent = `Reporte generado el ${today.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        })}`;
        
        // Agregar mantenimientos a la tabla
        maintenances.forEach(maintenance => {
            const row = historyTable.insertRow();
            
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
        });
    }
    
    // Función para exportar a PDF
    function exportToPdf() {
        if (!selectedCarId) return;
        
        // Mostrar mensaje de generación
        exportPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando PDF...';
        exportPdfBtn.disabled = true;
        
        // Usar html2canvas y jsPDF para generar el PDF
        const { jsPDF } = window.jspdf;
        
        html2canvas(document.getElementById('reportContent')).then(canvas => {
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
            const selectedCar = cars.find(car => car.id == selectedCarId);
            const fileName = `Historial_${selectedCar.marca}_${selectedCar.modelo}.pdf`;
            pdf.save(fileName);
            
            // Restaurar botón
            exportPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Exportar a PDF';
            exportPdfBtn.disabled = false;
        });
    }
});