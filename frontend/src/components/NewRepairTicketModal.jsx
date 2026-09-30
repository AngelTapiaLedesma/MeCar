import { useState, useEffect } from "react";
import { X, Search, Plus, UserPlus, FileText, Calendar } from "lucide-react";
import AddClientModal from "./AddClientModal";
import AddVehicleModal from "./AddVehicleModal";
import RepairItemsSection from "./RepairItemsSection";
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

function pillClass(active) {
  return [
    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "border-orange-500 bg-orange-50 text-orange-600"
      : "border-slate-200 text-slate-500 hover:bg-slate-50",
  ].join(" ");
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

  const [laborMode, setLaborMode] = useState("none");
  const [laborValue, setLaborValue] = useState("");
  const [marginMode, setMarginMode] = useState("none");
  const [marginValue, setMarginValue] = useState("");

  const [notes, setNotes] = useState("");
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
    const matchesQuery = `${v.make} ${v.model} ${v.plate}`
      .toLowerCase()
      .includes(vehicleQuery.toLowerCase());
    const matchesClient = !selectedClient || v.clientId === selectedClient.id;
    return matchesQuery && matchesClient;
  });

  const partsSubtotal = ticketItems.reduce(
    (sum, i) => sum + (Number(i.price) || 0),
    0
  );
  const laborAmount =
    laborMode === "fixed"
      ? Number(laborValue) || 0
      : laborMode === "percent_parts"
      ? (partsSubtotal * (Number(laborValue) || 0)) / 100
      : 0;
  const marginAmount =
    marginMode === "fixed"
      ? Number(marginValue) || 0
      : marginMode === "percent_total"
      ? ((partsSubtotal + laborAmount) * (Number(marginValue) || 0)) / 100
      : 0;
  const total = partsSubtotal + laborAmount + marginAmount;

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
    setLaborMode("none");
    setLaborValue("");
    setMarginMode("none");
    setMarginValue("");
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
          Origen: i.origin,
          IdCatalogoItem: i.origin === "catalogo" ? i.catalogItemId : null,
        })),
        CostoManoObra: laborAmount,
        MargenGanancia: marginAmount,
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
              <button
                onClick={handleClose}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
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
                            {v.make} {v.model} — {v.plate}
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

              <RepairItemsSection
                items={ticketItems}
                onAdd={handleAddItem}
                onUpdatePrice={handleUpdateItemPrice}
                onRemove={handleRemoveItem}
              />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase text-slate-400">
                    Labor
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLaborMode("none")}
                      className={pillClass(laborMode === "none")}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setLaborMode("fixed")}
                      className={pillClass(laborMode === "fixed")}
                    >
                      Fixed $
                    </button>
                    <button
                      type="button"
                      onClick={() => setLaborMode("percent_parts")}
                      className={pillClass(laborMode === "percent_parts")}
                    >
                      % of parts
                    </button>
                  </div>
                  {laborMode !== "none" && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-xs text-slate-400">
                        {laborMode === "fixed" ? "$" : "%"}
                      </span>
                      <input
                        type="number"
                        value={laborValue}
                        onChange={(e) => setLaborValue(e.target.value)}
                        className="w-24 rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-orange-400"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase text-slate-400">
                    Profit Margin
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMarginMode("none")}
                      className={pillClass(marginMode === "none")}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarginMode("fixed")}
                      className={pillClass(marginMode === "fixed")}
                    >
                      Fixed $
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarginMode("percent_total")}
                      className={pillClass(marginMode === "percent_total")}
                    >
                      % of total
                    </button>
                  </div>
                  {marginMode !== "none" && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-xs text-slate-400">
                        {marginMode === "fixed" ? "$" : "%"}
                      </span>
                      <input
                        type="number"
                        value={marginValue}
                        onChange={(e) => setMarginValue(e.target.value)}
                        className="w-24 rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-orange-400"
                      />
                    </div>
                  )}
                </div>
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
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                />
              </div>
            </div>

            {submitError && (
              <div className="px-6 pb-2">
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {submitError}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <p className="text-xs text-slate-400">
                {ticketItems.length} item{ticketItems.length !== 1 ? "s" : ""} ·
                Total ${total.toFixed(2)}
              </p>
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

          <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-slate-100 bg-slate-50/50 p-6 md:block">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileText className="h-4 w-4" /> Ticket Preview
            </div>

            {selectedVehicle ? (
              <p className="mb-3 text-xs text-slate-500">
                {selectedVehicle.make} {selectedVehicle.model}{" "}
                {selectedVehicle.year} — {selectedVehicle.plate}
              </p>
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
                      ${i.price.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Parts subtotal</span>
                    <span>${partsSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Labor</span>
                    <span>+${laborAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Margin</span>
                    <span>+${marginAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-orange-500">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
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
