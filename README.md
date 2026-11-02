# mathgame

Turn-based dungeon math RPG for 5th graders. TypeScript throughout: Express backend in `backend/`, Vite frontend in `frontend/` (entry page: `index.html` at the repo root).

```
npm install
npm run dev:backend    # Express API on http://localhost:3000
npm run dev:frontend   # game in the browser on http://localhost:5173 (forwards /api to the backend)
npm test               # Vitest
npm run typecheck      # TypeScript errors across the whole project
```

## Sprint 1 (main game only)

| Area | Owner | Files |
|---|---|---|
| Equations | Oliver | `backend/equations/*`, `tests/equations.test.ts` |
| Combat | David | `backend/game/Combat.ts`, `Monster.ts`, `BasicMonster.ts`, `backend/routes/combat.ts`, `frontend/src/CombatUI.ts`, `GameOverUI.ts`, `tests/combat.test.ts` |
| Level map + player | Sally | `backend/game/Level.ts`, `LevelNode.ts`, `GameManager.ts`, `Player.ts`, `backend/routes/runs.ts`, `frontend/src/LevelMapUI.ts`, `tests/level.test.ts`, `tests/player.test.ts` |
| Rest | Lianshi | `backend/game/RestStop.ts`, `backend/routes/rest.ts`, `frontend/src/RestUI.ts`, `tests/rest.test.ts` |
| Wrong-answer popup | Arushi | `frontend/src/wrongAnswerExplanationPopUp.ts`, `tests/wrongAnswer.test.ts` |
| Explanations | Darsh | `backend/equations/WrongAnswerExplanation.ts` + `getExplanation()` in each equation, `tests/explanations.test.ts` |
| UI | Ryan | `index.html`, `frontend/styles.css`, `frontend/src/main.ts`, `TitleScreenUI.ts` |

Shared: `backend/app.ts`, `backend/server.ts`, `backend/game/runStore.ts`, `GameState.ts`, `Health.ts`, `frontend/src/api.ts`, `tests/routes.test.ts`.

## Git workflow

1. **`main` always works.** Nobody pushes to it directly; everything goes through a pull request.
2. **One branch per user story or task**, made from the latest `main`:
   `git checkout main` → `git pull` → `git checkout -b feature-level-map`
3. **Keep branches small and short:** a few days at most. Split big stories, for example:
   - `feature-player-and-game-state` (the shared code, merged first)
   - `feature-level-map` (level logic and routes)
   - `feature-level-map-ui` (the map screen)
4. **Open a PR and get one teammate to review** before merging. This also gives you evidence for the course of reviewing each other's work.
5. **After merging, delete the branch** (GitHub offers a button), and everyone runs `git pull` on `main`.
6. **Pull `main` into your branch often** if it lives more than a day or two, so conflicts stay small.

### Backend: who uses whom

| File | Uses | What it gives others |
|---|---|---|
| `server.ts` | `app.ts` | Starts the server |
| `app.ts` | the 3 route files | Serves `frontend/` and mounts the `/api` routes |
| `routes/*.ts` | `runStore`, `GameManager` | The URLs (see API below) |
| `runStore.ts` | `GameState` | `create()` → new run id, `get(id)` → that run's GameState |
| `GameState.ts` | `Player`, `Level` | The data for one game: `player`, `level`, `combat` (current fight or none), `gameOver` |
| `GameManager.ts` | `Level`, `Combat`, `RestStop`, `BasicMonster` | The rules for what happens next: start the current stop, then move on or end the game after a win, loss or rest |
| `Level.ts` | `LevelNode` | 3–4 combat stops + 1 rest stop, `currentNode()`, `completeCurrent()` |
| `Combat.ts` | `EquationFactory` | `currentQuestion()`, `submitAnswer(answer)` → right/wrong, HPs, and win/lose/still fighting |
| `RestStop.ts` | (nothing) | `rest(player)` → heals the player to full |
| `Player.ts` | `Health` | The player's HP and attack: `takeDamage()`, `healFull()`, `isDead()` |
| `Monster.ts` | `Health` | Enemy HP and attack; `BasicMonster` extends `Monster` |
| `EquationFactory.ts` | the 3 equation classes | `create(difficulty)` → a random equation |
| Each equation class | `RandomEquation` | `getEquation()`, `getAnswer()`, `checkAnswer()`, `getExplanation()` |

### API (the contract between frontend and backend)

| Request | Sends | Gets back |
|---|---|---|
| `POST /api/runs` | nothing | `{ id, player:{hp,maxHp}, level, currentIndex, nodes:[{type,cleared}], gameOver }` |
| `GET /api/runs/:id` | nothing | the same state object |
| `GET /api/runs/:id/combat` | nothing | `{ question, playerHp, enemyHp }` |
| `POST /api/runs/:id/combat/answer` | `{ answer }` | `{ correct, playerHp, enemyHp, correctAnswer, explanation, result: "ongoing" \| "win" \| "lose" }` |
| `POST /api/runs/:id/rest` | nothing | the new state (full HP, next level) |

### Frontend: who uses whom

| File | Job |
|---|---|
| `index.html` | Loads `styles.css` and `main.ts` |
| `main.ts` | Keeps the run id and calls `showScreen(...)` based on the latest state from the server |
| `api.ts` | One function per route: `startRun()`, `getRun(id)`, `getQuestion(id)`, `submitAnswer(id, answer)`, `rest(id)` |
| Each screen (`*UI.ts`) | Draws itself from the data it's given, calls `api.ts` when the player acts, then tells `main.ts` it's done |
| `wrongAnswerExplanationPopUp.ts` | Opened by `CombatUI` when an answer comes back `correct: false` |

### Example: a player answers a question

1. **CombatUI** → `api.submitAnswer(id, 42)`
2. **api.ts** → `POST /api/runs/:id/combat/answer` with `{ "answer": 42 }`
3. **routes/combat.ts** → `runStore.get(id)` → `state.combat.submitAnswer(42)`
4. **Combat** → `equation.checkAnswer(42)`. If wrong, the player takes damage and the response includes `getAnswer()` and `getExplanation()`.
5. If the enemy's HP reaches 0, the route calls `GameManager`, which marks the stop cleared and moves to the next one.
6. The JSON comes back → **CombatUI** updates the HP bars. If the answer was wrong, it opens the **wrong-answer popup**. If `result` is `"win"` or `"lose"`, it tells **main.ts**, which shows the map or the game-over screen.
