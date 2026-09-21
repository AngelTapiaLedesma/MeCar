USE MeCarDB;
GO

-- ===== Catálogo de servicios (persistente, reutilizable entre tickets) =====

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
    CONSTRAINT FK_CatalogoItems_Secciones FOREIGN KEY (IdSeccion)
        REFERENCES CatalogoSecciones(IdSeccion) ON DELETE CASCADE
);
GO

-- Datos iniciales, igual a la maqueta de Figma
INSERT INTO CatalogoSecciones (Nombre, Orden) VALUES
    ('Maintenance', 1),
    ('Brakes & Suspension', 2),
    ('Engine & Electrical', 3),
    ('Climate & Comfort', 4),
    ('Inspection', 5);
GO

INSERT INTO CatalogoItems (IdSeccion, Nombre, PrecioBase)
SELECT IdSeccion, 'Oil Change', 80.00 FROM CatalogoSecciones WHERE Nombre = 'Maintenance'
UNION ALL
SELECT IdSeccion, 'Oil Change + Filter', 95.00 FROM CatalogoSecciones WHERE Nombre = 'Maintenance'
UNION ALL
SELECT IdSeccion, 'Tire Rotation', 50.00 FROM CatalogoSecciones WHERE Nombre = 'Maintenance'
UNION ALL
SELECT IdSeccion, 'Wheel Alignment', 90.00 FROM CatalogoSecciones WHERE Nombre = 'Maintenance'
UNION ALL
SELECT IdSeccion, 'Coolant Flush', 120.00 FROM CatalogoSecciones WHERE Nombre = 'Maintenance'
UNION ALL
SELECT IdSeccion, 'Transmission Service', 590.00 FROM CatalogoSecciones WHERE Nombre = 'Maintenance'
UNION ALL
SELECT IdSeccion, 'Full Service', 380.00 FROM CatalogoSecciones WHERE Nombre = 'Maintenance';
GO

-- ===== Campos que le faltaban a HistorialServicios para ser un ticket real =====

ALTER TABLE HistorialServicios ALTER COLUMN Titulo NVARCHAR(150) NULL;
GO
ALTER TABLE HistorialServicios ALTER COLUMN Descripcion NVARCHAR(MAX) NULL;
GO
ALTER TABLE HistorialServicios ADD Tecnico NVARCHAR(100) NULL;
GO
ALTER TABLE HistorialServicios ADD Estatus NVARCHAR(20) NOT NULL DEFAULT 'In Progress';
GO
ALTER TABLE HistorialServicios ADD MargenGanancia DECIMAL(10,2) NOT NULL DEFAULT 0;
GO

-- ===== Líneas individuales de cada ticket (los "repair items" agregados) =====

CREATE TABLE ServicioItems (
    IdServicioItem INT IDENTITY(1,1) PRIMARY KEY,
    IdServicio INT NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Precio DECIMAL(10,2) NOT NULL,
    Origen NVARCHAR(20) NOT NULL DEFAULT 'custom', -- 'catalogo' o 'custom'
    IdCatalogoItem INT NULL,
    CONSTRAINT FK_ServicioItems_Servicio FOREIGN KEY (IdServicio)
        REFERENCES HistorialServicios(IdServicio) ON DELETE CASCADE,
    CONSTRAINT FK_ServicioItems_CatalogoItem FOREIGN KEY (IdCatalogoItem)
        REFERENCES CatalogoItems(IdItem) ON DELETE SET NULL
);
GO