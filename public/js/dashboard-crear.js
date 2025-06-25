// Inicialización de variables
let usersData = [];
let tiposAtencion = [];
let areas = [];
let tickets = [];

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
  statusFilter.addEventListener("change", filterTickets);
  tipoAtencionFilter.addEventListener("change", filterTickets);
  searchInput.addEventListener("input", filterTickets);

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

const statusClassMap = {
  creado: "creado",
  "en ejecución": "en-ejecucion",
  "pendiente por presupuesto": "pendiente-por-presupuesto",
  cancelado: "cancelado",
  listo: "listo",
};

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
    return;
  }

  ticketsToRender.forEach((ticket) => {
    const row = document.createElement("tr");
    row.className = "new-ticket";

    const statusClass = statusClassMap[ticket.status] || "creado";

    row.innerHTML = `
    <td data-label="ID"><strong>#${ticket.id}</strong></td>
    <td data-label="Área">
      <div class="fw-semibold">${ticket.title}</div>
      <small class="text-muted">${ticket.category}</small>
    </td>
    <td data-label="Estado">
      <span class="badge status-${statusClass} badge-status">
        ${getStatusIcon(ticket.status)} ${getStatusText(ticket.status)}
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
    </td>`;

    ticketsTableBody.appendChild(row);
  });
}

// Avanzar ticket
function openAdvanceModal(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;

  document.getElementById("editTicketId").value = ticket.id;
  document.getElementById("editTicketStatus").value = ticket.status || "creado";
  document.getElementById("editTicketDescription").value =
    ticket.description || "";

  const modal = new bootstrap.Modal(document.getElementById("editTicketModal"));
  modal.show();
}

// Actualizar estadísticas
function updateStats() {
  const creado = tickets.filter((t) => t.status === "creado").length;
  const enEjecucion = tickets.filter((t) => t.status === "en ejecución").length;
  const pendientePorPresupuesto = tickets.filter(
    (t) => t.status === "pendiente por presupuesto"
  ).length;
  const cancelado = tickets.filter((t) => t.status === "cancelado").length;
  const listo = tickets.filter((t) => t.status === "listo").length;

  document.getElementById("creadoCount").textContent = creado;
  document.getElementById("ejecucionCount").textContent = enEjecucion;
  document.getElementById("pendienteCount").textContent =
    pendientePorPresupuesto;
  document.getElementById("canceladoCount").textContent = cancelado;
  document.getElementById("listoCount").textContent = listo;
}

// Filtrar tickets
function filterTickets() {
  const statusValue = statusFilter.value;
  const tipoAtencionValue = tipoAtencionFilter.value;
  const searchValue = searchInput.value.toLowerCase();

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = !statusValue || ticket.status === statusValue;
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

      return `
        <div class="ticket-history-entry">
          <time>🕒 ${fecha}</time>
          <div class="user">👤 ${h.usuario_cambio}</div>
          <div class="change">🔄 ${h.estado_anterior} → <strong>${h.nuevo_estado}</strong></div>
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
  <p><strong>Estado:</strong> ${getStatusText(
    ticket.status || ticket.estado
  )}</p>
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
}

// Funciones auxiliares / utilitarias
const statusMap = {
  creado: "Creado",
  "en ejecución": "En ejecución",
  "pendiente por presupuesto": "Pendiente por presupuesto",
  cancelado: "Cancelado",
  listo: "Listo",
};

const iconMap = {
  creado: '<i class="bi bi-plus-circle"></i>',
  "en ejecución": '<i class="bi bi-play-circle"></i>',
  "pendiente por presupuesto": '<i class="bi bi-clock"></i>',
  cancelado: '<i class="bi bi-x-circle"></i>',
  listo: '<i class="bi bi-check-circle"></i>',
};

function getStatusText(status) {
  return statusMap[status] || status;
}

function getStatusIcon(status) {
  return iconMap[status] || "";
}

function formatDate(dateString) {
  return luxon.DateTime.fromISO(dateString, { zone: "America/Santiago" })
    .setLocale("es")
    .toFormat("d LLL yyyy");
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
  userDisplay.textContent = "¡Hola " + userName + "!";
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
        status: t.estado,
        assignee: t.ejecutor,
        category: t.tipo_atencion,
        description: t.observaciones,
        date: luxon.DateTime.fromISO(t.fecha_creacion)
          .setZone("America/Santiago")
          .toFormat("yyyy-MM-dd"),
        historial: t.historial || [],
        archivo_pdf: t.archivo_pdf,
      }));

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
      status: t.estado,
      assignee: t.ejecutor,
      category: t.tipo_atencion,
      description: t.observaciones,
      date: luxon.DateTime.fromISO(t.fecha_creacion)
        .setZone("America/Santiago")
        .toFormat("yyyy-MM-dd"),
      historial: t.historial || [],
      archivo_pdf: t.archivo_pdf,
    }));

    renderTickets(tickets);
    updateStats();
  } catch (err) {
    console.error("Error recargando tickets:", err);
    showAlert("No se pudieron recargar los tickets.", "warning");
  }
}
