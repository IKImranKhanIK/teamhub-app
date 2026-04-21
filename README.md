# TeamHub — Team Connection App

A full-featured web application for distributed teams to connect, compete, celebrate, and communicate. Built as a pre-work challenge submission using Next.js 14, TypeScript, and Tailwind CSS.

**Live demo:** https://teamhub-app-eight.vercel.app  
**GitHub:** https://github.com/IKImranKhanIK/teamhub-app

---

## What It Does and Why

TeamHub solves the problem of distributed teams feeling disconnected. Everything lives in one place — no sign-up, no backend, no configuration required.

| Tab | What it does |
|-----|-------------|
| **Crew** | Living team directory with avatar initials, role, fun fact, and a four-state availability indicator (Available / In a Meeting / OOO / Focused). Click a status dot to cycle through states. |
| **Game** | Tic Tac Toe and Rock Paper Scissors in a single tab. Players are selected from the Crew roster. Both games feed a shared win/loss/draw leaderboard. RPS uses a best-of-3 match format with a pass-screen between picks so neither player sees the other's choice. |
| **Kudos** | Shoutout board where teammates recognise each other. Each card has a sender, recipient, message (up to 300 chars), and a chosen emoji. Recognition is a known driver of team engagement. |
| **Chat** | Team message board with per-message reactions (👍 ❤️ 😂 🔥). Sender is selected from the Crew roster. Messages auto-scroll to the bottom and persist across refreshes. |
| **Stats** | Dashboard showing crew size, games played, kudos sent, top player, most cheered teammate, and average win rate. Includes a full W/L/D leaderboard and a recent kudos wall. |
| **Vibes** | Three engagement features in one tab: a team poll (create, vote, live progress bars), a date-seeded daily icebreaker question with member answers, and a per-person per-day mood check-in with a team vibe summary. |
| **Activity** | Timestamped feed of every action taken across all tabs — joins, games, kudos, polls, mood check-ins. Updates in real time on the same page via a custom DOM event; also available as a collapsible sidebar on desktop. |

**Cross-cutting features:**
- Dark / light mode toggle — persists to `localStorage`, applies via `html.light` class with CSS overrides so zero component changes were needed
- Error boundaries on every tab — a single tab crash shows a fallback card with a Try-again button instead of breaking the whole app
- 600 ms loading spinner on every tab — prevents a flash of empty content before `localStorage` is read

All data persists to `localStorage` — no backend required, no sign-up needed.

---

## How to Run Locally

**Prerequisites:** Node.js 18+, npm

```bash
# 1. Clone the repository
git clone https://github.com/IKImranKhanIK/teamhub-app.git
cd teamhub-app

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open in browser
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
│   ├── storage.ts        # localStorage load/save helpers
│   ├── activity.ts       # Activity logger + custom DOM event dispatch
│   └── gameLogic.ts      # Pure TTT functions (checkWinner, isDraw)
├── hooks/
│   └── useLocalStorage.ts # Generic typed localStorage hook
└── __tests__/
    ├── GameLogic.test.ts
    ├── useLocalStorage.test.ts
    ├── ChatTab.test.tsx
    └── ErrorBoundary.test.tsx
```

---

## Technical Decisions and Reasoning

### Next.js 14 App Router
Chosen for its file-based routing, React Server Components support, and industry-standard positioning for production React apps. The App Router gives clean separation of concerns and straightforward future flexibility for API routes if a backend were added.

### TypeScript
All components and utilities are fully typed. Core interfaces (`CrewMember`, `PlayerStats`, `Kudos`, `AvailabilityStatus`) are defined in `lib/types.ts` and shared across the app. This prevents entire classes of runtime errors and makes the codebase self-documenting.

### Tailwind CSS
Utility-first CSS for rapid UI development. The dark theme uses a consistent custom palette (`#0f1117` background, `#1a1f2e` card surface, `#2d3348` borders). Light mode is implemented as a single CSS override block in `globals.css` targeting Tailwind's escaped arbitrary-value class names directly — no component changes required.

### localStorage for Persistence
A deliberate choice to keep the app self-contained and deployable without a backend. Each data slice has its own key (`teamhub_crew`, `teamhub_stats`, `teamhub_kudos`, `teamhub_chat`, `teamhub_activity`, `teamhub_poll`, `teamhub_mood`, `teamhub_icebreaker`). All load/save logic is centralised in `lib/storage.ts` with `try/catch` wrapping every `JSON.parse` — corrupt keys are reset and warned rather than crashing.

### Cross-component Activity Feed
`ActivityFeed` is a sibling component to all the tabs, not a parent. Rather than prop-drilling or adding a context layer, `logActivity()` writes to `localStorage` and fires `window.dispatchEvent(new CustomEvent("teamhub-activity"))`. The feed component listens for this event and re-reads storage — instant updates with zero shared state.

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

## What I Would Add Given More Time

1. **Backend persistence** — Replace `localStorage` with a database (e.g. Supabase or PlanetScale) so data is shared across devices and team members in real time.
2. **Real-time multiplayer** — WebSockets (via Pusher or Ably) so TTT and RPS work across two browsers without passing a phone.
3. **Authentication** — Simple OAuth (Google/GitHub) so each team member has a verified identity tied to their profile, rather than a dropdown.
4. **Push notifications** — Browser push notifications when someone sends you kudos or mentions you in chat.
5. **Chat threads and @mentions** — Reply threading and mention highlighting in the Chat tab.
6. **Poll history** — Archive past polls and display participation rates over time.
7. **Leaderboard history** — Track win/loss trends over time with a small sparkline chart per player.

---

## Open Source Libraries Used

| Library | Version | Purpose |
|---------|---------|---------|
| Next.js | 14.2.x | React framework with App Router |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| react-hot-toast | 2.x | Toast notifications |
| Jest | 29.x | Test runner |
| ts-jest | 29.x | TypeScript transform for Jest |
| @testing-library/react | 16.x | Component rendering for tests |
| @testing-library/jest-dom | 6.x | DOM assertion matchers |

---

## Attribution

Built with [Claude Code](https://claude.ai/code) as the AI development tool. See `AI_USAGE_LOG.md` for a full, honest record of how AI was used and what decisions were made independently.
