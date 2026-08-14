USE MeCarDB;
GO

-- Aquí abajo va todo el código de tus tablas (CREATE TABLE Clientes...)
-- 1. Tabla de Clientes
CREATE TABLE Clientes (
    IdCliente INT IDENTITY(1,1) PRIMARY KEY,
    NombreCompleto NVARCHAR(150) NOT NULL,
    Telefono NVARCHAR(20),
    Email NVARCHAR(100),
    Notas NVARCHAR(MAX),
    FechaRegistro DATETIME DEFAULT GETDATE()
);

-- 2. Tabla de Vehículos
CREATE TABLE Vehiculos (
    IdVehiculo INT IDENTITY(1,1) PRIMARY KEY,
    IdCliente INT NOT NULL,
    Placas NVARCHAR(15) NOT NULL UNIQUE,
    VIN NVARCHAR(17), -- El Número de Identificación Vehicular siempre tiene 17 caracteres
    Marca NVARCHAR(50) NOT NULL,
    Modelo NVARCHAR(50) NOT NULL,
    Anio INT NOT NULL,
    Motor NVARCHAR(50), -- Ej. '2.0L 4Cil'
    KilometrajeActual INT,
    CONSTRAINT FK_Vehiculos_Clientes FOREIGN KEY (IdCliente) 
        REFERENCES Clientes(IdCliente) ON DELETE CASCADE
);

-- 3. Tabla de Historial de Servicios (El "Log" del auto)
CREATE TABLE HistorialServicios (
    IdServicio INT IDENTITY(1,1) PRIMARY KEY,
    IdVehiculo INT NOT NULL,
    Titulo NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(MAX) NOT NULL,
    CostoPiezas DECIMAL(10,2) DEFAULT 0.00,
    CostoManoObra DECIMAL(10,2) DEFAULT 0.00,
    -- Columna calculada automáticamente por SQL Server
    CostoTotal AS (CostoPiezas + CostoManoObra) PERSISTED, 
    KilometrajeEnServicio INT,
    FechaServicio DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Servicios_Vehiculos FOREIGN KEY (IdVehiculo) 
        REFERENCES Vehiculos(IdVehiculo) ON DELETE CASCADE
);

-- 4. Tabla de Mantenimientos y Verificaciones (El Calendario)
CREATE TABLE Recordatorios (
    IdRecordatorio INT IDENTITY(1,1) PRIMARY KEY,
    IdVehiculo INT NOT NULL,
    TipoRecordatorio NVARCHAR(50) NOT NULL, -- Ej. 'Verificación', 'Cambio de Aceite'
    FechaVencimiento DATE NOT NULL,
    Completado BIT DEFAULT 0, -- 0 = Pendiente, 1 = Realizado
    FechaCompletado DATETIME NULL,
    CONSTRAINT FK_Recordatorios_Vehiculos FOREIGN KEY (IdVehiculo) 
        REFERENCES Vehiculos(IdVehiculo) ON DELETE CASCADE
);