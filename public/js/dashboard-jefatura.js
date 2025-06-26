// Inicialización de variables
let usersData = [];
let tiposAtencion = [];
let areas = [];
let tickets = [];
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

// Obtener data de storage
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
  fetchEstados();
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
  statusFilter.addEventListener("change", filterTickets);
  tipoAtencionFilter.addEventListener("change", filterTickets);
  searchInput.addEventListener("input", filterTickets);

  // Actualizar ticket
  updateTicketBtn.addEventListener("click", updateTicket);

  // Validación del formulario de avanzar ticket
  document
    .getElementById("editTicketStatus")
    .addEventListener("change", validateAdvanceForm);
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

    const avanzarBtn = `<button class="btn btn-outline-secondary btn-action" onclick="openAdvanceModal(${ticket.id})" title="Avanzar Ticket">
        <i class="bi bi-forward-fill text-success"></i>
      </button>`;

    row.innerHTML = `
      <td data-label="ID"><strong>#${ticket.id}</strong></td>
      <td data-label="Área">
        <div class="fw-semibold">${ticket.title}</div>
        <small class="text-muted">${ticket.category}</small>
      </td>
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
      </td>`;

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
      filterTickets();
    });
    paginationContainer.appendChild(btn);
  }
}

// Avanzar ticket
function openAdvanceModal(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;

  document.getElementById("editTicketId").value = ticket.id;
  document.getElementById("editTicketStatus").value = "";
  document.getElementById("editTicketDescription").value = "";

  const modal = new bootstrap.Modal(document.getElementById("editTicketModal"));
  modal.show();
  validateAdvanceForm();
}

// Actualizar estadísticas
// function updateStats() {
//   const asignado = tickets.filter((t) => t.status_id === 2).length;
//   const pendienteAutorizar = tickets.filter((t) => t.status_id === 1).length;
//   const enEjecucion = tickets.filter((t) => t.status_id === 3).length;
//   const pendientePresupuesto = tickets.filter((t) => t.status_id === 4).length;
//   const rechazado = tickets.filter((t) => t.status_id === 9).length;
//   const cancelado = tickets.filter((t) => t.status_id === 5).length;
//   const listo = tickets.filter((t) => t.status_id === 6).length;

//   document.getElementById("asignadoCount").textContent = asignado;
//   document.getElementById("pendienteAutorizarCount").textContent =
//     pendienteAutorizar;
//   document.getElementById("ejecucionCount").textContent = enEjecucion;
//   document.getElementById("pendienteCount").textContent = pendientePresupuesto;
//   document.getElementById("rechazadoCount").textContent = rechazado;
//   document.getElementById("canceladoCount").textContent = cancelado;
//   document.getElementById("listoCount").textContent = listo;
// }

// Filtrar tickets
function filterTickets() {
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
    id_estado: nuevoEstado,
    observacion,
    usuario_id: parseInt(userId, 10),
  };

  console.log("payload asignar/rechazar:", payload);

  try {
    const response = await fetch(
      `https://tickets.dev-wit.com/api/tickets/autorizar-rechazar/${id}`,
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

function formatHistorial(historial) {
  if (!Array.isArray(historial) || historial.length === 0) {
    return "<p class='text-muted'><em>Sin historial disponible</em></p>";
  }

  return historial
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
}

// Ver detalles del ticket
function viewTicket(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return showAlert("Ticket no encontrado", "warning");

  const historialHtml = formatHistorial(ticket.historial);

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
    <p><strong>Solicitado por:</strong> ${
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
}

// Validar formulario
function validateAdvanceForm() {
  const estadoSelect = document.getElementById("editTicketStatus");
  const updateBtn = document.getElementById("updateTicketBtn");

  const estadoSeleccionado = parseInt(estadoSelect.value, 10);
  const nombreEstado = estadoMap[estadoSeleccionado] || "";

  const esValido = nombreEstado === "asignado" || nombreEstado === "rechazado";

  updateBtn.disabled = !esValido;
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
    // console.log("tiposAreas", areas);
  })
  .catch((error) => {
    console.error("Error cargando áreas:", error);
  });

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

    tipoAtencionFilterSelect.innerHTML =
      '<option value="">Todos los tipos de atención</option>';

    // Agregar opciones a los tres selects
    data.forEach((tipo) => {
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
  const endpoint = `https://tickets.dev-wit.com/api/tickets/pendientes/jefatura/${userId}`;

  fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      // console.log("tickets" ,data)
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
          assignee: t.nombre_solicitante,
          category: t.tipo_atencion,
          description: t.observaciones,
          date: luxon.DateTime.fromISO(fechaTicket)
            .setZone("America/Santiago")
            .toFormat("yyyy-MM-dd"),
          historial: t.historial || [],
          archivo_pdf: t.archivo_pdf || null,
        };
      });

      renderTickets(tickets);
      // updateStats();
    })
    .catch((err) => {
      console.error("Error cargando tickets:", err);
      showAlert("No se pudieron cargar los tickets.", "warning");
    });
});

// Llamada para recargar tabla de tickets
async function loadTickets(userId) {
  const endpoint = `https://tickets.dev-wit.com/api/tickets/pendientes/jefatura/${userId}`;

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
      assignee: t.nombre_solicitante,
      category: t.tipo_atencion,
      description: t.observaciones,
      date: luxon.DateTime.fromISO(t.fecha_creacion)
        .setZone("America/Santiago")
        .toFormat("yyyy-MM-dd"),
      historial: t.historial || [],
      archivo_pdf: t.archivo_pdf || null,
    }));

    renderTickets(tickets);
    // updateStats();
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

function capitalize(texto) {
  return texto
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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
      nombreLower !== "cancelado" &&
      nombreLower !== "listo" &&
      nombreLower !== "en ejecución" &&
      nombreLower !== "pendiente por presupuesto" &&
      nombreLower !== "pendiente por autorizar"
    ) {
      const option2 = document.createElement("option");
      option2.value = estado.id;

      if (nombreLower === "asignado") {
        option2.textContent = "Autorizar";
      } else if (nombreLower === "rechazado") {
        option2.textContent = "Rechazar";
      } else {
        option2.textContent = nombreCapitalizado;
      }

      selectEdit.appendChild(option2);
    }
  });
}
