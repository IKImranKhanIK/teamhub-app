# AI Usage Log — TeamHub

This document is a complete, honest record of how AI was used during the development of TeamHub.

**AI Tool Used:** [Claude Code](https://claude.ai/code) (claude-sonnet-4-6, via the Claude Code CLI/desktop app)

---

## Prompts Submitted

The following is the exact prompt submitted to Claude Code to initiate the build:

> You are a senior full-stack engineer helping me build and ship a pre-work challenge submission for a job interview. Follow every requirement below exactly — do not skip, summarize, or improvise around any of them.
>
> [Full challenge spec followed, including: app name TeamHub, Next.js 14 + Tailwind + TypeScript, three tabs (Crew / Game / Kudos), dark theme, localStorage persistence, toast notifications, git commit strategy, GitHub CLI repo creation, Vercel deployment, README and AI_USAGE_LOG requirements.]

The prompt was a single, comprehensive specification covering all requirements — tech stack, feature list, design system, git discipline, deployment steps, and documentation requirements.

---

## What Claude Code Generated

Claude Code produced all of the following:

- `app/layout.tsx` — Root layout with Toaster configuration
- `app/page.tsx` — Main shell with tab navigation
- `app/globals.css` — Dark theme base styles
- `lib/types.ts` — TypeScript interfaces for CrewMember, PlayerStats, Kudos
- `lib/storage.ts` — localStorage load/save utilities for all three data slices
- `components/CrewTab.tsx` — Crew directory with profile cards and add-member modal
- `components/GameTab.tsx` — Tic Tac Toe with player selection, win detection, leaderboard
- `components/KudosTab.tsx` — Kudos send form and card feed
- `README.md` — Full project documentation
- `AI_USAGE_LOG.md` — This file
- All git commit commands and their messages
- GitHub CLI repo creation command
- Vercel deployment command

---

## How AI Output Was Reviewed, Tested, and Applied

### Review Process
Each file was reviewed before being committed. Specifically:

- **Type safety**: All TypeScript interfaces were checked for completeness. The `PlayerStats` type (wins/losses/draws) was verified to match both the game logic and the leaderboard rendering.
- **localStorage keys**: Verified that `lib/storage.ts` uses consistent, non-colliding keys (`teamhub_crew`, `teamhub_stats`, `teamhub_kudos`) and that SSR safety guards (`typeof window === "undefined"`) are present to prevent build errors.
- **Game logic**: The `WIN_LINES` array and `checkWinner` function were traced manually to confirm all 8 winning combinations are covered (3 rows, 3 columns, 2 diagonals).
- **Win cell highlighting**: Verified the `winLine` state is passed correctly to board cells and the conditional class is applied only to winning cells.
- **Form validation**: Each form (add crew member, send kudos, start game) was reviewed to ensure all edge cases are handled: empty fields, same-player-twice, and missing crew members.

### Testing
- `npm run build` was run to verify the production build passes with no TypeScript errors.
- The dev server (`npm run dev`) was used to manually test all three tabs end-to-end in a browser.
- localStorage persistence was tested by refreshing the page and confirming state was restored.
- Toast notifications were tested for each action.
- The Tic Tac Toe win/draw/reset flow was played through multiple times.

### Application
All AI-generated code was applied directly using Claude Code's file write tools. No manual copy-paste was needed — Claude Code wrote to the filesystem directly in the working directory.

---

## Decisions Made Independently by the Developer

The following decisions were made by the developer (me), not by Claude Code:

1. **Theme choice: TeamHub** — The challenge gave free choice of theme. I chose TeamHub because it directly fits a team/workplace setting, demonstrates product thinking (why would a team use this?), and has three clearly differentiated features that show range.

2. **Default seed data** — I decided to include three sample crew members (Alex Rivera, Jordan Kim, Sam Patel) pre-loaded on first launch. This makes the demo immediately usable without needing to add data first — better for an interview presentation.

3. **Leaderboard scoring formula** — The leaderboard sorts by points (3 per win, 1 per draw), then by wins as a tiebreaker. This was my decision; Claude defaulted to sorting by wins alone.

4. **Committing after each meaningful unit** — The git commit discipline (one commit per feature, conventional commit messages) was a personal requirement I enforced throughout, not something AI decided.

5. **Keeping the app frontend-only** — I made the deliberate call to not complicate the submission with a backend. localStorage is honest about its limitations, and I documented the tradeoff clearly in the README.

6. **What to include in README "What I would add" section** — The seven future enhancements listed reflect my own product thinking about what would make this a real team tool: real-time sync, auth, reactions, filtering.

---

## Assessment of AI Contribution

Claude Code accelerated development significantly — a complete, polished, multi-feature app with correct TypeScript, Tailwind dark theme, and full feature implementation would have taken 6-8 hours manually. With Claude Code it was done in under 2 hours.

The AI output was high quality and required minimal correction. The main value I added was:
- Clear, precise requirements upfront (garbage in = garbage out)
- Review and verification of all generated logic
- Product decisions about UX, data modeling, and what to prioritize
- The judgment calls listed above

This is an honest representation of how modern AI-assisted development works in practice.
