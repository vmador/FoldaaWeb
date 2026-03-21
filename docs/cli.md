# CLIs Core y Uso (cli.md)

La CLI de Foldaa (`foldaa`) es interactiva, usa prompts cuando los parámetros omiten información y se encarga de todo el ciclo de vida de la aplicación proxied a través de Supabase.

## Comandos Principales

### 1. `foldaa create <url>`
Crea un nuevo proyecto basado en un sitio web existente.
- **Qué hace:** Crea directorio local, init `app.json`, setea la Edge Function de Supabase para el proxy, arranca modo de desarrollo local (`supabase start` / `supabase functions serve`).
- **Flags:** `--directory <path>`, `--name <app_name>`.

### 2. `foldaa add <feature>`
Permite agregar extensiones/nodos al `app.json` e instalar dependencias o prompts requeridos inyectándolos en Supabase.
- **Soporta features:** `auth`, `payments`, `analytics`, `automation`, `database`.
- **Comportamiento:**
  - Si no provees secrets, te solicita ingresar los valores (ej: "Ingresa tu Stripe Secret Key") y los guarda en `.env`.
  - Modifica los archivos `workflows.md` o el `app.json` incorporando el feature.
  - Genera automáticamente migraciones locales para Supabase (ej: tablas de analíticas) si es necesario.

### 3. `foldaa deploy`
Empaqueta y despliega la función y la base de datos en Supabase.
- **Qué hace:**
  - Ejecuta `supabase db push` para aplicar migraciones.
  - Ejecuta `supabase secrets set --env-file .env.production` para subir secretos.
  - Ejecuta `supabase functions deploy proxy --no-verify-jwt` para desplegar el runtime.
- **Flags:** `--env <production|staging>`.

### 4. `foldaa domain <app_id> <custom_domain>`
Configura un dominio personalizado apuntando a tu proyecto de Supabase.
- **Qué hace:** Configura los Custom Domains en Supabase.
- **Flags:** `--force`.

### 5. `foldaa publish`
Empaqueta publicamente la aplicación, removiendo todos los secretos locales/nodos con datos privados, y la sube al Foldaa Marketplace.

### 6. `foldaa clone <app_id>`
Permite descargar un template de la comunidad junto a un conjunto pre-configurado de extensiones e inicializar un nuevo proyecto Supabase.
