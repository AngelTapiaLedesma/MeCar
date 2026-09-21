import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Car,
  Pencil,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import Topbar from "../components/Topbar";
import EditClientModal from "../components/EditClientModal";
import AddVehicleModal from "../components/AddVehicleModal";
import { fetchClientById } from "../api/clients";
import { deleteVehicle } from "../api/vehicles";
import { useClients } from "../context/ClientsContext";

export default function ClientDetail() {
  const { id } = useParams();
  const { refreshClient } = useClients();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  function loadClient() {
    setLoading(true);
    setError(null);
    fetchClientById(id)
      .then((data) => {
        setClient(data);
        setNote(data?.description ?? "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleUpdated() {
    loadClient();
    await refreshClient(id);
  }

  async function handleDeleteVehicle(vehicleId) {
    setDeletingId(vehicleId);
    setDeleteError(null);
    try {
      await deleteVehicle(vehicleId);
      setConfirmDeleteId(null);
      loadClient();
      await refreshClient(id);
    } catch (err) {
      setDeleteError(err.message || "No se pudo eliminar el vehículo.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <>
        <Topbar title="Client Details" />
        <main className="p-8">
          <p className="text-sm text-slate-400">Cargando cliente...</p>
        </main>
      </>
    );
  }

  if (error || !client) {
    return (
      <>
        <Topbar title="Client not found" />
        <main className="p-8">
          <p className="text-sm text-slate-500">
            {error
              ? `${error} — revisa que tu backend esté corriendo.`
              : "No encontramos a ese cliente."}{" "}
            <Link to="/clients" className="text-orange-500 hover:underline">
              Volver a Clients
            </Link>
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Client Details" />

      <main className="space-y-6 p-8">
        <Link
          to="/clients"
          className="flex w-fit items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: profile + contact */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${client.color}`}
                  >
                    {client.initials}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {client.name}
                    </h2>
                    <span
                      className={[
                        "mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium",
                        client.status === "Active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {client.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                  {client.phone}
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  {client.email}
                </div>
                <div className="flex items-start gap-3 text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>{client.address}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                  Client since {client.since}
                </div>
              </div>
            </div>

            {/* Editable description / note */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Notas del cliente
                </h3>
                <button
                  onClick={() => setEditingNote((v) => !v)}
                  className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                >
                  {editingNote ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Guardar
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </>
                  )}
                </button>
              </div>
              {editingNote ? (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder="Agrega una nota para identificar mejor a este cliente (ej. preferencias, cómo ubicarlo, detalles importantes)..."
                  className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-orange-400"
                />
              ) : (
                <p className="text-sm text-slate-500">
                  {note || "Sin notas todavía. Haz clic en Editar para agregar una."}
                </p>
              )}
            </div>
          </div>

          {/* Right: vehicles */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Vehículos ({client.vehicles.length})
                </h3>
                <button
                  onClick={() => setAddVehicleOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar vehículo
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {client.vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="relative flex items-start gap-3 rounded-lg border border-slate-100 p-4 hover:border-orange-200 hover:bg-orange-50/30"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Car className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {v.make} {v.model} {v.year}
                      </p>
                      <p className="text-xs text-slate-400">{v.plate}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Color: {v.color}
                      </p>
                      {v.mileage != null && (
                        <p className="text-xs text-slate-500">
                          Kilometraje: {v.mileage.toLocaleString()} km
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setConfirmDeleteId(v.id);
                      }}
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {confirmDeleteId === v.id && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/95 p-3 text-center">
                        <p className="text-xs text-slate-600">
                          ¿Eliminar este vehículo? Sus tickets abiertos
                          también se borrarán. Los cerrados se quedan en el
                          historial.
                        </p>
                        {deleteError && (
                          <p className="text-xs text-red-500">{deleteError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(v.id)}
                            disabled={deletingId === v.id}
                            className="rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60"
                          >
                            {deletingId === v.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {client.vehicles.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Este cliente no tiene vehículos registrados todavía.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <EditClientModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        client={client}
        onUpdated={handleUpdated}
      />

      <AddVehicleModal
        open={addVehicleOpen}
        onClose={() => setAddVehicleOpen(false)}
        client={client}
        onCreated={loadClient}
      />
    </>
  );
}