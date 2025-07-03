// Inicialización de variables
let usersData = [];
let tiposAtencion = [];
let areas = [];
let tickets = [];
let actividades = [];
let estadoMap = {};
let statusClassMap = {};
let statusMap = {};
let iconMap = {};
let currentPage = 1;
const rowsPerPage = 10;

// Elementos del DOM
const ticketsTableBody = document.getElementById("ticketsTableBody");
const statusFilter = document.getElementById("statusFilter");
const tipoAtencionFilter = document.getElementById("tipoAtencionFilter");
const searchInput = document.getElementById("searchInput");
const createTicketForm = document.getElementById("createTicketForm");
const saveTicketBtn = document.getElementById("saveTicketBtn");
const updateTicketBtn = document.getElementById("updateTicketBtn");
const total = tickets.length;
document.getElementById("totalCount").textContent = total;
const token =
  localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
const userMail =
  localStorage.getItem("userMail") || sessionStorage.getItem("userMail");
const userRole =
  localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
const userId =
  localStorage.getItem("userId") || sessionStorage.getItem("userId");
const userName =
  sessionStorage.getItem("userName") || localStorage.getItem("userName");

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar el panel de control (dashboard)
  setupEventListeners();
  // Traer estados de tickets
  loadStatus();
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll("[title]")
  );
  tooltipTriggerList.map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
  );
});

// Recargar los tickets
document.getElementById("refreshTicketsBtn").addEventListener("click", () => {
  window.location.reload();
});

// Configurar los listeners de eventos
function setupEventListeners() {
  // Filtros
  statusFilter.addEventListener("change", onFilterChange);
  tipoAtencionFilter.addEventListener("change", onFilterChange);
  searchInput.addEventListener("input", onFilterChange);
  document
    .getElementById("idSearchInput")
    .addEventListener("input", applyFilters);

  // Actualizar o cerrar ticket
  updateTicketBtn.addEventListener("click", () => {
    const estadoId = parseInt(
      document.getElementById("editTicketStatus").value,
      10
    );
    const estadoNombre = estadoMap[estadoId] || "";
    if (estadoNombre === "listo") {
      updateTicketCierre();
    } else {
      updateTicket();
    }
  });

  // Condicional de despacho
  document
    .getElementById("requiereDespachoSelect")
    .addEventListener("change", (e) => {
      const requiere = e.target.value === "Sí";
      toggleVisibility("detalleDespachoGroup", requiere);
    });

  document
    .getElementById("editTicketStatus")
    .addEventListener("change", (e) => {
      const selectedEstadoId = parseInt(e.target.value);
      handleEstadoChange(selectedEstadoId);
    });
  // Validación del formulario
  document
    .getElementById("editTicketStatus")
    .addEventListener("change", validateAdvanceForm);
  [
    "actividadSelect",
    "modalidadSelect",
    "requiereDespachoSelect",
    "detalleDespacho",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", validateAdvanceForm);
      el.addEventListener("change", validateAdvanceForm);
    }
  });
  document.getElementById("editTicketFile").addEventListener("change", () => {
    const fileInput = document.getElementById("editTicketFile");
    const removeBtn = document.getElementById("removeFileBtn");
    removeBtn.classList.toggle("d-none", !fileInput.files.length);
  });

  document.getElementById("removeFileBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("editTicketFile");
    fileInput.value = "";
    document.getElementById("removeFileBtn").classList.add("d-none");
  });
  document
    .querySelector("#editTicketModal .btn-close")
    .addEventListener("click", clearEditTicketForm);
  document
    .querySelector("#editTicketModal .btn-secondary")
    .addEventListener("click", clearEditTicketForm);

  // Crear ticket
  saveTicketBtn.addEventListener("click", createTicket);

  // Validación del formulario
  document
    .getElementById("ticketDescription")
    .addEventListener("input", validateForm);
  document
    .getElementById("ticketAssignee")
    .addEventListener("change", validateForm);
  document
    .getElementById("ticketCategory")
    .addEventListener("change", validateForm);
}

// Renderizar la tabla de tickets
function renderTickets(ticketsToRender = tickets) {
  ticketsTableBody.innerHTML = "";

  if (!Array.isArray(ticketsToRender) || ticketsToRender.length === 0) {
    ticketsTableBody.innerHTML = `
      <tr class="no-tickets-row">
        <td colspan="7" class="text-center text-muted py-4">
          <i class="bi bi-inbox display-4 d-block mb-2"></i>
          No se encontraron tickets
        </td>
      </tr>
    `;
    renderPagination(0);
    return;
  }

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedTickets = ticketsToRender.slice(start, end);

  paginatedTickets.forEach((ticket) => {
    const row = document.createElement("tr");
    row.className = "new-ticket";

    const statusClass = statusClassMap[ticket.status_id];
    const estadoNombre = estadoMap[ticket.status_id] || "";
    const avanzarBtn = ![
      "listo",
      "cancelado",
      "pendiente pa",
      "rechazado",
    ].includes(estadoNombre)
      ? `<button class="btn btn-outline-secondary btn-action" onclick="openAdvanceModal(${ticket.id})" title="Avanzar Ticket">
          <i class="bi bi-forward-fill text-success"></i>
        </button>`
      : "";

    row.innerHTML = `
      <td data-label="ID"><strong>#${ticket.id}</strong></td>
      <td data-label="Área Solicitante">
        <span class="fw-semibold">${ticket.title}</span>
      </td>
      <td data-label="Tipo de Atención"><small class="text-muted">${
        ticket.category
      }</small></td>
      <td data-label="Estado">
        <span class="badge status-${statusClass} badge-status">
          ${getStatusIcon(ticket.status_id)} ${getStatusText(ticket.status_id)}
        </span>
      </td>
      <td data-label="Asignado">
        ${
          ticket.assignee
            ? `<div class="d-flex align-items-center">
                <i class="bi bi-person-circle me-2"></i>
                ${ticket.assignee}
              </div>`
            : '<span class="text-muted">Sin asignar</span>'
        }
      </td>
      <td data-label="Fecha"><small>${formatDate(ticket.date)}</small></td>
      <td data-label="Acciones">
        <div class="btn-group" role="group">
          ${avanzarBtn}
          <button class="btn btn-outline-info btn-action" onclick="viewTicket(${
            ticket.id
          })" title="Ver detalles">
            <i class="bi bi-eye"></i>
          </button>
        </div>
      </td>
    `;

    ticketsTableBody.appendChild(row);
  });
  renderPagination(Math.ceil(ticketsToRender.length / rowsPerPage));
}

// Paginación
function renderPagination(totalPages) {
  const paginationContainer = document.getElementById("paginationContainer");
  if (!paginationContainer) return;
  paginationContainer.innerHTML = "";
  if (totalPages <= 1) return;
  const maxVisible = 3;
  const createButton = (text, page, disabled = false, active = false) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = `btn btn-sm mx-1`;
    if (disabled) {
      btn.classList.add("btn-outline-secondary", "disabled");
      btn.disabled = true;
    } else if (active) {
      btn.classList.add("btn-primary");
    } else {
      btn.classList.add("btn-outline-primary");
      btn.addEventListener("click", () => {
        currentPage = page;
        applyFilters();
      });
    }
    return btn;
  };

  paginationContainer.appendChild(
    createButton("«", currentPage - 1, currentPage === 1)
  );
  paginationContainer.appendChild(
    createButton("1", 1, false, currentPage === 1)
  );
  if (currentPage - maxVisible > 2) {
    paginationContainer.appendChild(createButton("...", null, true));
  }
  const start = Math.max(2, currentPage - maxVisible);
  const end = Math.min(totalPages - 1, currentPage + maxVisible);
  for (let i = start; i <= end; i++) {
    paginationContainer.appendChild(
      createButton(i, i, false, i === currentPage)
    );
  }
  if (currentPage + maxVisible < totalPages - 1) {
    paginationContainer.appendChild(createButton("...", null, true));
  }
  if (totalPages > 1) {
    paginationContainer.appendChild(
      createButton(totalPages, totalPages, false, currentPage === totalPages)
    );
  }
  paginationContainer.appendChild(
    createButton("»", currentPage + 1, currentPage === totalPages)
  );
}

// Avanzar ticket
function openAdvanceModal(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;
  const nombreEstado = estadoMap[ticket.status_id]?.toLowerCase() || "";
  document.getElementById("editTicketId").value = ticket.id;
  if (nombreEstado === "asignado") {
    document.getElementById("editTicketStatus").value = "";
  } else {
    document.getElementById("editTicketStatus").value = ticket.status_id;
  }
  document.getElementById("editTicketDescription").value = "";
  handleEstadoChange(document.getElementById("editTicketStatus").value);
  const modal = new bootstrap.Modal(document.getElementById("editTicketModal"));
  modal.show();
  validateAdvanceForm();
}

function handleEstadoChange(estadoId) {
  const estadoNombre = estadoMap[estadoId] || "";
  const isListo = estadoNombre === "listo";
  toggleVisibility("actividadGroup", isListo);
  toggleVisibility("modalidadGroup", isListo);
  toggleVisibility("requiereDespachoGroup", isListo);
  toggleVisibility("adjuntoGroup", isListo);
  if (isListo) loadActivities();
  toggleVisibility("detalleDespachoGroup", false);
}

function toggleVisibility(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("d-none", !show);
}

// Limpiar formulario de avanzar ticket
function clearEditTicketForm() {
  document.getElementById("editTicketForm").reset();
  toggleVisibility("actividadGroup", false);
  toggleVisibility("modalidadGroup", false);
  toggleVisibility("requiereDespachoGroup", false);
  toggleVisibility("detalleDespachoGroup", false);
  toggleVisibility("adjuntoGroup", false);
  const fileInput = document.getElementById("editTicketFile");
  if (fileInput) fileInput.value = "";
  const removeFileBtn = document.getElementById("removeFileBtn");
  if (removeFileBtn) removeFileBtn.classList.add("d-none");
}

// Actualizar estadísticas
function updateStats() {
  const asignado = tickets.filter((t) => t.status_id === 2).length;
  const pendienteAutorizar = tickets.filter((t) => t.status_id === 1).length;
  const enEjecucion = tickets.filter((t) => t.status_id === 3).length;
  const pendientePresupuesto = tickets.filter((t) => t.status_id === 4).length;
  const rechazado = tickets.filter((t) => t.status_id === 9).length;
  const cancelado = tickets.filter((t) => t.status_id === 5).length;
  const listo = tickets.filter((t) => t.status_id === 6).length;
  const total = tickets.length;

  document.getElementById("asignadoCount").textContent = asignado;
  document.getElementById("pendienteAutorizarCount").textContent =
    pendienteAutorizar;
  document.getElementById("ejecucionCount").textContent = enEjecucion;
  document.getElementById("pendienteCount").textContent = pendientePresupuesto;
  document.getElementById("rechazadoCount").textContent = rechazado;
  document.getElementById("canceladoCount").textContent = cancelado;
  document.getElementById("listoCount").textContent = listo;
  document.getElementById("totalCount").textContent = total;
}

// Filtrar tickets
function onFilterChange() {
  currentPage = 1;
  applyFilters();
}

function applyFilters() {
  const statusValue = statusFilter.value;
  const tipoAtencionValue = tipoAtencionFilter.value;
  const searchValue = searchInput.value.toLowerCase();
  const idSearchValue = document.getElementById("idSearchInput").value.trim();

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = !statusValue || ticket.status_id == statusValue;
    const matchesTipoAtencion =
      !tipoAtencionValue || ticket.category === tipoAtencionValue;
    const matchesSearch =
      !searchValue ||
      ticket.title.toLowerCase().includes(searchValue) ||
      ticket.description.toLowerCase().includes(searchValue) ||
      ticket.assignee.toLowerCase().includes(searchValue);
    const matchesId =
      !idSearchValue || String(ticket.id).includes(idSearchValue);

    return matchesStatus && matchesTipoAtencion && matchesSearch && matchesId;
  });

  renderTickets(filteredTickets);
}

// Crear nuevo ticket
async function createTicket() {
  const saveBtn = document.getElementById("saveTicketBtn");
  const btnSpinner = document.getElementById("btnSpinner");
  const btnIcon = document.getElementById("btnIcon");
  const btnText = document.getElementById("btnText");

  btnSpinner.classList.remove("d-none");
  btnIcon.classList.add("d-none");
  btnText.textContent = "Creando...";
  saveBtn.disabled = true;

  const areaSolicitante = parseInt(
    document.getElementById("ticketAssignee").value,
    10
  );
  const tipoAtencion = parseInt(
    document.getElementById("ticketCategory").value,
    10
  );
  const description = document.getElementById("ticketDescription").value.trim();
  const attachmentInput = document.getElementById("ticketAttachment");

  if (!description || !tipoAtencion || !areaSolicitante) {
    showAlert("Por favor, completa todos los campos obligatorios.", "warning");
    btnSpinner.classList.add("d-none");
    btnIcon.classList.remove("d-none");
    btnText.textContent = "Crear Ticket";
    saveBtn.disabled = false;
    return;
  }

  const solicitante = usersData.find((u) => u.email === userMail);
  if (!solicitante) {
    showAlert(
      "No se encontró el usuario logueado en los datos de usuarios.",
      "error"
    );
    btnSpinner.classList.add("d-none");
    btnIcon.classList.remove("d-none");
    btnText.textContent = "Crear Ticket";
    saveBtn.disabled = false;
    return;
  }

  const formData = new FormData();
  formData.append("solicitante_id", solicitante.id);
  formData.append("area_id", tipoAtencion);
  formData.append("tipo_atencion_id", areaSolicitante);
  formData.append("observaciones", description);

  if (attachmentInput.files.length > 0) {
    const file = attachmentInput.files[0];

    if (file.size > 10 * 1024 * 1024) {
      showAlert("El archivo adjunto no debe superar los 10MB", "warning");
      btnSpinner.classList.add("d-none");
      btnIcon.classList.remove("d-none");
      btnText.textContent = "Crear Ticket";
      saveBtn.disabled = false;
      return;
    }

    if (file.type !== "application/pdf") {
      showAlert("Solo se permiten archivos en formato PDF", "warning");
      btnSpinner.classList.add("d-none");
      btnIcon.classList.remove("d-none");
      btnText.textContent = "Crear Ticket";
      saveBtn.disabled = false;
      return;
    }

    formData.append("archivo_pdf", file);
  }

  // console.log para debug
  // for (const [key, value] of formData.entries()) {
  //   console.log(`${key}:`, value);
  // }

  try {
    const response = await fetch(
      "https://tickets.dev-wit.com/api/tickets/crear",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Detalle del error:", errorData);
      const message = errorData.message || "Error al crear el ticket";
      throw new Error(message);
    }

    // Recargar tabla de tickets
    getUserIdWhenReady((userId) => loadTickets(userId));

    createTicketForm.reset();
    const modalElement = document.getElementById("createTicketModal");
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();

    showAlert("Ticket creado exitosamente!", "success");
  } catch (error) {
    console.error("Error al crear ticket:", error);
    showAlert("No se pudo crear el ticket. " + error.message, "error");
  } finally {
    btnSpinner.classList.add("d-none");
    btnIcon.classList.remove("d-none");
    btnText.textContent = "Crear Ticket";
    saveBtn.disabled = false;
  }
}

// Actualizar ticket
async function updateTicket() {
  updateTicketBtn.disabled = true;
  const originalText = updateTicketBtn.innerHTML;
  updateTicketBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Actualizando...`;

  const id = Number.parseInt(document.getElementById("editTicketId").value);
  const nuevoEstado = parseInt(
    document.getElementById("editTicketStatus").value,
    10
  );
  const observacion = document.getElementById("editTicketDescription").value;

  const payload = {
    id_nuevo_estado: nuevoEstado,
    observacion,
    usuario_id: parseInt(userId, 10),
  };

  // console.log("Payload enviado:", {
  //   id_nuevo_estado: nuevoEstado,
  //   observacion,
  //   usuario_id: parseInt(userId, 10),
  // });

  try {
    const response = await fetch(
      `https://tickets.dev-wit.com/api/tickets/estado/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al actualizar el ticket");
    }

    getUserIdWhenReady((userId) => loadTickets(userId));

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("editTicketModal")
    );
    modal.hide();

    showAlert("Ticket actualizado exitosamente!", "success");
  } catch (error) {
    console.error("Error actualizando ticket:", error);
    showAlert("No se pudo actualizar el ticket. " + error.message, "error");
  } finally {
    updateTicketBtn.disabled = false;
    updateTicketBtn.innerHTML = originalText;
  }
}

// Actualizar y cerrar ticket
async function updateTicketCierre() {
  updateTicketBtn.disabled = true;
  const originalText = updateTicketBtn.innerHTML;
  updateTicketBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...`;

  const id = parseInt(document.getElementById("editTicketId").value, 10);
  const actividadId = parseInt(
    document.getElementById("actividadSelect").value,
    10
  );
  const detalleSolucion = document
    .getElementById("editTicketDescription")
    .value.trim();
  const tipoAtencion = document.getElementById("modalidadSelect").value;

  const necesitaDespachoRaw = document
    .getElementById("requiereDespachoSelect")
    .value.toLowerCase();

  const necesitaDespacho =
    necesitaDespachoRaw === "sí" ? "si" : necesitaDespachoRaw;

  const detallesDespacho =
    necesitaDespachoRaw === "sí"
      ? document.getElementById("detalleDespacho").value.trim()
      : "";

  const archivoInput = document.getElementById("editTicketFile");
  const archivo = archivoInput.files[0];

  const formData = new FormData();
  formData.append("id_actividad", actividadId);
  formData.append("detalle_solucion", detalleSolucion);
  formData.append("tipo_atencion", tipoAtencion);
  formData.append("necesita_despacho", necesitaDespacho);
  formData.append("detalles_despacho", detallesDespacho);
  formData.append("usuario_id", parseInt(userId, 10));

  if (archivo) {
    formData.append("archivo_solucion", archivo);
  }

  // console.log("payload cerrar ticket:", Object.fromEntries(formData.entries()));

  try {
    const response = await fetch(
      `https://tickets.dev-wit.com/api/tickets/${id}/cerrar`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al cerrar el ticket");
    }

    getUserIdWhenReady((userId) => loadTickets(userId));

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("editTicketModal")
    );
    modal.hide();

    showAlert("Ticket cerrado exitosamente!", "success");
  } catch (error) {
    console.error("Error al cerrar ticket:", error);
    showAlert("No se pudo cerrar el ticket. " + error.message, "error");
  } finally {
    updateTicketBtn.disabled = false;
    updateTicketBtn.innerHTML = originalText;
  }
}

// Validar formulario
function validateAdvanceForm() {
  const estadoSelect = document.getElementById("editTicketStatus");
  const updateBtn = document.getElementById("updateTicketBtn");
  const estadoSeleccionado = parseInt(estadoSelect.value, 10);
  const nombreEstado = estadoMap[estadoSeleccionado] || "";
  let esValido = false;
  if (
    nombreEstado === "en ejecución" ||
    nombreEstado === "pendiente pp" ||
    nombreEstado === "cancelado"
  ) {
    esValido = true;
  } else if (nombreEstado === "listo") {
    const actividad = document.getElementById("actividadSelect").value;
    const modalidad = document.getElementById("modalidadSelect").value;
    const requiereDespacho = document.getElementById(
      "requiereDespachoSelect"
    ).value;
    const detalleDespacho = document
      .getElementById("detalleDespacho")
      .value.trim();
    const requiere = requiereDespacho === "Sí";
    const detalleValido = !requiere || (requiere && detalleDespacho.length > 0);
    esValido = actividad && modalidad && requiereDespacho && detalleValido;
  }
  updateBtn.disabled = !esValido;
}

function formatFinalCard(ticket) {
  if (ticket.status_id !== 6) return "";

  const fechaFinal = luxon.DateTime.fromISO(
    ticket.historial?.at(-1)?.fecha || ticket.fecha_creacion,
    { zone: "America/Santiago" }
  )
    .setLocale("es")
    .toFormat("dd/MM/yyyy HH:mm");

  const archivoUrl = ticket.archivo_solucion
    ? `https://tickets.dev-wit.com/uploads/${ticket.archivo_solucion}`
    : null;

  const detallesDespachoHtml = ticket.detalles_despacho?.trim()
    ? `<p><strong>Detalles del Despacho:</strong> ${ticket.detalles_despacho}</p>`
    : "";

  const huboDespacho =
    ticket.necesita_despacho?.toLowerCase() === "si" ||
    ticket.necesita_despacho?.toLowerCase() === "sí";
  const textoDespacho = huboDespacho ? "Sí" : "No";

  const yaEvaluado =
    ticket.aprobacion_solucion === "si" || ticket.aprobacion_solucion === "no";
  const esAprobado = ticket.aprobacion_solucion === "si";
  const esDesaprobado = ticket.aprobacion_solucion === "no";

  const puedeEvaluar =
    userId && String(ticket?.id_solicitante) === String(userId);

  let accionesHtml = "";
  if (!yaEvaluado && puedeEvaluar) {
    accionesHtml = `
      <div class="mt-3 d-flex gap-2">
        <button id="btn-aprobar-${ticket.id}" class="btn btn-primary btn-sm" onclick="aprobarTicket('${ticket.id}')">
          ✅ Aprobado
        </button>
        <button id="btn-desaprobar-${ticket.id}" class="btn btn-outline-danger btn-sm" onclick="mostrarCampoDesaprobado('${ticket.id}')">
          Desaprobado
        </button>
      </div>
      <div class="mt-2" id="desaprobado-section-${ticket.id}" style="display: none;">
        <textarea id="desaprobado-textarea-${ticket.id}" class="form-control mt-2" rows="3" placeholder="Describe el motivo de desaprobación..."></textarea>
        <button class="btn btn-danger btn-sm mt-2" onclick="desaprobarTicket(event, '${ticket.id}')">
          Confirmar Desaprobación
        </button>
      </div>
    `;
  }

  const observacionHtml =
    esDesaprobado && ticket.solucion_observacion
      ? `<p><strong>Motivo de Desaprobación:</strong> ${ticket.solucion_observacion}</p>`
      : "";

  return `
    <div id="ticket-card-${
      ticket.id
    }" class="ticket-history-entry final-card border ${
    esDesaprobado ? "border-danger" : "border-success"
  } p-3 rounded mt-4 bg-light shadow">
      <h5 class="fw-bold ${
        esDesaprobado ? "text-danger" : "text-success"
      } mb-3">
        ${
          esDesaprobado
            ? "❌ Ticket Desaprobado"
            : esAprobado
            ? "✅ Ticket Aprobado"
            : "Ticket Cerrado"
        }
      </h5>
      <p><strong>Fecha y Hora de Cierre:</strong> ${fechaFinal}</p>
      <p><strong>Modalidad de Atención:</strong> ${
        capitalize(ticket.tipo_atencion_cierre) || "-"
      }</p>
      <p><strong>Tipo de Actividad:</strong> ${getActividadNombreById(
        ticket.id_actividad
      )}</p>
      <p><strong>Detalle de Solución:</strong> ${ticket.detalle_solucion}</p>
      <p><strong>¿Requirió despacho?:</strong> ${textoDespacho}</p>
      ${detallesDespachoHtml}
      ${observacionHtml}
      ${
        archivoUrl
          ? `<div class="mt-2"><a class="btn btn-outline-success btn-sm" href="${archivoUrl}" target="_blank" rel="noopener">
              <i class="bi bi-file-earmark-pdf"></i> Ver archivo
            </a></div>`
          : ""
      }
      ${accionesHtml}
      ${
        esDesaprobado
          ? `<div class="mt-3 small fw-semibold fst-italic">Por favor genere un nuevo ticket con el problema.</div>`
          : ""
      }
    </div>
  `;
}

function formatHistorial(historial, ticket = {}) {
  if (!Array.isArray(historial) || historial.length === 0) {
    return "<p class='text-muted'><em>Sin historial disponible</em></p>";
  }
  const entriesHtml = historial
    .map((h) => {
      const fecha = luxon.DateTime.fromISO(h.fecha, {
        zone: "America/Santiago",
      })
        .setLocale("es")
        .toFormat("dd/MM/yyyy HH:mm");
      const iconAnterior = getStatusIcon(h.estado_anterior);
      const iconNuevo = getStatusIcon(h.nuevo_estado);
      const textoAnterior = getStatusText(h.estado_anterior);
      const textoNuevo = getStatusText(h.nuevo_estado);
      return `
        <div class="ticket-history-entry">
          <time>🕒 ${fecha}</time>
          <div class="user">👤 ${h.usuario_cambio}</div>
          <div class="change">
            🔄 ${iconAnterior} ${textoAnterior} → ${iconNuevo} <strong>${textoNuevo}</strong>
          </div>
          <div class="note">📝 ${h.observacion}</div>
        </div>
      `;
    })
    .join("");
  const finalCard = ticket.status_id === 6 ? formatFinalCard(ticket) : "";
  return entriesHtml + finalCard;
}

// Ver detalles del ticket
function viewTicket(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return showAlert("Ticket no encontrado", "warning");
  const historialHtml = formatHistorial(ticket.historial, ticket);
  const historialSection = historialHtml.includes("Sin historial disponible")
    ? ""
    : `
      <hr>
      <h5 class="mt-4 mb-3 fw-bold">Historial del Ticket</h5>
      ${historialHtml}
    `;
  const archivoUrl = `https://tickets.dev-wit.com/uploads/${ticket.archivo_pdf}`;
  const details = `
    <p><strong>ID:</strong> #${ticket.id}</p>
    <p><strong>Área:</strong> ${ticket.title}</p>
    <p><strong>Estado:</strong> ${getStatusIcon(
      ticket.status_id
    )} ${getStatusText(ticket.status_id)}</p>
    <p><strong>Solicitado por:</strong> <i class="bi bi-person-circle me-2"></i>${
      ticket.assignee || ticket.ejecutor || "Sin asignar"
    }</p>
    <p><strong>Tipo de Atención:</strong> ${
      ticket.category || ticket.tipo_atencion
    }</p>
    <p><strong>Fecha:</strong> ${formatDate(
      ticket.date || ticket.fecha_creacion
    )}</p>
    <p><strong>Descripción:</strong> ${
      ticket.description || ticket.observaciones
    }</p>
    ${
      ticket.archivo_pdf
        ? `
        <p><strong>Archivo Adjunto:</strong></p>
        <div style="margin-bottom: 1rem;">
          <a href="${archivoUrl}" target="_blank" rel="noopener noreferrer" class="btn-pdf">
            <i class="bi bi-file-earmark-pdf" style="margin-right: 0.4rem;"></i> Ver PDF
          </a>
        </div>`
        : ""
    }
    ${historialSection}
  `;
  document.getElementById("ticketModalBody").innerHTML = details;
  const modal = new bootstrap.Modal(document.getElementById("ticketModal"));
  modal.show();
  // console.log("DEBUG ticket:", ticket);
}

async function aprobarTicket(ticketId) {
  const btnAprobar = document.getElementById(`btn-aprobar-${ticketId}`);
  const btnDesaprobar = document.getElementById(`btn-desaprobar-${ticketId}`);
  const originalHTML = btnAprobar?.innerHTML;
  if (btnAprobar) {
    btnAprobar.disabled = true;
    btnAprobar.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Aprobando...`;
  }
  if (btnDesaprobar) {
    btnDesaprobar.disabled = true;
  }
  try {
    const response = await fetch(
      `https://tickets.dev-wit.com/api/tickets/aprobar-solucion/${ticketId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aprobacion_solucion: "si",
          solucion_observacion: "",
        }),
      }
    );
    if (!response.ok) throw new Error("Error al aprobar el ticket");
    getUserIdWhenReady((userId) => loadTickets(userId));
    showAlert("Ticket aprobado correctamente!", "success");
    ocultarAccionesFinales(ticketId, true);
  } catch (error) {
    console.error("Error al aprobar:", error);
    showAlert("Hubo un problema al aprobar el ticket.", "error");
  } finally {
    if (btnAprobar) {
      btnAprobar.disabled = false;
      btnAprobar.innerHTML = originalHTML;
    }
    if (btnDesaprobar) {
      btnDesaprobar.disabled = false;
    }
  }
}

function mostrarCampoDesaprobado(ticketId) {
  const section = document.getElementById(`desaprobado-section-${ticketId}`);
  if (section) section.style.display = "block";
}

async function desaprobarTicket(event, ticketId) {
  const textarea = document.getElementById(`desaprobado-textarea-${ticketId}`);
  const descripcion = textarea?.value.trim();
  if (!descripcion) {
    showAlert("Por favor ingresa una descripción para desaprobar.", "warning");
    return;
  }
  const btnDesaprobar = event.target;
  const btnAprobar = document.getElementById(`btn-aprobar-${ticketId}`);
  const originalHTML = btnDesaprobar.innerHTML;
  btnDesaprobar.disabled = true;
  btnDesaprobar.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Confirmando...`;
  if (btnAprobar) {
    btnAprobar.disabled = true;
  }
  try {
    const response = await fetch(
      `https://tickets.dev-wit.com/api/tickets/aprobar-solucion/${ticketId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aprobacion_solucion: "no",
          solucion_observacion: descripcion,
        }),
      }
    );
    if (!response.ok) throw new Error("Error al desaprobar el ticket");
    getUserIdWhenReady((userId) => loadTickets(userId));
    ocultarAccionesFinales(ticketId, false);
    mostrarMensajeDesaprobacion(ticketId);
  } catch (error) {
    console.error("Error al desaprobar:", error);
    showAlert("Hubo un problema al desaprobar el ticket.", "error");
  } finally {
    btnDesaprobar.disabled = false;
    btnDesaprobar.innerHTML = originalHTML;
    if (btnAprobar) {
      btnAprobar.disabled = false;
    }
  }
}

function mostrarMensajeDesaprobacion(ticketId) {
  const card = document.getElementById(`ticket-card-${ticketId}`);
  if (!card) return;
  const mensaje = document.createElement("div");
  mensaje.className = "mt-3 small fw-semibold fst-italic";
  mensaje.textContent = "Por favor genere un nuevo ticket con el problema.";
  card.appendChild(mensaje);
}

function ocultarAccionesFinales(ticketId, aprobado) {
  const btnAprobar = document.getElementById(`btn-aprobar-${ticketId}`);
  const btnDesaprobar = document.getElementById(`btn-desaprobar-${ticketId}`);
  const seccionDesaprobado = document.getElementById(
    `desaprobado-section-${ticketId}`
  );
  if (btnAprobar) btnAprobar.style.display = "none";
  if (btnDesaprobar) btnDesaprobar.style.display = "none";
  if (seccionDesaprobado) seccionDesaprobado.style.display = "none";
  const card = document.getElementById(`ticket-card-${ticketId}`);
  if (card) {
    const title = card.querySelector("h5");
    if (title && title.textContent.includes("Ticket")) {
      title.textContent = aprobado
        ? "✅ Ticket Aprobado"
        : "❌ Ticket Desaprobado";
      title.classList.remove("text-success", "text-danger");
      title.classList.add(aprobado ? "text-success" : "text-danger");
    }
  }
}

// Validar formulario crear ticket
function validateForm() {
  const description = document.getElementById("ticketDescription").value.trim();
  const tipoAtencion = document.getElementById("ticketAssignee").value;
  const areaSolicitante = document.getElementById("ticketCategory").value;

  const isValid = description && tipoAtencion && areaSolicitante;
  saveTicketBtn.disabled = !isValid;
}

// Funciones auxiliares / utilitarias
const customIcons = {
  1: '<i class="bi bi-shield-check"></i>',
  2: '<i class="bi bi-person-check"></i>',
  3: '<i class="bi bi-play-circle"></i>',
  4: '<i class="bi bi-clock"></i>',
  5: '<i class="bi bi-x-circle"></i>',
  6: '<i class="bi bi-check-circle"></i>',
  9: '<i class="bi bi-slash-circle"></i>',
};

const customClasses = {
  1: "pendiente-por-autorizar",
  2: "asignado",
  3: "en-ejecucion",
  4: "pendiente-por-presupuesto",
  5: "cancelado",
  6: "listo",
  9: "rechazado",
};

function getStatusText(statusId) {
  return statusMap[statusId] || "Desconocido";
}

function getStatusIcon(statusId) {
  return iconMap[statusId] || "";
}

function getActividadNombreById(id) {
  const actividad = actividades.find((a) => Number(a.id) === Number(id));
  return actividad ? actividad.nombre : id;
}

function formatDate(dateString) {
  return luxon.DateTime.fromISO(dateString, { zone: "America/Santiago" })
    .setLocale("es")
    .toFormat("d LLL yyyy");
}

// Alertas
function showAlert(message, type = "info") {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: type, // puede ser "success", "error", "warning", "info", "question"
    title: message,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
}

// Terminar la sesión
function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/index.html";
}

// Mostrar nombre de usuario logueado
const userDisplay = document.getElementById("userNameDisplay");
if (userName && userDisplay) {
  userDisplay.textContent = "¡Bienvenido(a) " + userName + "!";
}

// Llamadas API (areas y tipos)
const categorySelect = document.getElementById("ticketCategory");

fetch("https://tickets.dev-wit.com/api/areas", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    if (!response.ok) {
      throw new Error("Error al obtener áreas");
    }
    return response.json();
  })
  .then((data) => {
    areas = data;
    categorySelect.innerHTML =
      '<option value="">Seleccionar categoría</option>';

    data.forEach((area) => {
      const option = document.createElement("option");
      option.value = area.id;
      option.textContent = area.nombre;
      categorySelect.appendChild(option);
    });
    // console.log("tiposAreas", areas);
  })
  .catch((error) => {
    console.error("Error cargando áreas:", error);
  });

const tipoSelect = document.getElementById("ticketAssignee");
const tipoAtencionFilterSelect = document.getElementById("tipoAtencionFilter");

fetch("https://tickets.dev-wit.com/api/tipos", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    if (!response.ok) {
      throw new Error("Error al obtener tipos de atención");
    }
    return response.json();
  })
  .then((data) => {
    tiposAtencion = data;
    // console.log("tipos de atención:", tiposAtencion)
    tipoSelect.innerHTML = '<option value="">Sin asignar</option>';
    tipoAtencionFilterSelect.innerHTML =
      '<option value="">Todos los tipos de atención</option>';

    const categorias = {};
    data.forEach((tipo) => {
      if (!categorias[tipo.categoria]) {
        categorias[tipo.categoria] = [];
      }
      categorias[tipo.categoria].push(tipo);
    });

    for (const categoria in categorias) {
      const optgroup1 = document.createElement("optgroup");
      optgroup1.label = categoria;

      const optgroup2 = document.createElement("optgroup");
      optgroup2.label = categoria;

      categorias[categoria].forEach((tipo) => {
        const option1 = document.createElement("option");
        option1.value = tipo.id;
        option1.textContent = tipo.nombre;
        optgroup1.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = tipo.nombre;
        option2.textContent = tipo.nombre;
        optgroup2.appendChild(option2);
      });
      tipoSelect.appendChild(optgroup1);
      tipoAtencionFilterSelect.appendChild(optgroup2);
    }
  })
  .catch((error) => {
    console.error("Error cargando tipos de atención:", error);
  });

(async function getUsers() {
  try {
    const response = await fetch("https://tickets.dev-wit.com/api/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    usersData = data;
    // console.log("usersData", usersData);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
  }
})();

// Esperar usersData para asignar id de usuario conectado
function getUserIdWhenReady(callback) {
  const interval = setInterval(() => {
    if (Array.isArray(usersData) && usersData.length > 0) {
      const user = usersData.find((u) => u.email === userMail);
      if (user) {
        clearInterval(interval);
        callback(user.id);
      } else {
        showAlert("No se encontró el usuario en la lista de datos.", "error");
        clearInterval(interval);
      }
    }
  }, 100);
}

// Llamada tickets con la id del usuario
getUserIdWhenReady((userId) => {
  const endpoint = `https://tickets.dev-wit.com/api/tickets/ejecutor/${userId}`;
  fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      // console.log("tickets", data);
      tickets = data.map((t) => {
        let ultimoEstado = t.id_estado;
        let fechaTicket = t.fecha_creacion;
        if (Array.isArray(t.historial) && t.historial.length > 0) {
          const ultimoCambio = t.historial[t.historial.length - 1];
          if (ultimoCambio && ultimoCambio.id_nuevo_estado) {
            ultimoEstado = ultimoCambio.id_nuevo_estado;
          }
          if (ultimoCambio && ultimoCambio.fecha) {
            fechaTicket = ultimoCambio.fecha;
          }
        }
        return {
          id: t.id,
          title: t.area,
          status_id: ultimoEstado,
          assignee: t.solicitante,
          id_solicitante: t.id_solicitante,
          category: t.tipo_atencion,
          description: t.observaciones,
          date: luxon.DateTime.fromISO(fechaTicket)
            .setZone("America/Santiago")
            .toFormat("yyyy-MM-dd"),
          historial: t.historial || [],
          archivo_pdf: t.archivo_pdf || null,
          detalle_solucion: t.detalle_solucion || "",
          tipo_atencion_cierre: t.modo_atencion || "",
          necesita_despacho: t.necesita_despacho || "",
          detalles_despacho: t.detalles_despacho || "",
          archivo_solucion: t.archivo_solucion || "",
          id_actividad: t.id_actividad || null,
          aprobacion_solucion: t.aprobacion_solucion,
          solucion_observacion: t.solucion_observacion,
        };
      });
      renderTickets(tickets);
      updateStats();
    })
    .catch((err) => {
      console.error("Error cargando tickets:", err);
      showAlert("No se pudieron cargar los tickets.", "warning");
    });
});

// Llamada para recargar tabla de tickets
async function loadTickets(userId) {
  const endpoint = `https://tickets.dev-wit.com/api/tickets/ejecutor/${userId}`;
  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    tickets = data.map((t) => ({
      id: t.id,
      title: t.area,
      status_id: t.id_estado,
      assignee: t.solicitante,
      id_solicitante: t.id_solicitante,
      category: t.tipo_atencion,
      description: t.observaciones,
      date: luxon.DateTime.fromISO(t.fecha_creacion)
        .setZone("America/Santiago")
        .toFormat("yyyy-MM-dd"),
      historial: t.historial || [],
      archivo_pdf: t.archivo_pdf || null,
      detalle_solucion: t.detalle_solucion || "",
      tipo_atencion_cierre: t.modo_atencion || "",
      necesita_despacho: t.necesita_despacho || "",
      detalles_despacho: t.detalles_despacho || "",
      archivo_solucion: t.archivo_solucion || "",
      id_actividad: t.id_actividad || null,
      aprobacion_solucion: t.aprobacion_solucion,
      solucion_observacion: t.solucion_observacion,
    }));
    renderTickets(tickets);
    updateStats();
  } catch (err) {
    console.error("Error recargando tickets:", err);
    showAlert("No se pudieron recargar los tickets.", "warning");
  }
}

async function loadStatus() {
  try {
    const res = await fetch("https://tickets.dev-wit.com/api/estados", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    const estados = await res.json();
    // console.log("estados:", estados);
    estados.forEach((estado) => {
      estadoMap[estado.id] = estado.nombre.toLowerCase();
      statusMap[estado.id] = capitalize(estado.nombre);
      statusClassMap[estado.id] = customClasses[estado.id] || "sin-clase";
      iconMap[estado.id] = customIcons[estado.id] || "";
    });
    populateStatusFilter(estados);
  } catch (error) {
    console.error("Error cargando estados:", error.message);
  }
}

function capitalize(texto) {
  return texto
    .split(" ")
    .map((w) =>
      w === w.toUpperCase()
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join(" ");
}

async function loadActivities() {
  try {
    const res = await fetch("https://tickets.dev-wit.com/api/actividades", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    actividades = await res.json();
    const actividadSelect = document.getElementById("actividadSelect");
    actividadSelect.innerHTML =
      '<option value="">Seleccione una actividad</option>';
    actividades.forEach((actividad) => {
      const option = document.createElement("option");
      option.value = actividad.id;
      option.textContent = actividad.nombre;
      actividadSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Error al cargar actividades:", err);
  }
}

async function init() {
  await loadActivities();
  getUserIdWhenReady((userId) => loadTickets(userId));
}
init();

function populateStatusFilter(estados) {
  const select = document.getElementById("statusFilter");
  const selectEdit = document.getElementById("editTicketStatus");
  select.innerHTML = '<option value="">Todos los estados</option>';
  selectEdit.innerHTML = '<option value="">Seleccione un estado</option>';
  estados.forEach((estado) => {
    const nombreCapitalizado = capitalize(estado.nombre);
    const option1 = document.createElement("option");
    option1.value = estado.id;
    option1.textContent = nombreCapitalizado;
    select.appendChild(option1);
    const nombreLower = estado.nombre.toLowerCase();
    if (
      nombreLower !== "pendiente pa" &&
      nombreLower !== "rechazado" &&
      nombreLower !== "asignado"
    ) {
      const option2 = document.createElement("option");
      option2.value = estado.id;
      option2.textContent = nombreCapitalizado;
      selectEdit.appendChild(option2);
    }
  });
}
