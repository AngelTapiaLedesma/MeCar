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
  Wrench,
  ShieldCheck,
  Activity,
  Eye,
} from "lucide-react";
import Topbar from "../components/Topbar";
import TicketDetailModal from "../components/TicketDetailModal";
import NewRepairTicketModal from "../components/NewRepairTicketModal";
import { fetchAllReminders, createReminder } from "../api/reminders";
import { fetchHistory, updateTicket, createTicket } from "../api/history";
import { fetchVehicles } from "../api/vehicles";

const CATEGORY_COLORS = {
  Mantenimiento: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Reparación: "bg-orange-50 text-orange-600 border-orange-200",
  Verificación: "bg-blue-50 text-blue-600 border-blue-200",
  Diagnóstico: "bg-purple-50 text-purple-600 border-purple-200",
};

export default function Agenda() {
  const [periodo, setPeriodo] = useState("Esta semana");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");
  const [vista, setVista] = useState("tabla"); // 'tabla' | 'calendario'

  const [citas, setCitas] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modales
  const [bridgeModalData, setBridgeModalData] = useState(null); // { cita, activeTicket }
  const [viewTicketModal, setViewTicketModal] = useState(null); // ticket object
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [newAppointmentModalOpen, setNewAppointmentModalOpen] = useState(false);

  // Formulario para nueva cita
  const [newApptVehicleId, setNewApptVehicleId] = useState("");
  const [newApptType, setNewApptType] = useState("Mantenimiento");
  const [newApptDate, setNewApptDate] = useState(new Date().toISOString().slice(0, 10));
  const [savingAppt, setSavingAppt] = useState(false);
  const [apptError, setApptError] = useState(null);

  const categorias = ["Todos", "Mantenimiento", "Reparación", "Verificación", "Diagnóstico"];
  const periodos = ["Esta semana", "Próximos 15 días", "Este mes"];

  function loadData() {
    setLoading(true);
    setError(null);
    Promise.all([fetchAllReminders(), fetchHistory(), fetchVehicles()])
      .then(([remindersData, historyData, vehiclesData]) => {
        setCitas(remindersData);
        setTickets(historyData);
        setVehicles(vehiclesData);
      })
      .catch((err) => setError(err.message || "No se pudo cargar la agenda."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const citasFiltradas = citas.filter((c) => {
    if (categoriaFiltro !== "Todos" && c.name !== categoriaFiltro) {
      return false;
    }
    return true;
  });

  function handleGenerarTicket(cita) {
    // Buscar si existe un ticket "In Progress" para este vehículo (por placa o id)
    const activeTicket = tickets.find(
      (t) =>
        t.status === "In Progress" &&
        (t.plate.toLowerCase() === cita.placas.toLowerCase() ||
          t.vehicle.toLowerCase().includes(cita.vehiculo.toLowerCase()))
    );

    if (!activeTicket) {
      // No tiene ticket abierto -> Abrir modal para crear ticket nuevo
      setNewTicketModalOpen(true);
    } else {
      // Tiene ticket abierto -> Abrir Bridge Modal
      setBridgeModalData({
        cita,
        activeTicket,
      });
    }
  }

  async function handleAddToExistingTicket(cita, activeTicket) {
    try {
      // Agregar el servicio de la cita como un item al ticket existente
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
          Precio: 150.00, // Precio estimado por defecto
          Costo: 50.00,
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
    if (!newApptVehicleId || !newApptType || !newApptDate) {
      setApptError("Todos los campos son obligatorios.");
      return;
    }
    setApptError(null);
    setSavingAppt(true);
    try {
      await createReminder({
        vehicleId: newApptVehicleId,
        name: newApptType,
        startDate: newApptDate,
        recurring: false,
        notify: true,
      });
      setNewAppointmentModalOpen(false);
      setNewApptVehicleId("");
      loadData();
    } catch (err) {
      setApptError(err.message || "No se pudo programar la cita.");
    } finally {
      setSavingAppt(false);
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
              Gestión de citas programadas y vinculación con tickets activos en base de datos
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

            {/* Period selector */}
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

            {/* View Toggle */}
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
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaFiltro(cat)}
              className={[
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                categoriaFiltro === cat
                  ? "border-orange-500 bg-orange-50 text-orange-600"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
            Cargando agenda de servicios...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            {error} — verifica que el backend esté en ejecución.
          </div>
        ) : vista === "tabla" ? (
          /* Vista de Tabla Principal */
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
                            CATEGORY_COLORS[cita.name] || "bg-slate-50 text-slate-600 border-slate-200",
                          ].join(" ")}
                        >
                          {cita.name === "Mantenimiento" && <CheckCircle2 className="h-3 w-3" />}
                          {cita.name === "Reparación" && <Wrench className="h-3 w-3" />}
                          {cita.name === "Verificación" && <ShieldCheck className="h-3 w-3" />}
                          {cita.name === "Diagnóstico" && <Activity className="h-3 w-3" />}
                          {cita.name}
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
          /* Vista de Calendario Alternativa */
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
                        CATEGORY_COLORS[cita.name] || "bg-slate-50 text-slate-600 border-slate-200",
                      ].join(" ")}
                    >
                      {cita.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {cita.startDate}
                    </span>
                  </div>

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

        {/* Modal Intermedio (Bridge Modal) cuando ya existe ticket abierto */}
        {bridgeModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="text-base font-bold text-slate-900">Ticket en Progreso Detectado</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setBridgeModalData(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
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

        {/* Modal para Crear Nueva Cita / Recordatorio */}
        {newAppointmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-2 text-orange-600">
                  <CalendarIcon className="h-5 w-5" />
                  <h3 className="text-base font-bold text-slate-900">Programar Nueva Cita</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNewAppointmentModalOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
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
                    Categoría del Servicio *
                  </label>
                  <select
                    value={newApptType}
                    onChange={(e) => setNewApptType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                  >
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Reparación">Reparación</option>
                    <option value="Verificación">Verificación</option>
                    <option value="Diagnóstico">Diagnóstico</option>
                  </select>
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
