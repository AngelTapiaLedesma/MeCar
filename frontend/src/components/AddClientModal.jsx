import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

const emptyVehicle = { make: "", model: "", year: "", plate: "", color: "", mileage: "" };
const emptyForm = { name: "", phone: "", email: "", address: "", description: "" };

export default function AddClientModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [vehicles, setVehicles] = useState([{ ...emptyVehicle }]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (!open) return null;

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateVehicle(index, field, value) {
    setVehicles((vs) =>
      vs.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  function addVehicleRow() {
    setVehicles((vs) => [...vs, { ...emptyVehicle }]);
  }

  function removeVehicleRow(index) {
    setVehicles((vs) => vs.filter((_, i) => i !== index));
  }

  function resetAndClose() {
    setForm(emptyForm);
    setVehicles([{ ...emptyVehicle }]);
    setErrors({});
    setSubmitError(null);
    setSubmitting(false);
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "El nombre es obligatorio.";
    if (!form.phone.trim()) newErrors.phone = "El teléfono es obligatorio.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const cleanVehicles = vehicles
      .filter((v) => v.make.trim() || v.model.trim())
      .map((v) => ({
        make: v.make.trim(),
        model: v.model.trim(),
        year: Number(v.year) || undefined,
        plate: v.plate.trim(),
        color: v.color.trim(),
        mileage: Number(v.mileage) || undefined,
      }));

    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSave({ ...form, vehicles: cleanVehicles });
      resetAndClose();
    } catch (err) {
      setSubmitError(err.message || "Ocurrió un error al guardar el cliente.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Add Client
          </h2>
          <button
            onClick={resetAndClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Nombre completo *
            </label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ej. Marcus Rivera"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Teléfono *
              </label>
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+1 555-0000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="cliente@email.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Dirección
            </label>
            <input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Calle, ciudad, estado"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Notas (para ubicarlo mejor)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
              placeholder="Ej. Prefiere citas en la mañana..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>

          {/* Vehículos dinámicos */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600">
                Vehículos
              </label>
              <button
                type="button"
                onClick={addVehicleRow}
                className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar vehículo
              </button>
            </div>

            <div className="space-y-3">
              {vehicles.map((v, i) => (
                <div
                  key={i}
                  className="relative rounded-lg border border-slate-100 p-3"
                >
                  {vehicles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVehicleRow(i)}
                      className="absolute right-2 top-2 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={v.make}
                      onChange={(e) => updateVehicle(i, "make", e.target.value)}
                      placeholder="Marca"
                      className="rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                    />
                    <input
                      value={v.model}
                      onChange={(e) => updateVehicle(i, "model", e.target.value)}
                      placeholder="Modelo"
                      className="rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                    />
                    <input
                      value={v.year}
                      onChange={(e) => updateVehicle(i, "year", e.target.value)}
                      placeholder="Año"
                      className="rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                    />
                    <input
                      value={v.plate}
                      onChange={(e) => updateVehicle(i, "plate", e.target.value)}
                      placeholder="Placa"
                      className="rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                    />
                    <input
                      value={v.color}
                      onChange={(e) => updateVehicle(i, "color", e.target.value)}
                      placeholder="Color"
                      className="rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                    />
                    <input
                      value={v.mileage}
                      onChange={(e) => updateVehicle(i, "mileage", e.target.value)}
                      placeholder="Kilometraje"
                      inputMode="numeric"
                      className="rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                    />
                  </div>
                </div>
              ))}
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
              {submitting ? "Guardando..." : "Guardar cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}