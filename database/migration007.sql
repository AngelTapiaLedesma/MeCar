USE MeCarDB;
GO

-- Datos para distinguir recordatorios automáticos de verificación.
IF COL_LENGTH('Recordatorios', 'EsAutomatico') IS NULL
    ALTER TABLE Recordatorios ADD EsAutomatico BIT NOT NULL CONSTRAINT DF_Recordatorios_EsAutomatico DEFAULT 0;
GO
IF COL_LENGTH('Recordatorios', 'ClaveAutomatica') IS NULL
    ALTER TABLE Recordatorios ADD ClaveAutomatica NVARCHAR(40) NULL;
GO

-- Evita duplicar la cita automática de un vehículo y periodo.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_Recordatorios_ClaveAutomatica'
      AND object_id = OBJECT_ID('Recordatorios')
)
    CREATE UNIQUE INDEX UX_Recordatorios_ClaveAutomatica
        ON Recordatorios (ClaveAutomatica)
        WHERE ClaveAutomatica IS NOT NULL;
GO

-- Los registros históricos pueden ser NULL; el backend exige kilometraje para
-- tickets nuevos. WITH NOCHECK permite migrar bases con datos viejos inválidos
-- sin romper, pero la regla sí aplica a inserts/updates nuevos.
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_HistorialServicios_KilometrajeNoNegativo'
)
    ALTER TABLE HistorialServicios WITH NOCHECK ADD CONSTRAINT CK_HistorialServicios_KilometrajeNoNegativo
        CHECK (KilometrajeEnServicio IS NULL OR KilometrajeEnServicio >= 0);
GO

PRINT 'Migration 007 completada: recordatorios automáticos de verificación y kilometraje no negativo.';
GO
