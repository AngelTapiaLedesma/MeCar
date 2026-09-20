import Topbar from "../components/Topbar";

const mockHistory = [
  { date: "Aug 19, 2026", vehicle: "Honda Civic 2019", plate: "MRX-4421", client: "Sarah Thompson", service: "Full Service", tech: "Alex Kovacs", duration: "4h 30m", cost: 380, status: "In Progress" },
  { date: "Aug 18, 2026", vehicle: "Toyota Camry 2021", plate: "KJL-8872", client: "Marcus Rivera", service: "Brake Replacement", tech: "Sam Torres", duration: "2h 15m", cost: 220, status: "Completed" },
  { date: "Aug 17, 2026", vehicle: "BMW 3 Series 2020", plate: "BWM-3398", client: "James Chen", service: "Engine Diagnostics", tech: "Alex Kovacs", duration: "1h 45m", cost: 150, status: "In Progress" },
  { date: "Aug 16, 2026", vehicle: "Volkswagen Golf 2020", plate: "VLK-5531", client: "Priya Patel", service: "Oil Change + Filter", tech: "Jordan Mills", duration: "45m", cost: 85, status: "Completed" },
  { date: "Aug 15, 2026", vehicle: "Nissan Altima 2023", plate: "NIS-9923", client: "Nathan Okafor", service: "A/C Repair", tech: "Sam Torres", duration: "3h 20m", cost: 310, status: "In Progress" },
  { date: "Aug 14, 2026", vehicle: "Hyundai Tucson 2021", plate: "HND-3381", client: "Marcus Rivera", service: "Tire Rotation", tech: "Jordan Mills", duration: "1h", cost: 60, status: "Completed" },
  { date: "Aug 13, 2026", vehicle: "Audi A4 2018", plate: "ADI-7754", client: "David Williams", service: "Suspension Overhaul", tech: "Alex Kovacs", duration: "6h", cost: 740, status: "In Progress" },
  { date: "Aug 12, 2026", vehicle: "Kia Sportage 2020", plate: "KIA-7743", client: "James Chen", service: "Transmission Service", tech: "Sam Torres", duration: "5h", cost: 590, status: "In Progress" },
  { date: "Aug 11, 2026", vehicle: "Subaru Outback 2023", plate: "SUB-1198", client: "Laura Schneider", service: "Coolant Flush", tech: "Jordan Mills", duration: "1h 30m", cost: 120, status: "In Progress" },
  { date: "Aug 10, 2026", vehicle: "Ford F-150 2022", plate: "FRD-1140", client: "Elena Martinez", service: "Inspection", tech: "Alex Kovacs", duration: "2h", cost: 180, status: "Cancelled" },
];

const STATUS_STYLES = {
  "In Progress": "bg-orange-50 text-orange-600",
  Completed: "bg-emerald-50 text-emerald-600",
  Cancelled: "bg-red-50 text-red-500",
};

export default function History() {
  return (
    <>
      <Topbar title="History & Logs" />

      <main className="space-y-6 p-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">History & Logs</h2>
          <p className="text-sm text-slate-400">
            Complete repair and service records
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Vehicle</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Service Type</th>
                  <th className="px-6 py-3 font-medium">Technician</th>
                  <th className="px-6 py-3 font-medium">Duration</th>
                  <th className="px-6 py-3 font-medium">Cost</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockHistory.map((h, i) => (
                  <tr
                    key={i}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-3 text-slate-500">{h.date}</td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-900">
                        {h.vehicle}
                      </p>
                      <p className="text-xs text-slate-400">{h.plate}</p>
                    </td>
                    <td className="px-6 py-3 text-orange-500">{h.client}</td>
                    <td className="px-6 py-3 text-slate-700">{h.service}</td>
                    <td className="px-6 py-3 text-slate-600">{h.tech}</td>
                    <td className="px-6 py-3 text-slate-500">{h.duration}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      ${h.cost}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={[
                          "rounded-md px-2 py-1 text-xs font-medium",
                          STATUS_STYLES[h.status],
                        ].join(" ")}
                      >
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
