const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function fetchCatalog() {
  const res = await fetch(`${API_URL}/catalogo`);
  if (!res.ok) throw new Error("No se pudo cargar el catálogo.");
  return res.json();
}

export async function createSection(nombre) {
  const res = await fetch(`${API_URL}/catalogo/secciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nombre: nombre }),
  });
  if (!res.ok) throw new Error("No se pudo crear la sección.");
  return res.json();
}

export async function deleteSection(id) {
  const res = await fetch(`${API_URL}/catalogo/secciones/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar la sección.");
  return res.json();
}

export async function createCatalogItem(idSeccion, nombre, precioBase) {
  const res = await fetch(`${API_URL}/catalogo/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      IdSeccion: idSeccion,
      Nombre: nombre,
      PrecioBase: precioBase,
    }),
  });
  if (!res.ok) throw new Error("No se pudo crear el item.");
  return res.json();
}

export async function updateCatalogItem(id, nombre, precioBase) {
  const res = await fetch(`${API_URL}/catalogo/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nombre: nombre, PrecioBase: precioBase }),
  });
  if (!res.ok) throw new Error("No se pudo actualizar el item.");
  return res.json();
}

export async function deleteCatalogItem(id) {
  const res = await fetch(`${API_URL}/catalogo/items/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar el item.");
  return res.json();
}