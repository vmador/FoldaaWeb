# API: Foldaa Platform

Foldaa expone una API que coordina la generación de manifestos y la gestión de deployments.

### Flujo típico

1. El CLI envía una solicitud `POST /apps` con la URL de origen.
2. La API genera un manifest `app.json` basado en la URL y las opciones del usuario.
3. La API invoca el runtime para generar workers y rutas.
4. La API reporta estado al CLI y a la UI del marketplace.

### Endpoints clave

- `POST /apps` — crea una nueva app y genera manifest
- `PUT /apps/:id` — actualiza configuración o features
- `POST /apps/:id/deploy` — dispara despliegue en Cloudflare
- `GET /apps/:id/status` — estado de deployment y runtime
- `POST /marketplace/publish` — publica app en marketplace
- `POST /marketplace/clone` — clona app existente
