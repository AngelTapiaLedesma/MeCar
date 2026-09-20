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

  // Crea el cliente en el backend, trae la versión completa (con su Id real
  // y vehículos ya guardados) y la mete al principio de la lista local.
  async function addClient(form) {
    const result = await createClient(form);
    const newClient = await fetchClientById(result.IdCliente);
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  }

  function getClientById(id) {
    return clients.find((c) => c.id === String(id));
  }

  return (
    <ClientsContext.Provider
      value={{ clients, loading, error, addClient, getClientById }}
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