-- Migration 006: Categorías dinámicas para recordatorios/citas
USE MeCarDB;
GO

-- 1. Crear tabla de Categorías
CREATE TABLE Categorias (
    IdCategoria INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    ColorClase NVARCHAR(100) NOT NULL, -- Clases CSS para el color (ej. 'bg-emerald-50 text-emerald-600 border-emerald-200')
    FechaCreacion DATETIME DEFAULT GETDATE()
);
GO

-- 2. Insertar las 4 categorías predeterminadas
INSERT INTO Categorias (Nombre, ColorClase) VALUES
('Mantenimiento', 'bg-emerald-50 text-emerald-600 border-emerald-200'),
('Reparación', 'bg-orange-50 text-orange-600 border-orange-200'),
('Verificación', 'bg-blue-50 text-blue-600 border-blue-200'),
('Diagnóstico', 'bg-purple-50 text-purple-600 border-purple-200');
GO

-- 3. Agregar columna IdCategoria a Recordatorios
ALTER TABLE Recordatorios
ADD IdCategoria INT NULL;
GO

-- 4. Agregar la relación de clave foránea
ALTER TABLE Recordatorios
ADD CONSTRAINT FK_Recordatorios_Categorias
    FOREIGN KEY (IdCategoria) REFERENCES Categorias(IdCategoria);
GO

-- 5. Migrar datos existentes: asignar "Mantenimiento" por defecto a todos los recordatorios existentes
UPDATE Recordatorios
SET IdCategoria = (SELECT IdCategoria FROM Categorias WHERE Nombre = 'Mantenimiento')
WHERE IdCategoria IS NULL;
GO

-- 6. Hacer la columna obligatoria después de la migración
ALTER TABLE Recordatorios
ALTER COLUMN IdCategoria INT NOT NULL;
GO

-- 7. Agregar índice para mejorar el rendimiento de consultas
CREATE INDEX IX_Recordatorios_IdCategoria ON Recordatorios(IdCategoria);
GO

PRINT 'Migration 006 completada: Tabla Categorias creada y Recordatorios actualizado con categorías.';
GO
