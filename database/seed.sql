USE MeCarDB;
GO

-- 1. Insertamos Clientes (Papá mecánico style)
INSERT INTO Clientes (NombreCompleto, Telefono, Email, Notas)
VALUES 
('Juan Pérez', '555-123-4567', 'juan.perez@email.com', 'Cliente frecuente, paga puntual.'),
('María Fernanda López', '555-987-6543', 'mafer.lopez@email.com', 'Es muy exigente con la limpieza del auto.'),
('Roberto Gómez', '555-456-7890', 'roberto.gomez@email.com', 'Pide factura de todo.');

-- 2. Insertamos Vehículos (Asumiendo que los IDs de arriba son 1, 2 y 3)
INSERT INTO Vehiculos (IdCliente, Placas, VIN, Marca, Modelo, Anio, Motor, KilometrajeActual)
VALUES 
(1, 'ABC-1234', '3VW21234567890123', 'Volkswagen', 'Jetta', 2018, '2.0L', 65000),
(1, 'XYZ-9876', '1G123456789012345', 'Chevrolet', 'Chevy', 2010, '1.6L', 120000),
(2, 'DEF-5678', 'JHM21234567890123', 'Honda', 'CR-V', 2021, '1.5L Turbo', 35000),
(3, 'GHI-9012', '3N121234567890123', 'Nissan', 'Versa', 2019, '1.6L', 50000);

-- 3. Insertamos Historial de Servicios (El Log de reparaciones)
INSERT INTO HistorialServicios (IdVehiculo, Titulo, Descripcion, CostoPiezas, CostoManoObra, KilometrajeEnServicio, FechaServicio)
VALUES 
(1, 'Afinación Mayor', 'Cambio de bujías, aceite sintético, filtro de aire y gasolina. Limpieza de inyectores.', 1500.00, 800.00, 64500, DATEADD(day, -30, GETDATE())),
(2, 'Cambio de Balatas', 'Cambio de balatas delanteras marca TRW y rectificado de discos.', 900.00, 500.00, 119800, DATEADD(day, -15, GETDATE())),
(3, 'Revisión General', 'Revisión de niveles, suspensión y frenos. Todo en orden.', 0.00, 300.00, 34900, DATEADD(day, -5, GETDATE()));

-- 4. Insertamos Recordatorios (El calendario de tu papá)
INSERT INTO Recordatorios (IdVehiculo, TipoRecordatorio, FechaVencimiento, Completado)
VALUES 
(1, 'Verificación Vehicular', DATEADD(day, 12, GETDATE()), 0), -- Vence en 12 días
(1, 'Cambio de Aceite', DATEADD(day, 60, GETDATE()), 0),      -- Vence en 2 meses
(2, 'Renovación de Seguro', DATEADD(day, 5, GETDATE()), 0),    -- Vence en 5 días
(3, 'Servicio de Agencia 40k', DATEADD(day, 180, GETDATE()), 0); -- Vence en 6 meses