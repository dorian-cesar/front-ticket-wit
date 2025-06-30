document.addEventListener("DOMContentLoaded", () => {
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById(
    "toggleConfirmPassword"
  );
  const resetSpinner = document.getElementById("resetSpinner");
  const resetText = document.getElementById("resetText");
  const submitBtn = document.getElementById("submitBtn");
  const alertContainer = document.getElementById("alertContainer");
  const invalidTokenContainer = document.getElementById(
    "invalidTokenContainer"
  );
  const strengthBar = document.getElementById("strengthBar");
  const strengthText = document.getElementById("strengthText");

  // Obtener token de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  // Verificar si hay token
  if (!token) {
    showInvalidToken();
    return;
  }

  // Verificar token al cargar la página
  verifyToken(token);

  // Elementos de requisitos
  const requirements = {
    length: document.getElementById("req-length"),
    uppercase: document.getElementById("req-uppercase"),
    lowercase: document.getElementById("req-lowercase"),
    number: document.getElementById("req-number"),
    special: document.getElementById("req-special"),
  };

  // Función para mostrar token inválido
  function showInvalidToken() {
    resetPasswordForm.style.display = "none";
    invalidTokenContainer.classList.remove("d-none");
  }

  // Función para verificar token
//   async function verifyToken(token) {
//     try {
//       const response = await fetch("/api/verify-reset-token", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ token }),
//       });

//       if (!response.ok) {
//         showInvalidToken();
//       }
//     } catch (error) {
//       console.error("Error verificando token:", error);
//       showInvalidToken();
//     }
//   }

  // Función para mostrar alertas
  function showAlert(message, type = "info") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    alertContainer.innerHTML = "";
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }

  // Toggle password visibility
  togglePassword.addEventListener("click", () => {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    togglePassword.querySelector("i").className =
      type === "password" ? "bi bi-eye" : "bi bi-eye-slash";
  });

  toggleConfirmPassword.addEventListener("click", () => {
    const type =
      confirmPasswordInput.getAttribute("type") === "password"
        ? "text"
        : "password";
    confirmPasswordInput.setAttribute("type", type);
    toggleConfirmPassword.querySelector("i").className =
      type === "password" ? "bi bi-eye" : "bi bi-eye-slash";
  });

  // Validación de fortaleza de contraseña
  function checkPasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Actualizar requisitos visuales
    Object.keys(checks).forEach((key) => {
      const element = requirements[key];
      if (checks[key]) {
        element.classList.add("valid");
        element.querySelector("i").className =
          "bi bi-check-circle-fill text-success";
      } else {
        element.classList.remove("valid");
        element.querySelector("i").className = "bi bi-x-circle text-danger";
      }
    });

    // Calcular puntuación
    const score = Object.values(checks).filter(Boolean).length;
    let strength = "";
    let barClass = "";
    let width = 0;

    switch (score) {
      case 0:
      case 1:
        strength = "Muy débil";
        barClass = "bg-danger";
        width = 20;
        break;
      case 2:
        strength = "Débil";
        barClass = "bg-danger";
        width = 40;
        break;
      case 3:
        strength = "Regular";
        barClass = "bg-warning";
        width = 60;
        break;
      case 4:
        strength = "Buena";
        barClass = "bg-info";
        width = 80;
        break;
      case 5:
        strength = "Muy fuerte";
        barClass = "bg-success";
        width = 100;
        break;
    }

    // Actualizar barra de progreso
    strengthBar.className = `progress-bar ${barClass}`;
    strengthBar.style.width = `${width}%`;
    strengthText.textContent = `Fortaleza: ${strength}`;
    strengthText.className = `form-text ${barClass.replace("bg-", "text-")}`;

    return score >= 4; // Requiere al menos 4 de 5 criterios
  }

  // Validación en tiempo real
  passwordInput.addEventListener("input", function () {
    const password = this.value;
    const isStrong = checkPasswordStrength(password);

    if (password === "") {
      this.classList.remove("is-valid", "is-invalid");
    } else if (isStrong) {
      this.classList.remove("is-invalid");
      this.classList.add("is-valid");
    } else {
      this.classList.remove("is-valid");
      this.classList.add("is-invalid");
    }

    validateForm();
  });

  // Validación de confirmación de contraseña
  confirmPasswordInput.addEventListener("input", function () {
    const password = passwordInput.value;
    const confirmPassword = this.value;

    if (confirmPassword === "") {
      this.classList.remove("is-valid", "is-invalid");
    } else if (password === confirmPassword && password !== "") {
      this.classList.remove("is-invalid");
      this.classList.add("is-valid");
    } else {
      this.classList.remove("is-valid");
      this.classList.add("is-invalid");
    }

    validateForm();
  });

  // Validar formulario completo
  function validateForm() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const isPasswordStrong = checkPasswordStrength(password);
    const passwordsMatch = password === confirmPassword && password !== "";

    submitBtn.disabled = !(isPasswordStrong && passwordsMatch);
  }

  // Manejo del formulario
  resetPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validaciones finales
    if (!checkPasswordStrength(password)) {
      showAlert(
        "La contraseña no cumple con los requisitos mínimos.",
        "danger"
      );
      passwordInput.focus();
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Las contraseñas no coinciden.", "danger");
      confirmPasswordInput.focus();
      return;
    }

    // Mostrar loading
    resetSpinner.classList.remove("d-none");
    resetText.textContent = "Estableciendo...";
    submitBtn.disabled = true;

    try {
      const response = await fetch(`https://tickets.dev-wit.com/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: password
        }),
      });

      if (response.ok) {
        showAlert(
          `
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>¡Contraseña actualizada exitosamente!</strong><br>
                    Tu contraseña ha sido cambiada. Serás redirigido al login.
                `,
          "success"
        );

        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 3000);
      } else {
        const errorData = await response.json();
        showAlert(
          `
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> ${
                      errorData.message ||
                      "No se pudo actualizar la contraseña."
                    }
                `,
          "danger"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert(
        `
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error de conexión:</strong> No se pudo conectar con el servidor.
            `,
        "danger"
      );
    } finally {
      resetSpinner.classList.add("d-none");
      resetText.innerHTML =
        '<i class="bi bi-check-circle me-1"></i>Establecer Nueva Contraseña';
      submitBtn.disabled = false;
    }
  });
  passwordInput.focus();
});
