document.addEventListener("DOMContentLoaded", () => {
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("email");
  const resetSpinner = document.getElementById("resetSpinner");
  const resetText = document.getElementById("resetText");
  const alertContainer = document.getElementById("alertContainer");

  // Cambiar título y subtítulo si proviene de "changePasswordLink"
  const urlParams = new URLSearchParams(window.location.search);
  const origin = urlParams.get("origin");

  if (origin === "change") {
    const title = document.getElementById("forgotTitle");
    const subtitle = document.getElementById("forgotSubtitle");
    const emailInfo = document.getElementById("emailInfoText");

    title.textContent = "Cambiar Contraseña";
    subtitle.textContent =
      "Ingresa tu email para recibir instrucciones y cambiar tu contraseña";
    emailInfo.innerHTML = `
    <i class="bi bi-info-circle me-1"></i>
    Te enviaremos un enlace para cambiar tu contraseña
  `;
  }

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

  // Validación de email en tiempo real
  emailInput.addEventListener("input", function () {
    const email = this.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === "") {
      this.classList.remove("is-valid", "is-invalid");
    } else if (emailRegex.test(email)) {
      this.classList.remove("is-invalid");
      this.classList.add("is-valid");
    } else {
      this.classList.remove("is-valid");
      this.classList.add("is-invalid");
    }
  });

  // Manejo del formulario
  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validación
    if (!email) {
      emailInput.classList.add("is-invalid");
      showAlert("Por favor ingresa tu email.", "danger");
      emailInput.focus();
      return;
    }

    if (!emailRegex.test(email)) {
      emailInput.classList.add("is-invalid");
      showAlert("Por favor ingresa un email válido.", "danger");
      emailInput.focus();
      return;
    }

    // Loader
    resetSpinner.classList.remove("d-none");
    resetText.innerHTML = "Enviando...";
    forgotPasswordForm.querySelector('button[type="submit"]').disabled = true;

    try {
      const response = await fetch(
        "https://tickets.dev-wit.com/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email }),
        }
      );

      if (response.ok) {
        const successTitle =
          origin === "change" ? "¡Enlace enviado!" : "¡Instrucciones enviadas!";
        const successMessage =
          origin === "change"
            ? `Hemos enviado un enlace para cambiar tu contraseña a <strong>${email}</strong>.`
            : `Hemos enviado un enlace de recuperación a <strong>${email}</strong>.`;

        showAlert(
          `
      <i class="bi bi-check-circle me-2"></i>
      <strong>${successTitle}</strong><br>
      ${successMessage}<br>
      Revisa tu bandeja de entrada.
    `,
          "success"
        );
        forgotPasswordForm.reset();
        emailInput.classList.remove("is-valid", "is-invalid");
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 8000);
      } else {
        const errorData = await response.json();
        showAlert(
          `
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> ${
                      errorData.message ||
                      "No se pudo enviar el email de recuperación."
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
                <strong>Error de conexión:</strong> No se pudo conectar con el servidor. Inténtalo más tarde.
            `,
        "danger"
      );
    } finally {
      resetSpinner.classList.add("d-none");
      resetText.innerHTML =
        '<i class="bi bi-send me-1"></i>Enviar Instrucciones';
      forgotPasswordForm.querySelector(
        'button[type="submit"]'
      ).disabled = false;
    }
  });
  emailInput.focus();
});
