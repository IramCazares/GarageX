-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS garagex_db;
USE garagex_db;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'user') DEFAULT 'user',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de autos
CREATE TABLE autos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    año INT NOT NULL,
    kilometros INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de mantenimientos
CREATE TABLE mantenimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auto_id INT NOT NULL,
    tipo ENUM('cambio_aceite', 'rotacion_llantas', 'afinacion', 'otros') NOT NULL,
    fecha DATE NOT NULL,
    kilometros INT NOT NULL,
    costo DECIMAL(10,2),
    comentarios TEXT,
    FOREIGN KEY (auto_id) REFERENCES autos(id) ON DELETE CASCADE
);

-- Tabla de servicios recomendados
CREATE TABLE servicios_recomendados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    kilometros_intervalo INT NOT NULL,
    costo_promedio DECIMAL(10,2) NOT NULL,
    descripcion TEXT
);

-- Insertar servicios recomendados
INSERT INTO servicios_recomendados (nombre, kilometros_intervalo, costo_promedio, descripcion) VALUES
('Cambio de aceite', 5000, 500.00, 'Reemplazo de aceite y filtro de aceite'),
('Rotación de llantas', 10000, 300.00, 'Rotación de llantas para desgaste parejo'),
('Afinación general', 20000, 1200.00, 'Revisión completa del motor y sistemas principales'),
('Cambio de filtro de aire', 15000, 350.00, 'Reemplazo del filtro de aire del motor'),
('Cambio de frenos', 30000, 1200.00, 'Reemplazo de pastillas y discos de freno');