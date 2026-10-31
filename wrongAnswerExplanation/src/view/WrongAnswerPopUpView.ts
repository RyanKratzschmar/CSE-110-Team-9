import Konva from 'konva';
import type { WrongAnswerPopUpState } from '../model/WrongAnswerPopUpModel';
import { isCellVisible, type ExplanationStep, type WorkCell, type WorkLayout, type WorkedSolution } from '../wrongAnswerExplanationPopUp';

export interface WrongAnswerPopUpViewHandlers {
    onScrollBy(dy: number): void;
    onScrollTo(y: number): void;
    onClose(): void;
}

interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

type Slot = Omit<Box, 'height'>;

interface Built {
    solution: WorkedSolution;
    stageWidth: number;
    stageHeight: number;
    content: Konva.Group;
    viewportHeight: number;
    contentHeight: number;
    thumb: Konva.Rect | null;
    trackY: number;
    trackHeight: number;
}

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const PAD = 20;
const PANEL_MARGIN = 16;
const SCROLLBAR_GUTTER = 16;
const STEP_GAP = 18;

const COLORS = {
    overlay: 'rgba(15, 23, 42, 0.55)',
    panel: '#ffffff',
    ink: '#1e293b',
    muted: '#64748b',
    divider: '#e2e8f0',
    paper: '#f8fafc',
    paperBorder: '#e2e8f0',
    current: '#2563eb',
    currentBg: '#dbeafe',
    carry: '#ea580c',
    placeholder: '#94a3b8',
    closeBg: '#e2e8f0',
    track: '#f1f5f9',
    thumb: '#cbd5e1',
} as const;

function panelSize(available: number, preferredMin: number, max: number): number {
    return Math.min(max, Math.max(available - PANEL_MARGIN * 2, Math.min(preferredMin, available)));
}

export class WrongAnswerPopUpView {
    private readonly stage: Konva.Stage;
    private readonly layer: Konva.Layer;
    private handlers: WrongAnswerPopUpViewHandlers | null = null;
    private lastState: WrongAnswerPopUpState | null = null;
    private built: Built | null = null;

    constructor(stage: Konva.Stage) {
        this.stage = stage;
        this.layer = new Konva.Layer({ visible: false });
        stage.add(this.layer);
    }

    setHandlers(handlers: WrongAnswerPopUpViewHandlers): void {
        this.handlers = handlers;
    }

    render(state: WrongAnswerPopUpState): void {
        this.lastState = state;
        const solution = state.solution;

        if (!state.isOpen || !solution) {
            if (this.built) {
                this.built = null;
                this.layer.destroyChildren();
                this.layer.visible(false);
                this.setCursor('default');
                this.layer.batchDraw();
            }
            return;
        }

        const b = this.built;
        const upToDate = (b !== null) && (b.solution === solution) && (b.stageWidth === this.stage.width()) && (b.stageHeight === this.stage.height());

        if (!upToDate) {
            this.build(solution);
        }

        this.applyScroll(state.scrollY);
        this.layer.batchDraw();
    }

    getMaxScroll(): number {
        return this.built ? Math.max(0, this.built.contentHeight - this.built.viewportHeight) : 0;
    }

    getViewportHeight(): number {
        return this.built?.viewportHeight ?? 0;
    }

    refresh(): void {
        this.built = null;
        if (this.lastState) {
            this.render(this.lastState);
        }
    }

    destroy(): void {
        this.setCursor('default');
        this.layer.destroy();
        this.handlers = null;
        this.lastState = null;
        this.built = null;
    }

    private build(solution: WorkedSolution): void {
        this.layer.destroyChildren();
        this.layer.visible(true);
        this.layer.moveToTop();
        this.setCursor('default');

        const sw = this.stage.width();
        const sh = this.stage.height();

        const overlay = new Konva.Rect({ x: 0, y: 0, width: sw, height: sh, fill: COLORS.overlay });
        overlay.on('click tap', () => this.handlers?.onClose());
        this.layer.add(overlay);

        const pw = panelSize(sw, 300, 860);
        const ph = panelSize(sh, 360, 760);
        const panel = new Konva.Group({ x: Math.round((sw - pw) / 2), y: Math.round((sh - ph) / 2) });
        this.layer.add(panel);
        panel.add(
            new Konva.Rect({
                width: pw,
                height: ph,
                fill: COLORS.panel,
                cornerRadius: 16,
                shadowColor: '#000',
                shadowBlur: 28,
                shadowOpacity: 0.22,
                shadowOffsetY: 10,
            }),
        );

        const title = new Konva.Text({
            x: PAD,
            y: PAD,
            width: Math.max(0, pw - PAD * 2 - 44),
            text: `Worked solution: ${solution.problemText}`,
            fontFamily: FONT,
            fontSize: 21,
            fontStyle: 'bold',
            fill: COLORS.ink,
        });
        const subtitle = new Konva.Text({
            x: PAD,
            y: title.y() + title.height() + 4,
            text: 'Scroll to see every step.',
            fontFamily: FONT,
            fontSize: 13,
            fill: COLORS.muted,
        });
        panel.add(title, subtitle);
        this.drawCloseButton(panel, pw - PAD - 32, PAD - 4);

        const headerBottom = subtitle.y() + subtitle.height() + 14;
        panel.add(new Konva.Line({ points: [0, headerBottom, pw, headerBottom], stroke: COLORS.divider, strokeWidth: 1 }));

        const viewport: Box = {
            x: PAD,
            y: headerBottom + 1,
            width: pw - PAD * 2,
            height: ph - headerBottom - 1 - 8,
        };

        const viewportGroup = new Konva.Group({
            x: viewport.x,
            y: viewport.y,
            clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
        });
        panel.add(viewportGroup);

        const content = new Konva.Group();
        viewportGroup.add(content);
        const contentWidth = viewport.width - SCROLLBAR_GUTTER;
        let y = STEP_GAP;
        solution.steps.forEach((step, i) => {
            if (i > 0) {
                content.add(
                    new Konva.Line({ points: [0, y, contentWidth, y], stroke: COLORS.divider, strokeWidth: 1 }),
                );
                y += STEP_GAP;
            }
            y += this.drawStep(content, solution.layout, step, i, y, contentWidth) + STEP_GAP;
        });
        const contentHeight = y;

        let thumb: Konva.Rect | null = null;
        const trackY = viewport.y + 6;
        const trackHeight = viewport.height - 12;
        if (contentHeight > viewport.height) {
            const trackX = viewport.x + viewport.width - 8;
            thumb = this.drawScrollbar(panel, trackX, trackY, trackHeight, viewport.height / contentHeight);
        }

        this.bindScrollInput(panel, thumb);

        this.built = {
            solution,
            stageWidth: sw,
            stageHeight: sh,
            content,
            viewportHeight: viewport.height,
            contentHeight,
            thumb,
            trackY,
            trackHeight,
        };
    }

    private drawScrollbar(panel: Konva.Group, trackX: number, trackY: number, trackHeight: number, visibleRatio: number): Konva.Rect {
        const thumbHeight = Math.min(trackHeight, Math.max(40, trackHeight * visibleRatio));
        const travel = trackHeight - thumbHeight;

        panel.add(
            new Konva.Rect({ x: trackX, y: trackY, width: 6, height: trackHeight, fill: COLORS.track, cornerRadius: 3 }),
        );

        const thumb = new Konva.Rect({
            x: trackX,
            y: trackY,
            width: 6,
            height: thumbHeight,
            fill: COLORS.thumb,
            cornerRadius: 3,
            draggable: true,
            hitStrokeWidth: 16,
        });

        const panelPos = panel.getAbsolutePosition();
        thumb.dragBoundFunc((pos) => ({
            x: panelPos.x + trackX,
            y: Math.max(panelPos.y + trackY, Math.min(panelPos.y + trackY + travel, pos.y)),
        }));

        thumb.on('dragmove', () => {
            const ratio = travel > 0 ? (thumb.y() - trackY) / travel : 0;
            this.handlers?.onScrollTo(ratio * this.getMaxScroll());
        });
        thumb.on('dragstart', () => this.setCursor('grabbing'));
        thumb.on('dragend', () => this.setCursor('grab'));
        thumb.on('mouseenter', () => {
            if (!thumb.isDragging()) {
                this.setCursor('grab');
            }
        });
        thumb.on('mouseleave', () => {
            if (!thumb.isDragging()) {
                this.setCursor('default');
            }
        });

        panel.add(thumb);
        return thumb;
    }

    private applyScroll(scrollY: number): void {
        const b = this.built;

        if (!b) {
            return;
        }

        const max = this.getMaxScroll();
        const y = Math.max(0, Math.min(max, scrollY));

        b.content.y(-y);

        if (b.thumb && max > 0) {
            b.thumb.y(b.trackY + (y / max) * (b.trackHeight - b.thumb.height()));
        }
    }

    private bindScrollInput(target: Konva.Group, thumb: Konva.Rect | null): void {
        target.on('wheel', (event) => {
            const wheel = event.evt as WheelEvent;
            wheel.preventDefault();
            const scale = wheel.deltaMode === 1 ? 40 : wheel.deltaMode === 2 ? this.getViewportHeight() : 1;
            this.handlers?.onScrollBy(wheel.deltaY * scale);
        });

        let lastTouchY: number | null = null;

        target.on('touchstart', (event) => {
            lastTouchY = event.target === thumb ? null : (this.stage.getPointerPosition()?.y ?? null);
        });

        target.on('touchmove', (event) => {
            const y = this.stage.getPointerPosition()?.y;
            if (y === undefined || lastTouchY === null) {
                return;
            }
            event.evt.preventDefault();
            this.handlers?.onScrollBy(lastTouchY - y);
            lastTouchY = y;
        });

        target.on('touchend', () => {
            lastTouchY = null;
        });
    }

    private drawStep(parent: Konva.Group, layout: WorkLayout, step: ExplanationStep, index: number, top: number, width: number): number {
        const sideBySide = width >= 560;
        const workWidth = sideBySide ? Math.min(300, Math.round(width * 0.42)) : width;

        const workHeight = this.drawWork(parent, layout, index, { x: 0, y: top, width: workWidth });

        const textSlot: Slot = sideBySide
            ? { x: workWidth + 22, y: top, width: width - workWidth - 22 }
            : { x: 0, y: top + workHeight + 12, width };
        const textHeight = this.drawStepText(parent, step, index, textSlot);

        return sideBySide ? Math.max(workHeight, textHeight) : workHeight + 12 + textHeight;
    }

    private drawWork(parent: Konva.Group, layout: WorkLayout, stepIndex: number, slot: Slot): number {
        const visibleCells = layout.cells.filter((c) => isCellVisible(c, stepIndex));
        const visibleLines = layout.lines.filter((l) => l.step <= stepIndex);

        const rows = Math.max(
            0,
            ...visibleCells.map((c) => c.row),
            ...visibleLines.map((l) => l.row),
        ) + 1;

        const inset = 12;
        const cellW = Math.min(34, Math.max(0, slot.width - inset * 2) / Math.max(1, layout.columns));
        const cellH = cellW * 1.15;
        const height = rows * cellH + inset * 2;

        parent.add(
            new Konva.Rect({
                x: slot.x,
                y: slot.y,
                width: slot.width,
                height,
                fill: COLORS.paper,
                stroke: COLORS.paperBorder,
                strokeWidth: 1,
                cornerRadius: 12,
            }),
        );

        const gx = slot.x + (slot.width - cellW * layout.columns) / 2;
        const gy = slot.y + inset;

        for (const cell of visibleCells) {
            const x = gx + cell.col * cellW;
            const y = gy + cell.row * cellH;

            if (cell.kind === 'bracket') {
                parent.add(
                    new Konva.Line({
                        points: [x + cellW * 0.55, y, x + cellW * 0.82, y + cellH / 2, x + cellW * 0.55, y + cellH],
                        tension: 0.5,
                        stroke: COLORS.ink,
                        strokeWidth: Math.max(1.5, cellW * 0.07),
                        lineCap: 'round',
                    }),
                );
                continue;
            }

            const isCarry = cell.kind === 'carry';
            const isNewDigit = stepIndex > 0 && cell.step === stepIndex && cell.kind === 'digit';

            if (isNewDigit) {
                parent.add(new Konva.Rect({ x: x + 1, y: y + 1, width: cellW - 2, height: cellH - 2, fill: COLORS.currentBg, cornerRadius: 4 }));
            }

            parent.add(
                new Konva.Text({
                    x,
                    y,
                    width: cellW,
                    height: cellH,
                    align: 'center',
                    verticalAlign: isCarry ? 'bottom' : 'middle',
                    text: cell.text,
                    fontFamily: MONO,
                    fontSize: isCarry ? cellW * 0.45 : cellW * 0.64,
                    fontStyle: isNewDigit ? 'bold' : 'normal',
                    fill: this.cellColor(cell, isNewDigit),
                }),
            );
        }

        for (const line of visibleLines) {
            const y = gy + (line.row + (line.edge === 'bottom' ? 1 : 0)) * cellH;
            const fromX = gx + (line.fromCol + line.fromOffset) * cellW;
            const toX = gx + (line.toCol + 1) * cellW;
            parent.add(
                new Konva.Line({
                    points: [fromX, y, toX, y],
                    stroke: stepIndex > 0 && line.step === stepIndex ? COLORS.current : COLORS.ink,
                    strokeWidth: Math.max(1.5, cellW * 0.06),
                    lineCap: 'round',
                }),
            );
        }

        return height;
    }

    private cellColor(cell: WorkCell, isNewDigit: boolean): string {
        if (cell.kind === 'carry') {
            return COLORS.carry;
        }
        if (cell.kind === 'placeholder') {
            return COLORS.placeholder;
        }
        return isNewDigit ? COLORS.current : COLORS.ink;
    }

    private drawStepText(parent: Konva.Group, step: ExplanationStep, index: number, slot: Slot): number {
        const compact = slot.width < 420;
        let y = slot.y;

        const label = new Konva.Text({
            x: slot.x,
            y,
            text: `STEP ${index + 1}`,
            fontFamily: FONT,
            fontSize: 12,
            fontStyle: 'bold',
            letterSpacing: 1,
            fill: COLORS.current,
        });
        parent.add(label);
        y += label.height() + 6;

        const title = new Konva.Text({
            x: slot.x,
            y,
            width: slot.width,
            text: step.title,
            fontFamily: FONT,
            fontSize: compact ? 16 : 18,
            fontStyle: 'bold',
            fill: COLORS.ink,
        });
        parent.add(title);
        y += title.height() + 6;

        const description = new Konva.Text({
            x: slot.x,
            y,
            width: slot.width,
            text: step.description,
            fontFamily: FONT,
            fontSize: compact ? 14 : 15,
            lineHeight: 1.4,
            fill: COLORS.ink,
        });
        parent.add(description);
        y += description.height();

        if (step.details.length > 0) {
            y += 8;
        }
        for (const detail of step.details) {
            parent.add(
                new Konva.Text({ x: slot.x, y, text: '•', fontFamily: FONT, fontSize: 14, lineHeight: 1.35, fill: COLORS.current }),
            );
            const text = new Konva.Text({
                x: slot.x + 14,
                y,
                width: slot.width - 14,
                text: detail,
                fontFamily: FONT,
                fontSize: compact ? 13 : 14,
                lineHeight: 1.35,
                fill: COLORS.ink,
            });
            parent.add(text);
            y += text.height() + 5;
        }
        return y - slot.y;
    }

    private drawCloseButton(parent: Konva.Group, x: number, y: number): void {
        const size = 32;
        const button = new Konva.Group({ x, y });
        button.add(
            new Konva.Circle({ x: size / 2, y: size / 2, radius: size / 2, fill: COLORS.closeBg }),
            new Konva.Text({
                width: size,
                height: size,
                align: 'center',
                verticalAlign: 'middle',
                text: '✕',
                fontFamily: FONT,
                fontSize: 15,
                fill: COLORS.ink,
            }),
        );
        button.on('click tap', (event) => {
            event.cancelBubble = true;
            this.handlers?.onClose();
        });
        button.on('mouseenter', () => this.setCursor('pointer'));
        button.on('mouseleave', () => this.setCursor('default'));
        parent.add(button);
    }

    private setCursor(cursor: string): void {
        this.stage.container().style.cursor = cursor;
    }
}
