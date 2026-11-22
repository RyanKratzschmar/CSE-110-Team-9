# Game Over screen

Approved in conversation: show a Game Over screen after death or when the future
quit button ends a run. Provide Play Again and Main Menu. The quit button itself
belongs to a teammate and is outside this change.

Use the existing Konva screen/controller pattern and shared GameSession. A new
`gameover` Screen route hides the other screens and ends the current run. Play
Again calls `GameSession.newGame()` and opens the map; Main Menu preserves the
ended run and opens the title screen. No separate screen model is needed.

Keep the existing answer-result Continue step before leaving a lost fight.
A lethal potion counterattack opens Game Over immediately, avoiding a delayed
callback that could overwrite a later screen. Preserve music and popup cleanup.

The view uses the existing purple/orange palette, a Game Over heading, a short
run-ended message, and two centered buttons. No score system, saved-game support,
new assets, or dependencies are introduced.

Approach: a dedicated screen provides one navigation destination for all callers.
Reusing the title screen would not communicate that the run ended; an alert would
not fit the existing in-game UI. The dedicated screen was approved by the user.
