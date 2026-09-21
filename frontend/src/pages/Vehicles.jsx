import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Topbar from "../components/Topbar";
import RegisterVehicleModal from "../components/RegisterVehicleModal";
import { fetchVehicles } from "../api/vehicles";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  function loadVehicles() {
    setLoading(true);
    setError(null);
    fetchVehicles()
      .then(setVehicles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  return (
    <>
      <Topbar title="Vehicles" />

      <main className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Vehicles</h2>
            <p className="text-sm text-slate-400">
              {vehicles.length} vehicles registered
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Register Vehicle
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3 font-medium">Plate</th>
                  <th className="px-6 py-3 font-medium">Make / Model</th>
                  <th className="px-6 py-3 font-medium">Year</th>
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Mileage</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                      Cargando vehículos...
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-red-500">
                      {error} — revisa que tu backend esté corriendo.
                    </td>
                  </tr>
                )}
                {!loading && !error && vehicles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                      No hay vehículos todavía. Da clic en "Register Vehicle".
                    </td>
                  </tr>
                )}
                {!loading && !error && vehicles.map((v) => (
                  <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-medium text-slate-600">
                        {v.plate}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {v.make} {v.model}
                    </td>
                    <td className="px-6 py-3 text-slate-500">{v.year}</td>
                    <td className="px-6 py-3 text-orange-500">{v.clientName}</td>
                    <td className="px-6 py-3 text-slate-500">
                      {v.mileage != null ? `${v.mileage.toLocaleString()} km` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <RegisterVehicleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadVehicles}
      />
    </>
  );
}