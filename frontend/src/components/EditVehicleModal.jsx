import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { updateVehicle } from "../api/vehicles";

const emptyForm = { plate: "", make: "", model: "", year: "", color: "", mileage: "" };

export default function EditVehicleModal({ open, onClose, vehicle, onUpdated }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (open && vehicle) {
      setForm({
        plate: vehicle.plate || "",
        make: vehicle.make || "",
        model: vehicle.model || "",
        year: vehicle.year || "",
        color: vehicle.color || "",
        mileage: vehicle.mileage ?? "",
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [open, vehicle]);

  if (!open || !vehicle) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
      await updateVehicle(vehicle.id, {
        plate: form.plate.trim(),
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year) || undefined,
        color: form.color.trim(),
        mileage: Number(form.mileage) || undefined,
      });
      onUpdated?.();
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Ocurrió un error al actualizar el vehículo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Editar vehículo
          </h2>
          <button
            onClick={onClose}
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
                inputMode="numeric"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Color
              </label>
              <input
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
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
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {submitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}