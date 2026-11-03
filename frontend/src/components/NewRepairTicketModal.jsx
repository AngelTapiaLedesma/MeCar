import { useState, useEffect } from "react";
import { X, Search, Plus, UserPlus, FileText, Calendar, Eye, EyeOff } from "lucide-react";
import AddClientModal from "./AddClientModal";
import AddVehicleModal from "./AddVehicleModal";
import RepairItemsSection from "./RepairItemsSection";
import TicketSummarySection from "./TicketSummarySection";
import { useClients } from "../context/ClientsContext";
import { fetchVehicles } from "../api/vehicles";
import { createTicket } from "../api/history";

const TECHNICIANS = ["Alex Kovacs", "Sam Torres", "Jordan Mills"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateDisplay(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NewRepairTicketModal({ open, onClose, onCreated }) {
  const { clients, addClient } = useClients();

  const [vehicles, setVehicles] = useState([]);

  const [clientQuery, setClientQuery] = useState("");
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showClientResults, setShowClientResults] = useState(false);
  const [showVehicleResults, setShowVehicleResults] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

  const [date, setDate] = useState(todayIso());
  const [technician, setTechnician] = useState(TECHNICIANS[0]);

  const [ticketItems, setTicketItems] = useState([]);

  // Doble costo para mano de obra
  const [laborCost, setLaborCost] = useState("");
  const [laborPrice, setLaborPrice] = useState("");

  const [notes, setNotes] = useState("");
  const [showCosts, setShowCosts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    fetchVehicles()
      .then((data) => {
        if (!cancelled) setVehicles(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientQuery.toLowerCase())
  );
  const filteredVehicles = vehicles.filter((v) => {
    const matchesQuery = `${v.make} ${v.model} ${v.plate} ${v.vin || ""}`
      .toLowerCase()
      .includes(vehicleQuery.toLowerCase());
    const matchesClient = !selectedClient || v.clientId === selectedClient.id;
    return matchesQuery && matchesClient;
  });

  const partsPriceTotal = ticketItems.reduce(
    (sum, i) => sum + (Number(i.price) || 0),
    0
  );
  const partsCostTotal = ticketItems.reduce(
    (sum, i) => sum + (Number(i.cost) || 0),
    0
  );

  const laborPriceVal = Number(laborPrice) || 0;
  const laborCostVal = Number(laborCost) || 0;

  const total = partsPriceTotal + laborPriceVal;
  const totalCost = partsCostTotal + laborCostVal;
  const totalProfit = total - totalCost;

  function selectClient(c) {
    setSelectedClient(c);
    setClientQuery(c.name);
    setShowClientResults(false);
    if (selectedVehicle && selectedVehicle.clientId !== c.id) {
      setSelectedVehicle(null);
      setVehicleQuery("");
    }
  }

  function selectVehicle(v) {
    setSelectedVehicle(v);
    setVehicleQuery(`${v.make} ${v.model} (${v.plate})`);
    setShowVehicleResults(false);
    if (!selectedClient) {
      const owner = clients.find((c) => c.id === v.clientId);
      if (owner) setSelectedClient(owner);
    }
  }

  function handleAddItem(item) {
    setTicketItems((prev) => [...prev, item]);
  }

  function handleUpdateItemPrice(id, value) {
    setTicketItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, price: Number(value) || 0 } : i))
    );
  }

  function handleUpdateItemCost(id, value) {
    setTicketItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cost: value === "" ? null : Number(value) } : i))
    );
  }

  function handleRemoveItem(id) {
    setTicketItems((prev) => prev.filter((i) => i.id !== id));
  }

  function resetAll() {
    setSelectedClient(null);
    setSelectedVehicle(null);
    setClientQuery("");
    setVehicleQuery("");
    setShowClientResults(false);
    setShowVehicleResults(false);
    setDate(todayIso());
    setTechnician(TECHNICIANS[0]);
    setTicketItems([]);
    setLaborCost("");
    setLaborPrice("");
    setNotes("");
    setSubmitError(null);
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  async function handleCreateRepair() {
    if (!selectedVehicle) {
      setSubmitError("Selecciona un vehículo.");
      return;
    }
    if (ticketItems.length === 0) {
      setSubmitError("Agrega al menos un item.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createTicket({
        IdVehiculo: selectedVehicle.id,
        Tecnico: technician,
        FechaServicio: date,
        Items: ticketItems.map((i) => ({
          Nombre: i.name,
          Precio: i.price,
          Costo: i.cost,
          Origen: i.origin,
          IdCatalogoItem: i.origin === "catalogo" ? i.catalogItemId : null,
        })),
        CostoManoObra: laborPriceVal,
        CostoManoObraTaller: laborCost !== "" ? laborCostVal : null,
        MargenGanancia: 0, // Ya no se usa recargo global duplicado
        Notas: notes,
      });
      onCreated?.();
      resetAll();
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Ocurrió un error al crear el ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div className="flex max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    New Repair Ticket
                  </h2>
                  <p className="text-xs text-slate-400">
                    Fill in the details to create a repair record
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCosts((v) => !v)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  title={showCosts ? "Ocultar costos del taller" : "Mostrar costos del taller"}
                >
                  {showCosts ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showCosts ? "Ocultar Costos" : "Mostrar Costos"}
                </button>
                <button
                  onClick={handleClose}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 px-6 py-5">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Client & Vehicle
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                      Client
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={clientQuery}
                        onChange={(e) => {
                          setClientQuery(e.target.value);
                          setSelectedClient(null);
                          setShowClientResults(true);
                        }}
                        onFocus={() => setShowClientResults(true)}
                        placeholder="Search client..."
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400"
                      />
                    </div>
                    {showClientResults && clientQuery && !selectedClient && (
                      <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {filteredClients.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectClient(c)}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            {c.name}
                          </button>
                        ))}
                        {filteredClients.length === 0 && (
                          <p className="px-3 py-2 text-xs text-slate-400">
                            Sin resultados
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAddClientModal(true)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Crear cliente nuevo
                    </button>
                  </div>

                  <div className="relative">
                    <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                      Vehicle
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={vehicleQuery}
                        onChange={(e) => {
                          setVehicleQuery(e.target.value);
                          setSelectedVehicle(null);
                          setShowVehicleResults(true);
                        }}
                        onFocus={() => setShowVehicleResults(true)}
                        placeholder="Search vehicle..."
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400"
                      />
                    </div>
                    {showVehicleResults && vehicleQuery && !selectedVehicle && (
                      <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {filteredVehicles.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => selectVehicle(v)}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            {v.make} {v.model} — {v.plate} {v.vin ? `(VIN: ${v.vin})` : ""}
                          </button>
                        ))}
                        {filteredVehicles.length === 0 && (
                          <p className="px-3 py-2 text-xs text-slate-400">
                            Sin resultados
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={!selectedClient}
                      onClick={() => setShowAddVehicleModal(true)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" /> Crear vehículo nuevo
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                    Technician
                  </label>
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
                </div>
              </div>

              <RepairItemsSection onAdd={handleAddItem} />

              <TicketSummarySection
                items={ticketItems}
                onUpdatePrice={handleUpdateItemPrice}
                onUpdateCost={handleUpdateItemCost}
                onRemove={handleRemoveItem}
              >
                {/* Mano de obra con doble costo */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Labor (Mano de obra)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {showCosts && (
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                          Costo Taller ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={laborCost}
                          onChange={(e) => setLaborCost(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                        />
                      </div>
                    )}
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
                  </div>
                  {showCosts && laborCost !== "" && laborPrice !== "" && (
                    <p className="text-xs font-medium text-emerald-600">
                      Ganancia mano de obra: +${(laborPriceVal - laborCostVal).toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Additional notes or observations..."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                </div>
              </TicketSummarySection>
            </div>

            {submitError && (
              <div className="px-6 pb-2">
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {submitError}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <div className="text-xs text-slate-500">
                <span>{ticketItems.length} items</span>
                {showCosts && (
                  <span className="ml-3 font-medium text-emerald-600">
                    Ganancia estimada: +${totalProfit.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] uppercase text-slate-400">Total Cliente</p>
                  <p className="text-lg font-bold text-orange-500">${total.toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateRepair}
                    disabled={
                      submitting || !selectedVehicle || ticketItems.length === 0
                    }
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {submitting ? "Creando..." : "Create Repair"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-slate-100 bg-slate-50/50 p-6 md:block">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4" /> Ticket Preview
              </div>
            </div>

            {selectedVehicle ? (
              <div className="mb-3 text-xs text-slate-500">
                <p className="font-medium text-slate-900">
                  {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.year}
                </p>
                <p>Placa: {selectedVehicle.plate}</p>
                {selectedVehicle.vin && <p className="font-mono">VIN: {selectedVehicle.vin}</p>}
              </div>
            ) : (
              <p className="mb-3 text-xs text-slate-400">No vehicle selected</p>
            )}

            {ticketItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-300">
                <FileText className="mb-2 h-8 w-8" />
                <p className="text-xs">Add items to see the ticket</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {ticketItems.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span className="text-slate-700">{i.name}</span>
                    <span className="font-medium text-slate-900">
                      ${Number(i.price).toFixed(2)}
                    </span>
                  </div>
                ))}
                {laborPriceVal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Labor</span>
                    <span>${laborPriceVal.toFixed(2)}</span>
                  </div>
                )}
                <div className="mt-4 border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-base font-bold text-orange-500">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  {showCosts && (
                    <div className="mt-1 flex justify-between text-xs font-medium text-emerald-600">
                      <span>Ganancia neta</span>
                      <span>+${totalProfit.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateDisplay(date)}
              <span>· by {technician.split(" ")[0]}</span>
            </div>
          </aside>
        </div>
      </div>

      <AddClientModal
        open={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onSave={async (data) => {
          const created = await addClient(data);
          selectClient(created);
        }}
      />

      <AddVehicleModal
        open={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        client={selectedClient}
        onCreated={(created) => {
          setVehicles((prev) => [created, ...prev]);
          selectVehicle(created);
        }}
      />
    </>
  );
}
