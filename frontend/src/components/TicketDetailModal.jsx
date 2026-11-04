import { useState, useEffect } from "react";
import { X, Lock, Car, User, Calendar, Eye, EyeOff } from "lucide-react";
import { updateTicket } from "../api/history";
import RepairItemsSection from "./RepairItemsSection";
import TicketSummarySection from "./TicketSummarySection";

const TECHNICIANS = ["Alex Kovacs", "Sam Torres", "Jordan Mills"];

// editable: true cuando se abrió desde "Editar" en el menú de la fila.
// false cuando se abrió con clic directo en la fila (solo ver detalles).
// Un ticket Closed nunca es editable, sin importar este prop.
export default function TicketDetailModal({ open, onClose, ticket, editable, onChanged }) {
  const [date, setDate] = useState("");
  const [technician, setTechnician] = useState(TECHNICIANS[0]);
  const [items, setItems] = useState([]);
  const [laborCost, setLaborCost] = useState("");
  const [laborPrice, setLaborPrice] = useState("0");
  const [laborMode, setLaborMode] = useState("fixed");
  const [laborMarginPct, setLaborMarginPct] = useState("20");
  const [notes, setNotes] = useState("");
  const [showCosts, setShowCosts] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open && ticket) {
      setDate(ticket.date ? String(ticket.date).slice(0, 10) : "");
      setTechnician(ticket.tech || TECHNICIANS[0]);
      setItems(ticket.items.map((i) => ({ ...i })));
      setLaborPrice(String(ticket.laborCost ?? 0));
      setLaborCost(ticket.laborCostShop != null ? String(ticket.laborCostShop) : "");
      setLaborMode("fixed");
      setNotes(ticket.notes || "");
      setSaveError(null);
      setConfirmClose(false);
    }
  }, [open, ticket]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open || !ticket) return null;

  const isClosed = ticket.status === "Closed";
  const readOnly = isClosed || !editable;

  const partsPrice = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  const partsCost = items.reduce((sum, i) => {
    const c = i.cost != null ? Number(i.cost) : 0;
    return sum + c;
  }, 0);

  const laborCostVal = laborCost !== "" ? Number(laborCost) : 0;
  const laborMarginVal = Number(laborMarginPct) || 0;
  const laborPriceVal =
    laborMode === "percentage"
      ? laborCostVal * (1 + laborMarginVal / 100)
      : Number(laborPrice) || 0;

  const total = partsPrice + laborPriceVal;
  const totalCost = partsCost + laborCostVal;
  const totalProfit = total - totalCost;

  const hasAnyCost = items.some((i) => i.cost != null) || laborCost !== "";

  function handleAddItem(item) {
    setItems((prev) => [...prev, item]);
  }

  function handleUpdateItemPrice(id, value) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, price: Number(value) || 0 } : i))
    );
  }

  function handleUpdateItemCost(id, value) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cost: value === "" ? null : Number(value) } : i))
    );
  }

  function handleRemoveItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function buildPayload(estatus) {
    return {
      Tecnico: technician,
      FechaServicio: date,
      Items: items.map((i) => ({
        Nombre: i.name,
        Precio: i.price,
        Costo: i.cost,
        Origen: i.origin,
        IdCatalogoItem: i.catalogItemId,
      })),
      CostoManoObra: laborPriceVal,
      CostoManoObraTaller: laborCost !== "" ? laborCostVal : null,
      MargenGanancia: 0,
      Notas: notes,
      Estatus: estatus,
    };
  }

  async function handleSave() {
    if (items.length === 0) {
      setSaveError("Debe haber al menos un item.");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await updateTicket(ticket.id, buildPayload("In Progress"));
      onChanged?.();
      onClose();
    } catch (err) {
      setSaveError(err.message || "Ocurrió un error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmClose() {
    if (items.length === 0) {
      setSaveError("Debe haber al menos un item.");
      setConfirmClose(false);
      return;
    }
    setSaveError(null);
    setClosing(true);
    try {
      await updateTicket(ticket.id, buildPayload("Closed"));
      onChanged?.();
      onClose();
    } catch (err) {
      setSaveError(err.message || "Ocurrió un error al cerrar el ticket.");
      setConfirmClose(false);
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="relative flex items-center justify-center border-b border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                {ticket.vehicle}
              </h2>
              <span
                className={[
                  "rounded-md px-2 py-0.5 text-xs font-medium",
                  isClosed
                    ? "bg-slate-100 text-slate-500"
                    : "bg-orange-50 text-orange-600",
                ].join(" ")}
              >
                {isClosed ? (
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Closed
                  </span>
                ) : (
                  "In Progress"
                )}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Car className="h-3 w-3" /> {ticket.plate}
              </span>
              {ticket.vin && (
                <span className="font-mono text-slate-500">VIN: {ticket.vin}</span>
              )}
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {ticket.client}
              </span>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowCosts((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              title={showCosts ? "Ocultar costos del taller" : "Mostrar costos del taller"}
            >
              {showCosts ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        <div className="space-y-6 px-6 py-5">
          {isClosed && (
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5" />
              Este ticket está cerrado y ya no se puede modificar.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                Date
              </label>
              {readOnly ? (
                <p className="flex items-center gap-1.5 text-sm text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" /> {date}
                </p>
              ) : (
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                />
              )}
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                Technician
              </label>
              {readOnly ? (
                <p className="text-sm text-slate-700">{technician}</p>
              ) : (
                <select
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                >
                  {TECHNICIANS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <RepairItemsSection onAdd={handleAddItem} readOnly={readOnly} />

          <TicketSummarySection
            items={items}
            onUpdatePrice={handleUpdateItemPrice}
            onUpdateCost={handleUpdateItemCost}
            onRemove={handleRemoveItem}
            readOnly={readOnly}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Labor (Mano de obra)
                </p>
                {!readOnly && (
                  <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setLaborMode("fixed")}
                      className={[
                        "rounded-md px-2 py-1 font-medium transition-colors",
                        laborMode === "fixed"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-900",
                      ].join(" ")}
                    >
                      Precio Fijo ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLaborMode("percentage")}
                      className={[
                        "rounded-md px-2 py-1 font-medium transition-colors",
                        laborMode === "percentage"
                          ? "bg-white text-orange-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-900",
                      ].join(" ")}
                    >
                      Margen (%)
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {showCosts && (
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                      Costo Taller ($)
                    </label>
                    {readOnly ? (
                      <p className="text-sm text-slate-700">
                        {laborCost !== "" ? `$${laborCostVal.toFixed(2)}` : "—"}
                      </p>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        value={laborCost}
                        onChange={(e) => setLaborCost(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    )}
                  </div>
                )}

                {readOnly ? (
                  <div className={!showCosts ? "col-span-2" : ""}>
                    <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                      Precio Cliente ($)
                    </label>
                    <p className="text-sm text-slate-700">${laborPriceVal.toFixed(2)}</p>
                  </div>
                ) : laborMode === "percentage" ? (
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                      Margen Ganancia (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={laborMarginPct}
                      onChange={(e) => setLaborMarginPct(e.target.value)}
                      placeholder="20"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                ) : (
                  <div className={!showCosts ? "col-span-2" : ""}>
                    <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                      Precio Cliente ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={laborPrice}
                      onChange={(e) => setLaborPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                )}
              </div>

              {!readOnly && laborMode === "percentage" && (
                <div className="flex items-center justify-between rounded-lg bg-orange-50/50 px-3 py-2 text-xs">
                  <span className="text-slate-600">
                    Precio calculado ({laborMarginPct}% sobre costo):
                  </span>
                  <span className="font-bold text-orange-600">
                    ${laborPriceVal.toFixed(2)}
                  </span>
                </div>
              )}

              {showCosts && laborCost !== "" && (
                <p className="text-xs font-medium text-emerald-600">
                  Ganancia mano de obra: +${(laborPriceVal - laborCostVal).toFixed(2)}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                Notes
              </label>
              {readOnly ? (
                <p className="text-sm text-slate-600">{notes || "—"}</p>
              ) : (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                />
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <div className="text-xs text-slate-500">
                {showCosts && hasAnyCost && (
                  <span className="font-medium text-emerald-600">
                    Ganancia neta: +${totalProfit.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-400">Total Cliente</p>
                <p className="text-lg font-bold text-orange-500">${total.toFixed(2)}</p>
              </div>
            </div>
          </TicketSummarySection>

          {saveError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {saveError}
            </p>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            {!confirmClose ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  onClick={() => setConfirmClose(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
                >
                  <Lock className="h-3.5 w-3.5" /> Cerrar ticket
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                <span className="text-xs text-red-600">
                  ¿Seguro que quieres cerrar el ticket? No podrás modificarlo después.
                </span>
                <button
                  onClick={() => setConfirmClose(false)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmClose}
                  disabled={closing}
                  className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-60"
                >
                  {closing ? "Cerrando..." : "Sí, cerrar"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
