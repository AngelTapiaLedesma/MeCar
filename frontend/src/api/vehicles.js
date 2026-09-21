const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function mapVehicleFromApi(raw) {
  return {
    id: String(raw.IdVehiculo),
    clientId: String(raw.IdCliente),
    clientName: raw.ClienteNombre || "",
    plate: raw.Placas,
    make: raw.Marca,
    model: raw.Modelo,
    year: raw.Anio,
    color: raw.Color || "",
    mileage: raw.KilometrajeActual ?? null,
  };
}

export async function fetchVehicles() {
  const res = await fetch(`${API_URL}/vehiculos`);
  if (!res.ok) throw new Error("No se pudo cargar la lista de vehículos.");
  const data = await res.json();
  return data.map(mapVehicleFromApi);
}

export async function createVehicle(form) {
  const res = await fetch(`${API_URL}/vehiculos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      IdCliente: form.clientId,
      Placas: form.plate,
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
  return mapVehicleFromApi({
    IdVehiculo: result.IdVehiculo,
    IdCliente: form.clientId,
    ClienteNombre: form.clientName || "",
    Placas: form.plate,
    Marca: form.make,
    Modelo: form.model,
    Anio: form.year,
    Color: form.color,
    KilometrajeActual: form.mileage,
  });
}