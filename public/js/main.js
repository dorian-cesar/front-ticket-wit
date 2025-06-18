// Elementos del DOM
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");
const loginSpinner = document.getElementById("loginSpinner");
const loginText = document.getElementById("loginText");
const alertContainer = document.getElementById("alertContainer");
const loadingOverlay = document.getElementById("loadingOverlay");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");

// Configuración de la aplicación
const APP_CONFIG = {
  maxLoginAttempts: 5,
  lockoutTime: 300000, // 5 minutos en milisegundos
};

// Estado de la aplicación
let loginAttempts = parseInt(localStorage.getItem("loginAttempts") || "0");
let lockoutTime = parseInt(localStorage.getItem("lockoutTime") || "0");

// Verificar si el usuario está bloqueado
function checkLockout() {
  const now = Date.now();
  if (lockoutTime > now) {
    const remainingTime = Math.ceil((lockoutTime - now) / 60000);
    showAlert(
      `Demasiados intentos fallidos. Intenta nuevamente en ${remainingTime} minuto(s).`,
      "warning"
    );
    disableForm(true);
    return true;
  } else if (lockoutTime > 0) {
    // Reset lockout
    localStorage.removeItem("lockoutTime");
    localStorage.removeItem("loginAttempts");
    loginAttempts = 0;
    disableForm(false);
  }
  return false;
}

// Deshabilitar/habilitar formulario
function disableForm(disable) {
  emailInput.disabled = disable;
  passwordInput.disabled = disable;
  togglePasswordBtn.disabled = disable;
  loginForm.querySelector('button[type="submit"]').disabled = disable;
}

// Toggle para mostrar/ocultar contraseña
togglePasswordBtn.addEventListener("click", function () {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);

  const icon = this.querySelector("i");
  icon.classList.toggle("bi-eye");
  icon.classList.toggle("bi-eye-slash");
});

// Función para mostrar alertas
function showAlert(message, type = "danger") {
  const iconMap = {
    success: "check-circle-fill",
    danger: "exclamation-triangle-fill",
    warning: "exclamation-triangle-fill",
    info: "info-circle-fill",
  };

  const alertHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    <i class="bi bi-${iconMap[type]} me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
  alertContainer.innerHTML = alertHTML;

  // Auto-ocultar después de 8 segundos para mensajes informativos
  if (type === "info" || type === "success") {
    setTimeout(() => {
      const alert = alertContainer.querySelector(".alert");
      if (alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 8000);
  }
}

// Validación del formulario
function validateForm() {
  let isValid = true;

  // Validar email
  if (!emailInput.value || !isValidEmail(emailInput.value)) {
    emailInput.classList.add("is-invalid");
    isValid = false;
  } else {
    emailInput.classList.remove("is-invalid");
    emailInput.classList.add("is-valid");
  }

  // Validar contraseña
  if (!passwordInput.value || passwordInput.value.length < 4) {
    passwordInput.classList.add("is-invalid");
    const feedback =
      passwordInput.parentElement.querySelector(".invalid-feedback");
    feedback.textContent =
      passwordInput.value.length === 0
        ? "La contraseña es requerida."
        : "La contraseña debe tener al menos 4 caracteres.";
    isValid = false;
  } else {
    passwordInput.classList.remove("is-invalid");
    passwordInput.classList.add("is-valid");
  }

  return isValid;
}

// Función para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Limpiar validación al escribir
[emailInput, passwordInput].forEach((input) => {
  input.addEventListener("input", function () {
    if (this.classList.contains("is-invalid")) {
      this.classList.remove("is-invalid");
    }
  });
});

// Manejar envío del formulario
loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  // Verificar lockout
  if (checkLockout()) return;

  if (!validateForm()) {
    showAlert("Por favor corrige los errores en el formulario.");
    return;
  }

  // Mostrar loading
  showLoading(true);

  try {
    // Simular llamada a API
    const result = await simulateLogin(emailInput.value, passwordInput.value);

    // Reset intentos en caso de éxito
    localStorage.removeItem("loginAttempts");
    localStorage.removeItem("lockoutTime");

    // Guardar sesión
    if (document.getElementById("rememberMe").checked) {
      localStorage.setItem("userLoggedIn", "true"); // sesión persistente
    } else {
      sessionStorage.setItem("userLoggedIn", "true"); // sesión solo hasta cerrar pestaña
    }

    // Redirección
    window.location.href = "/views/dashboard1.html";
  } catch (error) {
    handleLoginError(error.message);
  } finally {
    showLoading(false);
  }
});

// Manejar errores de login
function handleLoginError(message) {
  loginAttempts++;
  localStorage.setItem("loginAttempts", loginAttempts.toString());

  if (loginAttempts >= APP_CONFIG.maxLoginAttempts) {
    const lockoutEnd = Date.now() + APP_CONFIG.lockoutTime;
    localStorage.setItem("lockoutTime", lockoutEnd.toString());
    showAlert(
      `Demasiados intentos fallidos. Acceso bloqueado por 5 minutos. Contacta a soporte si necesitas ayuda.`,
      "warning"
    );
    disableForm(true);
  } else {
    const remainingAttempts = APP_CONFIG.maxLoginAttempts - loginAttempts;
    showAlert(`${message} Te quedan ${remainingAttempts} intento(s).`);
  }
}

// Mostrar/ocultar loading
function showLoading(show) {
  if (show) {
    loadingOverlay.style.display = "flex";
    loginSpinner.classList.remove("d-none");
    loginText.textContent = "Verificando...";
  } else {
    loadingOverlay.style.display = "none";
    loginSpinner.classList.add("d-none");
    loginText.textContent = "Iniciar Sesión";
  }
}

// Simular llamada a API de login
function simulateLogin(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Credenciales de prueba para herramienta interna
      const validCredentials = [
        {
          email: "admin@wit.com",
          password: "admin123",
          role: "Administrador",
        },
        { email: "usuario@wit.com", password: "user123", role: "Usuario" },
        {
          email: "soporte@wit.com",
          password: "soporte123",
          role: "Soporte",
        },
      ];

      const user = validCredentials.find(
        (cred) => cred.email === email && cred.password === password
      );

      if (user) {
        resolve({
          success: true,
          user: {
            email: user.email,
            role: user.role,
            loginTime: new Date().toISOString(),
          },
        });
      } else {
        reject(new Error("Credenciales incorrectas."));
      }
    }, 2000); // Simular delay de red más realista
  });
}

// Manejar enlace de "¿Olvidaste la contraseña?"
forgotPasswordLink.addEventListener("click", function (e) {
  e.preventDefault();
  showAlert(
    "Para restablecer tu contraseña o resolver problemas de acceso, contacta al departamento de TI en la extensión 1234 o envía un email a soporte@empresa.com",
    "info"
  );
});

// Verificar lockout al cargar la página
document.addEventListener("DOMContentLoaded", function () {
  checkLockout();

  // Animación de entrada
  const loginContainer = document.querySelector(".login-container");
  loginContainer.style.opacity = "0";
  loginContainer.style.transform = "translateY(30px)";

  setTimeout(() => {
    loginContainer.style.transition = "all 0.6s ease";
    loginContainer.style.opacity = "1";
    loginContainer.style.transform = "translateY(0)";
  }, 200);
});

// Limpiar datos sensibles al cerrar/recargar
window.addEventListener("beforeunload", function () {
  // Limpiar campos de contraseña
  passwordInput.value = "";
});
