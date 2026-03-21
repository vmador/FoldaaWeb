# Nodes: Foldaa Node Catalog

## Node Básico

- name: HttpRequest
- input: url
- output: html/json
- description: Hace fetch de la URL y retorna contenido base

## Node Auth

- name: Auth
- input: user/email/password
- output: JWT token
- description: Auth completo con JWT, email, OAuth

## Node Payments

- name: Payments
- input: product_id, user_id, price
- output: success/failure
- description: Stripe checkout + webhooks

## Node Analytics

- name: Analytics
- input: event_type, metadata
- output: logged
- description: Logs en KV y dashboard

## Node Automation

- name: WorkflowTrigger
- input: event_type, cron_schedule
- output: triggers node flow
- description: Automation, cron jobs, notifications
