export const VEHICLES_CHANGED_EVENT = "mecar:vehicles-changed";

// Avisa a las pantallas abiertas que los vehículos (kilometraje, datos o
// citas) cambiaron, para que refresquen sin recargar la página.
export function notifyVehiclesChanged(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(VEHICLES_CHANGED_EVENT, { detail }));
}

export function onVehiclesChanged(handler) {
  if (typeof window === "undefined") return () => {};
  const listener = (event) => handler(event.detail || {});
  window.addEventListener(VEHICLES_CHANGED_EVENT, listener);
  return () => window.removeEventListener(VEHICLES_CHANGED_EVENT, listener);
}
