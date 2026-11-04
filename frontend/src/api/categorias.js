const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function fetchCategorias() {
  const res = await fetch(`${API_URL}/categorias`);
  if (!res.ok) throw new Error("No se pudieron cargar las categorías.");
  return res.json();
}

export async function createCategoria(data) {
  const res = await fetch(`${API_URL}/categorias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Nombre: data.nombre,
      ColorClase: data.colorClase,
    }),
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "No se pudo crear la categoría.");
  }
  return res.json();
}

export async function updateCategoria(id, data) {
  const res = await fetch(`${API_URL}/categorias/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Nombre: data.nombre,
      ColorClase: data.colorClase,
    }),
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "No se pudo actualizar la categoría.");
  }
  return res.json();
}

export async function deleteCategoria(id) {
  const res = await fetch(`${API_URL}/categorias/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "No se pudo eliminar la categoría.");
  }
  return res.json();
}
