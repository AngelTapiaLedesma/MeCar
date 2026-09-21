import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { updateClient } from "../api/clients";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  description: "",
  status: "Active",
};

export default function EditClientModal({ open, onClose, client, onUpdated }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Cada vez que se abre con un cliente distinto, precarga sus datos.
  useEffect(() => {
    if (open && client) {
      setForm({
        name: client.name || "",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        description: client.description || "",
        status: client.status || "Active",
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [open, client]);

  if (!open || !client) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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

    setSubmitError(null);
    setSubmitting(true);
    try {
      await updateClient(client.id, form);
      onUpdated?.();
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Ocurrió un error al actualizar el cliente.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Editar cliente
          </h2>
          <button
            onClick={onClose}
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
              onChange={(e) => update("name", e.target.value)}
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
                onChange={(e) => update("phone", e.target.value)}
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
                onChange={(e) => update("email", e.target.value)}
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
              onChange={(e) => update("address", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Notas
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Estatus
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update("status", "Active")}
                className={[
                  "rounded-lg border px-3 py-1.5 text-xs font-medium",
                  form.status === "Active"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50",
                ].join(" ")}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => update("status", "Inactive")}
                className={[
                  "rounded-lg border px-3 py-1.5 text-xs font-medium",
                  form.status === "Inactive"
                    ? "border-slate-500 bg-slate-100 text-slate-600"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50",
                ].join(" ")}
              >
                Inactive
              </button>
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