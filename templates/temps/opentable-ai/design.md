# Design: OpenTable + AI (Midnight Reservation)
[SoT Manifest: design.md]

This design system is optimized for a premium, high-density HUD experience that feels responsive and intelligent.

## Aesthetics

### Color Palette
- **Primary (Passion)**: `#FF5A5F` (Airbnb Red) for actionable reservation buttons and status alerts.
- **Secondary (Precision)**: `#00A699` (Teal) for confirmed reservations and success states.
- **Background (Midnight)**: `#0A0A0A` (Deepest Charcoal) for the core canvas.
- **Surface (Glass)**: `rgba(255, 255, 255, 0.05)` with `backdrop-blur-xl` for overlays and cards.

### Typography
- **Headlines**: `Outfit` or `Inter` (Bold, tight tracking `-0.02em`).
- **Body**: `Inter` (Regular, 14px, line-height 1.5).
- **Monospace (HUD)**: `JetBrains Mono` for metadata (times, availability counts, status codes).

## Components

### 1. Reservation HUD
- **Grid Layout**: Real-time status of all tables.
- **Micro-animations**: Hovering over a table shows its capacity and current/upcoming bookings with a subtle glow.

### 2. AI Chat Overlay
- **Minimalist Bubble**: A small, floating "spark" icon in the bottom right.
- **Expands to HUD**: When opened, it takes 30% of the screen with a semi-transparent blur.
- **Natural Language Input**: A single text line with "Pulse" animation while processing.

### 3. Responsive State (Mobile-Ready)
- **Bottom Sheet Navigation**: On mobile, the reservation flow is handled via high-fidelity bottom sheets.
- **Haptic Feedback**: Integrated for all reservation confirmations.

## UX Principles
- **Speed to Value**: A user should be able to book a table in under 10 seconds via voice or text.
- **Visual Proof**: Real-time feedback at every step (e.g., table availability updates instantly as someone else books).
