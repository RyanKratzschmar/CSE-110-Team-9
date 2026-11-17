# Sprint 2

UI for every new screen: Ryan. One branch per story, following the README git workflow.

## Upgrade minigame

### 1. Earn an upgrade with a math challenge (David)
> As a player, I want to complete a math challenge to earn an upgrade, so that practicing math helps me strengthen my character.

**Priority:** High · **Estimate:** 10 h · **Branch:** `feature-upgrade-minigame`

Rules: 60-second timer; times tables (1 to 12) x (1 to 12); answer as many as you can; check each answer and show the correct one (no explanation); one upgrade per level; the upgrade raises all stats.

Files: `backend/equations/TimesTableEquation.ts`, `backend/game/UpgradeMinigame.ts`, `src/screens/UpgradeMinigameScreen/*`, `tests/upgrade.test.ts`

- [ ] Build the minigame screen with instructions, a math problem, and an answer field (1 h)
- [ ] Display problems and check submitted answers (2 h)
- [ ] Show feedback and allow another attempt after an incorrect answer (2 h)
- [ ] Award a basic upgrade after a correct answer and display its effect (1 h)
- [ ] Write tests for answer checking, invalid inputs, retries, and awarding the upgrade only once (2 h)
- [ ] Run and debug (2 h)

## Potion lab

### 1. Solve an equation to brew a potion (Sally)
> As a player, I want to solve an equation to brew a potion, so that I practice order of operations while preparing for fights.

**Priority:** High · **Estimate:** 10 h · **Branch:** `feature-potion-lab`

Rules: PEMDAS equation; two difficulty levels per potion. Easy (add / subtract) brews an ok potion; hard (multiply / divide) brews a better potion.

Code split: Sally writes the lab logic (`backend/game/PotionLab.ts`, `src/screens/PotionLabScreen/*`, `tests/potionLab.test.ts`). Oliver writes the equations (`backend/equations/PemdasEquation.ts`, tested in `tests/equations.test.ts`).

- [ ] Generate or select an order-of-operations equation (2 h)
- [ ] Display the equation and an answer input field (2 h)
- [ ] Check whether the player's answer is correct (2 h)
- [ ] Write tests: verify equation display and correct/incorrect answer validation (2 h)
- [ ] Run tests and fix bugs (2 h)

### 2. A correct answer gives me the potion (Oliver)
> As a player, I want a correct answer to give me the potion, so that solving feels rewarding and helps me survive in upcoming fights.

**Priority:** High · **Estimate:** 7 h · **Branch:** `feature-potion-inventory`

Files: `backend/game/Potion.ts`, `backend/game/Inventory.ts`, `src/screens/PotionLabScreen/PotionLabScreenView.ts` (success message), `tests/potions.test.ts`

- [ ] Connect a correct answer to successful potion brewing (2 h)
- [ ] Add the brewed potion to the player's inventory (1 h)
- [ ] Display a success message when the potion is obtained (1 h)
- [ ] Write tests: verify correct answers grant exactly one potion and update inventory correctly (2 h)
- [ ] Run tests and fix bugs (1 h)

### 3. Use potions in battle (Arushi)
> As a player, I want to be able to use potions in battle instead of attacking so that I can heal during combat and not lose.

**Priority:** Medium · **Estimate:** 10 h · **Branch:** `feature-potion-combat`

Files: `src/screens/CombatMainScreen/PotionPopUpView.ts`, `CombatMainScreenController.ts`, `CombatMainScreenView.ts`, `backend/game/Combat.ts`, `tests/potionCombat.test.ts`

- [ ] Create buttons for option to attack or use potion during player turn (attack links to regular attack flow, potions leads to potion popup screen) (2 h)
- [ ] Create options to return to action select from attack question/potion use popups (1 h)
- [ ] Connect potion tracker and create visual way to see potions and click to use (2 h)
- [ ] If using a potion, should remove potion and heal player accordingly (then enemy attacks) (1 h)
- [ ] Write tests: move between actions without being attacked, the attack question does not change after being seen, health updates correctly, the potion is removed from the inventory (2 h)
- [ ] Run tests and debug (2 h)

## Leaderboard

### 1. See every user's score (Darsh)
> As a player, I want a way to keep track of all users' scores so that I can get an idea of how my progress is relative to my peers.

**Priority:** Medium · **Estimate:** 8 h · **Branch:** `feature-leaderboard`

Files: `backend/game/Leaderboard.ts`, `backend/routes/leaderboard.ts`, `src/screens/LeaderboardScreen/*`, `tests/leaderboard.test.ts`

- [ ] Set up backend to sync login system's database and add score column to database so that we can read the scores of each player (1 h)
- [ ] Set up frontend to take all the usernames in the database and sort them in descending order of their scores (1 h)
- [ ] Set up UI that displays the list of usernames with their scores, formatted like the prototype; the leaderboard scrolls (3 h)
- [ ] Add the Back button (goes to the previous page) and the Leave button (goes to the Title Screen) (1 h)
- [ ] Write tests: usernames sorted by score, correct usernames and scores from the database, Back and Leave work (1 h)
- [ ] Run tests and debug (1 h)

## Rest

### 1. See which minigames are available (Lianshi)
> In Rest, as a player, I want to see what mini games are available so that I can gain some bonuses before the next battle.

**Priority:** Low · **Estimate:** 8 h · **Branch:** `feature-rest-menu`

Files: `src/screens/RestScreen/*`, `tests/restMenu.test.ts`

- [ ] Create the Rest menu with Upgrade Mini Game, Potions Mini Game, and Leave Rest buttons (2 h)
- [ ] Connect the two minigame buttons to their corresponding screens (2 h)
- [ ] Connect the Leave Rest button to return the player to the main game (1 h)
- [ ] Write tests: verify all buttons navigate to the correct screens and the Rest menu displays correctly (2 h)
- [ ] Run tests and fix bugs (1 h)

## To agree on as a team

- **Login system:** the leaderboard reads from the login system's database, which isn't in the repo yet.
- **Healing at the rest stop:** the Rest screen heals every time it opens, so coming back from a minigame would heal again.
- **Numbers:** potion heal amounts, and how much an upgrade raises each stat.
- **Shared files:** `Player.ts` needs healing (Arushi) and a stat upgrade (David); `GameState.ts`, `src/types.ts`, and `src/main.ts` get new entries from several stories.
