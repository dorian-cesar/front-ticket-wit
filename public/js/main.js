// Elementos del DOM
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");
const checkBoxRemember = document.getElementById("rememberMe");
const loginSpinner = document.getElementById("loginSpinner");
const loginText = document.getElementById("loginText");
const alertContainer = document.getElementById("alertContainer");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");

// Configuración de la aplicación
const APP_CONFIG = {
  maxLoginAttempts: 5,
  // lockoutTime: 300000, // 5 minutos en milisegundos
  lockoutTime: 3000, // prueba
};

// Estado de la aplicación
let loginAttempts = parseInt(localStorage.getItem("loginAttempts") || "0");
let lockoutTime = parseInt(localStorage.getItem("lockoutTime") || "0");

// Verificar si el usuario está bloqueado
function checkLockout() {
  const now = Date.now();
  if (lockoutTime > now) {
    disableForm(true);
    showLockoutCountdown(lockoutTime);
    return true;
  } else if (lockoutTime > 0) {
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
  checkBoxRemember.disabled = disable;
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

  // Auto-ocultar después de 5 segundos para mensajes informativos
  if (type === "info" || type === "success") {
    setTimeout(() => {
      const alert = alertContainer.querySelector(".alert");
      if (alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
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

  if (checkLockout()) return;

  if (!validateForm()) {
    showAlert("Por favor corrige los errores en el formulario.");
    return;
  }
  showLoading(true);

  try {
    // Llamada a API
    const result = await Login(emailInput.value, passwordInput.value);
    console.log(result);
    const token = result.token;
    const nombre = result.user.nombre;
    const mail = result.user.mail;
    const rol = result.user.rol;

    // Reset intentos en caso de éxito
    localStorage.removeItem("loginAttempts");
    localStorage.removeItem("lockoutTime");

    if (document.getElementById("rememberMe").checked) {
      localStorage.setItem("userLoggedIn", "true");
      localStorage.setItem("authToken", token);
      localStorage.setItem("userName", nombre);
      localStorage.setItem("userMail", mail);
      localStorage.setItem("userRole", rol);
    } else {
      sessionStorage.setItem("userLoggedIn", "true");
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("userName", nombre);
      sessionStorage.setItem("userMail", mail);
      sessionStorage.setItem("userRole", rol);
    }
    window.location.href = "/views/dashboard-crear.html";
    // window.location.href = "/views/options.html";
  } catch (error) {
    const isAuthError = [401, 403].includes(error.status);
    const isCredentialMessage = error.message
      .toLowerCase()
      .includes("credenciales");

    if (error.message === "Failed to fetch") {
      showAlert("Servidor caído. Intenta nuevamente más tarde.", "danger");
    } else if (isAuthError && isCredentialMessage) {
      handleLoginError(error.message);
    } else {
      showAlert(`Error al iniciar sesión: ${error.message}`, "danger");
    }
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
    disableForm(true);
    showLockoutCountdown(lockoutEnd);
  } else {
    const remainingAttempts = APP_CONFIG.maxLoginAttempts - loginAttempts;
    showAlert(`${message} Te quedan ${remainingAttempts} intento(s).`);
  }
}

// Muestra tiempo de lockout
function showLockoutCountdown(lockoutEnd) {
  const alertHTML = `
    <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      Demasiados intentos fallidos. Intenta nuevamente en <span id="lockout-timer"></span>.
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
  alertContainer.innerHTML = alertHTML;

  const timerSpan = document.getElementById("lockout-timer");

  function updateCountdown() {
    const now = Date.now();
    const remaining = lockoutEnd - now;

    if (remaining <= 0) {
      clearInterval(interval);
      showAlert("Ya puedes volver a iniciar sesión.", "success");
      disableForm(false);
      localStorage.removeItem("lockoutTime");
      localStorage.removeItem("loginAttempts");
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    timerSpan.textContent =
      minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }

  updateCountdown();
  const interval = setInterval(updateCountdown, 1000);
}

// Mostrar/ocultar loading
function showLoading(show) {
  if (show) {
    loginSpinner.classList.remove("d-none");
    loginText.textContent = "Verificando...";
  } else {
    loginSpinner.classList.add("d-none");
    loginText.textContent = "Iniciar Sesión";
  }
}

function Login(email, password) {
  return new Promise((resolve, reject) => {
    fetch("https://tickets.dev-wit.com/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          const errorMsg = errorData?.message || "Credenciales incorrectas.";
          const error = new Error(errorMsg);
          error.status = res.status;
          throw error;
        }
        return res.json();
      })
      .then((data) => {
        resolve({
          success: true,
          user: {
            id: data.user.id,
            nombre: data.user.nombre,
            mail: email,
            rol: data.user.rol,
          },
          token: data.token,
        });
      })
      .catch((err) => {
        reject(err);
      });
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
