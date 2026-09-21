const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function mapTicketFromApi(raw) {
  // Si el vehículo sigue existiendo, usamos los datos en vivo. Si ya se
  // borró (tickets cerrados que sobrevivieron), caemos al Snapshot que se
  // guardó al crear el ticket.
  const vehicle = raw.Marca
    ? `${raw.Marca} ${raw.Modelo} ${raw.Anio}`
    : raw.VehiculoSnapshot || "Vehículo eliminado";
  const plate = raw.Placas || "";
  const client = raw.ClienteNombre || raw.ClienteSnapshot || "—";

  return {
    id: String(raw.IdServicio),
    date: raw.FechaServicio,
    vehicle,
    plate,
    client,
    tech: raw.Tecnico || "",
    status: raw.Estatus,
    partsCost: Number(raw.CostoPiezas) || 0,
    laborCost: Number(raw.CostoManoObra) || 0,
    margin: Number(raw.MargenGanancia) || 0,
    total:
      (Number(raw.CostoPiezas) || 0) +
      (Number(raw.CostoManoObra) || 0) +
      (Number(raw.MargenGanancia) || 0),
    notes: raw.Descripcion || "",
    items: (raw.Items || []).map((i) => ({
      id: String(i.IdServicioItem),
      name: i.Nombre,
      price: Number(i.Precio),
      origin: i.Origen,
    })),
  };
}

export async function fetchHistory() {
  const res = await fetch(`${API_URL}/historial`);
  if (!res.ok) throw new Error("No se pudo cargar el historial.");
  const data = await res.json();
  return data.map(mapTicketFromApi);
}

export async function createTicket(payload) {
  const res = await fetch(`${API_URL}/historial`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "No se pudo crear el ticket.");
  }
  return res.json();
}