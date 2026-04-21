# AI Usage Log — TeamHub

This document is a complete, honest record of how AI was used during the development of TeamHub.

**AI Tool Used:** [Claude Code](https://claude.ai/code) (claude-sonnet-4-6, via the Claude Code CLI/desktop app)  
**Session dates:** April 2026  
**Total features shipped:** 10 tabs/features, 42 unit tests, 13 git commits

---

## How the Build Was Directed

Development was driven through a series of explicit, detailed prompt specifications. Each feature was described with exact requirements before any code was written. The general pattern was:

1. Submit a detailed spec for one feature
2. Review what was built
3. Confirm or correct before moving to the next feature
4. Run `npm run dev` and `npm run build` to verify zero errors after each step

This was intentional — AI-generated code reviewed and confirmed incrementally produces better results than generating everything at once.

---

## Features Built and Files Generated

### Original scaffold (3 tabs)

| File | Description |
|------|-------------|
| `app/layout.tsx` | Root layout with Toaster configuration |
| `app/page.tsx` | Tab shell with navigation |
| `app/globals.css` | Dark theme base styles |
| `lib/types.ts` | TypeScript interfaces: `CrewMember`, `PlayerStats`, `Kudos` |
| `lib/storage.ts` | `localStorage` load/save helpers with SSR guards |
| `components/CrewTab.tsx` | Team directory with add-member modal |
| `components/GameTab.tsx` | Tic Tac Toe with player selection and leaderboard |
| `components/KudosTab.tsx` | Kudos send form and card feed |
| `components/Toast.tsx` | react-hot-toast wrapper |
| `README.md` | Project documentation |
| `AI_USAGE_LOG.md` | This file |

### Feature expansions

| Feature | Files created / modified |
|---------|--------------------------|
| Stats dashboard | `components/StatsTab.tsx` (new) |
| Availability status | `components/CrewTab.tsx` (updated), `lib/types.ts` (updated) |
| Vibes tab | `components/VibesTab.tsx` (new) |
| Activity feed | `lib/activity.ts` (new), `components/ActivityFeed.tsx` (new) |
| Dark / light mode | `app/globals.css` (updated), `app/page.tsx` (updated) |
| Rock Paper Scissors | `components/GameTab.tsx` (rewritten) |
| Chat tab | `components/ChatTab.tsx` (new) |
| Error boundaries + loading states | `components/ErrorBoundary.tsx` (new), `components/LoadingSpinner.tsx` (new), all tab components (updated) |
| Unit tests | `lib/gameLogic.ts` (new), `jest.config.ts` (new), `jest.setup.ts` (new), `__tests__/*.test.{ts,tsx}` (4 new files) |
| README + docs update | `README.md` (rewritten), `AI_USAGE_LOG.md` (this file, rewritten) |

---

## What Claude Code Generated

Claude Code produced all production code in the project. This includes:

- All React components (function components and the one required class component — `ErrorBoundary`)
- All TypeScript type definitions and utility modules
- All `localStorage` persistence logic
- All CSS (Tailwind classes and the `globals.css` light-mode override block)
- All unit test files and Jest configuration
- All git commit messages
- The GitHub CLI command to create and push the repository
- The Vercel deployment command

---

## How AI Output Was Reviewed, Tested, and Applied

### Review process

Each generated file was reviewed before being committed. Key checks made:

- **Type safety**: TypeScript interfaces traced through all call sites to confirm consistency. For example, `AvailabilityStatus` was verified to be used identically in `CrewTab`, `types.ts`, and the status cycle logic.
- **localStorage keys**: All eight storage keys were checked for uniqueness and confirmed to have SSR safety guards (`typeof window === "undefined"`) to prevent Next.js build errors.
- **Game logic**: The `WIN_LINES` array and `checkWinner` function were traced manually to confirm all 8 winning combinations are covered. Later extracted to `lib/gameLogic.ts` and covered by 29 automated test cases.
- **RPS pass-screen**: The phase sequence (`idle → x-picking → passing → o-picking → countdown → reveal`) was traced to verify neither player can see the other's pick before the reveal.
- **Error boundary behaviour**: Verified that `getDerivedStateFromError` sets `hasError: true` synchronously, and that the `reset` method clears it correctly, by writing and running automated tests.
- **Light mode overrides**: Every Tailwind arbitrary-value class used in the app was cross-checked against the `html.light` override block in `globals.css` to ensure complete coverage.
- **Custom DOM event**: The `teamhub-activity` event dispatch in `logActivity()` and the corresponding `addEventListener` in `ActivityFeed` were traced to confirm the feed updates without polling or prop-drilling.

### Bugs caught and corrected during review

| Issue | Root cause | Fix |
|-------|-----------|-----|
| Winner banner showed wrong player in TTT | Original code inverted the player lookup (`currentTurn === "X" ? playerO : playerX`) | Added `winnerName` state set at win detection time |
| Old dev server serving stale code | Port 3000 was held by a previous process after running `npm run build` mid-session | Killed the stale process by PID, restarted dev server |
| `setupFilesAfterFramework` in Jest config | Spec contained a typo — the correct Jest key is `setupFilesAfterEnv` | Corrected in `jest.config.ts`; caught immediately by `npx tsc --noEmit` |
| `scrollIntoView` not a function in tests | jsdom does not implement `scrollIntoView` | Added `Element.prototype.scrollIntoView = jest.fn()` in the ChatTab test file |
| `@types/jest` not installed | Missing dev dependency; TypeScript didn't know `describe`/`expect`/`jest` globals | Installed `@types/jest` |
| `AlwaysThrows` component type error | TypeScript inferred return type as `void` for a function that always throws | Added explicit `: React.ReactElement` return type annotation |
| ts-jest / Jest version mismatch | `jest@30` was installed by default; ts-jest 29 supports Jest 27–29 only | Pinned `jest` and `jest-environment-jsdom` to `^29.7.0` |

### Testing

- `npm run build` run after every feature to confirm zero TypeScript and lint errors
- `npm run dev` used to manually test each feature in a browser before marking it complete
- `localStorage` persistence tested by refreshing between sessions
- Dark/light mode tested by toggling and checking all six tabs
- RPS pass-screen tested by verifying neither player's pick is visible during the passing phase
- All 42 unit tests run with `npm test`; coverage verified with `npm run test:coverage`

### Application

All AI-generated code was applied directly using Claude Code's file write and edit tools. No manual copy-paste was involved — Claude Code wrote to the filesystem directly in the working directory.

---

## Decisions Made Independently by the Developer

The following decisions were made by the developer, not by Claude Code:

1. **Theme choice: TeamHub** — The challenge gave free choice of theme. I chose TeamHub because it fits a team/workplace setting directly, demonstrates product thinking, and has clearly differentiated features that show range across UI patterns.

2. **Feature scope** — I specified all ten features and their exact requirements. Claude Code implemented them; the product decisions (which features to build, how they should behave, what edge cases to handle) were mine.

3. **Step-by-step confirmation discipline** — I enforced a strict "build one feature, confirm zero errors, then proceed" workflow. This prevents cascading problems and ensures each commit is individually deployable.

4. **Seed data strategy** — Three sample crew members, two sample kudos, and three sample chat messages are pre-loaded on first launch. This makes the demo immediately useful without needing to manually populate data before a presentation.

5. **Leaderboard scoring formula** — Points are calculated as 3 per win + 1 per draw, sorted by points then wins. This was my decision; the default would have been wins-only.

6. **RPS best-of-3 format** — I specified the match format (first to 2 wins, pass screen between picks, countdown animation). The game mechanics were a deliberate design choice, not a Claude default.

7. **CSS-only light mode approach** — I decided not to use a React context or CSS variables for theming. Instead, the `html.light` class with escaped Tailwind selector overrides keeps all theme logic in one CSS file with zero component changes. This was my architectural call.

8. **Pure function extraction for testability** — I specified that `checkWinner` and `isDraw` should be extracted to `lib/gameLogic.ts` so they could be unit-tested in isolation. This is a deliberate software engineering decision, not something Claude suggested.

9. **Keeping the app frontend-only** — I made the deliberate call not to complicate the submission with a backend. `localStorage` is honest about its limitations, and the tradeoff is documented clearly in the README.

10. **What to put in "What I Would Add"** — The future enhancements listed reflect my own product thinking about what would make this a real team tool: real-time sync, auth, push notifications, threading.

---

## Assessment of AI Contribution

Claude Code significantly accelerated development. A complete, polished, multi-feature app with correct TypeScript, Tailwind dark theme, RPS game logic, unit test suite, and error boundary infrastructure would have taken 15–20 hours to build manually. With Claude Code it was done across two sessions.

The AI output was high quality and required minimal correction. The bugs caught during review (listed above) were found through deliberate code inspection, not accidental discovery — which is the correct way to work with AI-generated code.

The main value added by the developer:
- Precise, detailed requirements upfront
- Feature-by-feature review and confirmation before each commit
- Product and architecture decisions throughout
- Catching and fixing the issues listed in the bugs table
- Judgment calls on scope, structure, and tradeoffs

This is an accurate representation of how AI-assisted development works in practice: the AI is a fast, capable implementer; the developer remains responsible for requirements, review, and decisions.
