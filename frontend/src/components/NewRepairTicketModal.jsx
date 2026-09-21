import { useState, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  FileText,
  Calendar,
} from "lucide-react";
import AddClientModal from "./AddClientModal";
import AddVehicleModal from "./AddVehicleModal";
import { useClients } from "../context/ClientsContext";
import { fetchVehicles } from "../api/vehicles";
import {
  fetchCatalog,
  createSection,
  deleteSection,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from "../api/catalog";
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
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});

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

  const [editMode, setEditMode] = useState(false);
  const [draftSections, setDraftSections] = useState([]);
  const [deletedSectionIds, setDeletedSectionIds] = useState([]);
  const [deletedItemIds, setDeletedItemIds] = useState([]);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [catalogSaveError, setCatalogSaveError] = useState(null);

  const [ticketItems, setTicketItems] = useState([]);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const [laborMode, setLaborMode] = useState("none");
  const [laborValue, setLaborValue] = useState("");
  const [marginMode, setMarginMode] = useState("none");
  const [marginValue, setMarginValue] = useState("");

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Carga catálogo + vehículos cada vez que se abre el modal
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setCatalogLoading(true);
    fetchCatalog()
      .then((data) => {
        if (cancelled) return;
        setCatalog(data);
        if (data[0]) setOpenSections({ [data[0].IdSeccion]: true });
      })
      .catch((err) => {
        if (!cancelled) setSubmitError(err.message);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

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

  const sectionsToRender = editMode ? draftSections : catalog;

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

  // ---------- Cliente / Vehículo ----------

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

  // ---------- Modo edición del catálogo ----------

  function enterEditMode() {
    setDraftSections(
      catalog.map((s) => ({ ...s, Items: s.Items.map((i) => ({ ...i })) }))
    );
    setDeletedSectionIds([]);
    setDeletedItemIds([]);
    setCatalogSaveError(null);
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setDraftSections([]);
    setDeletedSectionIds([]);
    setDeletedItemIds([]);
    setCatalogSaveError(null);
  }

  function addDraftSection() {
    setDraftSections((prev) => [
      ...prev,
      { IdSeccion: `new-${Date.now()}`, Nombre: "", Items: [], isNew: true },
    ]);
  }

  function updateDraftSectionName(id, nombre) {
    setDraftSections((prev) =>
      prev.map((s) => (s.IdSeccion === id ? { ...s, Nombre: nombre } : s))
    );
  }

  function removeDraftSection(id) {
    const section = draftSections.find((s) => s.IdSeccion === id);
    if (section && !section.isNew) {
      setDeletedSectionIds((prev) => [...prev, id]);
    }
    setDraftSections((prev) => prev.filter((s) => s.IdSeccion !== id));
  }

  function addDraftItem(sectionId) {
    setDraftSections((prev) =>
      prev.map((s) =>
        s.IdSeccion === sectionId
          ? {
              ...s,
              Items: [
                ...s.Items,
                {
                  IdItem: `new-${Date.now()}`,
                  Nombre: "",
                  PrecioBase: 0,
                  isNew: true,
                },
              ],
            }
          : s
      )
    );
  }

  function updateDraftItem(sectionId, itemId, field, value) {
    setDraftSections((prev) =>
      prev.map((s) =>
        s.IdSeccion === sectionId
          ? {
              ...s,
              Items: s.Items.map((i) =>
                i.IdItem === itemId ? { ...i, [field]: value } : i
              ),
            }
          : s
      )
    );
  }

  function removeDraftItem(sectionId, itemId) {
    const section = draftSections.find((s) => s.IdSeccion === sectionId);
    const item = section?.Items.find((i) => i.IdItem === itemId);
    if (item && !item.isNew) {
      setDeletedItemIds((prev) => [...prev, itemId]);
    }
    setDraftSections((prev) =>
      prev.map((s) =>
        s.IdSeccion === sectionId
          ? { ...s, Items: s.Items.filter((i) => i.IdItem !== itemId) }
          : s
      )
    );
  }

  function findOriginalItem(itemId) {
    for (const s of catalog) {
      const found = s.Items.find((i) => String(i.IdItem) === String(itemId));
      if (found) return found;
    }
    return null;
  }

  function findOriginalItemSection(itemId) {
    for (const s of catalog) {
      if (s.Items.some((i) => String(i.IdItem) === String(itemId))) {
        return s.IdSeccion;
      }
    }
    return null;
  }

  async function saveCatalogChanges() {
    setSavingCatalog(true);
    setCatalogSaveError(null);
    try {
      const sectionsBeingDeleted = new Set(deletedSectionIds);

      // 1) borrar items marcados (si su sección también se borra, la cascada ya lo hace)
      for (const itemId of deletedItemIds) {
        const origSectionId = findOriginalItemSection(itemId);
        if (origSectionId != null && sectionsBeingDeleted.has(origSectionId)) {
          continue;
        }
        await deleteCatalogItem(itemId);
      }

      // 2) borrar secciones marcadas
      for (const sectionId of deletedSectionIds) {
        await deleteSection(sectionId);
      }

      // 3) crear secciones nuevas (mapear id temporal -> id real)
      const tempToRealSection = {};
      for (const s of draftSections) {
        if (s.isNew && s.Nombre.trim()) {
          const result = await createSection(s.Nombre.trim());
          tempToRealSection[s.IdSeccion] = result.IdSeccion;
        }
      }

      // 4) crear items nuevos
      for (const s of draftSections) {
        const realSectionId = s.isNew ? tempToRealSection[s.IdSeccion] : s.IdSeccion;
        if (realSectionId == null) continue;
        for (const item of s.Items) {
          if (item.isNew && item.Nombre.trim()) {
            await createCatalogItem(
              realSectionId,
              item.Nombre.trim(),
              Number(item.PrecioBase) || 0
            );
          }
        }
      }

      // 5) actualizar items existentes que cambiaron
      for (const s of draftSections) {
        for (const item of s.Items) {
          if (item.isNew) continue;
          const original = findOriginalItem(item.IdItem);
          if (!original) continue;
          if (
            original.Nombre !== item.Nombre ||
            Number(original.PrecioBase) !== Number(item.PrecioBase)
          ) {
            await updateCatalogItem(
              item.IdItem,
              item.Nombre,
              Number(item.PrecioBase) || 0
            );
          }
        }
      }

      const fresh = await fetchCatalog();
      setCatalog(fresh);
      setEditMode(false);
      setDraftSections([]);
      setDeletedSectionIds([]);
      setDeletedItemIds([]);
    } catch (err) {
      setCatalogSaveError(
        err.message || "Ocurrió un error al guardar los cambios del catálogo."
      );
    } finally {
      setSavingCatalog(false);
    }
  }

  // ---------- Items del ticket ----------

  function toggleSection(id) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function addCatalogItemToTicket(item) {
    setTicketItems((prev) => [
      ...prev,
      {
        localId: `t-${Date.now()}-${Math.random()}`,
        name: item.Nombre,
        price: Number(item.PrecioBase),
        origin: "catalogo",
        catalogItemId: item.IdItem,
      },
    ]);
  }

  function addCustomItem() {
    if (!customName.trim()) return;
    setTicketItems((prev) => [
      ...prev,
      {
        localId: `t-${Date.now()}-${Math.random()}`,
        name: customName.trim(),
        price: Number(customPrice) || 0,
        origin: "custom",
        catalogItemId: null,
      },
    ]);
    setCustomName("");
    setCustomPrice("");
  }

  function updateTicketItemPrice(localId, value) {
    setTicketItems((prev) =>
      prev.map((i) =>
        i.localId === localId ? { ...i, price: Number(value) || 0 } : i
      )
    );
  }

  function removeTicketItem(localId) {
    setTicketItems((prev) => prev.filter((i) => i.localId !== localId));
  }

  // ---------- Cerrar / enviar ----------

  function resetAll() {
    setSelectedClient(null);
    setSelectedVehicle(null);
    setClientQuery("");
    setVehicleQuery("");
    setShowClientResults(false);
    setShowVehicleResults(false);
    setDate(todayIso());
    setTechnician(TECHNICIANS[0]);
    setEditMode(false);
    setDraftSections([]);
    setDeletedSectionIds([]);
    setDeletedItemIds([]);
    setTicketItems([]);
    setCustomName("");
    setCustomPrice("");
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
          {/* Columna izquierda: formulario */}
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
              {/* Client & Vehicle */}
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

              {/* Date & Technician */}
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

              {/* Repair Items */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Repair Items
                  </p>
                  {editMode ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={saveCatalogChanges}
                        disabled={savingCatalog}
                        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-60"
                      >
                        {savingCatalog ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={enterEditMode}
                      className="text-xs font-medium text-orange-500 hover:text-orange-600"
                    >
                      Editar catálogo
                    </button>
                  )}
                </div>

                {catalogSaveError && (
                  <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {catalogSaveError}
                  </p>
                )}

                {editMode && (
                  <button
                    type="button"
                    onClick={addDraftSection}
                    className="mb-2 flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar sección
                  </button>
                )}

                {catalogLoading ? (
                  <p className="text-xs text-slate-400">Cargando catálogo...</p>
                ) : (
                  <div className="space-y-2">
                    {sectionsToRender.map((s) => (
                      <div
                        key={s.IdSeccion}
                        className="rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center justify-between px-4 py-2.5">
                          {editMode ? (
                            <input
                              value={s.Nombre}
                              onChange={(e) =>
                                updateDraftSectionName(s.IdSeccion, e.target.value)
                              }
                              placeholder="Nombre de sección"
                              className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm font-semibold outline-none focus:border-orange-400"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleSection(s.IdSeccion)}
                              className="flex flex-1 items-center justify-between text-left text-sm font-semibold text-slate-900"
                            >
                              {s.Nombre}
                              {openSections[s.IdSeccion] ? (
                                <ChevronUp className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              )}
                            </button>
                          )}
                          {editMode && (
                            <button
                              type="button"
                              onClick={() => removeDraftSection(s.IdSeccion)}
                              className="ml-2 text-slate-300 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {(editMode || openSections[s.IdSeccion]) && (
                          <div className="border-t border-slate-100 px-4 py-3">
                            {editMode ? (
                              <div className="space-y-2">
                                {s.Items.map((item) => (
                                  <div
                                    key={item.IdItem}
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      value={item.Nombre}
                                      onChange={(e) =>
                                        updateDraftItem(
                                          s.IdSeccion,
                                          item.IdItem,
                                          "Nombre",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Nombre del item"
                                      className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                                    />
                                    <input
                                      type="number"
                                      value={item.PrecioBase}
                                      onChange={(e) =>
                                        updateDraftItem(
                                          s.IdSeccion,
                                          item.IdItem,
                                          "PrecioBase",
                                          e.target.value
                                        )
                                      }
                                      className="w-24 rounded border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeDraftItem(s.IdSeccion, item.IdItem)
                                      }
                                      className="text-slate-300 hover:text-red-500"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addDraftItem(s.IdSeccion)}
                                  className="text-xs font-medium text-orange-500 hover:text-orange-600"
                                >
                                  + Agregar item
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {s.Items.map((item) => (
                                  <button
                                    key={item.IdItem}
                                    type="button"
                                    onClick={() => addCatalogItemToTicket(item)}
                                    className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                                  >
                                    <Plus className="h-3 w-3" />
                                    {item.Nombre}{" "}
                                    <span className="text-slate-400">
                                      ${Number(item.PrecioBase).toFixed(2)}
                                    </span>
                                  </button>
                                ))}
                                {s.Items.length === 0 && (
                                  <p className="text-xs text-slate-400">
                                    Sin items todavía.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom item — solo para este ticket, nunca se guarda en el catálogo */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Custom item name..."
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                  <input
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="$0.00"
                    inputMode="decimal"
                    className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                  <button
                    type="button"
                    onClick={addCustomItem}
                    className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-xs font-medium text-white hover:bg-orange-600"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>

                {ticketItems.length === 0 ? (
                  <p className="mt-3 text-center text-xs text-slate-400">
                    Pick from the menu above or add a custom item to begin
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {ticketItems.map((item) => (
                      <div
                        key={item.localId}
                        className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                      >
                        <span className="text-sm text-slate-700">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">$</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              updateTicketItemPrice(item.localId, e.target.value)
                            }
                            className="w-20 rounded border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-orange-400"
                          />
                          <button
                            type="button"
                            onClick={() => removeTicketItem(item.localId)}
                            className="text-slate-300 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Labor & Profit Margin */}
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

              {/* Notes */}
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

          {/* Columna derecha: Ticket Preview */}
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
                  <div key={i.localId} className="flex justify-between">
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