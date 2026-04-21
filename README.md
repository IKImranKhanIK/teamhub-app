# TeamHub — Team Connection App

A web application for teams to connect, compete, and celebrate each other. Built as a pre-work challenge submission using Next.js 14, TypeScript, and Tailwind CSS.

**Live demo:** https://teamhub-app-eight.vercel.app

---

## What It Does and Why

TeamHub solves the problem of distributed teams feeling disconnected. It brings three experiences into one place:

- **Crew** — A living directory of team members with profiles, roles, and fun facts. Helps new joiners learn who's who quickly.
- **Game** — A Tic Tac Toe game with player selection from the crew roster, win/loss/draw tracking, and a live leaderboard. Adds a moment of fun to the workday.
- **Kudos Board** — A shoutout feed where teammates can recognize each other's contributions with a message and emoji. Recognition is a known driver of team engagement.

All data persists via `localStorage` — no backend required, no sign-up needed.

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

---

## Technical Decisions and Reasoning

### Next.js 14 App Router
Chosen for its file-based routing, React Server Components support, and the fact it is the current industry standard for production React apps. The App Router gives clean separation of concerns and future flexibility for API routes if a backend were added.

### TypeScript
All components and utilities are fully typed. Interfaces for `CrewMember`, `PlayerStats`, and `Kudos` are defined in `lib/types.ts` and shared across the app. This prevents entire classes of runtime errors and makes the codebase self-documenting.

### Tailwind CSS
Utility-first CSS for rapid UI development. The dark theme is consistent throughout using a custom color palette (`#0f1117` background, `#1a1f2e` card surface, `#2d3348` borders). No custom CSS files beyond `globals.css` for base resets.

### localStorage for Persistence
A deliberate choice to keep the app self-contained and deployable without a backend. Each data slice (crew, stats, kudos) has its own key. All load/save logic is centralized in `lib/storage.ts` — this makes it straightforward to swap in an API layer later.

### react-hot-toast
Lightweight toast notification library. Every user action (add crew, send kudos, game result) gives immediate feedback. Configured with a dark theme matching the app.

### Component Architecture
Three tab components (`CrewTab`, `GameTab`, `KudosTab`) are isolated and own their own state. The parent `page.tsx` only manages active tab state. This keeps each feature independently testable and maintainable.

### Win Detection
Tic Tac Toe uses a pre-defined array of winning lines checked after every move. Winning cells are highlighted with a green border and scale animation. The board is fully disabled after a win or draw to prevent further input.

---

## What I Would Add Given More Time

1. **Backend persistence** — Replace localStorage with a database (e.g., Supabase or PlanetScale) so data is shared across devices and team members.
2. **Real-time multiplayer** — Use WebSockets (via Pusher or Ably) so the Tic Tac Toe game works across two browsers in real time.
3. **Kudos reactions** — Allow teammates to react to kudos with emojis (like Slack's reaction system).
4. **Authentication** — Simple OAuth (Google/GitHub) so each team member has an identity tied to their profile.
5. **Kudos filtering** — Filter the kudos feed by recipient, date, or emoji tag.
6. **Crew profile photos** — Allow avatar image upload instead of only emoji selection.
7. **Leaderboard history** — Track win/loss trends over time with a simple chart.

---

## Open Source Libraries Used

| Library | Version | Purpose |
|---|---|---|
| Next.js | 14.2.x | React framework with App Router |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| react-hot-toast | 2.x | Toast notifications |

---

## Attribution

Built with [Claude Code](https://claude.ai/code) as the AI development tool. See `AI_USAGE_LOG.md` for full details on how AI was used and what decisions were made independently.
