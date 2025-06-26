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
const token =
  localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
const userMail =
  localStorage.getItem("userMail") || sessionStorage.getItem("userMail");
const userName =
  sessionStorage.getItem("userName") || localStorage.getItem("userName");

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
      </tr>`;
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
          ${getStatusIcon(statusId)} ${getStatusText(statusId)}
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

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `btn btn-sm ${
      i === currentPage ? "btn-primary" : "btn-outline-primary"
    } mx-1`;
    btn.addEventListener("click", () => {
      currentPage = i;
      applyFilters();
    });
    paginationContainer.appendChild(btn);
  }
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

  document.getElementById("asignadoCount").textContent = asignado;
  document.getElementById("pendienteAutorizarCount").textContent =
    pendienteAutorizar;
  document.getElementById("ejecucionCount").textContent = enEjecucion;
  document.getElementById("pendienteCount").textContent = pendientePresupuesto;
  document.getElementById("rechazadoCount").textContent = rechazado;
  document.getElementById("canceladoCount").textContent = cancelado;
  document.getElementById("listoCount").textContent = listo;
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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = !statusValue || ticket.status_id == statusValue;
    const matchesTipoAtencion =
      !tipoAtencionValue || ticket.category === tipoAtencionValue;
    const matchesSearch =
      !searchValue ||
      ticket.title.toLowerCase().includes(searchValue) ||
      ticket.description.toLowerCase().includes(searchValue) ||
      ticket.assignee.toLowerCase().includes(searchValue);

    return matchesStatus && matchesTipoAtencion && matchesSearch;
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
  for (const [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

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
    await loadTickets(solicitante.id);

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

  return `
    <div class="ticket-history-entry final-card border border-success p-3 rounded mt-4 bg-light shadow">
      <h5 class="fw-bold text-success mb-3">✅ Ticket Cerrado</h5>
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
      ${
        archivoUrl
          ? `<div class="mt-2"><a class="btn btn-outline-success btn-sm" href="${archivoUrl}" target="_blank" rel="noopener">
              <i class="bi bi-file-earmark-pdf"></i> Ver archivo de solución
            </a></div>`
          : ""
      }
    </div>
  `;
}

function formatHistorial(historial, ticket = {}) {
  if (!Array.isArray(historial) || historial.length === 0) {
    return "<p class='text-muted'><em>Sin historial disponible</em></p>";
  }
  console.log("historial", historial)

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
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
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
  <p><strong>Asignado a:</strong> ${
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
  console.log("DEBUG ticket:", ticket);
}

// Validar formulario
function validateForm() {
  const description = document.getElementById("ticketDescription").value.trim();
  const tipoAtencion = document.getElementById("ticketAssignee").value;
  const areaSolicitante = document.getElementById("ticketCategory").value;

  const isValid = description && tipoAtencion && areaSolicitante;
  saveTicketBtn.disabled = !isValid;
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
    // Limpia el select si no quieres opciones fijas
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

    // Resetear selects
    tipoSelect.innerHTML = '<option value="">Sin asignar</option>';
    tipoAtencionFilterSelect.innerHTML =
      '<option value="">Todos los tipos de atención</option>';

    // Agregar opciones a los tres selects
    data.forEach((tipo) => {
      const option1 = document.createElement("option");
      option1.value = tipo.id;
      option1.textContent = tipo.nombre;
      tipoSelect.appendChild(option1);

      const option2 = document.createElement("option");
      option2.value = tipo.id;
      option2.textContent = tipo.nombre;

      const option3 = document.createElement("option");
      option3.value = tipo.nombre;
      option3.textContent = tipo.nombre;
      tipoAtencionFilterSelect.appendChild(option3);
    });
    // console.log("tiposAtencion", tiposAtencion);
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
      }));
      // console.log("tickets:", tickets);
      renderTickets(tickets);
      updateStats();
    })
    .catch((err) => {
      console.error("Error cargando tickets:", err);
      showAlert("No se pudieron cargar los tickets.", "warning");
    });
});

// Llamada para recargar tabla de tickets después de createTicket
async function loadTickets(userId) {
  try {
    const response = await fetch(
      `https://tickets.dev-wit.com/api/tickets/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
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
    }));

    renderTickets(tickets);
    updateStats();
  } catch (err) {
    console.error("Error recargando tickets:", err);
    showAlert("No se pudieron recargar los tickets.", "warning");
  }
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
  select.innerHTML = '<option value="">Todos los estados</option>';
  estados.forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado.id;
    option.textContent = capitalize(estado.nombre);
    select.appendChild(option);
  });
}
