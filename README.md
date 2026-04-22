# TeamHub — Team Connection App

A full-featured web application for distributed teams to connect, compete, celebrate, and communicate. Built as a pre-work challenge submission using Next.js 14, TypeScript, and Tailwind CSS.

**Live demo:** https://teamhub-app-eight.vercel.app  
**GitHub:** https://github.com/IKImranKhanIK/teamhub-app

---

## What It Does and Why

TeamHub solves the problem of distributed teams feeling disconnected. Everything lives in one place — no sign-up, no configuration required.

| Tab | What it does |
|-----|-------------|
| **Crew** | Living team directory with avatar initials, role, fun fact, and a four-state availability indicator (Available / In a Meeting / OOO / Focused). Click a status dot to cycle through states. |
| **Game** | Tic Tac Toe and Rock Paper Scissors in a single tab. Players are selected from the Crew roster. Both games feed a shared win/loss/draw leaderboard. RPS uses a best-of-3 match format with a pass-screen between picks so neither player sees the other's choice. |
| **Kudos** | Shoutout board where teammates recognise each other. Each card has a sender, recipient, message (up to 300 chars), and a chosen emoji. Recognition is a known driver of team engagement. |
| **Chat** | Team message board with per-message reactions (👍 ❤️ 😂 🔥). Sender is selected from the Crew roster. Messages auto-scroll to the bottom and persist across refreshes. |
| **Stats** | Dashboard showing crew size, games played, kudos sent, top player, most cheered teammate, and average win rate. Includes a full W/L/D leaderboard and a recent kudos wall. |
| **Vibes** | Three engagement features in one tab: a team poll (create, vote, live progress bars), a date-seeded daily icebreaker question with member answers, and a per-person per-day mood check-in with a team vibe summary. |
| **Activity** | Timestamped feed of every action taken across all tabs — joins, games, kudos, polls, mood check-ins. Updates in real time via a Supabase subscription — visible to all connected users instantly; also available as a collapsible sidebar on desktop. |

**Cross-cutting features:**
- Dark / light mode toggle — preference persists to `localStorage`, applies via `html.light` class with CSS overrides so zero component changes were needed
- Error boundaries on every tab — a single tab crash shows a fallback card with a Try-again button instead of breaking the whole app
- Loading spinner on every tab — prevents a flash of empty content while data loads from the database

All data persists to a **Supabase PostgreSQL database** — shared across all team members in real time, no sign-up needed.

---

## How to Run Locally

**Prerequisites:** Node.js 18+, npm, a free [Supabase](https://supabase.com) project

```bash
# 1. Clone the repository
git clone https://github.com/IKImranKhanIK/teamhub-app.git
cd teamhub-app

# 2. Install dependencies
npm install

# 3. Add your Supabase credentials
echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" >> .env.local

# 4. Start the development server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

**Production build:**

```bash
npm run build
npm start
```

**Run tests:**

```bash
npm test                # run all tests once
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report
```

---

## Project Structure

```
teamhub-app/
├── app/
│   ├── layout.tsx        # Root layout with Toaster
│   ├── page.tsx          # Tab shell, theme toggle, activity sidebar
│   └── globals.css       # Dark theme base + html.light overrides
├── components/
│   ├── CrewTab.tsx       # Team directory
│   ├── GameTab.tsx       # TTT + RPS with shared leaderboard
│   ├── KudosTab.tsx      # Shoutout board
│   ├── ChatTab.tsx       # Message board with reactions
│   ├── StatsTab.tsx      # Stats dashboard
│   ├── VibesTab.tsx      # Polls, icebreaker, mood check-in
│   ├── ActivityFeed.tsx  # Timestamped event feed
│   ├── ErrorBoundary.tsx # React class component error boundary
│   ├── LoadingSpinner.tsx # CSS-only animated spinner
│   └── Toast.tsx         # react-hot-toast wrapper
├── lib/
│   ├── types.ts          # Shared TypeScript interfaces
│   ├── supabase.ts       # Supabase client initialisation
│   ├── storage.ts        # Async load/save helpers (crew, kudos, stats)
│   ├── activity.ts       # Activity logger using Supabase
│   └── gameLogic.ts      # Pure TTT functions (checkWinner, isDraw)
├── hooks/
│   └── useLocalStorage.ts # Generic typed localStorage hook (theme + tests)
└── __tests__/
    ├── GameLogic.test.ts
    ├── useLocalStorage.test.ts
    ├── ChatTab.test.tsx
    └── ErrorBoundary.test.tsx
```

---

## Technical Decisions and Reasoning

### Next.js 14 App Router
Chosen for its file-based routing, React Server Components support, and industry-standard positioning for production React apps. The App Router gives clean separation of concerns and straightforward flexibility for API routes.

### TypeScript
All components and utilities are fully typed. Core interfaces (`CrewMember`, `PlayerStats`, `Kudos`, `AvailabilityStatus`) are defined in `lib/types.ts` and shared across the app. This prevents entire classes of runtime errors and makes the codebase self-documenting.

### Tailwind CSS
Utility-first CSS for rapid UI development. The dark theme uses a consistent custom palette (`#0f1117` background, `#1a1f2e` card surface, `#2d3348` borders). Light mode is implemented as a single CSS override block in `globals.css` targeting Tailwind's escaped arbitrary-value class names directly — no component changes required.

### Supabase for Persistence
All eight data slices (crew, kudos, stats, messages, activity, poll, icebreaker, mood) are stored in a Supabase PostgreSQL database. `lib/storage.ts` contains async load/save helpers that map between the app's TypeScript interfaces and the DB column names. Saves are fire-and-forget with `.catch(console.error)` — optimistic UI updates keep interactions feeling instant.

### Real-time Chat and Activity Feed
Chat and Activity use Supabase `postgres_changes` subscriptions. Any insert into the `messages` or `activity` table is broadcast to all connected clients immediately — no polling, no websocket boilerplate. The theme preference (dark/light) is the one thing that intentionally stays in `localStorage` since it is per-device, not per-team.

### Error Boundaries
React error boundaries must be class components (no hooks equivalent). `ErrorBoundary` wraps every tab individually so a crash in one tab shows a localised fallback card and a Try-again reset button, leaving all other tabs functional.

### Pure Game Logic for Testability
`checkWinner` and `isDraw` were extracted from `GameTab.tsx` into `lib/gameLogic.ts` as pure functions. This makes them directly unit-testable without mounting the component, and keeps the component focused on UI state.

### React Class Component for Error Boundary
React does not support hooks-based error boundaries (`getDerivedStateFromError` and `componentDidCatch` are class lifecycle methods only). This is the one deliberate use of a class component in an otherwise all-function-component codebase.

### react-hot-toast
Lightweight toast notification library. Every user action (add crew, send kudos, game result, poll vote, mood check-in) gives immediate feedback. Configured with a dark theme matching the app.

---

## Testing

42 unit tests across four suites, all passing. Coverage: **86% statements, 90% lines** on tested files.

| Suite | Cases | What is tested |
|-------|-------|----------------|
| `GameLogic.test.ts` | 29 | All 8 X wins, all 8 O wins, draw condition, empty board, partial board, winning line return value |
| `useLocalStorage.test.ts` | 6 | Initial value fallback, stored value retrieval, setValue update, function-updater form, JSON parse error fallback |
| `ChatTab.test.tsx` | 7 | Renders without crash, loading spinner timing, disabled send button, 280-char limit, submit adds message, Enter key submits, input clears |
| `ErrorBoundary.test.tsx` | 4 | Normal render, fallback on throw, Try-again reset, console.error called with boundary name |

---

## Accessibility

Accessibility was treated as a core engineering requirement, not an afterthought. This is particularly important given Apple's deep commitment to accessibility across all its platforms and products.

### Standard

The app targets **WCAG 2.1 AA** compliance — the professional standard for web accessibility.

### What is implemented

**Semantic HTML and ARIA**
- `<nav aria-label="Main navigation">` for the tab bar
- `role="tablist"`, `role="tab"`, `aria-selected`, and `role="tabpanel"` on the tab switcher with `aria-labelledby` wiring
- `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` on all modals
- `role="grid"` and `role="gridcell"` with descriptive `aria-label` on every game board cell (e.g. "Row 1 Column 2, empty")
- `aria-live="polite"` on the game status bar so screen readers announce turn changes automatically
- `role="alert"` on the winner/draw announcement for immediate screen reader notification
- `role="log"` and `aria-live="polite"` on the chat message list
- `role="feed"` and `role="article"` on the activity feed
- Proper `<table>` with `<thead>`, `<th scope="col">`, and `<caption>` on the stats leaderboard
- `aria-label` on all icon-only buttons, profile cards, kudos cards, reaction buttons, and emoji pickers
- `aria-hidden="true"` on all decorative emoji and bullet dots
- `role="img"` with `aria-label` on meaningful emoji

**Keyboard navigation**
- Full Tab key navigation across all interactive elements
- Arrow key navigation between tab switcher tabs (left/right)
- Arrow key navigation across the Tic Tac Toe game board (up/down/left/right)
- Enter and Space to select a game cell
- Escape key closes all modals
- Focus trapped inside modals while open — Tab cycles only through modal elements
- Focus returns to the trigger button when a modal closes

**Focus indicators**
- `:focus-visible` rule in `globals.css`: `outline: 2px solid #f5c518; outline-offset: 2px`
- Visible on all interactive elements in both dark and light mode
- No `outline: none` without a replacement style anywhere in the codebase

**Color contrast**
- All body text meets the 4.5:1 minimum contrast ratio against its background
- Large text meets the 3:1 minimum
- Status indicators use both a colored dot and a text label — never color alone

**Screen reader support**
- Skip link at the top of the page: "Skip to main content" — visible only on focus, links to `<main id="main-content">`
- `<html lang="en">` set in the root layout
- Page title: "TeamHub — Team Connection App"
- Loading spinner has `role="status"` and `aria-label="Loading"`
- All empty states have descriptive text — no blank space without context
- Toast notifications use `role="status"` and `aria-live="polite"`

**Touch and mobile (Apple HIG)**
- All tap targets meet the **44×44px minimum** specified in Apple's Human Interface Guidelines
- All text inputs have `font-size: 16px` minimum to prevent iOS auto-zoom on focus
- No horizontal scroll on any tab at any screen width

**Reduced motion**
- `@media (prefers-reduced-motion: reduce)` block in `globals.css` disables all animations and transitions for users who have enabled this system preference

---

## What I Would Add Given More Time

1. **Authentication** — Simple OAuth (Google/GitHub) so each team member has a verified identity tied to their profile, rather than a dropdown.
2. **Real-time multiplayer** — TTT and RPS across two browsers without passing a phone, using Supabase real-time game state.
3. **Push notifications** — Browser push notifications when someone sends you kudos or mentions you in chat.
4. **Chat threads and @mentions** — Reply threading and mention highlighting in the Chat tab.
5. **Poll history** — Archive past polls and display participation rates over time.
6. **Leaderboard history** — Track win/loss trends over time with a small sparkline chart per player.

---

## Open Source Libraries Used

| Library | Version | Purpose |
|---------|---------|---------|
| Next.js | 14.2.x | React framework with App Router |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| react-hot-toast | 2.x | Toast notifications |
| @supabase/supabase-js | 2.x | Database client + real-time subscriptions |
| Jest | 29.x | Test runner |
| ts-jest | 29.x | TypeScript transform for Jest |
| @testing-library/react | 16.x | Component rendering for tests |
| @testing-library/jest-dom | 6.x | DOM assertion matchers |

---

## Attribution

Built with [Claude Code](https://claude.ai/code) as the AI development tool. See `AI_USAGE_LOG.md` for a full, honest record of how AI was used and what decisions were made independently.
