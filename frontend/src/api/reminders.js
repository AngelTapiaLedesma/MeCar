const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function mapReminderFromApi(raw) {
  return {
    id: String(raw.IdRecordatorio),
    vehicleId: String(raw.IdVehiculo),
    name: raw.TipoRecordatorio,
    startDate: raw.FechaInicio ? String(raw.FechaInicio).slice(0, 10) : "",
    recurring: !!raw.EsRecurrente,
    intervalDays: raw.IntervaloDias ?? null,
    notify: raw.Notificar !== false && raw.Notificar !== 0,
  };
}

export async function fetchReminders(vehicleId) {
  const res = await fetch(`${API_URL}/vehiculos/${vehicleId}/recordatorios`);
  if (!res.ok) throw new Error("No se pudieron cargar los eventos del vehículo.");
  const data = await res.json();
  return data.map(mapReminderFromApi);
}

export async function createReminder(form) {
  const res = await fetch(`${API_URL}/recordatorios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      IdVehiculo: form.vehicleId,
      TipoRecordatorio: form.name,
      FechaInicio: form.startDate,
      EsRecurrente: form.recurring,
      IntervaloDias: form.recurring ? form.intervalDays : null,
      Notificar: form.notify,
    }),
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "No se pudo crear el evento.");
  }
  return res.json();
}

export async function updateReminder(id, form) {
  const res = await fetch(`${API_URL}/recordatorios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      TipoRecordatorio: form.name,
      FechaInicio: form.startDate,
      EsRecurrente: form.recurring,
      IntervaloDias: form.recurring ? form.intervalDays : null,
      Notificar: form.notify,
    }),
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "No se pudo actualizar el evento.");
  }
  return res.json();
}

export async function deleteReminder(id) {
  const res = await fetch(`${API_URL}/recordatorios/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "No se pudo eliminar el evento.");
  }
  return res.json();
}