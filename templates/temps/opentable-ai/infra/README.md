# Infrastructure Setup: OpenTable + AI (Smart Reservations)

This directory contains the initial configuration for the project's infrastructure.

## Supabase Schema (Initial Draft)
See `infra/schema.sql` for the database schema definition.

## CI/CD Pipeline
See `infra/cicd.yml` for the GitHub Action workflow template.

## Edge Function Scaffolding
The `infra/edge-functions/` directory contains the base code for reservation processing.

## Initialization Script
To "ignite" this Temp, run:
```bash
npx campfire ignite opentable-ai
```
This will:
1.  Initialize a new Supabase project.
2.  Apply migrations.
3.  Deploy Edge Functions.
4.  Link the Vercel project and set environment secrets.
