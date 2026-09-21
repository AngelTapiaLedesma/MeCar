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
} from "lucide-react";
import Topbar from "../components/Topbar";
import { fetchClientById } from "../api/clients";

export default function ClientDetail() {
  const { id } = useParams();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState("");

  // Pide el cliente directo al backend por su Id, sin depender de que la
  // lista compartida (ClientsContext) ya lo tenga cargado. Así funciona
  // igual de bien si entras aquí recién creado el cliente o si abres
  // la URL directamente sin haber pasado por la lista antes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchClientById(id)
      .then((data) => {
        if (cancelled) return;
        setClient(data);
        setNote(data?.description ?? "");
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
  }, [id]);

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
            <Link to="/cslients" className="text-orange-500 hover:underline">
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
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Vehículos ({client.vehicles.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {client.vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 p-4 hover:border-orange-200 hover:bg-orange-50/30"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Car className="h-5 w-5" />
                    </span>
                    <div>
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
