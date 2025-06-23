// Variables globales
let isNavigating = false

// Inicialización cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  initializePage()
  addAnimations()
  loadUserData()
})

// Inicializar la página
function initializePage() {
  console.log("Sistema de Tickets - Página de Selección Cargada")

  // Agregar event listeners para teclado
  document.addEventListener("keydown", handleKeyboardNavigation)

  // Agregar efectos de hover adicionales
  addHoverEffects()

  // Verificar autenticación (opcional)
  checkAuthentication()
}

// Navegación principal
function navigateTo(option) {
  if (isNavigating) return

  isNavigating = true
  showLoading()

  // Simular tiempo de carga
  setTimeout(() => {
    switch (option) {
      case "crear":
        // Redirigir al dashboard de crear tickets
        window.location.href = "dashboard-crear.html"
        break
      case "resolver":
        // Redirigir al dashboard de resolver tickets
        window.location.href = "dashboard-resolver.html"
        break
      default:
        console.error("Opción no válida:", option)
        hideLoading()
        isNavigating = false
    }
  }, 1000)
}

// Mostrar overlay de carga
function showLoading() {
  const overlay = document.getElementById("loadingOverlay")
  overlay.style.display = "flex"
  document.body.style.overflow = "hidden"
}

// Ocultar overlay de carga
function hideLoading() {
  const overlay = document.getElementById("loadingOverlay")
  overlay.style.display = "none"
  document.body.style.overflow = "auto"
  isNavigating = false
}

// Función de logout
function logout() {
  if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
    showLoading()

    // Limpiar datos de sesión
    localStorage.removeItem("userToken")
    sessionStorage.clear()

    setTimeout(() => {
      // Redirigir al login
      window.location.href = "login.html"
    }, 1000)
  }
}

// Navegación por teclado
function handleKeyboardNavigation(event) {
  switch (event.key) {
    case "1":
      navigateTo("crear")
      break
    case "2":
      navigateTo("resolver")
      break
    case "Escape":
      if (confirm("¿Deseas cerrar sesión?")) {
        logout()
      }
      break
  }
}

// Agregar animaciones a los elementos
function addAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in")
      }
    })
  })

  // Observar elementos para animaciones
  document.querySelectorAll(".option-card, .stat-item").forEach((el) => {
    observer.observe(el)
  })

  // Animaciones específicas para las tarjetas
  setTimeout(() => {
    const createCard = document.querySelector(".create-card")
    const resolveCard = document.querySelector(".resolve-card")

    if (createCard) createCard.classList.add("slide-in-left")
    if (resolveCard) resolveCard.classList.add("slide-in-right")
  }, 300)
}

// Efectos de hover adicionales
function addHoverEffects() {
  const cards = document.querySelectorAll(".option-card")

  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-8px) scale(1.02)"
    })

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)"
    })

    // Efecto de click
    card.addEventListener("mousedown", function () {
      this.style.transform = "translateY(-4px) scale(0.98)"
    })

    card.addEventListener("mouseup", function () {
      this.style.transform = "translateY(-8px) scale(1.02)"
    })
  })
}

// Cargar datos del usuario
function loadUserData() {
  // Simular carga de datos del usuario
  const userData = {
    name: "Usuario Demo",
    role: "Administrador",
    lastLogin: new Date().toLocaleDateString(),
  }

  // Actualizar información del usuario en la interfaz
  const welcomeText = document.querySelector(".welcome-text")
  if (welcomeText) {
    welcomeText.textContent = `Bienvenido, ${userData.name}`
  }

  // Cargar estadísticas (simuladas)
  loadStats()
}

// Cargar estadísticas
function loadStats() {
  // Simular datos de estadísticas
  const stats = {
    active: Math.floor(Math.random() * 50) + 10,
    pending: Math.floor(Math.random() * 20) + 5,
    resolved: Math.floor(Math.random() * 200) + 100,
  }

  // Actualizar números con animación
  animateNumbers(stats)
}

// Animar números de estadísticas
function animateNumbers(stats) {
  const statNumbers = document.querySelectorAll(".stat-number")

  statNumbers.forEach((element, index) => {
    const finalValue = Object.values(stats)[index]
    let currentValue = 0
    const increment = finalValue / 30

    const timer = setInterval(() => {
      currentValue += increment
      if (currentValue >= finalValue) {
        element.textContent = finalValue
        clearInterval(timer)
      } else {
        element.textContent = Math.floor(currentValue)
      }
    }, 50)
  })
}

// Verificar autenticación
function checkAuthentication() {
  const token = localStorage.getItem("userToken")

  if (!token) {
    console.warn("No se encontró token de autenticación")
    // Opcional: redirigir al login si no hay token
    // window.location.href = 'login.html';
  }
}

// Funciones de utilidad
function showNotification(message, type = "info") {
  // Crear notificación temporal
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

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
    `

  // Color según el tipo
  switch (type) {
    case "success":
      notification.style.background = "var(--success-color)"
      break
    case "error":
      notification.style.background = "var(--danger-color)"
      break
    case "warning":
      notification.style.background = "var(--warning-color)"
      break
    default:
      notification.style.background = "var(--accent-color)"
  }

  document.body.appendChild(notification)

  // Remover después de 3 segundos
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease-out"
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

// Manejo de errores globales
window.addEventListener("error", (event) => {
  console.error("Error en la aplicación:", event.error)
  showNotification("Ha ocurrido un error inesperado", "error")
})

// Prevenir navegación accidental
window.addEventListener("beforeunload", (event) => {
  if (isNavigating) {
    event.preventDefault()
    event.returnValue = ""
  }
})
