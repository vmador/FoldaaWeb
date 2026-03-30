# Roadmap: OpenTable + AI (Smart Reservations)
[SoT Manifest: roadmap.md]

This 4-week execution plan leads from ignition to an MVP of the Smart Reservation platform.

## Week 1: Foundation (Ignition)
- **Day 1**: Project Repo scaffolding with Next.js App Router and Supabase integration.
- **Day 2**: DB Schema deployment (`restaurants`, `tables`, `reservations`, `availability`).
- **Day 3**: UI Shell construction (Navigation, Dashboard, and Global Layout).
- **Day 4**: Basic Merchant Portal - Floor view (static layout and table list).
- **Day 5**: Initial Reservation API - CRUD operations for bookings.

## Week 2: The Spark (AI Intelligence)
- **Day 1**: LangChain integration into Supabase Edge Functions.
- **Day 2**: Prompt engineering for "The Concierge" AI persona.
- **Day 3**: Tool integration (AI calling `check_availability` and `create_reservation`).
- **Day 4**: Real-time Chat UI - Stream response from LLM for reservation flows.
- **Day 5**: Multi-Intent Handling (e.g., "Any Italian food for 2?") and slot matching.

## Week 3: High-Density & Real-time Sync
- **Day 1**: Supabase Realtime - Sync floor status across all client instances.
- **Day 2**: Slot Management Engine - Algorithmic slot selection based on floor rules.
- **Day 3**: Notification Pipeline - Trigger SMS/Email on booking success.
- **Day 4**: Performance tuning - Caching availability checks with Redis/KV.
- **Day 5**: Comprehensive Testing - Reservation edge cases (overbooking, cancellations).

## Week 4: Deployment & Polish
- **Day 1**: "Midnight" UI Theme - Final CSS/Tailwind styling for all components.
- **Day 2**: Mobile-Ready optimization (Responsive HUD, Bottom Sheets).
- **Day 3**: User Acceptance Testing (UAT) with AI agents.
- **Day 4**: Final Handover documentation - Developer and User guides.
- **Day 5**: Final Deployment to Vercel and Supabase Production.

## Deliverables
- [ ] Fully functional reservation HUD.
- [ ] AI Concierge ready for customer interactions.
- [ ] Real-time availability sync.
- [ ] Merchant portal for floor management.
