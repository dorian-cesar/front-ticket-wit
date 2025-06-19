// Almacenamiento de datos de tickets
let tickets1 = [
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

// let nextTicketId = 6;

// Elementos del DOM
const ticketsTableBody = document.getElementById("ticketsTableBody");
const ticketsLoader = document.getElementById("ticketsLoader");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const searchInput = document.getElementById("searchInput");
const createTicketForm = document.getElementById("createTicketForm");
const saveTicketBtn = document.getElementById("saveTicketBtn");
const updateTicketBtn = document.getElementById("updateTicketBtn");
const token =
  localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
const userMail =
  localStorage.getItem("userMail") || sessionStorage.getItem("userMail");
let usersData = [];
let tiposAtencion = [];
let areas = [];
let tickets = [];

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
  // Limpiar tabla
  ticketsTableBody.innerHTML = "";

  // Validar si aún se está cargando (ticketsToRender no es array válido)
  const isLoading = !Array.isArray(ticketsToRender);

  if (isLoading) {
    ticketsLoader.style.display = "flex";
    return;
  }

  // Si es array válido pero vacío → sin resultados
  if (ticketsToRender.length === 0) {
    ticketsLoader.style.display = "none";
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

  // Si hay datos válidos
  ticketsLoader.style.display = "none";

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
          ${getStatusIcon(ticket.status)} ${getStatusText(ticket.status)}
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
            ? `<div class="d-flex align-items-center">
                <i class="bi bi-person-circle me-2"></i>
                ${ticket.assignee}
              </div>`
            : '<span class="text-muted">Sin asignar</span>'
        }
      </td>
      <td><small>${formatDate(ticket.date)}</small></td>
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
async function createTicket() {
  const saveBtn = document.getElementById("saveTicketBtn");
  const btnSpinner = document.getElementById("btnSpinner");
  const btnIcon = document.getElementById("btnIcon");
  const btnText = document.getElementById("btnText");

  btnSpinner.classList.remove("d-none");
  btnIcon.classList.add("d-none");
  btnText.textContent = "Creando...";
  saveBtn.disabled = true;

  const title = document.getElementById("ticketTitle").value.trim();
  const priority = document.getElementById("ticketPriority").value;
  const areaSolicitante = parseInt(
    document.getElementById("ticketAssignee").value,
    10
  );
  const tipoAtencion = parseInt(
    document.getElementById("ticketCategory").value,
    10
  );
  const description = document.getElementById("ticketDescription").value.trim();

  if (!title || !priority || !description) {
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
      "danger"
    );

    btnSpinner.classList.add("d-none");
    btnIcon.classList.remove("d-none");
    btnText.textContent = "Crear Ticket";
    saveBtn.disabled = false;
    return;
  }

  const newTicket = {
    solicitante_id: solicitante.id,
    area_id: tipoAtencion,
    tipo_atencion_id: areaSolicitante,
    observaciones: description,
  };

  try {
    const response = await fetch(
      "https://tickets.dev-wit.com/api/tickets/crear",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTicket),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al crear el ticket");
    }

    const result = await response.json();

    tickets.unshift(result);
    renderTickets();
    updateStats();

    createTicketForm.reset();
    const modalElement = document.getElementById("createTicketModal");
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();

    console.log("data para crear ticket", newTicket);
    showAlert("Ticket creado exitosamente!", "success");
  } catch (error) {
    console.error("Error al crear ticket:", error);
    showAlert("No se pudo crear el ticket. " + error.message, "danger");
  } finally {
    btnSpinner.classList.add("d-none");
    btnIcon.classList.remove("d-none");
    btnText.textContent = "Crear Ticket";
    saveBtn.disabled = false;
  }
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
  Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción eliminará el ticket permanentemente.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e64545",
    cancelButtonColor: "#34495e",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      tickets = tickets.filter((t) => t.id !== id);
      renderTickets();
      updateStats();
      showAlert("Ticket eliminado exitosamente!", "success");
    }
  });
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
  return luxon.DateTime.fromISO(dateString, { zone: "America/Santiago" })
    .setLocale("es")
    .toFormat("d LLL yyyy");
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
  localStorage.removeItem("userLoggedIn");
  sessionStorage.removeItem("userLoggedIn");
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
  localStorage.removeItem("userName");
  sessionStorage.removeItem("userName");
  localStorage.removeItem("userMail");
  sessionStorage.removeItem("userMail");
  localStorage.removeItem("userRole");
  sessionStorage.removeItem("userRole");

  window.location.href = "/index.html";
}

// Mostrar nombre de usuario logueado
const userName =
  sessionStorage.getItem("userName") || localStorage.getItem("userName");
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
      throw new Error("Error al obtener categorías");
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
    console.log("tiposAreas", areas);
  })
  .catch((error) => {
    console.error("Error cargando categorías:", error);
  });

const tipoSelect = document.getElementById("ticketAssignee");
const tipoSelectEdit = document.getElementById("editTicketAssignee");

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
    // Limpia y agrega opción por defecto
    tipoSelect.innerHTML = '<option value="">Sin asignar</option>';
    tipoSelectEdit.innerHTML = '<option value="">Sin asignar</option>';

    data.forEach((tipo) => {
      const option1 = document.createElement("option");
      option1.value = tipo.id;
      option1.textContent = tipo.nombre;
      tipoSelect.appendChild(option1);

      const option2 = document.createElement("option");
      option2.value = tipo.id;
      option2.textContent = tipo.nombre;
      tipoSelectEdit.appendChild(option2);
    });
    console.log("tiposAtencion", tiposAtencion);
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
    console.log("usersData", usersData);
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
        showAlert("No se encontró el usuario en la lista de datos.", "danger");
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
        priority: t.prioridad || "media",
      }));

      console.log("Tickets transformados:", tickets);
      renderTickets(tickets);
      updateStats();
    })
    .catch((err) => {
      console.error("Error cargando tickets:", err);
      showAlert("No se pudieron cargar los tickets.", "warning");
    });
});
