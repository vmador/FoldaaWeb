# Catálogo de Nodos (nodes.md)

Un "Nodo" es una unidad de lógica atómica que se ejecuta en el Cloudflare Worker durante la fase de Request o Response, o asincrónicamente mediante Cron Triggers/Workers AI.

## 1. WebHook Node
Intercepta requests a una ruta específica y extrae la carga útil (payload).
* **Inputs**: `route` (Ej: `/api/webhook`), `method` (Ej: `POST`)
* **Outputs**: `payload` (JSON), `headers`
* **Configuración**: Validación de firmas de terceros.

## 2. Auth Node
Protege rutas y gestiona sesiones y JWT.
* **Inputs**: `jwt_secret`, `protected_routes` (Array de strings o regex).
* **Outputs**: `user_id`, `session_data` u objeto `401 Unauthorized`.
* **Configuración**: Proveedores (Google, GitHub, Email/Password). Requiere KV para estado de sesión distribuidas temporalmente.

## 3. Payment Node (Stripe)
Maneja la generación de links de pago y verifica el estado de suscripciones.
* **Inputs**: `stripe_secret_key`, `webhook_secret`, `price_id`.
* **Outputs**: `checkout_url`, estado del usuario (`is_premium: boolean`).
* **Configuración**: Mapeo entre un `user_id` del Auth Node y el `customer_id` de Stripe.

## 4. Analytics Node
Interrumpe la response sin bloquear (usando `waitUntil`) para inyectar/registrar analíticas globales.
* **Inputs**: `request_info` (IP, User-Agent, Path, Referer).
* **Outputs**: Escribe a `Analytics_KV` o envía un log a un servicio externo.
* **Configuración**: Samplerate, Ignore_routes.

## 5. HttpRequest Node
Permite hacer Fetch a APIs externas desde el Worker para enriquecer data.
* **Inputs**: `url`, `method`, `headers`, `body`.
* **Outputs**: `response_status`, `response_body`.
* **Configuración**: Timeout, re-tries automáticos.

## 6. WorkerTrigger Node
Actúa como punto de inicio para flujos programados (Cron Jobs) o eventos pub/sub.
* **Inputs**: `cron_expression` (ej: `* * * * *`).
* **Outputs**: `timestamp`, `event_data`.
* **Configuración**: Queue integration para procesamientos pesados.

## Formato Interno en el Engine (Ejemplo referencial)
Cada nodo se transfiere a una función TypeScript pura que se orquesta dentro del framework middleware del Worker de Foldaa.
