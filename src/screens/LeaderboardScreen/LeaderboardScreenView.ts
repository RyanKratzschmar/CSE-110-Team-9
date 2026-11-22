import Konva from "konva";
import type { View } from "../../types";
import type { LeaderboardScreenState } from "./LeaderboardScreenModel";
import type { FloorEntry } from "../../../backend/game/Leaderboard/FloorLeaderboard";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants";

export interface LeaderboardViewHandlers {
    onScrollBy(dy: number): void;
    onScrollTo(y: number): void;
    onLeave(): void;
}

const LIST_WIDTH = 1440;
const LIST_X = (STAGE_WIDTH - LIST_WIDTH) / 2;
const LIST_Y = 135;
const LIST_HEIGHT = 648;
const ROW_HEIGHT = 72;
const SCROLLBAR_X = LIST_X + LIST_WIDTH + 8;
const SCROLLBAR_WIDTH = 14;
const MIN_THUMB_HEIGHT = 40;

const RANK_W = 105;
const DATE_W = 630;
const FLOOR_W = LIST_WIDTH - RANK_W - DATE_W;

const GOLD = "#D4AF37";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";
const ROW_A = "#5A4A78";
const ROW_B = "#4F4268";
const DIVIDER = "#3A2E4A";

//Draws the leaderboard screen: the title, the scrollable list of floors, the scrollbar, and the Leave button
export class LeaderboardScreenView implements View {
    private readonly group: Konva.Group;
    private readonly listGroup: Konva.Group;
    private readonly scrollTrack: Konva.Rect;
    private readonly scrollThumb: Konva.Rect;
    private contentHeight = 0;
    private renderedEntries: readonly FloorEntry[] | null = null;
    private renderedLoading: boolean | null = null;
    private readonly buttonBgs: Konva.Rect[] = [];

    //Builds the background, title, Leave button, clipped list area, and draggable scrollbar, and sets up mouse wheel scrolling
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
            y: 15,
            width: STAGE_WIDTH,
            text: "Leader Board",
            fontSize: 90,
            fontFamily: "Courier New, monospace",
            fontStyle: "bold",
            fill: "#FFD60A",
            align: "center"
        }));

        this.group.add(this.createButton("Leave", LIST_X + LIST_WIDTH - 200, 815, "#F04A23", "#FFFFFF", () => this.handlers.onLeave()));

        const clipGroup = new Konva.Group({
            x: LIST_X,
            y: LIST_Y,
            clipFunc: (ctx) => { ctx.beginPath(); ctx.roundRect(0, 0, LIST_WIDTH, LIST_HEIGHT, 10); ctx.closePath(); }
        });

        clipGroup.add(new Konva.Rect({
            width: LIST_WIDTH,
            height: LIST_HEIGHT,
            fill: ROW_B,
            cornerRadius: 10
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

    //Rebuilds the rows only when the entries or loading state change, then updates the scroll position and scrollbar
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

    //Returns how far the list can scroll, or 0 if every row fits on screen
    getMaxScroll(): number {
        return Math.max(0, this.contentHeight - LIST_HEIGHT);
    }

    //Returns the height of the visible list area
    getViewportHeight(): number {
        return LIST_HEIGHT;
    }

    //Returns the Konva group that holds the whole screen
    getGroup(): Konva.Group {
        return this.group;
    }

    //Makes the screen visible
    show(): void {
        this.group.visible(true);
    }

    //Hides the screen and resets the cursor and button colors so no hover effect stays behind
    hide(): void {
        document.body.style.cursor = "default";
        this.buttonBgs.forEach((bg) => bg.fill(bg.getAttr("baseFill")));
        this.group.visible(false);
    }

    //Draws one row per entry (rank, date, floor) with gold, silver, and bronze for the top 3, or a loading/empty message
    private buildRows(entries: readonly FloorEntry[], loading: boolean): void {
        this.listGroup.destroyChildren();

        if (loading || entries.length === 0) {
            this.listGroup.add(new Konva.Text({
                x: 0,
                y: LIST_HEIGHT / 2 - 16,
                width: LIST_WIDTH,
                text: loading? "Loading..." : "No floors yet",
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
                fill: i === 0 ? GOLD : i === 1 ? SILVER : i === 2 ? BRONZE : (i % 2 === 0 ? ROW_A : ROW_B)
            }));
            row.add(new Konva.Line({
                points: [RANK_W + DATE_W, 0, RANK_W + DATE_W, ROW_HEIGHT],
                stroke: DIVIDER,
                strokeWidth: 1
            }));
            
            row.add(new Konva.Line({
                points: [RANK_W, 0, RANK_W, ROW_HEIGHT],
                stroke: DIVIDER,
                strokeWidth: 1 
            }));

            row.add(new Konva.Line({
                points: [0, ROW_HEIGHT, LIST_WIDTH, ROW_HEIGHT],
                stroke: DIVIDER,
                strokeWidth: 1
            }));
            
            const cells: [string, number, number][] = [
                [String(i + 1), 0, RANK_W],
                [this.formatDate(entry.timestamp), RANK_W, DATE_W],
                [`Floor ${entry.floor}`, RANK_W + DATE_W, FLOOR_W]
            ];

            for (const [text, x, width] of cells) {
                row.add(new Konva.Text({
                    x,
                    y: 0,
                    width,
                    align: "center",
                    height: ROW_HEIGHT,
                    verticalAlign: "middle",
                    text,
                    fontSize: 26,
                    fontFamily: "Arial",
                    fontStyle: "bold",
                    fill: i < 3 ? "#2B2233" : (x === 0 ? "#C9BEDD" : "#FFF")
                }));
            }

            this.listGroup.add(row);
        });

        this.contentHeight = entries.length * ROW_HEIGHT;
    }

    //Sizes and positions the scrollbar to match the scroll position, and hides it when there's nothing to scroll
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

    //Formats a timestamp as a readable date and time, or returns it unchanged if it isn't a valid date
    private formatDate(timestamp: string): string {
        const date = new Date(timestamp);

        return Number.isNaN(date.getTime())? timestamp : date.toLocaleString(undefined, {month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"});
    }

    //Creates a clickable button that changes color and shows a pointer cursor on hover
    private createButton(label: string, x: number, y: number, fill: string, textColor: string, onClick: () => void): Konva.Group {
        const button = new Konva.Group({ x, y });
        const bg = new Konva.Rect( {
            width: 200,
            height: 62,
            fill,
            cornerRadius: 6,
            stroke: "#FFE9C2",
            strokeWidth: 2
        });
        
        this.buttonBgs.push(bg);

        bg.setAttr("baseFill", fill);
        
        const text = new Konva.Text({
            width: 200,
            height: 62,
            text: label,
            align: "center",
            verticalAlign: "middle",
            fontSize: 26,
            fontFamily: "Arial",
            fontStyle: "normal",
            fill: textColor
        });

        button.add(bg, text);
        button.on("click tap", onClick);
        button.on("mouseenter", () => { document.body.style.cursor = "pointer"; bg.fill("#B678D0")});
        button.on("mouseleave", () => { document.body.style.cursor = "default"; bg.fill(fill)});
        return button;
    }
}