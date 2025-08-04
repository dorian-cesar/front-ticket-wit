# Mesa de Ayuda Pullman Bus

Sistema web para la gestión de tickets de soporte interno, desarrollado para Pullman Bus. Permite la creación, seguimiento, edición y cierre de tickets por distintos roles (solicitante, ejecutor, jefatura, admin).

## Estructura del Proyecto

```
public/
  ├── index.html
  ├── views/
  │     ├── dashboard-crear.html
  │     └── ...
  ├── js/
  │     ├── dashboard-crear.js
  │     ├── dashboard-admin.js
  │     ├── dashboard-jefatura.js
  │     ├── dashboard-resolver.js
  │     ├── main.js
  │     ├── options.js
  │     └── ...
  ├── css/
  │     ├── dashboard-crear.css
  │     └── ...
  └── img/
        └── logo.png
server.js
package.json
README.md
.gitignore
```

## Instalación

1. Clona el repositorio:
   ```sh
   git clone <URL-del-repo>
   cd tickets-pullman2
   ```
2. Instala dependencias:
   ```sh
   npm install
   ```

## Uso

1. Inicia el servidor:
   ```sh
   node server.js
   ```
2. Accede a la aplicación en [http://localhost:8080](http://localhost:8080).

## Características

- **Login y autenticación** por roles.
- **Creación y edición de tickets** con adjuntos (PDF, imágenes).
- **Paneles de control** para cada rol.
- **Historial y seguimiento** de estados.
- **Descarga de certificados PDF** de tickets cerrados.
- **Filtros y búsqueda avanzada**.

## Tecnologías

- **Frontend:** HTML, CSS (Bootstrap), JavaScript (Vanilla)
- **Backend:** Node.js (Express)
- **Dependencias:** Bootstrap, SweetAlert2, Luxon, html2pdf.js

## Contribución

1. Haz un fork del repositorio.
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit.
4. Envía un pull request.

## Licencia

Este proyecto es propiedad de WIT y Pullman Bus. Uso interno.

---

Mesa de Ayuda Pullman Bus | WIT © 2025
