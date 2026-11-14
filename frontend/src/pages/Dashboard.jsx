import { TrendingUp } from "lucide-react";
import Topbar from "../components/Topbar";

const stats = [
  { label: "En Reparación", value: 6, sublabel: "50% de la flota", accent: true },
  { label: "Clientes", value: 8, sublabel: "2 agregados este mes" },
  { label: "Vehículos", value: 12, sublabel: "Flota registrada" },
  { label: "Completados", value: 34, sublabel: "Este mes" },
];

const activeRepairs = [
  { vehicle: "Honda Civic 2019", plate: "MRX-4421", owner: "Sarah Thompson", type: "Servicio Completo", mileage: 82450, status: "En Proceso" },
  { vehicle: "BMW 3 Series 2020", plate: "BWM-3398", owner: "James Chen", type: "Diagnóstico de Motor", mileage: 63800, status: "En Proceso" },
  { vehicle: "Nissan Altima 2023", plate: "NIS-9923", owner: "Nathan Okafor", type: "Reparación de A/C", mileage: 31025, status: "En Proceso" },
  { vehicle: "Audi A4 2018", plate: "ADI-7754", owner: "David Williams", type: "Revisión de Suspensión", mileage: 97600, status: "En Proceso" },
  { vehicle: "Kia Sportage 2020", plate: "KIA-7743", owner: "James Chen", type: "Servicio de Transmisión", mileage: 71940, status: "En Proceso" },
  { vehicle: "Subaru Outback 2023", plate: "SUB-1198", owner: "Laura Schneider", type: "Cambio de Refrigerante", mileage: 42800, status: "En Proceso" },
];

const upcomingEvents = [
  { day: "20", month: "AGO", label: "Servicio — Civic / Thompson" },
  { day: "21", month: "AGO", label: "Entrega — Camry / Rivera" },
  { day: "23", month: "AGO", label: "Inspección — BMW / Chen" },
  { day: "26", month: "AGO", label: "Cita — F-150 / Martinez" },
  { day: "28", month: "AGO", label: "Revisión — Audi / Williams" },
];

const fleetStatus = [
  { label: "En Reparación", count: 6, color: "bg-orange-500", pct: 50 },
  { label: "Listo", count: 2, color: "bg-emerald-500", pct: 17 },
  { label: "En Espera", count: 2, color: "bg-amber-400", pct: 17 },
  { label: "Entregado", count: 2, color: "bg-slate-400", pct: 17 },
];

function MiniCalendar() {
  const weekDays = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
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
      <p className="mb-3 text-sm font-semibold text-slate-900">Agosto 2026</p>
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

export default function Dashboard() {
  return (
    <>
      <Topbar title="Panel Principal" />

      <main className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
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

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Reparaciones Activas
                </h2>
                <span className="text-xs text-orange-500">
                  Hoy — 19 de Ago, 2026
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                      <th className="px-6 py-3 font-medium">Vehículo</th>
                      <th className="px-6 py-3 font-medium">Propietario</th>
                      <th className="px-6 py-3 font-medium">Tipo</th>
                      <th className="px-6 py-3 font-medium">Kilometraje</th>
                      <th className="px-6 py-3 font-medium">Estatus</th>
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
                          {r.mileage != null ? `${r.mileage.toLocaleString()} km` : "—"}
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

          <div className="space-y-6">
            <MiniCalendar />

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Próximos Eventos
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-3">
            <h2 className="mb-5 text-sm font-semibold text-slate-900">
              Resumen del Estado de la Flota
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
                    {f.count} vehículos
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Ingresos Mensuales
              </h2>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                +12.4%
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">$18,340</p>
            <p className="mt-1 text-xs text-slate-400">
              vs. $16,320 el mes pasado
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
