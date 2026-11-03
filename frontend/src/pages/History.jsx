import { useState, useEffect, useRef } from "react";
import { Plus, Lock, MoreVertical, Pencil, Trash2, Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import NewRepairTicketModal from "../components/NewRepairTicketModal";
import TicketDetailModal from "../components/TicketDetailModal";
import { fetchHistory, deleteTicket } from "../api/history";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RowMenu({ ticket, onEdit, onDeleted }) {
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
      await deleteTicket(ticket.id);
      setOpen(false);
      setConfirming(false);
      onDeleted();
    } catch (err) {
      setError(err.message || "No se pudo eliminar.");
    } finally {
      setDeleting(false);
    }
  }

  const isClosed = ticket.status === "Closed";

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
              onEdit(ticket);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
          {!isClosed && (
            <button
              onClick={() => setConfirming(true)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </button>
          )}
        </div>
      )}

      {open && confirming && (
        <div className="absolute right-0 z-20 mt-1 w-56 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="text-xs text-slate-600">¿Eliminar este ticket?</p>
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

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailEditable, setDetailEditable] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'open' | 'closed'
  const [contextFilter, setContextFilter] = useState(null); // { type: 'client'|'vehicle', value: string, label: string }

  useEffect(() => {
    // Leer filtros contextuales desde URL
    const clientFilter = searchParams.get("client");
    const vehicleFilter = searchParams.get("vehicle");

    if (clientFilter) {
      setContextFilter({ type: "client", value: clientFilter, label: `Cliente: ${clientFilter}` });
    } else if (vehicleFilter) {
      setContextFilter({ type: "vehicle", value: vehicleFilter, label: `Vehículo: ${vehicleFilter}` });
    }
  }, [searchParams]);

  function loadHistory() {
    setLoading(true);
    setError(null);
    fetchHistory()
      .then(setTickets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function openView(ticket) {
    setDetailTicket(ticket);
    setDetailEditable(false);
  }

  function openEdit(ticket) {
    setDetailTicket(ticket);
    setDetailEditable(true);
  }

  function clearContextFilter() {
    setContextFilter(null);
    setSearchParams({});
  }

  // Filtrado
  const filteredTickets = tickets.filter((t) => {
    // Búsqueda general
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const searchable = `${t.plate} ${t.vehicle} ${t.vin || ""} ${t.client}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    // Estado
    if (statusFilter === "open" && t.status !== "In Progress") return false;
    if (statusFilter === "closed" && t.status !== "Closed") return false;

    // Filtro contextual
    if (contextFilter) {
      if (contextFilter.type === "client" && t.client !== contextFilter.value) return false;
      if (contextFilter.type === "vehicle") {
        const matchesPlate = t.plate.toLowerCase() === contextFilter.value.toLowerCase();
        const matchesString = `${t.vehicle} ${t.plate}`.toLowerCase().includes(contextFilter.value.toLowerCase());
        if (!matchesPlate && !matchesString) return false;
      }
    }

    return true;
  });

  return (
    <>
      <Topbar title="History & Logs" />

      <main className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">History & Logs</h2>
            <p className="text-sm text-slate-400">
              Complete repair and service records
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Crear
          </button>
        </div>

        {/* Barra de filtros */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {/* Búsqueda general */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por placa, marca, modelo, VIN o cliente..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-orange-400"
              />
            </div>

            {/* Chips de estado */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={[
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  statusFilter === "all"
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                ].join(" ")}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter("open")}
                className={[
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  statusFilter === "open"
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                ].join(" ")}
              >
                En Proceso
              </button>
              <button
                onClick={() => setStatusFilter("closed")}
                className={[
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  statusFilter === "closed"
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                ].join(" ")}
              >
                Cerrados
              </button>
            </div>
          </div>

          {/* Chip de filtro contextual */}
          {contextFilter && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Filtrando por: {contextFilter.label}
                <button
                  onClick={clearContextFilter}
                  className="rounded-full hover:bg-blue-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Vehicle</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Service Type</th>
                  <th className="px-6 py-3 font-medium">Technician</th>
                  <th className="px-6 py-3 font-medium">Cost</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-400">
                      Cargando historial...
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-red-500">
                      {error} — revisa que tu backend esté corriendo.
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-400">
                      {tickets.length === 0
                        ? 'No hay registros todavía. Da clic en "Crear" para el primero.'
                        : "No se encontraron tickets con los filtros aplicados."}
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openView(t)}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-3 text-slate-500">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-900">{t.vehicle}</p>
                      <p className="text-xs text-slate-400">{t.plate}</p>
                      {t.vin && <p className="text-xs font-mono text-slate-400">{t.vin}</p>}
                    </td>
                    <td className="px-6 py-3 text-orange-500">{t.client}</td>
                    <td className="px-6 py-3 text-slate-700">
                      {t.items.map((i) => i.name).join(", ") || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{t.tech}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      ${t.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      {t.status === "Closed" ? (
                        <span className="flex w-fit items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                          <Lock className="h-3 w-3" /> Closed
                        </span>
                      ) : (
                        <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <RowMenu ticket={t} onEdit={openEdit} onDeleted={loadHistory} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <NewRepairTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadHistory}
      />

      <TicketDetailModal
        open={!!detailTicket}
        onClose={() => setDetailTicket(null)}
        ticket={detailTicket}
        editable={detailEditable}
        onChanged={loadHistory}
      />
    </>
  );
}
