import { useState } from "react";
import {
  Menu,
  Home,
  Users,
  Car,
  History,
  Settings,
  Bell,
  TrendingUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data — swap these out for real data from your backend
// ---------------------------------------------------------------------------

const stats = [
  { label: "In Repair", value: 6, sublabel: "50% of fleet", accent: true },
  { label: "Clients", value: 8, sublabel: "2 added this month" },
  { label: "Vehicles", value: 12, sublabel: "Fleet registered" },
  { label: "Completed", value: 34, sublabel: "This month" },
];

const activeRepairs = [
  { vehicle: "Honda Civic 2019", plate: "MRX-4421", owner: "Sarah Thompson", type: "Full Service", tech: "Alex Kovacs", status: "In Progress" },
  { vehicle: "BMW 3 Series 2020", plate: "BWM-3398", owner: "James Chen", type: "Engine Diagnostics", tech: "Alex Kovacs", status: "In Progress" },
  { vehicle: "Nissan Altima 2023", plate: "NIS-9923", owner: "Nathan Okafor", type: "A/C Repair", tech: "Sam Torres", status: "In Progress" },
  { vehicle: "Audi A4 2018", plate: "ADI-7754", owner: "David Williams", type: "Suspension Overhaul", tech: "Alex Kovacs", status: "In Progress" },
  { vehicle: "Kia Sportage 2020", plate: "KIA-7743", owner: "James Chen", type: "Transmission Service", tech: "Sam Torres", status: "In Progress" },
  { vehicle: "Subaru Outback 2023", plate: "SUB-1198", owner: "Laura Schneider", type: "Coolant Flush", tech: "Jordan Mills", status: "In Progress" },
];

const upcomingEvents = [
  { day: "20", month: "AUG", label: "Service — Civic / Thompson" },
  { day: "21", month: "AUG", label: "Pickup — Camry / Rivera" },
  { day: "23", month: "AUG", label: "Inspection — BMW / Chen" },
  { day: "26", month: "AUG", label: "Appointment — F-150 / Martinez" },
  { day: "28", month: "AUG", label: "MOT Due — Audi / Williams" },
];

const fleetStatus = [
  { label: "In Repair", count: 6, color: "bg-orange-500", pct: 50 },
  { label: "Ready", count: 2, color: "bg-emerald-500", pct: 17 },
  { label: "Waiting", count: 2, color: "bg-amber-400", pct: 17 },
  { label: "Delivered", count: 2, color: "bg-slate-400", pct: 17 },
];

const navItems = [
  { label: "Home", icon: Home },
  { label: "Clients", icon: Users },
  { label: "Vehicles", icon: Car },
  { label: "History", icon: History },
  { label: "Settings", icon: Settings },
];

// ---------------------------------------------------------------------------
// Small calendar for August 2026, matching the reference screenshot
// ---------------------------------------------------------------------------

function MiniCalendar() {
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  // August 2026 starts on a Saturday
  const leadingBlanks = 6;
  const daysInMonth = 31;
  const today = 19;
  const highlighted = [20, 21, 23, 26, 28];

  const cells = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="mb-3 text-sm font-semibold text-slate-900">August 2026</p>
      <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
        {weekDays.map((d) => (
          <span key={d} className="font-medium text-slate-400">
            {d}
          </span>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <span key={`b-${idx}`} />;
          const isToday = day === today;
          const isHighlighted = highlighted.includes(day);
          return (
            <span
              key={day}
              className={[
                "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs",
                isToday
                  ? "bg-orange-500 font-semibold text-white"
                  : isHighlighted
                  ? "border border-orange-300 text-orange-600"
                  : "text-slate-600",
              ].join(" ")}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={[
        "flex h-screen shrink-0 flex-col bg-slate-950 transition-all duration-200",
        collapsed ? "w-16" : "w-56",
      ].join(" ")}
    >
      {/* Top: toggle + logo */}
      <div
        className={[
          "flex h-16 items-center border-b border-white/5",
          collapsed ? "justify-center" : "justify-between px-4",
        ].join(" ")}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
              <Settings className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="text-base font-semibold text-white">
              me<span className="text-orange-500">Car</span>
            </span>
          </div>
        )}
        {collapsed && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
            <Settings className="h-4 w-4" strokeWidth={2.5} />
          </span>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={[
          "mx-3 mt-3 flex h-9 items-center gap-2 rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white",
          collapsed ? "justify-center" : "px-3",
        ].join(" ")}
      >
        <Menu className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="text-xs font-medium">Collapse</span>}
      </button>

      {/* Nav */}
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {navItems.map(({ label, icon: Icon }, i) => {
          const active = i === 0; // "Home" active, matching the reference
          return (
            <button
              key={label}
              className={[
                "flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-orange-500/10 text-orange-500"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              ].join(" ")}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div
        className={[
          "flex h-16 items-center border-t border-white/5",
          collapsed ? "justify-center" : "gap-3 px-4",
        ].join(" ")}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
          AK
        </span>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-medium text-white">Alex Kovacs</p>
            <p className="text-xs text-slate-400">Admin</p>
          </div>
        )}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Tue, Aug 19 2026</span>
            <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500" />
            </button>
          </div>
        </header>

        <main className="space-y-6 p-8">
          {/* Stat cards + calendar/events row */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className={[
                      "rounded-xl p-4",
                      s.accent
                        ? "bg-orange-500 text-white"
                        : "border border-slate-200 bg-white text-slate-900",
                    ].join(" ")}
                  >
                    <p
                      className={[
                        "text-[11px] font-semibold uppercase tracking-wide",
                        s.accent ? "text-orange-50" : "text-slate-400",
                      ].join(" ")}
                    >
                      {s.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold">{s.value}</p>
                    <p
                      className={[
                        "mt-1 text-xs",
                        s.accent ? "text-orange-50" : "text-slate-400",
                      ].join(" ")}
                    >
                      {s.sublabel}
                    </p>
                  </div>
                ))}
              </div>

              {/* Active repairs table */}
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Active Repairs
                  </h2>
                  <span className="text-xs text-orange-500">
                    Today — Aug 19, 2026
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                        <th className="px-6 py-3 font-medium">Vehicle</th>
                        <th className="px-6 py-3 font-medium">Owner</th>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Technician</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRepairs.map((r) => (
                        <tr
                          key={r.plate}
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-6 py-3">
                            <p className="font-medium text-slate-900">
                              {r.vehicle}
                            </p>
                            <p className="text-xs text-slate-400">{r.plate}</p>
                          </td>
                          <td className="px-6 py-3 text-orange-500">
                            {r.owner}
                          </td>
                          <td className="px-6 py-3 text-slate-600">
                            {r.type}
                          </td>
                          <td className="px-6 py-3 text-slate-600">
                            {r.tech}
                          </td>
                          <td className="px-6 py-3">
                            <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right column: calendar + upcoming events */}
            <div className="space-y-6">
              <MiniCalendar />

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">
                  Upcoming Events
                </h2>
                <ul className="space-y-3">
                  {upcomingEvents.map((e, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-orange-500 text-white">
                        <span className="text-sm font-bold leading-none">
                          {e.day}
                        </span>
                        <span className="text-[9px] font-medium leading-none">
                          {e.month}
                        </span>
                      </span>
                      <span className="text-sm text-slate-600">{e.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom row: fleet status + revenue */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-3">
              <h2 className="mb-5 text-sm font-semibold text-slate-900">
                Fleet Status Overview
              </h2>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {fleetStatus.map((f) => (
                  <div key={f.label}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${f.color}`} />
                      <span className="text-xs font-medium text-slate-500">
                        {f.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full ${f.color}`}
                        style={{ width: `${f.pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {f.count} vehicles
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Monthly Revenue
                </h2>
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +12.4%
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                $18,340
              </p>
              <p className="mt-1 text-xs text-slate-400">
                vs. $16,320 last month
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
