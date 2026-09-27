import { useState, useEffect, useMemo } from "react";
import {
  X,
  Car,
  Plus,
  Trash2,
  Pencil,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Repeat,
  CalendarDays,
} from "lucide-react";
import {
  fetchReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from "../api/reminders";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

// Para un mes visible dado, calcula en qué días caen las ocurrencias de un
// recordatorio (único o recurrente), sin guardar filas por cada repetición.
function occurrencesInMonth(reminder, year, month) {
  const start = new Date(`${reminder.startDate}T00:00:00`);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const days = [];

  if (!reminder.recurring) {
    if (start >= monthStart && start <= monthEnd) days.push(start.getDate());
    return days;
  }

  const interval = Number(reminder.intervalDays) || 0;
  if (interval <= 0) return days;

  let current = new Date(start);
  if (current < monthStart) {
    const diffDays = Math.floor((monthStart - current) / 86400000);
    const steps = Math.ceil(diffDays / interval);
    current = new Date(current.getTime() + steps * interval * 86400000);
  }
  while (current <= monthEnd) {
    if (current >= monthStart) days.push(current.getDate());
    current = new Date(current.getTime() + interval * 86400000);
  }
  return days;
}

const emptyForm = {
  name: "",
  recurring: false,
  startDate: toIsoDate(new Date()),
  intervalDays: "",
  notify: true,
};

export default function VehicleDetailModal({ open, onClose, vehicle }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  // Mapa día -> [recordatorios que caen ese día en el mes visible].
  // OJO: este hook debe ir SIEMPRE antes de cualquier "return null"
  // condicional, o React truena con "Rendered more hooks than during
  // the previous render" cuando el modal pasa de cerrado a abierto.
  const dayMap = useMemo(() => {
    const map = {};
    for (const r of reminders) {
      for (const day of occurrencesInMonth(r, viewYear, viewMonth)) {
        if (!map[day]) map[day] = [];
        map[day].push(r);
      }
    }
    return map;
  }, [reminders, viewYear, viewMonth]);

  function loadReminders() {
    if (!vehicle) return;
    setLoading(true);
    setLoadError(null);
    fetchReminders(vehicle.id)
      .then(setReminders)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (open && vehicle) {
      loadReminders();
      setSelectedDay(null);
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      setShowForm(false);
      setEditingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicle]);

  if (!open || !vehicle) return null;

  function resetForm() {
    setForm(emptyForm);
    setFormErrors({});
    setSubmitError(null);
    setEditingId(null);
    setShowForm(false);
  }

  function startCreate() {
    setForm({ ...emptyForm, startDate: toIsoDate(new Date()) });
    setFormErrors({});
    setSubmitError(null);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(reminder) {
    setForm({
      name: reminder.name,
      recurring: reminder.recurring,
      startDate: reminder.startDate,
      intervalDays: reminder.intervalDays ?? "",
      notify: reminder.notify,
    });
    setFormErrors({});
    setSubmitError(null);
    setEditingId(reminder.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = "El nombre del evento es obligatorio.";
    if (!form.startDate) errors.startDate = "La fecha es obligatoria.";
    if (form.recurring && !Number(form.intervalDays)) {
      errors.intervalDays = "Indica cada cuántos días se repite.";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = { ...form, vehicleId: vehicle.id, name: form.name.trim() };
      if (editingId) {
        await updateReminder(editingId, payload);
      } else {
        await createReminder(payload);
      }
      loadReminders();
      resetForm();
    } catch (err) {
      setSubmitError(err.message || "Ocurrió un error al guardar el evento.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteReminder(id);
      setConfirmDeleteId(null);
      loadReminders();
    } catch (err) {
      setSubmitError(err.message || "No se pudo eliminar el evento.");
    } finally {
      setDeletingId(null);
    }
  }

  function goToPrevMonth() {
    setSelectedDay(null);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    setSelectedDay(null);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const selectedReminders = selectedDay ? dayMap[selectedDay] || [] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Car className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {vehicle.make} {vehicle.model} {vehicle.year}
                </h2>
                <p className="text-xs text-slate-400">
                  {vehicle.plate} · {vehicle.clientName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 px-6 py-5">
            {/* Vehicle info */}
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Color</p>
                <p className="text-slate-700">{vehicle.color || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Mileage</p>
                <p className="text-slate-700">
                  {vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} km` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Owner</p>
                <p className="text-orange-500">{vehicle.clientName}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Plate</p>
                <p className="text-slate-700">{vehicle.plate}</p>
              </div>
            </div>

            {/* Reminders section */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Eventos y recordatorios
                </p>
                {!showForm && (
                  <button
                    onClick={startCreate}
                    className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                  >
                    <Plus className="h-3.5 w-3.5" /> Nuevo evento
                  </button>
                )}
              </div>

              {showForm && (
                <form
                  onSubmit={handleSubmit}
                  className="mb-4 space-y-3 rounded-lg border border-slate-200 p-4"
                >
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Nombre del evento *
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ej. Cambio de aceite"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, recurring: false }))}
                      className={[
                        "rounded-lg border px-3 py-1.5 text-xs font-medium",
                        !form.recurring
                          ? "border-orange-500 bg-orange-50 text-orange-600"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      Evento único
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, recurring: true }))}
                      className={[
                        "rounded-lg border px-3 py-1.5 text-xs font-medium",
                        form.recurring
                          ? "border-orange-500 bg-orange-50 text-orange-600"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      Recurrente
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        {form.recurring ? "Empieza el *" : "Fecha *"}
                      </label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                      {formErrors.startDate && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.startDate}</p>
                      )}
                    </div>
                    {form.recurring && (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Cada cuántos días *
                        </label>
                        <input
                          type="number"
                          value={form.intervalDays}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, intervalDays: e.target.value }))
                          }
                          placeholder="Ej. 90"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                        />
                        {formErrors.intervalDays && (
                          <p className="mt-1 text-xs text-red-500">{formErrors.intervalDays}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.notify}
                      onChange={(e) => setForm((f) => ({ ...f, notify: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                    />
                    Notificarme cuando se acerque la fecha
                  </label>

                  {submitError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                      {submitError}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                      {submitting
                        ? "Guardando..."
                        : editingId
                        ? "Guardar cambios"
                        : "Crear evento"}
                    </button>
                  </div>
                </form>
              )}

              {loading && (
                <p className="text-xs text-slate-400">Cargando eventos...</p>
              )}
              {!loading && loadError && (
                <p className="text-xs text-red-500">{loadError}</p>
              )}
              {!loading && !loadError && reminders.length === 0 && !showForm && (
                <p className="text-xs text-slate-400">
                  Este vehículo no tiene eventos todavía.
                </p>
              )}

              <div className="space-y-2">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className="relative flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {r.recurring ? (
                        <Repeat className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      ) : (
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-400">
                          {r.recurring
                            ? `Cada ${r.intervalDays} días desde ${r.startDate}`
                            : `Único: ${r.startDate}`}
                        </p>
                      </div>
                      {r.notify ? (
                        <Bell className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                      ) : (
                        <BellOff className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(r)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(r.id)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {confirmDeleteId === r.id && (
                      <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-white/95 px-3">
                        <span className="text-xs text-slate-600">¿Eliminar "{r.name}"?</span>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          className="rounded-lg bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60"
                        >
                          {deletingId === r.id ? "..." : "Eliminar"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar sidebar */}
        <aside className="hidden w-72 shrink-0 border-l border-slate-100 bg-slate-50/50 p-5 md:block">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={goToPrevMonth} className="rounded p-1 text-slate-400 hover:bg-slate-100">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-slate-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </p>
            <button onClick={goToNextMonth} className="rounded p-1 text-slate-400 hover:bg-slate-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
            {WEEKDAYS.map((d) => (
              <span key={d} className="font-medium text-slate-400">
                {d}
              </span>
            ))}
            {cells.map((day, idx) => {
              if (day === null) return <span key={`b-${idx}`} />;
              const hasEvents = !!dayMap[day];
              const isToday = isCurrentMonth && day === today.getDate();
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={[
                    "relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs",
                    isSelected
                      ? "bg-orange-500 font-semibold text-white"
                      : isToday
                      ? "border border-orange-300 text-orange-600"
                      : "text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {day}
                  {hasEvents && !isSelected && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-orange-500" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-3">
            {selectedDay ? (
              selectedReminders.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500">
                    {MONTH_NAMES[viewMonth]} {selectedDay}, {viewYear}
                  </p>
                  {selectedReminders.map((r) => (
                    <p key={r.id} className="text-xs text-slate-700">
                      • {r.name}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No hay eventos este día.</p>
              )
            ) : (
              <p className="text-xs text-slate-400">
                Selecciona un día para ver sus eventos.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
