# System: OpenTable + AI (Smart Reservations)
[SoT Manifest: system.md]

This system provides a natural language interface for restaurant discovery and reservation management, powered by Next.js and Supabase.

## System Architecture

### 1. Frontend (Next.js App Router)
- **Reservation HUD**: A high-density dashboard for real-time table availability.
- **AI Chat Overlay**: A floating assistant that understands "Book a table for 4 today at 7pm" and executes the reservation flow.
- **Merchant Portal**: For restaurants to manage their floors, tables, and upcoming bookings.

### 2. Backend (Supabase)
- **Database**:
  - `restaurants`: Store name, location, cuisine, and floor rules.
  - `tables`: Physical table definitions (capacity, status).
  - `reservations`: Active and historical bookings.
  - `availability`: Time-indexed slots per restaurant.
- **Auth**: Supabase Auth (OTP for customers, Google for merchants).
- **Edge Functions**:
  - `process-reservation`: Handles LLM intent detection and table matching.
  - `notify-booking`: SMS/Push notifications via Twilio/Firebase.

### 3. AI Reservation Agent (Brain)
- **Engine**: OpenAI GPT-4o-mini via LangChain.
- **Tools**:
  - `search_restaurants(query)`
  - `check_availability(restaurant_id, time, size)`
  - `create_reservation(restaurant_id, time, size, contact)`
- **Persona**: A polite, efficient, and proactive concierge.

## Infrastructure Requirements
- **Hosting**: Vercel for the web app.
- **Database**: Supabase Postgres with Realtime enabled.
- **Secrets**: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_SID`.
