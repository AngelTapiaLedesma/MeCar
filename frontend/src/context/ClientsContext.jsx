import { createContext, useContext, useEffect, useState } from "react";
import { fetchClients, fetchClientById, createClient } from "../api/clients";

const ClientsContext = createContext(null);

export function ClientsProvider({ children }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchClients()
      .then((data) => {
        if (!cancelled) setClients(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function addClient(form) {
    const result = await createClient(form);
    const newClient = await fetchClientById(result.IdCliente);
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  }

  // NUEVO: vuelve a traer un cliente por su id y actualiza esa fila dentro
  // de la lista compartida. Úsalo después de editar un cliente en su
  // página de detalle, para que la tabla de Clients no se quede desfasada.
  async function refreshClient(id) {
    const updated = await fetchClientById(id);
    if (updated) {
      setClients((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    }
    return updated;
  }

  function getClientById(id) {
    return clients.find((c) => c.id === String(id));
  }

  return (
    <ClientsContext.Provider
      value={{ clients, loading, error, addClient, refreshClient, getClientById }}
    >
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) {
    throw new Error("useClients debe usarse dentro de <ClientsProvider>");
  }
  return ctx;
}