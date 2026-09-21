import { useState, useEffect, useRef } from "react";
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Topbar from "../components/Topbar";
import RegisterVehicleModal from "../components/RegisterVehicleModal";
import EditVehicleModal from "../components/EditVehicleModal";
import VehicleDetailModal from "../components/VehicleDetailModal";
import { fetchVehicles, deleteVehicle } from "../api/vehicles";

function RowMenu({ vehicle, onEdit, onDeleted }) {
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
      await deleteVehicle(vehicle.id);
      setOpen(false);
      setConfirming(false);
      onDeleted();
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
              onEdit(vehicle);
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
        <div className="absolute right-0 z-20 mt-1 w-56 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="text-xs text-slate-600">
            ¿Eliminar {vehicle.make} {vehicle.model}? Sus tickets abiertos
            también se borrarán.
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

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [detailVehicle, setDetailVehicle] = useState(null);

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
            onClick={() => setRegisterOpen(true)}
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
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                      Cargando vehículos...
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-red-500">
                      {error} — revisa que tu backend esté corriendo.
                    </td>
                  </tr>
                )}
                {!loading && !error && vehicles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                      No hay vehículos todavía. Da clic en "Register Vehicle".
                    </td>
                  </tr>
                )}
                {!loading && !error && vehicles.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setDetailVehicle(v)}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  >
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
                    <td className="px-6 py-3 text-right">
                      <RowMenu
                        vehicle={v}
                        onEdit={setEditVehicle}
                        onDeleted={loadVehicles}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <RegisterVehicleModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onCreated={loadVehicles}
      />

      <EditVehicleModal
        open={!!editVehicle}
        onClose={() => setEditVehicle(null)}
        vehicle={editVehicle}
        onUpdated={loadVehicles}
      />

      <VehicleDetailModal
        open={!!detailVehicle}
        onClose={() => setDetailVehicle(null)}
        vehicle={detailVehicle}
      />
    </>
  );
}