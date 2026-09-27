import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  fetchCatalog,
  createSection,
  deleteSection,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from "../api/catalog";

// items: [{ id, name, price, origin: 'catalogo'|'custom', catalogItemId }]
// onAdd(item), onUpdatePrice(id, value), onRemove(id)
// readOnly: cuando el ticket ya está cerrado — solo muestra la lista, sin
// catálogo, sin edición, sin poder agregar/quitar/editar precios.
export default function RepairItemsSection({
  items,
  onAdd,
  onUpdatePrice,
  onRemove,
  readOnly = false,
}) {
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});

  const [editMode, setEditMode] = useState(false);
  const [draftSections, setDraftSections] = useState([]);
  const [deletedSectionIds, setDeletedSectionIds] = useState([]);
  const [deletedItemIds, setDeletedItemIds] = useState([]);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [catalogSaveError, setCatalogSaveError] = useState(null);

  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  useEffect(() => {
    if (readOnly) return;
    setCatalogLoading(true);
    fetchCatalog()
      .then((data) => {
        setCatalog(data);
        if (data[0]) setOpenSections({ [data[0].IdSeccion]: true });
      })
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (readOnly) {
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Repair Items
        </p>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <span className="text-sm text-slate-700">{item.name}</span>
              <span className="text-sm font-medium text-slate-900">
                ${Number(item.price).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sectionsToRender = editMode ? draftSections : catalog;

  function toggleSection(id) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function addCatalogItemToTicket(catalogItem) {
    onAdd({
      id: `t-${Date.now()}-${Math.random()}`,
      name: catalogItem.Nombre,
      price: Number(catalogItem.PrecioBase),
      origin: "catalogo",
      catalogItemId: catalogItem.IdItem,
    });
  }

  function addCustomItem() {
    if (!customName.trim()) return;
    onAdd({
      id: `t-${Date.now()}-${Math.random()}`,
      name: customName.trim(),
      price: Number(customPrice) || 0,
      origin: "custom",
      catalogItemId: null,
    });
    setCustomName("");
    setCustomPrice("");
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
                { IdItem: `new-${Date.now()}`, Nombre: "", PrecioBase: 0, isNew: true },
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

      for (const itemId of deletedItemIds) {
        const origSectionId = findOriginalItemSection(itemId);
        if (origSectionId != null && sectionsBeingDeleted.has(origSectionId)) {
          continue;
        }
        await deleteCatalogItem(itemId);
      }

      for (const sectionId of deletedSectionIds) {
        await deleteSection(sectionId);
      }

      const tempToRealSection = {};
      for (const s of draftSections) {
        if (s.isNew && s.Nombre.trim()) {
          const result = await createSection(s.Nombre.trim());
          tempToRealSection[s.IdSeccion] = result.IdSeccion;
        }
      }

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

  return (
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
            <div key={s.IdSeccion} className="rounded-lg border border-slate-200">
              <div className="flex items-center justify-between px-4 py-2.5">
                {editMode ? (
                  <input
                    value={s.Nombre}
                    onChange={(e) => updateDraftSectionName(s.IdSeccion, e.target.value)}
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
                        <div key={item.IdItem} className="flex items-center gap-2">
                          <input
                            value={item.Nombre}
                            onChange={(e) =>
                              updateDraftItem(s.IdSeccion, item.IdItem, "Nombre", e.target.value)
                            }
                            placeholder="Nombre del item"
                            className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                          />
                          <input
                            type="number"
                            value={item.PrecioBase}
                            onChange={(e) =>
                              updateDraftItem(s.IdSeccion, item.IdItem, "PrecioBase", e.target.value)
                            }
                            className="w-24 rounded border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                          />
                          <button
                            type="button"
                            onClick={() => removeDraftItem(s.IdSeccion, item.IdItem)}
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
                        <p className="text-xs text-slate-400">Sin items todavía.</p>
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

      {items.length === 0 ? (
        <p className="mt-3 text-center text-xs text-slate-400">
          Pick from the menu above or add a custom item to begin
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <span className="text-sm text-slate-700">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">$</span>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => onUpdatePrice(item.id, e.target.value)}
                  className="w-20 rounded border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-orange-400"
                />
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
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
  );
}