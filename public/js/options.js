const userRole =
  localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
const userName =
  localStorage.getItem("userName") || sessionStorage.getItem("userName");

document.addEventListener("DOMContentLoaded", () => {
  initializePage();
  addAnimations();
  loadUserData();
});

// Inicializar la página
function initializePage() {
  // Agregar efectos de hover adicionales
  addHoverEffects();

  // Verificar autenticación (opcional)
  checkAuthentication();
}

// Navegación principal
function navigateTo(option) {
  switch (option) {
    case "crear":
      window.location.href = "dashboard-crear.html";
      break;
    case "resolver":
      window.location.href = "dashboard-resolver.html";
      break;
    case "gestionar":
      window.location.href = "dashboard-jefatura.html";
      break;
    case "mantenedor":
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");

      if (token) {
        const mantenedorWindow = window.open(
          "https://localhost:3000/dashboard.html"
        );

        function sendTokenListener(e) {
          if (
            e.origin === "https://localhost:3000" &&
            e.data === "READY_FOR_TOKEN"
          ) {
            mantenedorWindow.postMessage(
              { type: "token", token: token },
              e.origin
            );
            window.removeEventListener("message", sendTokenListener);
          }
        }

        window.addEventListener("message", sendTokenListener);
      } else {
        showNotification("No se encontró un token de sesión", "error");
      }
      break;
    default:
      console.error("Opción no válida:", option);
  }
}

// Función de logout
function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "../index.html";
}

// Agregar animaciones a los elementos
function addAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in");
      }
    });
  });

  // Observar elementos para animaciones
  document.querySelectorAll(".option-card, .stat-item").forEach((el) => {
    observer.observe(el);
  });
}

// Efectos de hover adicionales
function addHoverEffects() {
  const cards = document.querySelectorAll(".option-card");

  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-8px) scale(1.02)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)";
    });

    // Efecto de click
    card.addEventListener("mousedown", function () {
      this.style.transform = "translateY(-4px) scale(0.98)";
    });

    card.addEventListener("mouseup", function () {
      this.style.transform = "translateY(-8px) scale(1.02)";
    });
  });
}

// Cargar datos del usuario
function loadUserData() {
  // Simular carga de datos del usuario
  const userData = {
    name: userName,
    role: userRole,
    lastLogin: new Date().toLocaleDateString(),
  };

  // Actualizar información del usuario en la interfaz
  const welcomeText = document.querySelector(".welcome-text");
  if (welcomeText) {
    welcomeText.textContent = `¡Bienvenido(a), ${userData.name}!`;
  }
}

// Animar números de estadísticas
function animateNumbers(stats) {
  const statNumbers = document.querySelectorAll(".stat-number");

  statNumbers.forEach((element, index) => {
    const finalValue = Object.values(stats)[index];
    let currentValue = 0;
    const increment = finalValue / 30;

    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= finalValue) {
        element.textContent = finalValue;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(currentValue);
      }
    }, 50);
  });
}

// Verificar autenticación
function checkAuthentication() {
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  if (!token) {
    console.warn("No se encontró token de autenticación");
    // window.location.href = '../index.html';
  }
}

// Funciones de utilidad
function showNotification(message, type = "info") {
  // Crear notificación temporal
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Estilos para la notificación
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;

  // Color según el tipo
  switch (type) {
    case "success":
      notification.style.background = "var(--success-color)";
      break;
    case "error":
      notification.style.background = "var(--danger-color)";
      break;
    case "warning":
      notification.style.background = "var(--warning-color)";
      break;
    default:
      notification.style.background = "var(--accent-color)";
  }

  document.body.appendChild(notification);

  // Remover después de 3 segundos
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease-out";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Manejo de errores globales
window.addEventListener("error", (event) => {
  console.error("Error en la aplicación:", event.error);
  showNotification("Ha ocurrido un error inesperado", "error");
});
