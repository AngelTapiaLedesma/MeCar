import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { createVehicle, checkVin } from "../api/vehicles";

const emptyForm = { plate: "", vin: "", make: "", model: "", year: "", color: "", mileage: "" };

export default function AddVehicleModal({ open, onClose, client, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [vinWarning, setVinWarning] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setErrors({});
      setVinWarning(null);
      setSubmitError(null);
    }
  }, [open]);

  if (!open || !client) return null;

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

  function resetAndClose() {
    setForm(emptyForm);
    setErrors({});
    setVinWarning(null);
    setSubmitError(null);
    setSubmitting(false);
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
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
        clientId: client.id,
        clientName: client.name,
        plate: form.plate.trim(),
        vin: form.vin.trim() || undefined,
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year) || undefined,
        color: form.color.trim(),
        mileage: Number(form.mileage) || undefined,
      });
      onCreated(created);
      resetAndClose();
    } catch (err) {
      setSubmitError(err.message || "Ocurrió un error al guardar el vehículo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Nuevo vehículo
            </h2>
            <p className="text-xs text-slate-400">Para {client.name}</p>
          </div>
          <button
            onClick={resetAndClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
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
              {submitting ? "Guardando..." : "Guardar vehículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
