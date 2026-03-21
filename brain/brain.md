# Brain: Foldaa Architecture

## Conceptos Principales

- Foldaa es un generador de apps PWA / Workers basado en URLs.
- Cada URL → Worker → app desplegada con routes, analytics, KV y extensiones.
- Cero fricción: CLI + runtime engine que hace todo automáticamente.
- Extensiones: auth, payments, automation, workflows, analytics.

## Componentes

1. CLI: Node.js + TS, comandos base (`create`, `add`, `deploy`, `domain`, `publish`)
2. Runtime Engine: transforma manifest + nodes → Cloudflare Workers
3. Workers: cada app se ejecuta como un worker independiente
4. Cloudflare Integration: dominios, routes, KV, cron jobs, SSL
5. Marketplace: publicar y clonar apps
6. Docs (.md): brain.md, nodes.md, workflows.md, api.md, cli.md

## Flujo Básico

1. Usuario: `foldaa create <url>`
2. CLI envía URL a API
3. API genera manifest `app.json`
4. Runtime genera workers + routes
5. Deploy automático en Cloudflare
6. Usuario puede extender con `foldaa add <feature>`
7. Analytics, cron jobs y background tasks activados por defecto
