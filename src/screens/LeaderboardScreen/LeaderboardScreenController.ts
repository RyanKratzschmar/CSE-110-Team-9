import { ScreenController } from '../../types';
import type {Screen, ScreenSwitcher } from '../../types';
import type { LeaderboardEntry } from '../../../backend/game/Leaderboard/Leaderboard';
import { LeaderboardScreenView } from './LeaderboardScreenView';
import { LeaderboardScreenModel } from './LeaderboardScreenModel';

const LINE_SCROLL = 60;

export class LeaderBoardScreenController extends ScreenController {
    private readonly screenSwitcher: ScreenSwitcher;
    private readonly model = new LeaderboardScreenModel();
    private readonly view: LeaderboardScreenView;
    private readonly clickSound = new Audio("/click.mp3");
    private returnTo: Screen = { type: "menu" };
    private loadId = 0;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.view = new LeaderboardScreenView({
            onScrollBy: (dy) => this.model.scrollBy(dy, this.view.getMaxScroll()),
            onScrollTo: (y) => this.model.scrollTo(y, this.view.getMaxScroll()),
            onBack: () => this.handleBack(),
            onLeave: () => this.handleLeave()
        });
        this.model.subscribe((state) => this.view.render(state));
        this.view.render(this.model.getState());
    }

    async startLeaderboard(returnTo: Screen): Promise<void> {
        this.returnTo = returnTo;
        this.model.setLoading();
        this.show();
        await this.loadEntries();
    }

    show(): void {
        super.show();
        window.addEventListener("keydown", this.handleKeyDown);
    }

    hide(): void {
        window.removeEventListener("keydown", this.handleKeyDown);
        super.hide();
    }

    getView(): LeaderboardScreenView {
        return this.view;
    }

    private async loadEntries(): Promise<void> {
        const id = ++this.loadId;
        try {
            const res = await fetch("/api/leaderboard");
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const entries = (await res.json()) as LeaderboardEntry[];
            if (id === this.loadId) {
                this.model.setEntries(entries);
            }
        } catch (err) {
            console.error("Failed to load leaderboard", err);
            if (id === this.loadId) {
                this.model.setEntries([]);
            }
        }
    }

    private playClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();
    }

    private handleBack(): void {
        this.playClick();
        this.screenSwitcher.switchToScreen(this.returnTo);
    }

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