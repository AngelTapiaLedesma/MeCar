// Capa de API — habla con tu backend Express (SQL Server) y traduce
// los nombres de columna en español (NombreCompleto, Telefono, etc.)
// a la forma que usan los componentes del frontend (name, phone, etc.).
// Si cambias el backend, solo tocas este archivo.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-lime-600",
  "bg-cyan-500",
  "bg-sky-400",
  "bg-blue-600",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-600",
  "bg-emerald-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-teal-500",
];

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Color determinístico según el IdCliente, así se ve igual en la lista y en el detalle.
function colorForId(idCliente) {
  const n = Number(idCliente) || 0;
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function formatSince(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function mapClientFromApi(raw) {
  return {
    id: String(raw.IdCliente),
    name: raw.NombreCompleto,
    initials: getInitials(raw.NombreCompleto),
    color: colorForId(raw.IdCliente),
    phone: raw.Telefono || "",
    email: raw.Email || "",
    address: raw.Direccion || "",
    since: formatSince(raw.FechaRegistro),
    status: raw.Estatus === 0 ? "Inactive" : "Active",
    description: raw.Notas || "",
    vehicles: (raw.Vehiculos || []).map((v) => ({
      id: String(v.IdVehiculo),
      make: v.Marca,
      model: v.Modelo,
      year: v.Anio,
      plate: v.Placas,
      color: v.Color || "",
      mileage: v.KilometrajeActual ?? null,
    })),
  };
}

function mapClientToApi(form) {
  return {
    NombreCompleto: form.name,
    Telefono: form.phone,
    Email: form.email,
    Direccion: form.address,
    Notas: form.description,
    Vehiculos: (form.vehicles || []).map((v) => ({
      Placas: v.plate,
      Marca: v.make,
      Modelo: v.model,
      Anio: v.year,
      Color: v.color,
      KilometrajeActual: v.mileage,
    })),
  };
}

export async function fetchClients() {
  const res = await fetch(`${API_URL}/clientes`);
  if (!res.ok) throw new Error("No se pudo cargar la lista de clientes.");
  const data = await res.json();
  return data.map(mapClientFromApi);
}

export async function fetchClientById(id) {
  const res = await fetch(`${API_URL}/clientes/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se pudo cargar el cliente.");
  const data = await res.json();
  return mapClientFromApi(data);
}

export async function createClient(form) {
  const res = await fetch(`${API_URL}/clientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapClientToApi(form)),
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "No se pudo registrar el cliente.");
  }
  return res.json(); // { message, IdCliente }
}