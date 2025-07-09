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
const saveEditButton = document.getElementById("updateNewTicketBtn");
const total = tickets.length;
document.getElementById("totalCount").textContent = total;
const token =
  localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
const userMail =
  localStorage.getItem("userMail") || sessionStorage.getItem("userMail");
const userName =
  sessionStorage.getItem("userName") || localStorage.getItem("userName");
const userRole =
  sessionStorage.getItem("userRole") || localStorage.getItem("userRole");
const userId =
  sessionStorage.getItem("userId") || localStorage.getItem("userId");

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar el panel de control (dashboard)
  setupEventListeners();

  // Traer estados de tickets
  fetchEstados();

  // Inicializar tooltips
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll("[title]")
  );
  tooltipTriggerList.map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
  );

  // Manejo de archivo adjunto
  const attachmentInput = document.getElementById("ticketAttachment");
  const clearAttachmentBtn = document.getElementById("clearAttachmentBtn");
  clearAttachmentBtn.addEventListener("click", () => {
    attachmentInput.value = "";
  });

  // Iniciar carga de tickets
  initTicketLoading();
});

// Recargar los tickets
document.getElementById("refreshTicketsBtn").addEventListener("click", () => {
  getUserIdWhenReady((userId) => {
    renderTickets(null);
    loadTickets(userId);
  });
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

  // Crear ticket
  saveTicketBtn.addEventListener("click", createTicket);

  // Validación formularios
  document
    .getElementById("ticketDescription")
    .addEventListener("input", validateForm);
  document
    .getElementById("ticketAssignee")
    .addEventListener("change", validateForm);
  document
    .getElementById("ticketCategory")
    .addEventListener("change", validateForm);
  document
    .getElementById("editNewTicketDescription")
    .addEventListener("input", validateEditNewForm);
  document
    .getElementById("editNewTicketAssignee")
    .addEventListener("change", validateEditNewForm);
  document
    .getElementById("editNewTicketCategory")
    .addEventListener("change", validateEditNewForm);

  // Editar el nuevo ticket en estado pendiente pa
  document
    .getElementById("updateNewTicketBtn")
    .addEventListener("click", updateEditTicket);
}

// Renderizar la tabla de tickets
function renderTickets(ticketsToRender = tickets) {
  const loadingSpinner = document.getElementById("loadingSpinner");
  const noTicketsRow = `
    <tr class="no-tickets-row">
      <td colspan="7" class="text-center text-muted py-4">
        <i class="bi bi-inbox display-4 d-block mb-2"></i>
        No se encontraron tickets
      </td>
    </tr>
  `;
  if (loadingSpinner) {
    loadingSpinner.style.display = ticketsToRender === null ? "block" : "none";
  }
  ticketsTableBody.innerHTML = "";
  if (ticketsToRender === null) {
    return;
  }
  if (!Array.isArray(ticketsToRender) || ticketsToRender.length === 0) {
    ticketsTableBody.innerHTML = noTicketsRow;
    renderPagination(0);
    return;
  }

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedTickets = ticketsToRender.slice(start, end);

  paginatedTickets.forEach((ticket) => {
    const statusId = ticket.status_id;
    const row = document.createElement("tr");
    row.className = "new-ticket";

    const statusClass = statusClassMap[statusId] || "sin-clase";

    // Botón editar solo si estado es Pendiente PA (id 1)
    const editButton =
      statusId === 1
        ? `<button class="btn btn-outline-primary btn-action" onclick="handleOpenEditNewTicketModal(${ticket.id})" title="Editar ticket">
             <i class="bi bi-pencil-square"></i>
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
        <span class="badge status-${statusClass} badge-status position-relative">
          ${getStatusIcon(statusId)} ${getStatusText(statusId)}

          ${
            statusId === 6 && ticket.aprobacion_solucion === "si"
              ? `<i class="bi bi-award-fill badge-corner-icon text-warning" title="Ticket aprobado"></i>`
              : statusId === 6 && ticket.aprobacion_solucion === "no"
              ? `<i class="bi bi-eye-fill badge-corner-icon text-warning" title="Aprobado con observación"></i>`
              : statusId === 6 &&
                ticket.aprobacion_solucion === null &&
                (ticket.tipo_atencion_cierre === "remota" ||
                  ticket.tipo_atencion_cierre === "presencial")
              ? `<i class="bi bi-question-circle badge-corner-icon text-primary-color" title="Aprobación pendiente"></i>`
              : ""
          }
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
         ${editButton}
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
      btn.classList.add("btn-outline-secondary");
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

// Filtrar tickets en pág 1
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

    if (file.size > 5 * 1024 * 1024) {
      showAlert("El archivo adjunto no debe superar los 5MB", "warning");
      btnSpinner.classList.add("d-none");
      btnIcon.classList.remove("d-none");
      btnText.textContent = "Crear Ticket";
      saveBtn.disabled = false;
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      showAlert(
        "Solo se permiten archivos PDF o imágenes (JPG, PNG, WEBP)",
        "warning"
      );
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

// Editar el ticket en estado pendiente pa
async function updateEditTicket() {
  const saveBtn = document.getElementById("updateNewTicketBtn");
  const btnSpinner = document.getElementById("updateNewBtnSpinner");
  const btnIcon = document.getElementById("updateNewBtnIcon");
  const btnText = document.getElementById("updateNewBtnText");

  btnSpinner.classList.remove("d-none");
  btnIcon.classList.add("d-none");
  btnText.textContent = "Guardando...";
  saveBtn.disabled = true;

  const areaSolicitante = parseInt(
    document.getElementById("editNewTicketAssignee").value,
    10
  );
  const tipoAtencion = parseInt(
    document.getElementById("editNewTicketCategory").value,
    10
  );
  const description = document
    .getElementById("editNewTicketDescription")
    .value.trim();

  if (!description || !tipoAtencion || !areaSolicitante) {
    showAlert("Por favor, completa todos los campos obligatorios.", "warning");
    resetButton();
    return;
  }

  const payload = {
    solicitante_id: userId,
    area_id: tipoAtencion,
    tipo_atencion_id: areaSolicitante,
    observaciones: description,
  };

  try {
    const response = await fetch(
      `https://tickets.dev-wit.com/api/tickets/editar/${window.ticketIdEnEdicion}`,
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
      throw new Error(
        errorData.message || "Error al editar el ticket, intente más tarde"
      );
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("editNewTicketModal")
    );
    modal.hide();

    getUserIdWhenReady((userId) => loadTickets(userId));

    showAlert("Ticket editado exitosamente!", "success");
  } catch (error) {
    console.error("Error al editar ticket:", error);
    showAlert("No se pudo editar el ticket. " + error.message, "error");
  } finally {
    resetButton();
  }

  function resetButton() {
    btnSpinner.classList.add("d-none");
    btnIcon.classList.remove("d-none");
    btnText.textContent = "Guardar Cambios";
    saveBtn.disabled = false;
  }
}

function handleOpenEditNewTicketModal(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) {
    showAlert("No se encontró el ticket para editar.", "error");
    return;
  }
  if (getStatusText(ticket.status_id) !== "Pendiente PA") {
    showAlert(
      "Solo se pueden editar tickets en estado Pendiente PA.",
      "warning"
    );
    return;
  }
  openEditNewTicketModal(ticket);
}

function openEditNewTicketModal(ticket) {
  // document.getElementById("editNewTicketCategory").value = ticket.title;
  // document.getElementById("editNewTicketAssignee").value =
  //   ticket.category;
  document.getElementById("editNewTicketDescription").value =
    ticket.description || "";

  window.ticketIdEnEdicion = ticket.id;

  const modal = new bootstrap.Modal(
    document.getElementById("editNewTicketModal")
  );
  modal.show();
  validateEditNewForm();
}

// Card para ticket cerrado
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
  const esObservado = ticket.aprobacion_solucion === "no";

  const borderClass = esObservado ? "border-warning" : "border-success";
  const textClass = esObservado ? "text-warning" : "text-success";
  const titulo = esObservado
    ? "Aprobado con Observación"
    : esAprobado
    ? "✅ Ticket Aprobado"
    : "Ticket Cerrado";

  let accionesHtml = "";
  if (!yaEvaluado) {
    accionesHtml = `
      <div class="mt-3 d-flex gap-2">
        <button id="btn-aprobar-${ticket.id}" class="btn btn-primary btn-sm" onclick="aprobarTicket('${ticket.id}')">
          ✅ Aprobado
        </button>
        <button id="btn-desaprobar-${ticket.id}" class="btn btn-primary btn-sm" onclick="mostrarCampoDesaprobado('${ticket.id}')">
          Aprobado con Observación
        </button>
      </div>
      <div class="mt-2" id="desaprobado-section-${ticket.id}" style="display: none;">
        <textarea id="desaprobado-textarea-${ticket.id}" class="form-control mt-2" rows="3" placeholder="Describe la observación..."></textarea>
        <button class="btn btn-primary btn-sm mt-2" onclick="desaprobarTicket(event, '${ticket.id}')">
          Confirmar Observación
        </button>
      </div>
    `;
  }

  const observacionHtml =
    esObservado && ticket.solucion_observacion
      ? `<p><strong>Observación:</strong> ${ticket.solucion_observacion}</p>`
      : "";

  const mensajeFinal = esObservado
    ? `<div class="mt-3 small fw-semibold fst-italic">
          Ticket aprobado con observaciones. Por favor genere un nuevo ticket con su solicitud.
       </div>`
    : "";

  const botonCertificado =
    esAprobado || esObservado
      ? `<div class="mt-3">
        <button class="btn btn-outline-gold btn-sm" onclick="generarCertificadoPDF('${ticket.id}')">
          <i class="bi bi-award me-1"></i> Descargar Certificado
        </button>
      </div>`
      : "";

  return `
    <div id="ticket-card-${
      ticket.id
    }" class="ticket-history-entry final-card border ${borderClass} p-3 rounded mt-4 bg-light shadow">
      <h5 class="fw-bold ${textClass} mb-3">${titulo}</h5>
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
              <i class="bi bi-file-earmark"></i> Ver archivo adjunto
            </a></div>`
          : ""
      }
      ${accionesHtml}
      ${botonCertificado}
      ${mensajeFinal}
    </div>
  `;
}

// Historial de ticket
function formatHistorial(historial, ticket = {}) {
  if (!Array.isArray(historial) || historial.length === 0) {
    return "<p class='text-muted'><em>Sin historial disponible</em></p>";
  }
  // console.log("historial", historial);
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
    showAlert("Por favor ingresa una observación.", "warning");
    return;
  }
  const btnDesaprobar = event.target;
  const btnAprobar = document.getElementById(`btn-aprobar-${ticketId}`);
  const originalHTML = btnDesaprobar.innerHTML;
  btnDesaprobar.disabled = true;
  btnDesaprobar.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Confirmando...`;
  if (btnAprobar) btnAprobar.disabled = true;
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
    if (!response.ok) throw new Error("Error al enviar la observación");
    getUserIdWhenReady((userId) => loadTickets(userId));
    ocultarAccionesFinales(ticketId, false, true);
    mostrarMensajeDesaprobacion(ticketId, true);
  } catch (error) {
    console.error("Error al desaprobar:", error);
    showAlert("Hubo un problema al enviar la observación.", "error");
  } finally {
    btnDesaprobar.disabled = false;
    btnDesaprobar.innerHTML = originalHTML;
    if (btnAprobar) btnAprobar.disabled = false;
  }
}

function mostrarMensajeDesaprobacion(ticketId, observado = false) {
  const card = document.getElementById(`ticket-card-${ticketId}`);
  if (!card) return;
  const mensaje = document.createElement("div");
  mensaje.className = "mt-3 small fw-semibold fst-italic";
  mensaje.textContent = observado
    ? "Ticket aprobado con observaciones.  un nuevo ticket con su solicitud."
    : "Por favor genere un nuevo ticket con su solicitud.";
  card.appendChild(mensaje);
}

function ocultarAccionesFinales(ticketId, aprobado, observado = false) {
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
      if (aprobado) {
        title.textContent = "✅ Ticket Aprobado";
        title.classList.remove("text-danger", "text-warning");
        title.classList.add("text-success");
      } else if (observado) {
        title.textContent = "Aprobado con Observación";
        title.classList.remove("text-success", "text-danger");
        title.classList.add("text-warning");
      }
    }
  }
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

function formatDate(dateString) {
  return luxon.DateTime.fromISO(dateString, { zone: "America/Santiago" })
    .setLocale("es")
    .toFormat("d LLL yyyy");
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
  <p><strong>Área:</strong> ${ticket.title || ticket.area}</p>
  <p><strong>Estado:</strong> ${getStatusIcon(
    ticket.status_id
  )} ${getStatusText(ticket.status_id)}</p>
  <p><strong>Asignado a:</strong> <i class="bi bi-person-circle me-2"></i>${
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
          <i class="bi bi-file-earmark" style="margin-right: 0.4rem;"></i> Ver archivo
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

// Validar formularios
function validateForm() {
  const description = document.getElementById("ticketDescription").value.trim();
  const tipoAtencion = document.getElementById("ticketAssignee").value;
  const areaSolicitante = document.getElementById("ticketCategory").value;

  const isValid = description && tipoAtencion && areaSolicitante;
  saveTicketBtn.disabled = !isValid;
}

function validateEditNewForm() {
  const description = document
    .getElementById("editNewTicketDescription")
    .value.trim();
  const tipoAtencion = document.getElementById("editNewTicketAssignee").value;
  const areaSolicitante = document.getElementById(
    "editNewTicketCategory"
  ).value;

  const isValid = description && tipoAtencion && areaSolicitante;
  saveEditButton.disabled = !isValid;
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
const categoryEditSelect = document.getElementById("editNewTicketCategory");

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
    categorySelect.innerHTML = '<option value="">Sin asignar</option>';
    categoryEditSelect.innerHTML = '<option value="">Sin asignar</option>';

    data.forEach((area) => {
      const option = document.createElement("option");
      option.value = area.id;
      option.textContent = area.nombre;
      categorySelect.appendChild(option);

      const option2 = document.createElement("option");
      option2.value = area.id;
      option2.textContent = area.nombre;
      categoryEditSelect.appendChild(option2);
    });
    // console.log("tiposAreas", areas);
  })
  .catch((error) => {
    console.error("Error cargando áreas:", error);
  });

const tipoSelect = document.getElementById("ticketAssignee");
const tipoAtencionFilterSelect = document.getElementById("tipoAtencionFilter");
const tipoEditSelect = document.getElementById("editNewTicketAssignee");

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
    tipoSelect.innerHTML = '<option value="">Sin asignar</option>';
    tipoAtencionFilterSelect.innerHTML =
      '<option value="">Todos los tipos de atención</option>';
    tipoEditSelect.innerHTML = '<option value="">Sin asignar</option>';

    // Agrupar por categoría
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

      const optgroup3 = document.createElement("optgroup");
      optgroup3.label = categoria;

      categorias[categoria].forEach((tipo) => {
        const option1 = document.createElement("option");
        option1.value = tipo.id;
        option1.textContent = tipo.nombre;
        optgroup1.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = tipo.nombre;
        option2.textContent = tipo.nombre;
        optgroup2.appendChild(option2);

        const option3 = document.createElement("option");
        option3.value = tipo.id;
        option3.textContent = tipo.nombre;
        optgroup3.appendChild(option3);
      });

      tipoSelect.appendChild(optgroup1);
      tipoAtencionFilterSelect.appendChild(optgroup2);
      tipoEditSelect.appendChild(optgroup3);
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
    if (response.status === 401) {
      localStorage.clear();
      sessionStorage.clear();
      showAlert(
        "Sesión expirada. Por favor, vuelve a iniciar sesión.",
        "error"
      );
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 2500);
      throw new Error("No autorizado");
    }
    if (!response.ok) {
      throw new Error(`Error al obtener usuarios: ${response.status}`);
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
  renderTickets(null);

  fetch(`https://tickets.dev-wit.com/api/tickets/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      tickets = data.map((t) => ({
        id: t.id,
        title: t.area,
        status_id: t.id_estado,
        assignee: t.ejecutor,
        category: t.tipo_atencion,
        description: t.observaciones,
        date: luxon.DateTime.fromISO(t.fecha_creacion)
          .setZone("America/Santiago")
          .toFormat("yyyy-MM-dd"),
        historial: t.historial || [],
        archivo_pdf: t.archivo_pdf,
        detalle_solucion: t.detalle_solucion || "",
        tipo_atencion_cierre: t.modo_atencion || "",
        necesita_despacho: t.necesita_despacho || "",
        detalles_despacho: t.detalles_despacho || "",
        archivo_solucion: t.archivo_solucion || "",
        id_actividad: t.id_actividad || null,
        aprobacion_solucion: t.aprobacion_solucion,
        solucion_observacion: t.solucion_observacion,
      }));
      // console.log("tickets:", tickets);
      renderTickets(tickets);
      updateStats();
    })
    .catch((err) => {
      console.error("Error cargando tickets:", err);
      showAlert("No se pudieron cargar los tickets.", "warning");
      renderTickets([]);
    });
});

// Llamada para recargar tabla de tickets después de createTicket
async function loadTickets(userId) {
  renderTickets(null);

  return fetch(`https://tickets.dev-wit.com/api/tickets/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      tickets = data.map((t) => ({
        id: t.id,
        title: t.area,
        status_id: t.id_estado,
        assignee: t.ejecutor,
        category: t.tipo_atencion,
        description: t.observaciones,
        date: luxon.DateTime.fromISO(t.fecha_creacion)
          .setZone("America/Santiago")
          .toFormat("yyyy-MM-dd"),
        historial: t.historial || [],
        archivo_pdf: t.archivo_pdf,
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
      return tickets;
    })
    .catch((error) => {
      console.error("Error cargando tickets:", error);
      showAlert("No se pudieron cargar los tickets.", "warning");
      renderTickets([]);
      return [];
    });
}

async function fetchEstados() {
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

async function loadActivities() {
  try {
    const res = await fetch("https://tickets.dev-wit.com/api/actividades", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    actividades = await res.json();
    // console.log("actividades", actividades)
  } catch (err) {
    console.error("Error al cargar actividades:", err);
  }
}

function initTicketLoading() {
  getUserIdWhenReady((userId) => {
    renderTickets(null);
    loadActivities()
      .then(() => {
        return loadTickets(userId);
      })
      .catch((error) => {
        console.error("Error en inicialización:", error);
        renderTickets([]);
      });
  });
}

function populateStatusFilter(estados) {
  const select = document.getElementById("statusFilter");
  select.innerHTML = '<option value="">Todos los estados</option>';
  estados.forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado.id;
    option.textContent = capitalize(estado.nombre);
    select.appendChild(option);
  });
}

// Genera el certificado en pdf
async function generarCertificadoPDF(ticketId) {
  const url = `https://tickets.dev-wit.com/api/tickets/detalle/${ticketId}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("No se pudo obtener el detalle del ticket.");
    const t = await res.json();

    const nuevaVentana = window.open("", "_blank");
    if (!nuevaVentana) {
      alert("No se pudo abrir la pestaña. Desbloquea los pop-ups.");
      return;
    }

    const historialHTML = t.historial?.length
      ? t.historial
          .map(
            (h) => `
        <tr>
          <td>${new Date(h.fecha).toLocaleString()}</td>
          <td>${h.estado_anterior}</td>
          <td>${h.nuevo_estado}</td>
          <td>${h.usuario_cambio}</td>
          <td>${h.observacion || "-"}</td>
        </tr>
      `
          )
          .join("")
      : '<tr><td colspan="5">Sin historial registrado.</td></tr>';

    const contenidoHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Certificado Ticket #${t.id}</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <style>
          body {
            margin: 0;
            background: #ccc;
            font-family: Arial, sans-serif;
            font-size: 13px;
            color: #333;
          }

          .no-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          #pdf-wrapper {
            width: 100%;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 40px 0;
          }

          #plantilla-pdf {
            padding: 40px;
            padding-top: 60px;
            box-sizing: border-box;
            background: white;
            font-family: Arial, sans-serif;
            font-size: 13px;
            color: #333;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
          }

          .header img {
            height: 35px;
            width: 100px;
          }

          .header h1 {
            font-size: 20px;
            margin: 0;
          }

          .card {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
          }

          .card-header {
            font-weight: bold;
            background: #f0f0f0;
            padding: 6px 10px;
            margin: -15px -15px 10px -15px;
            border-bottom: 1px solid #ddd;
            border-radius: 6px 6px 0 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th, td {
            border: 1px solid #999;
            padding: 6px;
            text-align: left;
            vertical-align: top;
            font-size: 12px;
          }

          th {
            background-color: #f9f9f9;
          }

          #boton-descargar {
            position: fixed;
            top: 40px;
            right: 300px;
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 18px;
            font-size: 14px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            z-index: 9999;
          }

          #boton-descargar:hover {
            background: #0056b3;
          }                 

          // .page-margin-top:first-of-type {
          //   height: 0;
          // }

          @page {
            margin-top: 20mm; /* Margen superior para todas las páginas */
          }

          body:first-of-type {
            margin-top: 0;
          }


          .page-break {
            display: block;
            height: 0;
            break-before: page;
            margin-top: 20mm; /* Margen superior para páginas nuevas */
          }

          .card.historial {
            margin-top: 20px !important;
          }

          @media print {
            .card, .header, .firma-footer {
              margin-top: 20px !important;
            }

            body > *:first-child {
              margin-top: 20px !important;
            }

            .card:first-child,
            .header:first-child {
              margin-top: 0 !important;
            }

            tr {
              page-break-inside: avoid !important;
            }

            .card, .header, .firma-footer {
              break-before: auto;
            }
          }

        }
        </style>
      </head>
      <body>
        <div id="pdf-wrapper">
          <div id="plantilla-pdf" style="display: flex; flex-direction: column; min-height: 100%;">

            <div class="header no-break">
              <h1>Certificado de Ticket #${t.id}</h1>
              <img src="../img/logo.png" alt="Logo Institucional" />
            </div>

            <div class="card no-break">
              <h4>${t.tipo_atencion}</h4>
              <p><strong>Área:</strong> ${t.area}</p>
              <p><strong>Fecha de creación:</strong> ${new Date(
                t.fecha_creacion
              ).toLocaleString()}</p>
              <p><strong>Modo de atención:</strong> ${
                t.modo_atencion ?? "—"
              }</p>
              <p><strong>¿Requiere despacho?:</strong> ${
                t.necesita_despacho
              }</p>
              ${
                t.detalles_despacho
                  ? `<p><strong>Detalles del despacho:</strong> ${t.detalles_despacho}</p>`
                  : ""
              }
            </div>

            <div style="display: flex; gap: 15px;" class="no-break">
              <div class="card" style="flex: 1;">
                <div class="card-header">Solicitante</div>
                <p><strong>Nombre:</strong> ${t.solicitante ?? "—"}</p>
                <p><strong>Correo:</strong> ${t.correo_solicitante ?? "—"}</p>
              </div>

              <div class="card" style="flex: 1;">
                <div class="card-header">Ejecutor</div>
                <p><strong>Nombre:</strong> ${t.ejecutor ?? "—"}</p>
                <p><strong>Correo:</strong> ${t.correo_ejecutor ?? "—"}</p>
              </div>

              <div class="card" style="flex: 1;">
                <div class="card-header">Jefatura</div>
                <p><strong>Nombre:</strong> ${t.jefatura ?? "—"}</p>
                <p><strong>Correo:</strong> ${t.correo_jefatura ?? "—"}</p>
              </div>
            </div>

            <div class="card no-break">
              <div class="card-header">Detalle del Ticket</div>
              <p><strong>Observaciones:</strong></p>
              <p>${t.observaciones ?? "—"}</p>
              ${
                t.detalle_solucion
                  ? `
                <hr>
                <p><strong>Detalle de la solución:</strong></p>
                <p>${t.detalle_solucion}</p>
              `
                  : ""
              }
              <p><strong>Aprobación de la solución:</strong> ${
                t.aprobacion_solucion ?? "—"
              }</p>
              <p><strong>Observación de la solución:</strong> ${
                t.solucion_observacion ?? "—"
              }</p>
            </div>
            
            <div class="card historial">
              <div class="card-header">Historial de Estados</div>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estado anterior</th>
                    <th>Nuevo estado</th>
                    <th>Usuario</th>
                    <th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  ${historialHTML}
                </tbody>
              </table>
            </div>

            <div class="firma-footer no-break" style="text-align: center; margin-top: auto; padding-top: 40px;">
              <img src="../img/firma.png" alt="Firma" style="width: 100px; height: 80px;" />
              <p style="font-size: 10px; margin-top: 30px; color: #555;">
                WIT – Manuel Obispo Umaña #633, Estación Central, Santiago, Chile. Contactos: +56 9 9073 7619 / soporte@wit.la
              </p>
            </div>

          </div>
        </div>

        <button id="boton-descargar" onclick="descargarPDF()">Descargar PDF</button>

        <script>
          function descargarPDF() {
            const element = document.getElementById('plantilla-pdf');

            html2pdf().set({
              margin: [1, 0, 20, 0], // [top, left, bottom, right] en mm
              filename: 'ticket_${t.id}.pdf',
              html2canvas: {
                scale: 2,
                useCORS: true,
                scrollY: 0
              },
              jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
              },
              pagebreak: {
                mode: 'css', // Usa el modo CSS para saltos de página
                avoid: ['.no-break', '.header', '.card', '.firma-footer'],
                before: '.page-break' // Elemento que fuerza el salto de página
              }
            }).from(element).save();
          }
        </script>
      </body>
      </html>
    `;

    nuevaVentana.document.open();
    nuevaVentana.document.write(contenidoHTML);
    nuevaVentana.document.close();
  } catch (err) {
    alert("Error al generar el certificado: " + err.message);
    console.error(err);
  }
}
