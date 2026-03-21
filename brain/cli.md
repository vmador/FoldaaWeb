# CLI: Foldaa Commands

## foldaa create <url>
- Crea app desde URL y genera worker
- Output: `<app_name>.foldaa.com`

## foldaa add <feature>
- Extiende app con features: auth, payments, automation
- Output: app updated + runtime updated

## foldaa deploy
- Despliega worker a Cloudflare

## foldaa domain <app> <custom_domain>
- Asocia custom domain a worker
- Configura routes y SSL automáticamente

## foldaa publish
- Publica app en marketplace

## foldaa clone <app_id>
- Clona app desde marketplace con todo runtime y nodes
