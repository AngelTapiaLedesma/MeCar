import { Trash2 } from "lucide-react";

// Bloque "resumen" de la reparación: la lista de items que YA se agregaron
// + (como children) mano de obra, margen y notas. Está separado a propósito
// del selector de catálogo (<RepairItemsSection />) para que se lea como
// "lo que va a quedar", no como parte de "lo que estoy agregando".
//
// items: [{ id, name, price }]
// onUpdatePrice(id, value), onRemove(id)
// readOnly: muestra la lista sin inputs ni botón de borrar.
export default function TicketSummarySection({
  items,
  onUpdatePrice,
  onRemove,
  readOnly = false,
  children,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Repair Summary
        </p>
        <span className="text-xs text-slate-400">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <p className="py-2 text-center text-xs text-slate-400">
            {readOnly
              ? "No items"
              : "Pick from the menu above or add a custom item to begin"}
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <span className="text-sm text-slate-700">{item.name}</span>
                {readOnly ? (
                  <span className="text-sm font-medium text-slate-900">
                    ${Number(item.price).toFixed(2)}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => onUpdatePrice(item.id, e.target.value)}
                      className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right text-sm outline-none focus:border-orange-400"
                    />
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {children && (
          <div className="mt-5 space-y-5 border-t border-slate-200 pt-5">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
