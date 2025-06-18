// Almacenamiento de datos de tickets
let tickets = [
  {
    id: 1,
    title: "Error en el sistema de login",
    status: "pendiente",
    priority: "alta",
    assignee: "Juan Pérez",
    category: "bug",
    description: "Los usuarios no pueden iniciar sesión",
    date: "2025-01-15",
  },
  {
    id: 2,
    title: "Solicitud de nueva funcionalidad",
    status: "esperando",
    priority: "media",
    assignee: "María García",
    category: "feature",
    description: "Implementar sistema de notificaciones",
    date: "2025-01-14",
  },
  {
    id: 3,
    title: "Optimización de base de datos",
    status: "completado",
    priority: "alta",
    assignee: "Carlos López",
    category: "soporte",
    description: "Mejorar rendimiento de consultas",
    date: "2025-01-13",
  },
  {
    id: 4,
    title: "Consulta sobre API",
    status: "pendiente",
    priority: "baja",
    assignee: "Ana Martínez",
    category: "consulta",
    description: "Documentación de endpoints",
    date: "2025-01-12",
  },
  {
    id: 5,
    title: "Bug en el módulo de reportes",
    status: "esperando",
    priority: "media",
    assignee: "",
    category: "bug",
    description: "Los reportes no se generan correctamente",
    date: "2025-01-11",
  },
];

let nextTicketId = 6;

// Elementos del DOM
const ticketsTableBody = document.getElementById("ticketsTableBody");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const searchInput = document.getElementById("searchInput");
const createTicketForm = document.getElementById("createTicketForm");
const saveTicketBtn = document.getElementById("saveTicketBtn");
const updateTicketBtn = document.getElementById("updateTicketBtn");

// Inicializar el panel de control (dashboard)
document.addEventListener("DOMContentLoaded", () => {
  renderTickets();
  updateStats();
  setupEventListeners();
});

// Configurar los listeners de eventos
function setupEventListeners() {
  // Filtros
  statusFilter.addEventListener("change", filterTickets);
  priorityFilter.addEventListener("change", filterTickets);
  searchInput.addEventListener("input", filterTickets);

  // Crear ticket
  saveTicketBtn.addEventListener("click", createTicket);

  // Actualizar ticket
  updateTicketBtn.addEventListener("click", updateTicket);

  // Validación del formulario
  document
    .getElementById("ticketTitle")
    .addEventListener("input", validateForm);
  document
    .getElementById("ticketDescription")
    .addEventListener("input", validateForm);
  document
    .getElementById("ticketPriority")
    .addEventListener("change", validateForm);
}

// Renderizar la tabla de tickets
function renderTickets(ticketsToRender = tickets) {
  ticketsTableBody.innerHTML = "";

  if (ticketsToRender.length === 0) {
    ticketsTableBody.innerHTML = `
            <tr>
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
    row.innerHTML = `
            <td><strong>#${ticket.id}</strong></td>
            <td>
                <div class="fw-semibold">${ticket.title}</div>
                <small class="text-muted">${ticket.category}</small>
            </td>
            <td>
                <span class="badge status-${ticket.status} badge-status">
                    ${getStatusIcon(ticket.status)} ${getStatusText(
      ticket.status
    )}
                </span>
            </td>
            <td>
                <span class="badge priority-${ticket.priority} badge-priority">
                    ${getPriorityText(ticket.priority)}
                </span>
            </td>
            <td>
                ${
                  ticket.assignee
                    ? `
                    <div class="d-flex align-items-center">
                        <i class="bi bi-person-circle me-2"></i>
                        ${ticket.assignee}
                    </div>
                `
                    : '<span class="text-muted">Sin asignar</span>'
                }
            </td>
            <td>
                <small>${formatDate(ticket.date)}</small>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-primary btn-action" onclick="editTicket(${
                      ticket.id
                    })" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-action" onclick="deleteTicket(${
                      ticket.id
                    })" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
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
}

// Actualizar estadísticas
function updateStats() {
  const completed = tickets.filter((t) => t.status === "completado").length;
  const pending = tickets.filter((t) => t.status === "pendiente").length;
  const waiting = tickets.filter((t) => t.status === "esperando").length;

  document.getElementById("completedCount").textContent = completed;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("waitingCount").textContent = waiting;
}

// Filtrar tickets
function filterTickets() {
  const statusValue = statusFilter.value;
  const priorityValue = priorityFilter.value;
  const searchValue = searchInput.value.toLowerCase();

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = !statusValue || ticket.status === statusValue;
    const matchesPriority = !priorityValue || ticket.priority === priorityValue;
    const matchesSearch =
      !searchValue ||
      ticket.title.toLowerCase().includes(searchValue) ||
      ticket.description.toLowerCase().includes(searchValue) ||
      ticket.assignee.toLowerCase().includes(searchValue);

    return matchesStatus && matchesPriority && matchesSearch;
  });

  renderTickets(filteredTickets);
}

// Crear nuevo ticket
function createTicket() {
  const title = document.getElementById("ticketTitle").value.trim();
  const priority = document.getElementById("ticketPriority").value;
  const assignee = document.getElementById("ticketAssignee").value;
  const category = document.getElementById("ticketCategory").value;
  const description = document.getElementById("ticketDescription").value.trim();

  if (!title || !priority || !description) {
    showAlert("Por favor, completa todos los campos obligatorios.", "warning");
    return;
  }

  const newTicket = {
    id: nextTicketId++,
    title: title,
    status: "pendiente",
    priority: priority,
    assignee: assignee,
    category: category,
    description: description,
    date: new Date().toISOString().split("T")[0],
  };

  tickets.unshift(newTicket);
  renderTickets();
  updateStats();

  // Resetear formulario y cerrar modal
  createTicketForm.reset();
  const modalElement = document.getElementById("createTicketModal");
  const modal = bootstrap.Modal.getInstance(modalElement);
  modal.hide();

  showAlert("Ticket creado exitosamente!", "success");
}

// Editar ticket
function editTicket(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;

  document.getElementById("editTicketId").value = ticket.id;
  document.getElementById("editTicketStatus").value = ticket.status;
  document.getElementById("editTicketAssignee").value = ticket.assignee;

  const modal = new bootstrap.Modal(document.getElementById("editTicketModal"));
  modal.show();
}

// Actualizar ticket
function updateTicket() {
  const id = Number.parseInt(document.getElementById("editTicketId").value);
  const status = document.getElementById("editTicketStatus").value;
  const assignee = document.getElementById("editTicketAssignee").value;

  const ticketIndex = tickets.findIndex((t) => t.id === id);
  if (ticketIndex === -1) return;

  tickets[ticketIndex].status = status;
  tickets[ticketIndex].assignee = assignee;

  renderTickets();
  updateStats();

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("editTicketModal")
  );
  modal.hide();

  showAlert("Ticket actualizado exitosamente!", "success");
}

// Eliminar ticket
function deleteTicket(id) {
  if (confirm("¿Estás seguro de que quieres eliminar este ticket?")) {
    tickets = tickets.filter((t) => t.id !== id);
    renderTickets();
    updateStats();
    showAlert("Ticket eliminado exitosamente!", "success");
  }
}

// Ver detalles del ticket
function viewTicket(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;

  const details = `
    <p><strong>ID:</strong> #${ticket.id}</p>
    <p><strong>Título:</strong> ${ticket.title}</p>
    <p><strong>Estado:</strong> ${getStatusText(ticket.status)}</p>
    <p><strong>Prioridad:</strong> ${getPriorityText(ticket.priority)}</p>
    <p><strong>Asignado a:</strong> ${ticket.assignee || "Sin asignar"}</p>
    <p><strong>Categoría:</strong> ${ticket.category}</p>
    <p><strong>Fecha:</strong> ${formatDate(ticket.date)}</p>
    <p><strong>Descripción:</strong> ${ticket.description}</p>
  `;

  document.getElementById("ticketModalBody").innerHTML = details;
  const modal = new bootstrap.Modal(document.getElementById("ticketModal"));
  modal.show();
}

// Funciones auxiliares / utilitarias
function getStatusText(status) {
  const statusMap = {
    pendiente: "Pendiente",
    esperando: "Esperando Respuesta",
    completado: "Completado",
  };
  return statusMap[status] || status;
}

function getStatusIcon(status) {
  const iconMap = {
    pendiente: '<i class="bi bi-clock"></i>',
    esperando: '<i class="bi bi-hourglass-split"></i>',
    completado: '<i class="bi bi-check-circle"></i>',
  };
  return iconMap[status] || "";
}

function getPriorityText(priority) {
  const priorityMap = {
    alta: "Alta",
    media: "Media",
    baja: "Baja",
  };
  return priorityMap[priority] || priority;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Validar formulario
function validateForm() {
  const title = document.getElementById("ticketTitle").value.trim();
  const description = document.getElementById("ticketDescription").value.trim();
  const priority = document.getElementById("ticketPriority").value;

  const isValid = title && description && priority;
  saveTicketBtn.disabled = !isValid;
}

// Mostrar alerta
function showAlert(message, type = "info", title = "Notificación") {
  // Crear elemento alerta
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText =
    "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
  alertDiv.innerHTML = `
        <strong>${title}:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  document.body.appendChild(alertDiv);

  // Remover automáticamente después de 5 segundos
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

// Terminar la sesión
function logout() {
  localStorage.removeItem("userLoggedIn");
  sessionStorage.removeItem("userLoggedIn");
  window.location.href = "/index.html";
}

// Mostrar nombre de usuario logueado
const userName = localStorage.getItem("userName");
const userDisplay = document.getElementById("userNameDisplay");
if (userName && userDisplay) {
  userDisplay.textContent = "¡Hola " + userName + "!";
}

// Inicializar tooltips
document.addEventListener("DOMContentLoaded", () => {
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll("[title]")
  );
  tooltipTriggerList.map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
  );
});

const categorySelect = document.getElementById("ticketCategory");
const token =
  localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

fetch("https://tickets.dev-wit.com/api/areas", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    if (!response.ok) {
      throw new Error("Error al obtener categorías");
    }
    return response.json();
  })
  .then((data) => {
    // Limpia el select si no quieres opciones fijas
    categorySelect.innerHTML =
      '<option value="">Seleccionar categoría</option>';

    data.forEach((area) => {
      const option = document.createElement("option");
      option.value = area.id;
      option.textContent = area.nombre;
      categorySelect.appendChild(option);
    });
  })
  .catch((error) => {
    console.error("Error cargando categorías:", error);
  });
