import Konva from "konva";
import type { View } from "../../types";
import type { LeaderboardScreenState } from "./LeaderboardScreenModel";
import type { LeaderboardEntry } from "../../../backend/game/Leaderboard/Leaderboard";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants";

export interface LeaderboardViewHandlers {
    onScrollBy(dy: number): void;
    onScrollTo(y: number): void;
    onBack(): void;
    onLeave(): void;
}

const LIST_WIDTH = 1000;
const LIST_X = (STAGE_WIDTH - LIST_WIDTH) / 2;
const LIST_Y = 230;
const LIST_HEIGHT = 560;
const ROW_HEIGHT = 60;
const SCROLLBAR_X = LIST_X + LIST_WIDTH + 12;
const SCROLLBAR_WIDTH = 14;
const MIN_THUMB_HEIGHT = 40;

const RANK_X = 40;
const SCORE_X = 300;
const DATE_X = 600;

export class LeaderboardScreenView implements View {
    private readonly group: Konva.Group;
    private readonly listGroup: Konva.Group;
    private readonly scrollTrack: Konva.Rect;
    private readonly scrollThumb: Konva.Rect;
    private contentHeight = 0;
    private renderedEntries: readonly LeaderboardEntry[] | null = null;
    private renderedLoading: boolean | null = null;
    private readonly buttonBgs: Konva.Rect[] = [];

    constructor(private readonly handlers: LeaderboardViewHandlers) {
        this.group = new Konva.Group({ visible: false });

        this.group.add(new Konva.Rect({
            x: 0,
            y: 0,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: "#433550"
        }));

        this.group.add(new Konva.Text({
            x: 0,
            y: 40,
            width: STAGE_WIDTH,
            text: "Leaderboard",
            fontSize: 80,
            fontFamily: "Arial",
            fontStyle: "bold",
            fill: "#FFC943",
            align: "center"
        }));

        this.group.add(this.createButton("Back", 60, 50, () => this.handlers.onBack()));
        this.group.add(this.createButton("Leave", STAGE_WIDTH - 260, 50, () => this.handlers.onLeave()));

        for (const [label, x] of [["Rank", RANK_X], ["Score", SCORE_X], ["Date", DATE_X]] as const) {
            this.group.add(new Konva.Text({
                x: LIST_X + x,
                y: LIST_Y - 45,
                text: label,
                fontSize: 30,
                fontFamily: "Arial",
                fontStyle: "bold",
                fill: "white"
            }));
        }

        const clipGroup = new Konva.Group({
            x: LIST_X,
            y: LIST_Y,
            clip: { x: 0, y: 0, width: LIST_WIDTH, height: LIST_HEIGHT }
        });

        clipGroup.add(new Konva.Rect({
            width: LIST_WIDTH,
            height: LIST_HEIGHT,
            fill: "#2E2438",
            cornerRadius: 8
        }));

        this.listGroup = new Konva.Group();
        clipGroup.add(this.listGroup);
        this.group.add(clipGroup);

        this.scrollTrack = new Konva.Rect({
            x: SCROLLBAR_X,
            y: LIST_Y,
            width: SCROLLBAR_WIDTH,
            height: LIST_HEIGHT,
            fill: "#2E2438",
            cornerRadius: SCROLLBAR_WIDTH / 2
        });

        this.scrollThumb = new Konva.Rect({
            x: SCROLLBAR_X,
            y: LIST_Y,
            width: SCROLLBAR_WIDTH,
            height: LIST_HEIGHT,
            fill: "#FFC943",
            cornerRadius: SCROLLBAR_WIDTH / 2,
            draggable: true,
            dragBoundFunc: (pos) => ({
                x: SCROLLBAR_X,
                y: Math.max(LIST_Y, Math.min(LIST_Y + LIST_HEIGHT - this.scrollThumb.height(), pos.y))
            })
        });

        this.scrollThumb.on("dragmove", () => {
            const travel = LIST_HEIGHT - this.scrollThumb.height();
            const fraction = travel > 0? (this.scrollThumb.y() - LIST_Y) / travel : 0;
            this.handlers.onScrollTo(fraction*this.getMaxScroll());
        });

        this.group.add(this.scrollTrack, this.scrollThumb);

        this.group.on("wheel", (e) => {
            e.evt.preventDefault();
            const dy = e.evt.deltaMode === 1? e.evt.deltaY * ROW_HEIGHT : e.evt.deltaY;
            this.handlers.onScrollBy(dy);
        });
    }

    render(state: LeaderboardScreenState): void {
        if (state.leaderboard !== this.renderedEntries || state.loading !== this.renderedLoading) {
            this.buildRows(state.leaderboard, state.loading);
            this.renderedEntries = state.leaderboard;
            this.renderedLoading = state.loading;
        }
        this.listGroup.y(-state.scrollY);
        this.updateScrollbar(state.scrollY);
        this.group.getLayer()?.batchDraw();
    }

    getMaxScroll(): number {
        return Math.max(0, this.contentHeight - LIST_HEIGHT);
    }

    getViewportHeight(): number {
        return LIST_HEIGHT;
    }

    getGroup(): Konva.Group {
        return this.group;
    }

    show(): void {
        this.group.visible(true);
    }

    hide(): void {
        document.body.style.cursor = "default";
        this.buttonBgs.forEach((bg) => bg.fill("#FFC943"));
        this.group.visible(false);
    }

    private buildRows(entries: readonly LeaderboardEntry[], loading: boolean): void {
        this.listGroup.destroyChildren();

        if (loading || entries.length === 0) {
            this.listGroup.add(new Konva.Text({
                x: 0,
                y: LIST_HEIGHT / 2 - 20,
                width: LIST_WIDTH,
                text: loading? "Loading..." : "No scores yet",
                fontSize: 32,
                fontFamily: "Arial",
                fill: "#BBBBBB",
                align: "center"
            }));
            this.contentHeight = 0;
            return;
        }

        entries.forEach((entry, i) => {
            const row = new Konva.Group({ y: i * ROW_HEIGHT });
            row.add(new Konva.Rect({
                width: LIST_WIDTH,
                height: ROW_HEIGHT,
                fill: i % 2 === 0 ? "#3A2E46" : "#2E2438"
            }));
            
            const cells: [string, number][] = [
                [`#${i + 1}`, RANK_X],
                [String(entry.score), SCORE_X],
                [this.formatDate(entry.timestamp), DATE_X]
            ];

            for (const [text, x] of cells) {
                row.add(new Konva.Text({
                    x,
                    y: 0,
                    height: ROW_HEIGHT,
                    verticalAlign: "middle",
                    text,
                    fontSize: 28,
                    fontFamily: "Arial",
                    fill: "#FFF"
                }));
            }

            this.listGroup.add(row);
        });

        this.contentHeight = entries.length * ROW_HEIGHT;
    }

    private updateScrollbar(scrollY: number): void {
        const max = this.getMaxScroll();
        const scrollable = max > 0;
        this.scrollTrack.visible(scrollable);
        this.scrollThumb.visible(scrollable);
        if (!scrollable) {
            return;
        }

        const thumbHeight = Math.max(MIN_THUMB_HEIGHT, (LIST_HEIGHT / this.contentHeight) * LIST_HEIGHT);
        this.scrollThumb.height(thumbHeight);
        this.scrollThumb.y(LIST_Y + (scrollY / max) * (LIST_HEIGHT - thumbHeight));
    }

    private formatDate(timestamp: string): string {
        const date = new Date(timestamp);
        return Number.isNaN(date.getTime())? timestamp : date.toLocaleDateString();
    }

    private createButton(label: string, x: number, y: number, onClick: () => void): Konva.Group {
        const button = new Konva.Group({ x, y });
        const bg = new Konva.Rect( {
            width: 200,
            height: 70,
            fill: "#FFC943",
            cornerRadius: 12,
            stroke: "#FFF",
            strokeWidth: 3
        });
        
        this.buttonBgs.push(bg);
        
        const text = new Konva.Text({
            width: 200,
            height: 70,
            text: label,
            align: "center",
            verticalAlign: "middle",
            fontSize: 32,
            fontFamily: "Arial",
            fontStyle: "bold",
            fill: "#433550"
        });
        
        button.add(bg, text);
        button.on("click tap", onClick);
        button.on("mouseenter", () => { document.body.style.cursor = "pointer"; bg.fill("#B678D0")});
        button.on("mouseleave", () => { document.body.style.cursor = "default"; bg.fill("#FFC943")});
        return button;
    }
}