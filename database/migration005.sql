USE MeCarDB;
GO

-- ============================================================
-- MIGRATION 005: VIN/Serial, Double Cost, History Search
-- ============================================================

-- 1. VIN/SERIAL: ampliar columna a VARCHAR(30) y quitar UNIQUE
--    La columna VIN ya existe en schema.sql como NVARCHAR(17) UNIQUE.
--    Permite duplicados: primero hay que quitar el índice UNIQUE si existe.
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('Vehiculos') AND name LIKE 'UQ__Vehiculo%VIN%'
)
BEGIN
    DECLARE @constraintName NVARCHAR(256);
    SELECT @constraintName = name FROM sys.indexes
    WHERE object_id = OBJECT_ID('Vehiculos') AND name LIKE 'UQ__Vehiculo%VIN%';
    EXEC('ALTER TABLE Vehiculos DROP CONSTRAINT [' + @constraintName + ']');
END
GO

ALTER TABLE Vehiculos ALTER COLUMN VIN NVARCHAR(30) NULL;
GO

-- 2. VIN en el snapshot del ticket
ALTER TABLE HistorialServicios ADD VINSnapshot NVARCHAR(30) NULL;
GO

-- 3. DOUBLE COST: agregar CostoBase a CatalogoItems (costo del taller)
ALTER TABLE CatalogoItems ADD CostoBase DECIMAL(10,2) NOT NULL DEFAULT 0;
GO

-- 4. DOUBLE COST: agregar Costo (taller) a ServicioItems
ALTER TABLE ServicioItems ADD Costo DECIMAL(10,2) NULL;
GO

-- 5. DOUBLE COST: agregar CostoManoObraTaller a HistorialServicios
ALTER TABLE HistorialServicios ADD CostoManoObraTaller DECIMAL(10,2) NULL;
GO
