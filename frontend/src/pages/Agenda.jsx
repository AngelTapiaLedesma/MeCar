import { useState, useEffect } from "react";
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
  CheckCircle2,
  Eye,
  Settings,
} from "lucide-react";
import Topbar from "../components/Topbar";
import TicketDetailModal from "../components/TicketDetailModal";
import NewRepairTicketModal from "../components/NewRepairTicketModal";
import { fetchAllReminders, createReminder } from "../api/reminders";
import { fetchHistory, updateTicket } from "../api/history";
import { fetchVehicles } from "../api/vehicles";
import { fetchCategorias, createCategoria } from "../api/categorias";

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
  const [vista, setVista] = useState("tabla");

  const [citas, setCitas] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modales
  const [bridgeModalData, setBridgeModalData] = useState(null);
  const [viewTicketModal, setViewTicketModal] = useState(null);
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

  const periodos = ["Esta semana", "Próximos 15 días", "Este mes"];

  function loadData() {
    setLoading(true);
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
      .catch((err) => setError(err.message || "No se pudo cargar la agenda."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!bridgeModalData && !newAppointmentModalOpen && !newCategoryModalOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (bridgeModalData) setBridgeModalData(null);
        if (newAppointmentModalOpen) setNewAppointmentModalOpen(false);
        if (newCategoryModalOpen) setNewCategoryModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [bridgeModalData, newAppointmentModalOpen, newCategoryModalOpen]);

  const citasFiltradas = citas.filter((c) => {
    if (categoriaFiltro !== "Todos" && c.categoryName !== categoriaFiltro) {
      return false;
    }
    return true;
  });

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
        Tecnico: activeTicket.tech,
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
      loadData();
    } catch (err) {
      alert(err.message || "No se pudo actualizar el ticket.");
    }
  }

  async function handleCreateAppointment(e) {
    e.preventDefault();
    if (!newApptVehicleId || !newApptName.trim() || !newApptCategoryId) {
      setApptError("Todos los campos obligatorios deben completarse.");
      return;
    }

    setSavingAppt(true);
    setApptError(null);
    try {
      await createReminder({
        vehicleId: newApptVehicleId,
        name: newApptName.trim(),
        startDate: newApptDate,
        recurring: false,
        intervalDays: null,
        notify: true,
        categoryId: Number(newApptCategoryId),
      });
      setNewAppointmentModalOpen(false);
      setNewApptName("");
      setNewApptVehicleId("");
      loadData();
    } catch (err) {
      setApptError(err.message || "Error al crear la cita.");
    } finally {
      setSavingAppt(false);
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
              onClick={() => setNewAppointmentModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Nueva Cita
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
                    <th className="px-6 py-3 font-medium">Servicio</th>
                    <th className="px-6 py-3 font-medium">Vehículo</th>
                    <th className="px-6 py-3 font-medium">Cliente</th>
                    <th className="px-6 py-3 font-medium">Categoría</th>
                    <th className="px-6 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {citasFiltradas.map((cita) => (
                    <tr
                      key={cita.id}
                      className="border-t border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{cita.startDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {cita.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <Car className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-medium text-slate-900">{cita.vehiculo || "Vehículo"}</p>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                              {cita.placas}
                            </span>
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
                        <span
                          className={[
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                            cita.categoryColor || "bg-slate-50 text-slate-600 border-slate-200",
                          ].join(" ")}
                        >
                          {cita.categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleGenerarTicket(cita)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-orange-600 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" /> Generar Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                  {citasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
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

                  <div className="mt-3 text-sm font-bold text-slate-900">{cita.name}</div>

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

                <div className="mt-6 border-t border-slate-100 pt-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleGenerarTicket(cita)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-orange-600 transition-colors"
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
                  onClick={() => setNewAppointmentModalOpen(false)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 text-orange-600">
                  <CalendarIcon className="h-5 w-5" />
                  <h3 className="text-base font-bold text-slate-900">Programar Nueva Cita</h3>
                </div>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Vehículo *
                  </label>
                  <select
                    value={newApptVehicleId}
                    onChange={(e) => setNewApptVehicleId(e.target.value)}
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
                    onChange={(e) => setNewApptCategoryId(e.target.value)}
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
                </div>

                {apptError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {apptError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewAppointmentModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingAppt}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-60"
                  >
                    {savingAppt ? "Guardando..." : "Agendar Cita"}
                  </button>
                </div>
              </form>
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
