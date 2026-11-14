import { Fragment, useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Table,
  Clock,
  Car,
  User,
  AlertCircle,
  X,
  FileText,
  Plus,
  Eye,
  Settings,
  RefreshCw,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Topbar from "../components/Topbar";
import TicketDetailModal from "../components/TicketDetailModal";
import NewRepairTicketModal from "../components/NewRepairTicketModal";
import {
  fetchAllReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  syncVerificationReminders,
} from "../api/reminders";
import { fetchHistory, updateTicket } from "../api/history";
import { fetchVehicles } from "../api/vehicles";
import { fetchCategorias, createCategoria } from "../api/categorias";
import { notifyVehiclesChanged, onVehiclesChanged } from "../utils/events";

const PLATE_COLORS = [
  { label: "Amarillo", dot: "bg-yellow-400" },
  { label: "Rosa", dot: "bg-pink-400" },
  { label: "Rojo", dot: "bg-red-500" },
  { label: "Verde", dot: "bg-emerald-500" },
  { label: "Azul", dot: "bg-blue-500" },
];

// Colores predeterminados para categorías nuevas
const PRESET_COLORS = [
  { label: "Verde (Mantenimiento)", value: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { label: "Naranja (Reparación)", value: "bg-orange-50 text-orange-600 border-orange-200" },
  { label: "Azul (Verificación)", value: "bg-blue-50 text-blue-600 border-blue-200" },
  { label: "Morado (Diagnóstico)", value: "bg-purple-50 text-purple-600 border-purple-200" },
  { label: "Rojo", value: "bg-red-50 text-red-600 border-red-200" },
  { label: "Amarillo", value: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  { label: "Rosa", value: "bg-pink-50 text-pink-600 border-pink-200" },
  { label: "Gris", value: "bg-slate-50 text-slate-600 border-slate-200" },
];

export default function Agenda() {
  const [periodo, setPeriodo] = useState("Esta semana");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");
  const [colorFiltro, setColorFiltro] = useState("Todos");
  const [vista, setVista] = useState("tabla");
  const [syncing, setSyncing] = useState(false);

  const [citas, setCitas] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modales
  const [bridgeModalData, setBridgeModalData] = useState(null);
  const [viewTicketModal, setViewTicketModal] = useState(null);
  const [expandedCitas, setExpandedCitas] = useState({});
  const [deleteAppointment, setDeleteAppointment] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [newAppointmentModalOpen, setNewAppointmentModalOpen] = useState(false);
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);

  // Formulario para nueva cita
  const [newApptVehicleId, setNewApptVehicleId] = useState("");
  const [newApptName, setNewApptName] = useState("");
  const [newApptCategoryId, setNewApptCategoryId] = useState("");
  const [newApptDate, setNewApptDate] = useState(new Date().toISOString().slice(0, 10));
  const [savingAppt, setSavingAppt] = useState(false);
  const [apptError, setApptError] = useState(null);

  // Formulario para nueva categoría
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0].value);
  const [savingCat, setSavingCat] = useState(false);
  const [catError, setCatError] = useState(null);

  const periodos = ["Esta semana", "Próximos 15 días", "Este mes", "Todas las fechas"];

  function loadData(silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    Promise.all([fetchAllReminders(), fetchHistory(), fetchVehicles(), fetchCategorias()])
      .then(([remindersData, historyData, vehiclesData, categoriasData]) => {
        setCitas(remindersData);
        setTickets(historyData);
        setVehicles(vehiclesData);
        setCategorias(categoriasData);

        // Set default category if available
        if (categoriasData.length > 0 && !newApptCategoryId) {
          setNewApptCategoryId(String(categoriasData[0].IdCategoria));
        }
      })
      .catch((err) => {
        if (!silent) setError(err.message || "No se pudo cargar la agenda.");
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }

  useEffect(() => {
    loadData();
    return onVehiclesChanged(() => loadData(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!bridgeModalData && !newAppointmentModalOpen && !newCategoryModalOpen && !deleteAppointment) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (bridgeModalData) setBridgeModalData(null);
        if (newAppointmentModalOpen) closeAppointmentForm();
        if (newCategoryModalOpen) setNewCategoryModalOpen(false);
        if (deleteAppointment) setDeleteAppointment(null);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [bridgeModalData, newAppointmentModalOpen, newCategoryModalOpen, deleteAppointment]);

  function getPeriodoRange() {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);

    if (periodo === "Todas las fechas") {
      return { start: "0000-00-00", end: "9999-99-99" };
    }

    if (periodo === "Esta semana") {
      // La semana de la agenda empieza el lunes.
      const daysSinceMonday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - daysSinceMonday);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 6);
    } else if (periodo === "Próximos 15 días") {
      end.setDate(end.getDate() + 14);
    } else if (periodo === "Este mes") {
      end.setMonth(end.getMonth() + 1, 0);
    }

    const toKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return { start: toKey(start), end: toKey(end) };
  }

  const periodoRange = getPeriodoRange();
  const citasFiltradas = citas.filter((c) => {
    if (
      !c.startDate ||
      c.startDate < periodoRange.start ||
      c.startDate > periodoRange.end
    ) {
      return false;
    }
    if (categoriaFiltro !== "Todos" && c.categoryName !== categoriaFiltro) {
      return false;
    }
    // Filtro independiente por color de placa; no afecta la creación manual
    // de citas, solo lo que se muestra en tabla/calendario/tarjetas.
    if (colorFiltro !== "Todos" && c.plateColor !== colorFiltro) {
      return false;
    }
    return true;
  });

  function isVerificationCategory(categoryId) {
    return categorias.find((category) => String(category.IdCategoria) === String(categoryId))?.Nombre === "Verificación";
  }

  function getCalculatedVerificationDate(vehicleId) {
    const vehicle = vehicles.find((item) => String(item.id) === String(vehicleId));
    return vehicle?.verification?.dueDate || null;
  }

  function handleAppointmentCategoryChange(categoryId, setCategoryId, setDate) {
    setCategoryId(categoryId);
    if (isVerificationCategory(categoryId)) {
      const calculatedDate = getCalculatedVerificationDate(newApptVehicleId);
      if (calculatedDate) setDate(calculatedDate);
    }
  }

  function toggleCita(id) {
    setExpandedCitas((previous) => ({ ...previous, [id]: !previous[id] }));
  }

  function openEditAppointment(cita) {
    setEditingAppointment({ ...cita });
    setNewApptVehicleId(cita.vehicleId);
    setNewApptName(cita.name);
    setNewApptCategoryId(String(cita.categoryId));
    setNewApptDate(cita.startDate);
    setApptError(null);
    setNewAppointmentModalOpen(true);
  }

  function closeAppointmentForm() {
    setNewAppointmentModalOpen(false);
    setEditingAppointment(null);
    setNewApptName("");
    setNewApptVehicleId("");
    setNewApptCategoryId("");
    setNewApptDate(new Date().toISOString().slice(0, 10));
    setApptError(null);
  }

  async function handleSaveAppointment(e) {
    e.preventDefault();
    if (!newApptVehicleId || !newApptName.trim() || !newApptCategoryId || !newApptDate) {
      setApptError("Todos los campos obligatorios deben completarse.");
      return;
    }

    setSavingAppt(true);
    setApptError(null);
    try {
      const payload = {
        vehicleId: newApptVehicleId,
        name: newApptName.trim(),
        startDate: newApptDate,
        recurring: false,
        intervalDays: null,
        notify: true,
        categoryId: Number(newApptCategoryId),
      };
      if (editingAppointment) {
        await updateReminder(editingAppointment.id, payload);
      } else {
        await createReminder(payload);
      }
      closeAppointmentForm();
      loadData();
    } catch (err) {
      setApptError(err.message || "Error al guardar la cita.");
    } finally {
      setSavingAppt(false);
    }
  }

  async function handleDeleteAppointment() {
    if (!deleteAppointment) return;
    try {
      await deleteReminder(deleteAppointment.id);
      setDeleteAppointment(null);
      loadData();
    } catch (err) {
      alert(err.message || "No se pudo eliminar la cita.");
    }
  }

  function handleGenerarTicket(cita) {
    const activeTicket = tickets.find(
      (t) =>
        t.status === "In Progress" &&
        (t.plate.toLowerCase() === cita.placas.toLowerCase() ||
          t.vehicle.toLowerCase().includes(cita.vehiculo.toLowerCase()))
    );

    if (!activeTicket) {
      setNewTicketModalOpen(true);
    } else {
      setBridgeModalData({ cita, activeTicket });
    }
  }

  async function handleAddToExistingTicket(cita, activeTicket) {
    const linkedVehicle =
      vehicles.find((v) => v.id === activeTicket.vehicleId) ||
      vehicles.find(
        (v) => v.plate?.toLowerCase() === activeTicket.plate?.toLowerCase()
      );
    // Al editar un ticket hay que reenviar su kilometraje; si el ticket no lo
    // tiene, usamos el último del vehículo.
    const serviceMileage = activeTicket.serviceMileage ?? linkedVehicle?.mileage;

    if (serviceMileage == null) {
      alert(
        "El ticket no tiene kilometraje registrado. Edita el ticket para agregarlo antes de continuar."
      );
      return;
    }

    try {
      const updatedItems = [
        ...activeTicket.items.map((i) => ({
          Nombre: i.name,
          Precio: i.price,
          Costo: i.cost,
          Origen: i.origin,
          IdCatalogoItem: i.catalogItemId,
        })),
        {
          Nombre: cita.name || "Servicio Agendado",
          Precio: 150.0,
          Costo: 50.0,
          Origen: "custom",
          IdCatalogoItem: null,
        },
      ];

      await updateTicket(activeTicket.id, {
        KilometrajeEnServicio: serviceMileage,
        FechaServicio: activeTicket.date,
        Items: updatedItems,
        CostoManoObra: activeTicket.laborCost,
        CostoManoObraTaller: activeTicket.laborCostShop,
        MargenGanancia: 0,
        Notas: (activeTicket.notes ? activeTicket.notes + "\n" : "") + `[Cita añadida: ${cita.name} - ${cita.startDate}]`,
        Estatus: "In Progress",
      });

      alert(`¡Servicio agregado exitosamente al Ticket #${activeTicket.id} (${activeTicket.vehicle})!`);
      setBridgeModalData(null);
      notifyVehiclesChanged({
        vehicleId: activeTicket.vehicleId,
        reason: "ticket-mileage",
      });
    } catch (err) {
      alert(err.message || "No se pudo actualizar el ticket.");
    }
  }

  async function handleSyncVerifications() {
    setSyncing(true);
    try {
      const result = await syncVerificationReminders();
      await loadData(true);
      alert(
        `Verificaciones sincronizadas. ${result.created} citas nuevas de ${result.processed} vehículos.`
      );
    } catch (err) {
      alert(err.message || "No se pudieron sincronizar las verificaciones.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCatError("El nombre de la categoría es obligatorio.");
      return;
    }

    setSavingCat(true);
    setCatError(null);
    try {
      await createCategoria({
        nombre: newCatName.trim(),
        colorClase: newCatColor,
      });
      setNewCategoryModalOpen(false);
      setNewCatName("");
      setNewCatColor(PRESET_COLORS[0].value);
      loadData();
    } catch (err) {
      setCatError(err.message || "Error al crear la categoría.");
    } finally {
      setSavingCat(false);
    }
  }

  return (
    <>
      <Topbar title="Agenda de Servicios" />

      <main className="space-y-6 p-8">
        {/* Header & Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Agenda de Servicios</h2>
            <p className="text-sm text-slate-400">
              Gestión de citas programadas y vinculación con tickets activos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                closeAppointmentForm();
                setNewAppointmentModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Nueva Cita
            </button>

            <button
              type="button"
              onClick={handleSyncVerifications}
              disabled={syncing}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
              title="Genera las citas de verificación que falten para los vehículos existentes"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar verificaciones"}
            </button>

            <button
              type="button"
              onClick={() => setNewCategoryModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-4 w-4" /> Nueva Categoría
            </button>

            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-orange-400"
            >
              {periodos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setVista("tabla")}
                className={[
                  "flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  vista === "tabla"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
              >
                <Table className="h-3.5 w-3.5" /> Tabla
              </button>
              <button
                type="button"
                onClick={() => setVista("calendario")}
                className={[
                  "flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  vista === "calendario"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
              >
                <CalendarIcon className="h-3.5 w-3.5" /> Calendario
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoriaFiltro("Todos")}
            className={[
              "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
              categoriaFiltro === "Todos"
                ? "border-orange-500 bg-orange-50 text-orange-600"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            Todos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.IdCategoria}
              type="button"
              onClick={() => setCategoriaFiltro(cat.Nombre)}
              className={[
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                categoriaFiltro === cat.Nombre
                  ? cat.ColorClase
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {cat.Nombre}
            </button>
          ))}
        </div>

        {/* Filtro independiente por color de placa */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-slate-500">
            Color de placa:
          </span>
          <button
            type="button"
            onClick={() => setColorFiltro("Todos")}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              colorFiltro === "Todos"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            Todos
          </button>
          {PLATE_COLORS.map((color) => (
            <button
              key={color.label}
              type="button"
              onClick={() => setColorFiltro(color.label)}
              className={[
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                colorFiltro === color.label
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
              {color.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
            Cargando agenda de servicios...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            {error}
          </div>
        ) : vista === "tabla" ? (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-3 font-medium">Fecha</th>
                    <th className="px-6 py-3 font-medium">Vehículo</th>
                    <th className="px-6 py-3 font-medium">Cliente</th>
                    <th className="px-6 py-3 font-medium">Categoría</th>
                    <th className="px-6 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {citasFiltradas.map((cita) => (
                    <Fragment key={cita.id}>
                      <tr
                        onClick={() => toggleCita(cita.id)}
                        className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-2">
                            {expandedCitas[cita.id] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{cita.startDate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <Car className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-medium text-slate-900">{cita.vehiculo || "Vehículo"}</p>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600">{cita.placas}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <User className="h-4 w-4 text-slate-400" />
                            <span>{cita.cliente || "Cliente"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={["inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", cita.categoryColor || "bg-slate-50 text-slate-600 border-slate-200"].join(" ")}>
                            {cita.categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                            <button type="button" onClick={() => openEditAppointment(cita)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title="Editar cita">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => setDeleteAppointment(cita)} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50" title="Eliminar cita">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleGenerarTicket(cita)} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-orange-600 transition-colors">
                              <FileText className="h-3.5 w-3.5" /> Generar Ticket
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedCitas[cita.id] && (
                        <tr className="bg-slate-50">
                          <td colSpan={5} className="px-6 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Descripción del servicio</p>
                            <p className="mt-1 text-sm text-slate-700">{cita.name || "Sin descripción."}</p>
                            {cita.verification && (
                              <p className="mt-2 text-xs text-slate-500">Verificación: {cita.verification.color} · No circula {cita.verification.noCircula} · {cita.verification.periodLabel}</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {citasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                        No hay citas programadas. Da clic en "Nueva Cita" para agendar la primera.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {citasFiltradas.map((cita) => (
              <div
                key={cita.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span
                      className={[
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        cita.categoryColor || "bg-slate-50 text-slate-600 border-slate-200",
                      ].join(" ")}
                    >
                      {cita.categoryName}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {cita.startDate}
                    </span>
                  </div>

                  <div className="mt-3 text-sm font-bold text-slate-900">{cita.vehiculo || "Vehículo"}</div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Car className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{cita.vehiculo || "Vehículo"}</h3>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-600">
                          {cita.placas}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 text-xs text-slate-600">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Propietario: <strong className="text-slate-900">{cita.cliente || "Cliente"}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleCita(cita.id)}
                  className="mt-4 flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <span>{expandedCitas[cita.id] ? "Ocultar servicio" : "Ver servicio"}</span>
                  {expandedCitas[cita.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {expandedCitas[cita.id] && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Descripción del servicio</p>
                    <p className="mt-1 text-sm text-slate-700">{cita.name || "Sin descripción."}</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => openEditAppointment(cita)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                    title="Editar cita"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteAppointment(cita)}
                    className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                    title="Eliminar cita"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerarTicket(cita)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-orange-600 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" /> Generar Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bridge Modal */}
        {bridgeModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="relative flex items-center justify-center border-b border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setBridgeModalData(null)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="text-base font-bold text-slate-900">Ticket en Progreso Detectado</h3>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-slate-600">
                  El <strong className="text-slate-900">{bridgeModalData.cita.vehiculo}</strong> con placas{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-800">
                    {bridgeModalData.cita.placas}
                  </code>{" "}
                  tiene el Ticket <strong className="text-orange-600">#{bridgeModalData.activeTicket.id}</strong> en progreso. ¿Deseas agregar este servicio a la cuenta existente o abrir un ticket separado?
                </p>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">Ticket #{bridgeModalData.activeTicket.id}</p>
                    <p className="text-slate-500">Total actual: ${bridgeModalData.activeTicket.total.toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setViewTicketModal(bridgeModalData.activeTicket);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver Ticket
                  </button>
                </div>

                <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3 text-xs text-orange-800">
                  <p className="font-semibold">Servicio agendado:</p>
                  <p>{bridgeModalData.cita.name} — {bridgeModalData.cita.startDate}</p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setBridgeModalData(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToExistingTicket(bridgeModalData.cita, bridgeModalData.activeTicket)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-900 transition-colors"
                >
                  Agregar al Ticket #{bridgeModalData.activeTicket.id}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBridgeModalData(null);
                    setNewTicketModalOpen(true);
                  }}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium text-white hover:bg-orange-600 transition-colors"
                >
                  Crear Nuevo Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Crear Nueva Cita */}
        {newAppointmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="relative flex items-center justify-center border-b border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeAppointmentForm}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 text-orange-600">
                  <CalendarIcon className="h-5 w-5" />
                  <h3 className="text-base font-bold text-slate-900">
                    {editingAppointment ? "Editar Cita" : "Programar Nueva Cita"}
                  </h3>
                </div>
              </div>

              <form onSubmit={handleSaveAppointment} className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Vehículo *
                  </label>
                  <select
                    value={newApptVehicleId}
                    onChange={(e) => {
                      setNewApptVehicleId(e.target.value);
                      if (isVerificationCategory(newApptCategoryId)) {
                        const calculatedDate = getCalculatedVerificationDate(e.target.value);
                        if (calculatedDate) setNewApptDate(calculatedDate);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                    required
                  >
                    <option value="">Selecciona un vehículo...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.plate}) — {v.clientName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Categoría *
                  </label>
                  <select
                    value={newApptCategoryId}
                    onChange={(e) =>
                      handleAppointmentCategoryChange(e.target.value, setNewApptCategoryId, setNewApptDate)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                    required
                  >
                    <option value="">Selecciona una categoría...</option>
                    {categorias.map((cat) => (
                      <option key={cat.IdCategoria} value={cat.IdCategoria}>
                        {cat.Nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Descripción del Servicio *
                  </label>
                  <input
                    type="text"
                    value={newApptName}
                    onChange={(e) => setNewApptName(e.target.value)}
                    placeholder="Ej. Cambio de aceite y filtro"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Fecha de la Cita *
                  </label>
                  <input
                    type="date"
                    value={newApptDate}
                    onChange={(e) => setNewApptDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                    required
                  />
                  {isVerificationCategory(newApptCategoryId) &&
                    getCalculatedVerificationDate(newApptVehicleId) && (
                      <p className="mt-1 text-xs text-slate-400">
                        (fecha calculada de verificación)
                      </p>
                    )}
                </div>

                {apptError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {apptError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeAppointmentForm}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingAppt}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-60"
                  >
                    {savingAppt ? "Guardando..." : editingAppointment ? "Guardar cambios" : "Agendar Cita"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmación de eliminación permanente de cita */}
        {deleteAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">Eliminar cita</h3>
              </div>
              <p className="text-sm text-slate-600">
                ¿Desea borrar permanentemente la cita{" "}
                <span className="font-medium">"{deleteAppointment.name}"</span>
                {deleteAppointment.vehiculo ? ` de ${deleteAppointment.vehiculo}` : ""}? Esta
                acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteAppointment(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAppointment}
                  className="rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Crear Nueva Categoría */}
        {newCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="relative flex items-center justify-center border-b border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setNewCategoryModalOpen(false)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 text-orange-600">
                  <Settings className="h-5 w-5" />
                  <h3 className="text-base font-bold text-slate-900">Nueva Categoría</h3>
                </div>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Nombre de la Categoría *
                  </label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ej. Revisión Anual"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Color *
                  </label>
                  <select
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                    required
                  >
                    {PRESET_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 mb-2">Vista previa:</p>
                  <span
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                      newCatColor,
                    ].join(" ")}
                  >
                    {newCatName || "Nombre de categoría"}
                  </span>
                </div>

                {catError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {catError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewCategoryModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingCat}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-60"
                  >
                    {savingCat ? "Guardando..." : "Crear Categoría"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Detalle de Ticket Existente */}
        <TicketDetailModal
          open={!!viewTicketModal}
          onClose={() => setViewTicketModal(null)}
          ticket={viewTicketModal}
          editable={false}
        />

        {/* Modal de Creación de Ticket Nuevo */}
        <NewRepairTicketModal
          open={newTicketModalOpen}
          onClose={() => setNewTicketModalOpen(false)}
          onCreated={loadData}
        />
      </main>
    </>
  );
}
