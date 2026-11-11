USE MeCarDB;
GO

-- Esquema base consolidado de MeCar.
-- Para bases de datos existentes usa las migraciones 001-007; este archivo
-- representa el estado final para una instalación desde cero.

-- 1. Clientes
CREATE TABLE Clientes (
    IdCliente INT IDENTITY(1,1) PRIMARY KEY,
    NombreCompleto NVARCHAR(150) NOT NULL,
    Telefono NVARCHAR(20),
    Email NVARCHAR(100),
    Direccion NVARCHAR(255),
    Notas NVARCHAR(MAX),
    Estatus BIT NOT NULL DEFAULT 1,
    FechaRegistro DATETIME DEFAULT GETDATE()
);
GO

-- 2. Vehículos
CREATE TABLE Vehiculos (
    IdVehiculo INT IDENTITY(1,1) PRIMARY KEY,
    IdCliente INT NOT NULL,
    Placas NVARCHAR(15) NOT NULL UNIQUE,
    VIN NVARCHAR(30) NULL,
    Marca NVARCHAR(50) NOT NULL,
    Modelo NVARCHAR(50) NOT NULL,
    Anio INT NOT NULL,
    Motor NVARCHAR(50),
    Color NVARCHAR(30) NULL,
    KilometrajeActual INT,
    CONSTRAINT FK_Vehiculos_Clientes FOREIGN KEY (IdCliente)
        REFERENCES Clientes(IdCliente) ON DELETE CASCADE
);
GO

-- 3. Historial de Servicios (tickets)
CREATE TABLE HistorialServicios (
    IdServicio INT IDENTITY(1,1) PRIMARY KEY,
    IdVehiculo INT NULL,
    Titulo NVARCHAR(150) NULL,
    Descripcion NVARCHAR(MAX) NULL,
    CostoPiezas DECIMAL(10,2) DEFAULT 0.00,
    CostoManoObra DECIMAL(10,2) DEFAULT 0.00,
    CostoManoObraTaller DECIMAL(10,2) NULL,
    CostoTotal AS (CostoPiezas + CostoManoObra) PERSISTED,
    MargenGanancia DECIMAL(10,2) NOT NULL DEFAULT 0,
    Tecnico NVARCHAR(100) NULL,
    Estatus NVARCHAR(20) NOT NULL DEFAULT 'In Progress',
    KilometrajeEnServicio INT,
    FechaServicio DATETIME DEFAULT GETDATE(),
    VehiculoSnapshot NVARCHAR(150) NULL,
    ClienteSnapshot NVARCHAR(150) NULL,
    VINSnapshot NVARCHAR(30) NULL,
    CONSTRAINT FK_Servicios_Vehiculos FOREIGN KEY (IdVehiculo)
        REFERENCES Vehiculos(IdVehiculo) ON DELETE SET NULL,
    CONSTRAINT CK_HistorialServicios_KilometrajeNoNegativo
        CHECK (KilometrajeEnServicio IS NULL OR KilometrajeEnServicio >= 0)
);
GO

-- 4. Categorías de recordatorios/citas
CREATE TABLE Categorias (
    IdCategoria INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    ColorClase NVARCHAR(100) NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE()
);
GO

-- 5. Recordatorios y citas
CREATE TABLE Recordatorios (
    IdRecordatorio INT IDENTITY(1,1) PRIMARY KEY,
    IdVehiculo INT NOT NULL,
    TipoRecordatorio NVARCHAR(50) NOT NULL,
    FechaInicio DATE NOT NULL,
    EsRecurrente BIT NOT NULL DEFAULT 0,
    IntervaloDias INT NULL,
    Notificar BIT NOT NULL DEFAULT 1,
    IdCategoria INT NOT NULL,
    EsAutomatico BIT NOT NULL DEFAULT 0,
    ClaveAutomatica NVARCHAR(40) NULL,
    Completado BIT DEFAULT 0,
    FechaCompletado DATETIME NULL,
    CONSTRAINT FK_Recordatorios_Vehiculos FOREIGN KEY (IdVehiculo)
        REFERENCES Vehiculos(IdVehiculo) ON DELETE CASCADE,
    CONSTRAINT FK_Recordatorios_Categorias FOREIGN KEY (IdCategoria)
        REFERENCES Categorias(IdCategoria)
);
GO

CREATE INDEX IX_Recordatorios_IdCategoria ON Recordatorios(IdCategoria);
GO

CREATE UNIQUE INDEX UX_Recordatorios_ClaveAutomatica
    ON Recordatorios(ClaveAutomatica)
    WHERE ClaveAutomatica IS NOT NULL;
GO

-- 6. Catálogo de servicios
CREATE TABLE CatalogoSecciones (
    IdSeccion INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    Orden INT NOT NULL DEFAULT 0
);
GO

CREATE TABLE CatalogoItems (
    IdItem INT IDENTITY(1,1) PRIMARY KEY,
    IdSeccion INT NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    PrecioBase DECIMAL(10,2) NOT NULL DEFAULT 0,
    CostoBase DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT FK_CatalogoItems_Secciones FOREIGN KEY (IdSeccion)
        REFERENCES CatalogoSecciones(IdSeccion) ON DELETE CASCADE
);
GO

-- 7. Líneas individuales de cada ticket
CREATE TABLE ServicioItems (
    IdServicioItem INT IDENTITY(1,1) PRIMARY KEY,
    IdServicio INT NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Precio DECIMAL(10,2) NOT NULL,
    Costo DECIMAL(10,2) NULL,
    Origen NVARCHAR(20) NOT NULL DEFAULT 'custom',
    IdCatalogoItem INT NULL,
    CONSTRAINT FK_ServicioItems_Servicio FOREIGN KEY (IdServicio)
        REFERENCES HistorialServicios(IdServicio) ON DELETE CASCADE,
    CONSTRAINT FK_ServicioItems_CatalogoItem FOREIGN KEY (IdCatalogoItem)
        REFERENCES CatalogoItems(IdItem) ON DELETE SET NULL
);
GO
