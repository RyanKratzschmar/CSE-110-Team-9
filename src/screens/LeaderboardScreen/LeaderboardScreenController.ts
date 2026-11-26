import { ScreenController } from '../../types';
import type { ScreenSwitcher } from '../../types';
import { LeaderboardScreenView } from './LeaderboardScreenView';
import { LeaderboardScreenModel } from './LeaderboardScreenModel';
import { GameSession } from '../../GameSession';

const LINE_SCROLL = 60;

//Connects the leaderboard model and view, loads the finished games, and handles input
export class LeaderBoardScreenController extends ScreenController {
    private readonly screenSwitcher: ScreenSwitcher;
    private readonly model = new LeaderboardScreenModel();
    private readonly view: LeaderboardScreenView;
    private readonly clickSound = new Audio("/click.mp3");
    private readonly gameSession: GameSession;

    //Creates the view with its scroll and leave handlers, and redraws the view whenever the model changes
    constructor(screenSwitcher: ScreenSwitcher, gameSession: GameSession) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.gameSession = gameSession;
        this.view = new LeaderboardScreenView({
            onScrollBy: (dy) => this.model.scrollBy(dy, this.view.getMaxScroll()),
            onScrollTo: (y) => this.model.scrollTo(y, this.view.getMaxScroll()),
            onLeave: () => this.handleLeave()
        });
        this.model.subscribe((state) => this.view.render(state));
        this.view.render(this.model.getState());
    }

    //Loads the finished games from this session and shows the screen
    startLeaderboard(): void {
        this.model.setEntries(this.gameSession.leaderboard.getSorted());
        this.show();    
    }

    //Shows the screen and starts listening for keyboard scrolling
    show(): void {
        super.show();
        window.addEventListener("keydown", this.handleKeyDown);
    }

    //Stops listening for keyboard scrolling and hides the screen
    hide(): void {
        window.removeEventListener("keydown", this.handleKeyDown);
        super.hide();
    }

    //Returns the leaderboard view
    getView(): LeaderboardScreenView {
        return this.view;
    }

    //Plays the click sound
    private playClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();
    }

    //Plays the click sound and returns to the main menu
    private handleLeave(): void {
        this.playClick();
        this.screenSwitcher.switchToScreen({ type: "menu" });
    }

    //Scrolls using the arrow keys, Space, Page Up/Down, Home, and End
    private readonly handleKeyDown = (event: KeyboardEvent): void => {
        const max = this.view.getMaxScroll();
        const page = this.view.getViewportHeight() * 0.9;

        switch (event.key) {
            case 'ArrowDown':
                this.model.scrollBy(LINE_SCROLL, max);
                break;
            case 'ArrowUp':
                this.model.scrollBy(-LINE_SCROLL, max);
                break;
            case ' ':
            case 'PageDown':
                this.model.scrollBy(page, max);
                break;
            case 'PageUp':
                this.model.scrollBy(-page, max);
                break;
            case 'Home':
                this.model.scrollTo(0, max);
                break;
            case 'End':
                this.model.scrollTo(max, max);
                break;
            default:
                return;
        }
        event.preventDefault();
    };
}