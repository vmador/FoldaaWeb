# Configuración e Infraestructura (infra.md)

Foldaa utiliza un enfoque híbrido de vanguardia: **Supabase** es el orquestador (Control Plane) y **Cloudflare** es el entorno de ejecución (Data Plane).

## 1. Supabase (Control Plane)

El backend de Foldaa está alojado en Supabase, el cual provee:
- **Base de Datos (PostgreSQL):** Tabla `projects`, `users`, `marketplace_templates`.
- **Auth:** Para que los creadores hagan login en el CLI (`foldaa login`).
- **Edge Functions:** APIs que la CLI consume. Proveen seguridad (esconden los tokens API de Cloudflare master de Foldaa).
  - `deploy-worker`: Recibe un JSON, inyecta el código, llama a CF API y levanta el Worker.
  - `add-domain`: Llama a CF API para agregar un Custom Hostname.

## 2. Cloudflare (Data Plane)

Es donde corren las apps generadas de los usuarios finales (`mi-app.foldaa.com`).
- **Workers:** Cada app es un Cloudflare Worker que implementa el Proxy + Nodos.
- **KV Namespaces:** Guardan el estado (configuraciones rápidas, sesiones, carritos de compra, logs).

## 3. Flujo API de Despliegue (Orquestación)

Cuando un desarrollador ejecuta `foldaa deploy`:
1. El CLI lee el token de Supabase Auth del usuario local.
2. Hace un `POST https://<supabase-id>.supabase.co/functions/v1/deploy-worker` pasando el `app.json`.
3. Supabase Edge Function invoca el **Runtime Engine**, genera un archivo `worker.js` en string.
4. Supabase realiza un `PUT https://api.cloudflare.com/client/v4/accounts/<cf-id>/workers/scripts/<app-name>` anexando el string.
5. Supabase crea/modifica bindings de KV a través de llamadas subsecuentes a la API de Cloudflare.

Este diseño asegura que los tokens root de Cloudflare nunca tocan las máquinas de los usuarios, y centralizamos toda la lógica de construcción y facturación dentro de nuestro entorno de Supabase.
