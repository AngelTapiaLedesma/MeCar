import { notifyVehiclesChanged } from "../utils/events";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function mapVehicleFromApi(raw) {
  return {
    id: String(raw.IdVehiculo),
    clientId: String(raw.IdCliente),
    clientName: raw.ClienteNombre || "",
    plate: raw.Placas,
    vin: raw.VIN || "",
    make: raw.Marca,
    model: raw.Modelo,
    year: raw.Anio,
    color: raw.Color || "",
    mileage: raw.KilometrajeActual ?? null,
    verification: raw.DatosVerificacion || null,
    plateColor: raw.DatosVerificacion?.color || "",
    noCirculaDay: raw.DatosVerificacion?.noCircula || "",
  };
}

export async function fetchVehicles() {
  const res = await fetch(`${API_URL}/vehiculos`);
  if (!res.ok) throw new Error("No se pudo cargar la lista de vehículos.");
  const data = await res.json();
  return data.map(mapVehicleFromApi);
}

export async function fetchVehicleById(id) {
  if (id == null) return null;
  const res = await fetch(`${API_URL}/vehiculos/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se pudo cargar el vehículo.");
  const data = await res.json();
  return mapVehicleFromApi(data);
}

export async function checkVin(vin, excludeId) {
  if (!vin || !vin.trim()) return { exists: false };
  const params = new URLSearchParams({ vin: vin.trim() });
  if (excludeId) params.append('excludeId', excludeId);
  const res = await fetch(`${API_URL}/vehiculos/check-vin?${params}`);
  if (!res.ok) throw new Error("No se pudo verificar el VIN.");
  return res.json();
}

export async function createVehicle(form) {
  const res = await fetch(`${API_URL}/vehiculos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      IdCliente: form.clientId,
      Placas: form.plate,
      VIN: form.vin,
      Marca: form.make,
      Modelo: form.model,
      Anio: form.year,
      Color: form.color,
      KilometrajeActual: form.mileage,
    }),
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "No se pudo registrar el vehículo.");
  }
  const result = await res.json();
  const created = mapVehicleFromApi({
    IdVehiculo: result.IdVehiculo,
    IdCliente: form.clientId,
    ClienteNombre: form.clientName || "",
    Placas: form.plate,
    VIN: form.vin,
    Marca: form.make,
    Modelo: form.model,
    Anio: form.year,
    Color: form.color,
    KilometrajeActual: form.mileage,
  });
  notifyVehiclesChanged({ vehicleId: created.id, reason: "created" });
  return created;
}

export async function updateVehicle(id, form) {
  const res = await fetch(`${API_URL}/vehiculos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Placas: form.plate,
      VIN: form.vin,
      Marca: form.make,
      Modelo: form.model,
      Anio: form.year,
      Color: form.color,
      KilometrajeActual: form.mileage,
    }),
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "No se pudo actualizar el vehículo.");
  }
  const result = await res.json();
  notifyVehiclesChanged({ vehicleId: String(id), reason: "updated" });
  return result;
}

export async function deleteVehicle(id) {
  const res = await fetch(`${API_URL}/vehiculos/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "No se pudo eliminar el vehículo.");
  }
  const result = await res.json();
  notifyVehiclesChanged({ vehicleId: String(id), reason: "deleted" });
  return result;
}
