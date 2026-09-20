import { useState } from "react";
import { Plus } from "lucide-react";
import Topbar from "../components/Topbar";

const mockVehicles = [
  { plate: "MRX-4421", make: "Honda", model: "Civic", year: 2019, owner: "Sarah Thompson", mileage: 62410, status: "In Repair" },
  { plate: "KJL-8872", make: "Toyota", model: "Camry", year: 2021, owner: "Marcus Rivera", mileage: 38900, status: "Ready" },
  { plate: "BWM-3398", make: "BMW", model: "3 Series", year: 2020, owner: "James Chen", mileage: 49200, status: "In Repair" },
  { plate: "FRD-1140", make: "Ford", model: "F-150", year: 2022, owner: "Elena Martinez", mileage: 21500, status: "Waiting" },
  { plate: "ADI-7754", make: "Audi", model: "A4", year: 2018, owner: "David Williams", mileage: 87300, status: "In Repair" },
  { plate: "VLK-5531", make: "Volkswagen", model: "Golf", year: 2020, owner: "Priya Patel", mileage: 44100, status: "Delivered" },
  { plate: "NIS-9923", make: "Nissan", model: "Altima", year: 2023, owner: "Nathan Okafor", mileage: 12800, status: "In Repair" },
  { plate: "CHV-2210", make: "Chevrolet", model: "Malibu", year: 2019, owner: "Laura Schneider", mileage: 55700, status: "Ready" },
  { plate: "MZD-6647", make: "Mazda", model: "CX-5", year: 2022, owner: "James Chen", mileage: 29400, status: "Waiting" },
  { plate: "HND-3381", make: "Hyundai", model: "Tucson", year: 2021, owner: "Marcus Rivera", mileage: 33600, status: "Delivered" },
  { plate: "KIA-7743", make: "Kia", model: "Sportage", year: 2020, owner: "James Chen", mileage: 51200, status: "In Repair" },
  { plate: "SUB-1198", make: "Subaru", model: "Outback", year: 2023, owner: "Laura Schneider", mileage: 8900, status: "In Repair" },
];

const STATUS_STYLES = {
  "In Repair": "bg-orange-50 text-orange-600",
  Ready: "bg-emerald-50 text-emerald-600",
  Waiting: "bg-amber-50 text-amber-600",
  Delivered: "bg-slate-100 text-slate-500",
};

const FILTERS = ["All", "In Repair", "Ready", "Waiting", "Delivered"];

export default function Vehicles() {
  const [activeFilter, setActiveFilter] = useState("All");

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] =
      f === "All"
        ? mockVehicles.length
        : mockVehicles.filter((v) => v.status === f).length;
    return acc;
  }, {});

  const filtered =
    activeFilter === "All"
      ? mockVehicles
      : mockVehicles.filter((v) => v.status === activeFilter);

  return (
    <>
      <Topbar title="Vehicles" />

      <main className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Vehicles</h2>
            <p className="text-sm text-slate-400">
              {mockVehicles.length} vehicles registered
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
            <Plus className="h-4 w-4" />
            Register Vehicle
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={[
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                activeFilter === f
                  ? "bg-orange-500 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {f}
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  activeFilter === f
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3 font-medium">Plate</th>
                  <th className="px-6 py-3 font-medium">Make / Model</th>
                  <th className="px-6 py-3 font-medium">Year</th>
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Mileage</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.plate}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-medium text-slate-600">
                        {v.plate}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {v.make} {v.model}
                    </td>
                    <td className="px-6 py-3 text-slate-500">{v.year}</td>
                    <td className="px-6 py-3 text-orange-500">{v.owner}</td>
                    <td className="px-6 py-3 text-slate-500">
                      {v.mileage.toLocaleString()} km
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={[
                          "rounded-md px-2 py-1 text-xs font-medium",
                          STATUS_STYLES[v.status],
                        ].join(" ")}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-slate-400"
                    >
                      No hay vehículos con este estatus.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
