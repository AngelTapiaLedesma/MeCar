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
  { id: "workshop", label: "Workshop Details", icon: Wrench },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "notification-center", label: "Notification Center", icon: BellRing },
  { id: "team", label: "Team", icon: Users },
  { id: "security", label: "Security", icon: Shield },
];

// Índice de búsqueda: cada campo/sección importante, para poder saltar directo a él.
const SEARCH_INDEX = [
  { id: "field-workshop-name", label: "Workshop Name", category: "workshop" },
  { id: "field-phone", label: "Phone", category: "workshop" },
  { id: "field-email", label: "Email", category: "workshop" },
  { id: "field-tax-id", label: "Tax ID", category: "workshop" },
  { id: "field-address", label: "Address", category: "workshop" },
  { id: "field-appointment-reminders", label: "Appointment Reminders", category: "notifications" },
  { id: "field-repair-updates", label: "Repair Updates", category: "notifications" },
  { id: "field-monthly-reports", label: "Monthly Reports", category: "notifications" },
  { id: "field-low-inventory", label: "Low Inventory Alerts", category: "notifications" },
  { id: "field-bell-visibility", label: "Show in Bell Menu", category: "notification-center" },
  { id: "field-quiet-hours", label: "Quiet Hours", category: "notification-center" },
  { id: "field-clear-history", label: "Clear Notification History", category: "notification-center" },
  { id: "field-add-member", label: "Add Team Member", category: "team" },
  { id: "field-change-password", label: "Change Password", category: "security" },
  { id: "field-2fa", label: "Two-Factor Authentication", category: "security" },
  { id: "field-sessions", label: "Active Sessions", category: "security" },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-orange-500" : "bg-slate-200",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
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

  // Después de cambiar de categoría, espera a que el DOM pinte y salta al campo.
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
      <Topbar title="Settings" />

      <main className="flex h-[calc(100%-4rem)]">
        {/* Sidebar interno de Settings */}
        <aside className="w-64 shrink-0 space-y-4 border-r border-slate-200 bg-white p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search settings..."
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
                      in{" "}
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
              <SettingsCard title="Workshop Details">
                <div className="grid grid-cols-2 gap-4">
                  <div className={highlightClass("field-workshop-name")}>
                    <Field id="field-workshop-name" label="Workshop Name">
                      <input
                        defaultValue="meCar Auto Service"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className={highlightClass("field-phone")}>
                    <Field id="field-phone" label="Phone">
                      <input defaultValue="+1 555-0100" className={inputClass} />
                    </Field>
                  </div>
                  <div className={highlightClass("field-email")}>
                    <Field id="field-email" label="Email">
                      <input
                        defaultValue="contact@mecar.auto"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className={highlightClass("field-tax-id")}>
                    <Field id="field-tax-id" label="Tax ID">
                      <input
                        defaultValue="TX-882-4499"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className={`col-span-2 ${highlightClass("field-address")}`}>
                    <Field id="field-address" label="Address">
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
              <SettingsCard title="Notifications">
                <div className="divide-y divide-slate-100">
                  <div className={highlightClass("field-appointment-reminders")}>
                    <NotificationRow
                      id="field-appointment-reminders"
                      title="Appointment Reminders"
                      description="Send email reminders 24h before appointments"
                      checked={notifications.appointmentReminders}
                      onChange={(v) =>
                        setNotifications((n) => ({ ...n, appointmentReminders: v }))
                      }
                    />
                  </div>
                  <div className={highlightClass("field-repair-updates")}>
                    <NotificationRow
                      id="field-repair-updates"
                      title="Repair Updates"
                      description="Notify clients when vehicle status changes"
                      checked={notifications.repairUpdates}
                      onChange={(v) =>
                        setNotifications((n) => ({ ...n, repairUpdates: v }))
                      }
                    />
                  </div>
                  <div className={highlightClass("field-monthly-reports")}>
                    <NotificationRow
                      id="field-monthly-reports"
                      title="Monthly Reports"
                      description="Receive monthly performance digest"
                      checked={notifications.monthlyReports}
                      onChange={(v) =>
                        setNotifications((n) => ({ ...n, monthlyReports: v }))
                      }
                    />
                  </div>
                  <div className={highlightClass("field-low-inventory")}>
                    <NotificationRow
                      id="field-low-inventory"
                      title="Low Inventory Alerts"
                      description="Alert when parts stock runs low"
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
                <SettingsCard title="Show in Bell Menu">
                  <p className="mb-3 text-xs text-slate-400">
                    Elige qué tipos de eventos aparecen en la campanita del
                    encabezado (además de enviarse por email).
                  </p>
                  <div id="field-bell-visibility" className={`divide-y divide-slate-100 ${highlightClass("field-bell-visibility")}`}>
                    <NotificationRow
                      id="bell-appointment-reminders"
                      title="Appointment Reminders"
                      description="Show upcoming appointment alerts"
                      checked={bellVisibility.appointmentReminders}
                      onChange={(v) =>
                        setBellVisibility((b) => ({ ...b, appointmentReminders: v }))
                      }
                    />
                    <NotificationRow
                      id="bell-repair-updates"
                      title="Repair Updates"
                      description="Show when a repair changes status"
                      checked={bellVisibility.repairUpdates}
                      onChange={(v) =>
                        setBellVisibility((b) => ({ ...b, repairUpdates: v }))
                      }
                    />
                    <NotificationRow
                      id="bell-low-inventory"
                      title="Low Inventory Alerts"
                      description="Show low stock warnings"
                      checked={bellVisibility.lowInventory}
                      onChange={(v) =>
                        setBellVisibility((b) => ({ ...b, lowInventory: v }))
                      }
                    />
                  </div>
                </SettingsCard>

                <SettingsCard title="Quiet Hours">
                  <div
                    id="field-quiet-hours"
                    className={`grid grid-cols-2 gap-4 ${highlightClass("field-quiet-hours")}`}
                  >
                    <Field label="From">
                      <input type="time" defaultValue="20:00" className={inputClass} />
                    </Field>
                    <Field label="To">
                      <input type="time" defaultValue="08:00" className={inputClass} />
                    </Field>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    No se mostrarán notificaciones nuevas en la campanita
                    durante este horario.
                  </p>
                </SettingsCard>

                <SettingsCard title="History">
                  <div
                    id="field-clear-history"
                    className={`flex items-center justify-between ${highlightClass("field-clear-history")}`}
                  >
                    <p className="text-sm text-slate-600">
                      Borra todas las notificaciones anteriores de la campanita.
                    </p>
                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      Clear Notification History
                    </button>
                  </div>
                </SettingsCard>
              </>
            )}

            {activeCategory === "team" && (
              <SettingsCard title="Team">
                <div className="divide-y divide-slate-100">
                  {[
                    { initials: "AK", name: "Alex Kovacs", role: "Admin" },
                    { initials: "ST", name: "Sam Torres", role: "Technician" },
                    { initials: "JM", name: "Jordan Mills", role: "Technician" },
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
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  id="field-add-member"
                  className={`mt-3 flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 ${highlightClass("field-add-member")}`}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Team Member
                </button>
              </SettingsCard>
            )}

            {activeCategory === "security" && (
              <>
                <SettingsCard title="Change Password">
                  <div id="field-change-password" className={`space-y-4 ${highlightClass("field-change-password")}`}>
                    <Field label="Current Password">
                      <input type="password" className={inputClass} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="New Password">
                        <input type="password" className={inputClass} />
                      </Field>
                      <Field label="Confirm New Password">
                        <input type="password" className={inputClass} />
                      </Field>
                    </div>
                  </div>
                </SettingsCard>

                <SettingsCard title="Two-Factor Authentication">
                  <div
                    id="field-2fa"
                    className={`flex items-center justify-between ${highlightClass("field-2fa")}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Require a code at login
                      </p>
                      <p className="text-xs text-slate-400">
                        Añade una capa extra de seguridad a tu cuenta
                      </p>
                    </div>
                    <Toggle checked={false} onChange={() => {}} />
                  </div>
                </SettingsCard>

                <SettingsCard title="Active Sessions">
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
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}