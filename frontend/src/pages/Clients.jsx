import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Topbar from "../components/Topbar";
import AddClientModal from "../components/AddClientModal";
import EditClientModal from "../components/EditClientModal";
import { deleteClient } from "../api/clients";
import { useClients } from "../context/ClientsContext";

function RowMenu({ client, onEdit, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteClient(client.id);
      setOpen(false);
      setConfirming(false);
      onDeleted(client.id);
    } catch (err) {
      setError(err.message || "No se pudo eliminar.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && !confirming && (
        <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <button
            onClick={() => {
              setOpen(false);
              onEdit(client);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
        </div>
      )}

      {open && confirming && (
        <div className="absolute right-0 z-20 mt-1 w-64 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="text-xs text-slate-600">
            ¿Eliminar a <span className="font-medium">{client.name}</span>?
            {client.vehicles.length > 0 && (
              <>
                {" "}
                Se eliminarán también{" "}
                <span className="font-medium text-red-500">
                  sus {client.vehicles.length} vehículo
                  {client.vehicles.length !== 1 ? "s" : ""} registrado
                  {client.vehicles.length !== 1 ? "s" : ""}
                </span>
                .
              </>
            )}
          </p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Clients() {
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const navigate = useNavigate();
  const { clients, loading, error, addClient, refreshClient, removeClient } = useClients();

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  async function handleSave(data) {
    const created = await addClient(data);
    setModalOpen(false);
    navigate(`/clients/${created.id}`);
  }

  return (
    <>
      <Topbar title="Clients" />

      <main className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Clients</h2>
            <p className="text-sm text-slate-400">
              {clients.length} registered clients
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Vehicles</th>
                  <th className="px-6 py-3 font-medium">Since</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">
                      Cargando clientes...
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-red-500">
                      {error} — revisa que tu backend esté corriendo.
                    </td>
                  </tr>
                )}
                {!loading && !error && filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}`)}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${c.color}`}
                        >
                          {c.initials}
                        </span>
                        <span className="font-medium text-slate-900">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{c.phone}</td>
                    <td className="px-6 py-3 text-orange-500">{c.email}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {c.vehicles.length}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{c.since}</td>
                    <td className="px-6 py-3">
                      <span
                        className={[
                          "rounded-md px-2 py-1 text-xs font-medium",
                          c.status === "Active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500",
                        ].join(" ")}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <RowMenu client={c} onEdit={setEditClient} onDeleted={removeClient} />
                    </td>
                  </tr>
                ))}
                {!loading && !error && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">
                      No clients match "{query}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AddClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <EditClientModal
        open={!!editClient}
        onClose={() => setEditClient(null)}
        client={editClient}
        onUpdated={() => refreshClient(editClient.id)}
      />
    </>
  );
}