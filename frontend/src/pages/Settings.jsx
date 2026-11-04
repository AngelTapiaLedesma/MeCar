import { useState, useEffect } from "react";
import {
  Search,
  Wrench,
  Bell,
  BellRing,
  Users,
  Shield,
  Plus,
} from "lucide-react";
import Topbar from "../components/Topbar";

const CATEGORIES = [
  { id: "workshop", label: "Detalles del Taller", icon: Wrench },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "notification-center", label: "Centro de Notificaciones", icon: BellRing },
  { id: "team", label: "Equipo", icon: Users },
  { id: "security", label: "Seguridad", icon: Shield },
];

const SEARCH_INDEX = [
  { id: "field-workshop-name", label: "Nombre del Taller", category: "workshop" },
  { id: "field-phone", label: "Teléfono", category: "workshop" },
  { id: "field-email", label: "Correo", category: "workshop" },
  { id: "field-tax-id", label: "RFC / Identificación Fiscal", category: "workshop" },
  { id: "field-address", label: "Dirección", category: "workshop" },
  { id: "field-appointment-reminders", label: "Recordatorios de Citas", category: "notifications" },
  { id: "field-repair-updates", label: "Actualizaciones de Reparación", category: "notifications" },
  { id: "field-monthly-reports", label: "Reportes Mensuales", category: "notifications" },
  { id: "field-low-inventory", label: "Alertas de Inventario Bajo", category: "notifications" },
  { id: "field-bell-visibility", label: "Mostrar en Menú de Campana", category: "notification-center" },
  { id: "field-quiet-hours", label: "Horario Silencioso", category: "notification-center" },
  { id: "field-clear-history", label: "Borrar Historial de Notificaciones", category: "notification-center" },
  { id: "field-add-member", label: "Agregar Miembro de Equipo", category: "team" },
  { id: "field-change-password", label: "Cambiar Contraseña", category: "security" },
  { id: "field-2fa", label: "Autenticación de Dos Factores", category: "security" },
  { id: "field-sessions", label: "Sesiones Activas", category: "security" },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-orange-500" : "bg-slate-200",
      ].join(" ")}
    >
      <span
        className={[
          "absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-[2px]",
        ].join(" ")}
      />
    </button>
  );
}

function SettingsCard({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ id, label, children }) {
  return (
    <div id={id}>
      <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function NotificationRow({ id, title, description, checked, onChange }) {
  return (
    <div id={id} className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400";

export default function Settings() {
  const [activeCategory, setActiveCategory] = useState("workshop");
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(null);

  const [notifications, setNotifications] = useState({
    appointmentReminders: true,
    repairUpdates: true,
    monthlyReports: false,
    lowInventory: true,
  });

  const [bellVisibility, setBellVisibility] = useState({
    appointmentReminders: true,
    repairUpdates: true,
    lowInventory: false,
  });

  const results = query.trim()
    ? SEARCH_INDEX.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  function goToField(item) {
    setActiveCategory(item.category);
    setQuery("");
    setHighlighted(item.id);
  }

  useEffect(() => {
    if (!highlighted) return;
    const el = document.getElementById(highlighted);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const timeout = setTimeout(() => setHighlighted(null), 1600);
    return () => clearTimeout(timeout);
  }, [highlighted, activeCategory]);

  function highlightClass(id) {
    return highlighted === id
      ? "rounded-lg ring-2 ring-orange-400 ring-offset-2 transition-shadow"
      : "";
  }

  return (
    <>
      <Topbar title="Configuración" />

      <main className="flex h-[calc(100%-4rem)]">
        {/* Sidebar interno de Settings */}
        <aside className="w-64 shrink-0 space-y-4 border-r border-slate-200 bg-white p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar configuración..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400"
            />
            {results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToField(item)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="text-slate-700">{item.label}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      en{" "}
                      {CATEGORIES.find((c) => c.id === item.category)?.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <nav className="space-y-1">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveCategory(id);
                  setQuery("");
                }}
                className={[
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeCategory === id
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Contenido de la categoría activa */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-2xl space-y-6">
            {activeCategory === "workshop" && (
              <SettingsCard title="Detalles del Taller">
                <div className="grid grid-cols-2 gap-4">
                  <div className={highlightClass("field-workshop-name")}>
                    <Field id="field-workshop-name" label="Nombre del Taller">
                      <input
                        defaultValue="meCar Auto Service"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className={highlightClass("field-phone")}>
                    <Field id="field-phone" label="Teléfono">
                      <input defaultValue="+1 555-0100" className={inputClass} />
                    </Field>
                  </div>
                  <div className={highlightClass("field-email")}>
                    <Field id="field-email" label="Correo">
                      <input
                        defaultValue="contact@mecar.auto"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className={highlightClass("field-tax-id")}>
                    <Field id="field-tax-id" label="RFC / Identificación Fiscal">
                      <input
                        defaultValue="TX-882-4499"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className={`col-span-2 ${highlightClass("field-address")}`}>
                    <Field id="field-address" label="Dirección">
                      <input
                        defaultValue="1240 Garage Lane, Detroit, MI 48201"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              </SettingsCard>
            )}

            {activeCategory === "notifications" && (
              <SettingsCard title="Notificaciones">
                <div className="divide-y divide-slate-100">
                  <div className={highlightClass("field-appointment-reminders")}>
                    <NotificationRow
                      id="field-appointment-reminders"
                      title="Recordatorios de Citas"
                      description="Enviar recordatorios por correo 24h antes de las citas"
                      checked={notifications.appointmentReminders}
                      onChange={(v) =>
                        setNotifications((n) => ({ ...n, appointmentReminders: v }))
                      }
                    />
                  </div>
                  <div className={highlightClass("field-repair-updates")}>
                    <NotificationRow
                      id="field-repair-updates"
                      title="Actualizaciones de Reparación"
                      description="Notificar a los clientes cuando cambie el estatus del vehículo"
                      checked={notifications.repairUpdates}
                      onChange={(v) =>
                        setNotifications((n) => ({ ...n, repairUpdates: v }))
                      }
                    />
                  </div>
                  <div className={highlightClass("field-monthly-reports")}>
                    <NotificationRow
                      id="field-monthly-reports"
                      title="Reportes Mensuales"
                      description="Recibir resumen de rendimiento mensual"
                      checked={notifications.monthlyReports}
                      onChange={(v) =>
                        setNotifications((n) => ({ ...n, monthlyReports: v }))
                      }
                    />
                  </div>
                  <div className={highlightClass("field-low-inventory")}>
                    <NotificationRow
                      id="field-low-inventory"
                      title="Alertas de Inventario Bajo"
                      description="Alertar cuando las refacciones o stock estén bajos"
                      checked={notifications.lowInventory}
                      onChange={(v) =>
                        setNotifications((n) => ({ ...n, lowInventory: v }))
                      }
                    />
                  </div>
                </div>
              </SettingsCard>
            )}

            {activeCategory === "notification-center" && (
              <>
                <SettingsCard title="Mostrar en Menú de Campana">
                  <p className="mb-3 text-xs text-slate-400">
                    Elige qué tipos de eventos aparecen en la campanita del
                    encabezado (además de enviarse por email).
                  </p>
                  <div id="field-bell-visibility" className={`divide-y divide-slate-100 ${highlightClass("field-bell-visibility")}`}>
                    <NotificationRow
                      id="bell-appointment-reminders"
                      title="Recordatorios de Citas"
                      description="Mostrar alertas de próximas citas"
                      checked={bellVisibility.appointmentReminders}
                      onChange={(v) =>
                        setBellVisibility((b) => ({ ...b, appointmentReminders: v }))
                      }
                    />
                    <NotificationRow
                      id="bell-repair-updates"
                      title="Actualizaciones de Reparación"
                      description="Mostrar cuando una reparación cambie de estatus"
                      checked={bellVisibility.repairUpdates}
                      onChange={(v) =>
                        setBellVisibility((b) => ({ ...b, repairUpdates: v }))
                      }
                    />
                    <NotificationRow
                      id="bell-low-inventory"
                      title="Alertas de Inventario Bajo"
                      description="Mostrar advertencias de stock bajo"
                      checked={bellVisibility.lowInventory}
                      onChange={(v) =>
                        setBellVisibility((b) => ({ ...b, lowInventory: v }))
                      }
                    />
                  </div>
                </SettingsCard>

                <SettingsCard title="Horario Silencioso">
                  <div
                    id="field-quiet-hours"
                    className={`grid grid-cols-2 gap-4 ${highlightClass("field-quiet-hours")}`}
                  >
                    <Field label="Desde">
                      <input type="time" defaultValue="20:00" className={inputClass} />
                    </Field>
                    <Field label="Hasta">
                      <input type="time" defaultValue="08:00" className={inputClass} />
                    </Field>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    No se mostrarán notificaciones nuevas en la campanita
                    durante este horario.
                  </p>
                </SettingsCard>

                <SettingsCard title="Historial de Notificaciones">
                  <div
                    id="field-clear-history"
                    className={`flex items-center justify-between ${highlightClass("field-clear-history")}`}
                  >
                    <p className="text-sm text-slate-600">
                      Borra todas las notificaciones anteriores de la campanita.
                    </p>
                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      Borrar Historial
                    </button>
                  </div>
                </SettingsCard>
              </>
            )}

            {activeCategory === "team" && (
              <SettingsCard title="Equipo">
                <div className="divide-y divide-slate-100">
                  {[
                    { initials: "AK", name: "Alex Kovacs", role: "Admin" },
                    { initials: "ST", name: "Sam Torres", role: "Técnico" },
                    { initials: "JM", name: "Jordan Mills", role: "Técnico" },
                  ].map((m) => (
                    <div key={m.name} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                          {m.initials}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {m.name}
                          </p>
                          <p className="text-xs text-slate-400">{m.role}</p>
                        </div>
                      </div>
                      <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  id="field-add-member"
                  className={`mt-3 flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 ${highlightClass("field-add-member")}`}
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar Miembro
                </button>
              </SettingsCard>
            )}

            {activeCategory === "security" && (
              <>
                <SettingsCard title="Cambiar Contraseña">
                  <div id="field-change-password" className={`space-y-4 ${highlightClass("field-change-password")}`}>
                    <Field label="Contraseña Actual">
                      <input type="password" className={inputClass} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Nueva Contraseña">
                        <input type="password" className={inputClass} />
                      </Field>
                      <Field label="Confirmar Nueva Contraseña">
                        <input type="password" className={inputClass} />
                      </Field>
                    </div>
                  </div>
                </SettingsCard>

                <SettingsCard title="Autenticación de Dos Factores">
                  <div
                    id="field-2fa"
                    className={`flex items-center justify-between ${highlightClass("field-2fa")}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Requerir código al iniciar sesión
                      </p>
                      <p className="text-xs text-slate-400">
                        Añade una capa extra de seguridad a tu cuenta
                      </p>
                    </div>
                    <Toggle checked={false} onChange={() => {}} />
                  </div>
                </SettingsCard>

                <SettingsCard title="Sesiones Activas">
                  <div id="field-sessions" className={highlightClass("field-sessions")}>
                    <p className="text-sm text-slate-600">
                      Windows · Chrome — sesión actual
                    </p>
                  </div>
                </SettingsCard>
              </>
            )}

            <div className="flex justify-end">
              <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
