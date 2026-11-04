import { useState, useEffect } from "react";
import { Search, X, AlertCircle } from "lucide-react";
import { createVehicle, checkVin } from "../api/vehicles";
import { useClients } from "../context/ClientsContext";

const emptyForm = { plate: "", vin: "", make: "", model: "", year: "", color: "", mileage: "" };

export default function RegisterVehicleModal({ open, onClose, onCreated }) {
  const { clients } = useClients();

  const [clientQuery, setClientQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [vinWarning, setVinWarning] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") resetAndClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  if (!open) return null;

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientQuery.toLowerCase())
  );

  async function update(field, value) {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);

    if (field === "vin") {
      const trimmed = value.trim();
      if (trimmed.length > 0 && trimmed.length !== 17) {
        setVinWarning("Aviso: El VIN estándar tiene 17 caracteres.");
      } else {
        setVinWarning(null);
      }

      if (trimmed) {
        try {
          const res = await checkVin(trimmed);
          if (res.exists) {
            setVinWarning(`Aviso: Este serial ya está registrado en el vehículo ${res.vehicle} de ${res.client}.`);
          }
        } catch {}
      }
    }
  }

  function selectClient(c) {
    setSelectedClient(c);
    setClientQuery(c.name);
    setShowResults(false);
    setErrors((e) => ({ ...e, client: undefined }));
  }

  function resetAndClose() {
    setForm(emptyForm);
    setErrors({});
    setVinWarning(null);
    setSubmitError(null);
    setSubmitting(false);
    setSelectedClient(null);
    setClientQuery("");
    setShowResults(false);
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!selectedClient) newErrors.client = "Selecciona a qué cliente pertenece.";
    if (!form.plate.trim()) newErrors.plate = "La placa es obligatoria.";
    if (!form.make.trim()) newErrors.make = "La marca es obligatoria.";
    if (!form.model.trim()) newErrors.model = "El modelo es obligatorio.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const created = await createVehicle({
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        plate: form.plate.trim(),
        vin: form.vin.trim() || undefined,
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year) || undefined,
        color: form.color.trim(),
        mileage: Number(form.mileage) || undefined,
      });
      onCreated?.(created);
      resetAndClose();
    } catch (err) {
      setSubmitError(err.message || "Ocurrió un error al registrar el vehículo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="relative flex items-center justify-center border-b border-slate-100 px-6 py-4">
          <button
            onClick={resetAndClose}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-slate-900">
            Registrar vehículo
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Cliente *
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={clientQuery}
                onChange={(e) => {
                  setClientQuery(e.target.value);
                  setSelectedClient(null);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                placeholder="Buscar cliente..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400"
              />
            </div>
            {showResults && clientQuery && !selectedClient && (
              <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectClient(c)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {c.name}
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <p className="px-3 py-2 text-xs text-slate-400">
                    Sin resultados
                  </p>
                )}
              </div>
            )}
            {errors.client && (
              <p className="mt-1 text-xs text-red-500">{errors.client}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Marca *
              </label>
              <input
                value={form.make}
                onChange={(e) => update("make", e.target.value)}
                placeholder="Honda"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
              {errors.make && (
                <p className="mt-1 text-xs text-red-500">{errors.make}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Modelo *
              </label>
              <input
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
                placeholder="Civic"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
              {errors.model && (
                <p className="mt-1 text-xs text-red-500">{errors.model}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Placa *
              </label>
              <input
                value={form.plate}
                onChange={(e) => update("plate", e.target.value)}
                placeholder="MRX-4421"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
              {errors.plate && (
                <p className="mt-1 text-xs text-red-500">{errors.plate}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Año
              </label>
              <input
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                placeholder="2020"
                inputMode="numeric"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Número de Serie / VIN
            </label>
            <input
              value={form.vin}
              onChange={(e) => update("vin", e.target.value)}
              placeholder="Ej. 1HGCR2F8... (hasta 30 chars)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
            {vinWarning && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{vinWarning}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Color
              </label>
              <input
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
                placeholder="Plata"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Kilometraje
              </label>
              <input
                value={form.mileage}
                onChange={(e) => update("mileage", e.target.value)}
                placeholder="45000"
                inputMode="numeric"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {submitting ? "Guardando..." : "Registrar vehículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
