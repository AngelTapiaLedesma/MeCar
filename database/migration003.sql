USE MeCarDB;
GO

-- "Foto" del vehículo y del cliente al momento de crear el ticket, para que
-- el historial de tickets CERRADOS siga siendo legible aunque después se
-- borre el vehículo.
ALTER TABLE HistorialServicios ADD VehiculoSnapshot NVARCHAR(150) NULL;
GO
ALTER TABLE HistorialServicios ADD ClienteSnapshot NVARCHAR(150) NULL;
GO

-- IdVehiculo debe poder quedar en NULL cuando se borra el vehículo (esto
-- solo les pasa a los tickets CERRADOS; los abiertos se borran de verdad,
-- ver el endpoint DELETE /vehiculos/:id).
ALTER TABLE HistorialServicios ALTER COLUMN IdVehiculo INT NULL;
GO

-- Cambiamos el FK de ON DELETE CASCADE a ON DELETE SET NULL:
-- hay que borrar el constraint viejo y crear uno nuevo.
ALTER TABLE HistorialServicios DROP CONSTRAINT FK_Servicios_Vehiculos;
GO
ALTER TABLE HistorialServicios
    ADD CONSTRAINT FK_Servicios_Vehiculos FOREIGN KEY (IdVehiculo)
    REFERENCES Vehiculos(IdVehiculo) ON DELETE SET NULL;
GO