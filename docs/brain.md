# Foldaa Brain 🧠

## 1. ¿Qué es Foldaa?
Foldaa es un generador de apps PWA y Web Apps basado en URLs. Su objetivo principal es ofrecer **cero-fricción** al convertir cualquier diseño web existente en una aplicación real y robusta. 

Todo esto está soportado por una **arquitectura híbrida**:
- **Control Plane (Supabase):** Gestiona a los usuarios (creadores), el marketplace, las configuraciones de los proyectos y **orquesta los despliegues** a través de Supabase Edge Functions.
- **Data Plane / Edge Engine (Cloudflare):** Ejecuta las aplicaciones generadas (Workers), almacena estado súper rápido (KV) y gestiona los dominios personalizados de cara a los usuarios finales.

## 2. Arquitectura de Alto Nivel
La arquitectura se divide en 4 pilares:
1. **CLI (`foldaa`)**: La interfaz única del desarrollador. Lee la carpeta local (`app.json`, `nodes.md`) y se comunica con la API de Supabase.
2. **Control API (Supabase Edge Functions)**: Funciones como `deploy-worker`, `setup-domain`, etc. Reciben los manifiestos, compilan el código del Worker dinámicamente usando el Runtime Engine y se comunican con la **API de Cloudflare** para publicar la app.
3. **Cloudflare Worker (El Core)**: El ejecutable inyectado en la red global de Cloudflare. Actúa como proxy reescribiendo la URL original, interceptando rutas, manejando analíticas y Auth.
4. **Cloudflare KV**: Almacenamiento rápido en el edge para sesiones de las apps generadas, caché y analíticas.

## 3. Flujo General (End-to-End)
### A. Inicialización
El usuario ejecuta `foldaa create https://aural.framer.website`.
- Foldaa crea un `app.json` definiendo la `originUrl`.
- Crea el esqueleto local mínimo.

### B. Extensibilidad (Nodos y Workflows)
El usuario ejecuta `foldaa add auth` o `foldaa add payments`.
- El CLI actualiza localmente el `app.json`.

### C. Despliegue (La Magia Híbrida)
El usuario ejecuta `foldaa deploy`.
- El CLI empaqueta el `app.json` y los assets locales y hace un request a la función **Supabase Edge Function: `deploy-worker`**.
- La función en Supabase:
  1. Utiliza el **Runtime Engine** (internamente en Supabase) para generar el archivo `worker.js` combinando el proxy base + middlewares activados.
  2. Llama a la **API de Registro de Cloudflare** para crear los namespaces KV (`FOLDAA_KV`, `ANALYTICS_KV`).
  3. Sube el script a Cloudflare Workers vía API.
  4. Retorna el subdominio `mi-app.foldaa.com` al CLI.

### D. Custom Domains
`foldaa domain miapp custom.com`.
- CLI llama a Supabase Edge Function `setup-domain`.
- Supabase llama a la API de Cloudflare for SaaS para proveer el custom hostname y SSL.

## 4. Filosofía de Diseño
- **Supabase como Cerebro**: Toda la lógica compleja de negocio de Foldaa (cobros a los creadores, autenticación de la CLI, logs de builds) vive en Supabase.
- **Cloudflare como Músculo**: Toda la ejecución de alta concurrencia de las apps generadas vive en Cloudflare Workers y KV. No hacemos cuello de botella en Supabase para el tráfico de los usuarios finales de las apps.
