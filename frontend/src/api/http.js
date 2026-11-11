// El backend responde con { message } en errores de negocio (por ejemplo el
// kilometraje menor al último). Extrae ese mensaje para mostrarlo tal cual.
export async function readApiError(res, fallback) {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const data = JSON.parse(text);
      return data.message || data.error || text;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
}
