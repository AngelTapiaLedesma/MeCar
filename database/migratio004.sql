USE MeCarDB;
GO

ALTER TABLE Recordatorios ADD EsRecurrente BIT NOT NULL DEFAULT 0;
GO
ALTER TABLE Recordatorios ADD IntervaloDias INT NULL;
GO
ALTER TABLE Recordatorios ADD Notificar BIT NOT NULL DEFAULT 1;
GO

-- Renombramos FechaVencimiento -> FechaInicio: para un evento único es su
-- fecha; para uno recurrente es la fecha de la primera ocurrencia (las
-- siguientes se calculan sumando IntervaloDias, no se guardan filas nuevas).
EXEC sp_rename 'Recordatorios.FechaVencimiento', 'FechaInicio', 'COLUMN';
GO