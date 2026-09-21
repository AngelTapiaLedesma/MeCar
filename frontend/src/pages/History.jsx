import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Topbar from "../components/Topbar";
import NewRepairTicketModal from "../components/NewRepairTicketModal";
import { fetchHistory } from "../api/history";

const STATUS_STYLES = {
  "In Progress": "bg-orange-50 text-orange-600",
  Completed: "bg-emerald-50 text-emerald-600",
  Cancelled: "bg-red-50 text-red-500",
};

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function History() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Crear
          </button>
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
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">
                      Cargando historial...
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
                {!loading && !error && tickets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">
                      No hay registros todavía. Da clic en "Crear" para el primero.
                    </td>
                  </tr>
                )}
                {!loading && !error && tickets.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-500">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-900">{t.vehicle}</p>
                      <p className="text-xs text-slate-400">{t.plate}</p>
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
                      <span
                        className={[
                          "rounded-md px-2 py-1 text-xs font-medium",
                          STATUS_STYLES[t.status] || STATUS_STYLES["In Progress"],
                        ].join(" ")}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <NewRepairTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadHistory}
      />
    </>
  );
}
