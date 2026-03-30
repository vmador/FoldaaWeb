# Technical Stack: OpenTable + AI (Smart Reservations)
[SoT Manifest: stack.md]

This project is built on a high-performance, modern web stack designed for real-time interaction and AI-native workflows.

## Core (Frontend)
- **Framework**: `Next.js 15+` (App Router, React Server Components).
- **Styling**: `Tailwind CSS`, `Framer Motion` (Advanced animations).
- **State Management**: `Zustand` for HUD state, `TanStack Query` for async data.
- **Icons**: `Lucide UI` for high-density HUD iconography.

## Backend (BaaS)
- **Postgres Database**: `Supabase` (Tables, Auth, Policies).
- **Real-time Sync**: `Supabase Realtime` (Broadcast/Causal) for floor updates.
- **Serverless Logic**: `Supabase Edge Functions` (Deno) for AI orchestration.
- **Storage**: `Supabase Storage` for restaurant/menu imagery.

## AI Layer (Intelligence)
- **LLM**: `OpenAI GPT-4o-mini` (Fast performance, low latency).
- **Orchestration**: `LangChain.js` for ReAct agents and tool calling.
- **Embeddings**: `OpenAI text-embedding-3-small` (if vector search is needed).

## DevOps & DX
- **Testing**: `Playwright` for E2E floor simulation.
- **Linting & Formatting**: `ESLint`, `Prettier`.
- **CI/CD**: `Vercel` for the web interface, `GitHub Actions` for migrations and functions.
- **Monitoring**: `Sentry` for error tracking, `PostHog` for analytics.

## Environment Config
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWILIO_SID=
TWILIO_TOKEN=
```
