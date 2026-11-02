import Konva from 'konva';
import type { HintPopUpState } from '../model/HintPopUpModel';
import {
    isCellVisible,
    type HintData,
    type HintStep,
    type WorkCell,
    type WorkLine,
    type WorkLayout,
} from '../../../../backend/equations/hints/hint';

export interface HintPopUpViewHandlers {
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
    hint: HintData;
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
const STEP_GAP = 20;

const COLORS = {
    overlay: 'rgba(15, 23, 42, 0.60)',
    panel: '#ffffff',
    ink: '#1e293b',
    muted: '#64748b',
    divider: '#e2e8f0',
    paper: '#f8fafc',
    paperBorder: '#cbd5e1',
    accent: '#0284c7',
    accentBg: '#e0f2fe',
    highlightText: '#2563eb',
    placeholder: '#94a3b8',
    carry: '#ea580c',
    tipBg: '#fffbeb',
    tipBorder: '#fef08a',
    tipText: '#854d0e',
    tipTitle: '#713f12',
    closeBg: '#e2e8f0',
    closeBgHover: '#cbd5e1',
    track: '#f1f5f9',
    thumb: '#94a3b8',
} as const;

function panelSize(available: number, preferredMin: number, max: number): number {
    return Math.min(max, Math.max(available - PANEL_MARGIN * 2, Math.min(preferredMin, available)));
}

export class HintPopUpView {
    private readonly stage: Konva.Stage;
    private readonly layer: Konva.Layer;
    private handlers: HintPopUpViewHandlers | null = null;
    private lastState: HintPopUpState | null = null;
    private built: Built | null = null;

    constructor(stage: Konva.Stage) {
        this.stage = stage;
        this.layer = new Konva.Layer({ visible: false });
        stage.add(this.layer);
    }

    setHandlers(handlers: HintPopUpViewHandlers): void {
        this.handlers = handlers;
    }

    render(state: HintPopUpState): void {
        this.lastState = state;
        const hint = state.hint;

        if (!state.isOpen || !hint) {
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
        const upToDate =
            b !== null &&
            b.hint === hint &&
            b.stageWidth === this.stage.width() &&
            b.stageHeight === this.stage.height();

        if (!upToDate) {
            this.build(hint);
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

    private build(hint: HintData): void {
        this.layer.destroyChildren();
        this.layer.visible(true);
        this.layer.moveToTop();
        this.setCursor('default');

        const sw = this.stage.width();
        const sh = this.stage.height();

        // Semi-transparent background overlay
        const overlay = new Konva.Rect({
            x: 0,
            y: 0,
            width: sw,
            height: sh,
            fill: COLORS.overlay,
        });
        overlay.on('click tap', () => this.handlers?.onClose());
        this.layer.add(overlay);

        // Modal Panel
        const pw = panelSize(sw, 320, 900);
        const ph = panelSize(sh, 380, 780);
        const panel = new Konva.Group({
            x: Math.round((sw - pw) / 2),
            y: Math.round((sh - ph) / 2),
        });
        this.layer.add(panel);

        panel.add(
            new Konva.Rect({
                width: pw,
                height: ph,
                fill: COLORS.panel,
                cornerRadius: 16,
                shadowColor: '#000',
                shadowBlur: 30,
                shadowOpacity: 0.25,
                shadowOffsetY: 10,
            }),
        );

        // Header
        const title = new Konva.Text({
            x: PAD,
            y: PAD,
            width: Math.max(0, pw - PAD * 2 - 44),
            text: `💡 Hint: ${hint.problemText}`,
            fontFamily: FONT,
            fontSize: 22,
            fontStyle: 'bold',
            fill: COLORS.ink,
        });
        const subtitle = new Konva.Text({
            x: PAD,
            y: title.y() + title.height() + 4,
            text: 'Step-by-step guidance and strategies to help you solve this!',
            fontFamily: FONT,
            fontSize: 13,
            fill: COLORS.muted,
        });
        panel.add(title, subtitle);
        this.drawCloseButton(panel, pw - PAD - 32, PAD - 4);

        const headerBottom = subtitle.y() + subtitle.height() + 14;
        panel.add(
            new Konva.Line({
                points: [0, headerBottom, pw, headerBottom],
                stroke: COLORS.divider,
                strokeWidth: 1,
            }),
        );

        // Viewport & Content Container
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

        hint.steps.forEach((step: HintStep, i: number) => {
            if (i > 0) {
                content.add(
                    new Konva.Line({
                        points: [0, y, contentWidth, y],
                        stroke: COLORS.divider,
                        strokeWidth: 1,
                    }),
                );
                y += STEP_GAP;
            }
            y += this.drawStep(content, hint.layout, step, i, y, contentWidth) + STEP_GAP;
        });
        const contentHeight = y;

        // Custom Scrollbar
        let thumb: Konva.Rect | null = null;
        const trackY = viewport.y + 6;
        const trackHeight = viewport.height - 12;
        if (contentHeight > viewport.height) {
            const trackX = viewport.x + viewport.width - 8;
            thumb = this.drawScrollbar(panel, trackX, trackY, trackHeight, viewport.height / contentHeight);
        }

        this.bindScrollInput(panel, thumb);

        this.built = {
            hint,
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

    private drawScrollbar(
        panel: Konva.Group,
        trackX: number,
        trackY: number,
        trackHeight: number,
        visibleRatio: number,
    ): Konva.Rect {
        const thumbHeight = Math.min(trackHeight, Math.max(40, trackHeight * visibleRatio));
        const travel = trackHeight - thumbHeight;

        panel.add(
            new Konva.Rect({
                x: trackX,
                y: trackY,
                width: 6,
                height: trackHeight,
                fill: COLORS.track,
                cornerRadius: 3,
            }),
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
        if (!b) return;

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
            if (y === undefined || lastTouchY === null) return;
            event.evt.preventDefault();
            this.handlers?.onScrollBy(lastTouchY - y);
            lastTouchY = y;
        });

        target.on('touchend', () => {
            lastTouchY = null;
        });
    }

    private drawStep(
        parent: Konva.Group,
        layout: WorkLayout,
        step: HintStep,
        index: number,
        top: number,
        width: number,
    ): number {
        const sideBySide = width >= 560;
        const workWidth = sideBySide ? Math.min(300, Math.round(width * 0.40)) : width;

        const workHeight = this.drawWork(parent, layout, index + 1, {
            x: 0,
            y: top,
            width: workWidth,
        });

        const textSlot: Slot = sideBySide
            ? { x: workWidth + 20, y: top, width: width - workWidth - 20 }
            : { x: 0, y: top + workHeight + 14, width };

        const textHeight = this.drawStepText(parent, step, index, textSlot);

        return sideBySide ? Math.max(workHeight, textHeight) : workHeight + 14 + textHeight;
    }

    private drawWork(
        parent: Konva.Group,
        layout: WorkLayout,
        stepNumber: number,
        slot: Slot,
    ): number {
        const visibleCells = layout.cells.filter((c: WorkCell) => isCellVisible(c, stepNumber));
        const visibleLines = layout.lines.filter((l: WorkLine) => l.step <= stepNumber);

        const rows =
            Math.max(
                0,
                ...visibleCells.map((c: WorkCell) => c.row),
                ...visibleLines.map((l: WorkLine) => l.row),
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
                        points: [
                            x + cellW * 0.55,
                            y,
                            x + cellW * 0.82,
                            y + cellH / 2,
                            x + cellW * 0.55,
                            y + cellH,
                        ],
                        tension: 0.5,
                        stroke: COLORS.ink,
                        strokeWidth: Math.max(1.5, cellW * 0.07),
                        lineCap: 'round',
                    }),
                );
                continue;
            }

            const isCarry = cell.kind === 'carry';
            const isHighlight = cell.kind === 'hint-highlight';

            if (isHighlight) {
                parent.add(
                    new Konva.Rect({
                        x: x + 1,
                        y: y + 1,
                        width: cellW - 2,
                        height: cellH - 2,
                        fill: COLORS.accentBg,
                        stroke: COLORS.accent,
                        strokeWidth: 1,
                        cornerRadius: 4,
                    }),
                );
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
                    fontStyle: isHighlight ? 'bold' : 'normal',
                    fill: isHighlight ? COLORS.highlightText : isCarry ? COLORS.carry : cell.kind === 'placeholder' ? COLORS.placeholder : COLORS.ink,
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
                    stroke: COLORS.ink,
                    strokeWidth: Math.max(1.5, cellW * 0.06),
                    lineCap: 'round',
                }),
            );
        }

        return height;
    }

    private drawStepText(
        parent: Konva.Group,
        step: HintStep,
        index: number,
        slot: Slot,
    ): number {
        const compact = slot.width < 420;
        let y = slot.y;

        // Badge
        const badgeText = `HINT ${index + 1}`;
        const label = new Konva.Text({
            x: slot.x,
            y,
            text: badgeText,
            fontFamily: FONT,
            fontSize: 12,
            fontStyle: 'bold',
            letterSpacing: 1,
            fill: COLORS.accent,
        });
        parent.add(label);
        y += label.height() + 6;

        // Step Title
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

        // Step Description
        const description = new Konva.Text({
            x: slot.x,
            y,
            width: slot.width,
            text: step.description,
            fontFamily: FONT,
            fontSize: compact ? 13 : 15,
            lineHeight: 1.4,
            fill: COLORS.ink,
        });
        parent.add(description);
        y += description.height();

        // Bullet Details
        if (step.details.length > 0) {
            y += 8;
        }
        for (const detail of step.details) {
            parent.add(
                new Konva.Text({
                    x: slot.x,
                    y,
                    text: '•',
                    fontFamily: FONT,
                    fontSize: 14,
                    lineHeight: 1.35,
                    fill: COLORS.accent,
                }),
            );
            const text = new Konva.Text({
                x: slot.x + 14,
                y,
                width: slot.width - 14,
                text: detail,
                fontFamily: FONT,
                fontSize: compact ? 12 : 13.5,
                lineHeight: 1.35,
                fill: COLORS.ink,
            });
            parent.add(text);
            y += text.height() + 5;
        }

        // Tip Box
        if (step.tip) {
            y += 6;
            const tipInset = 10;
            const tipTextWidth = slot.width - tipInset * 2;
            const tipText = new Konva.Text({
                x: slot.x + tipInset,
                y: y + tipInset,
                width: tipTextWidth,
                text: `💡 Tip: ${step.tip}`,
                fontFamily: FONT,
                fontSize: compact ? 12 : 13,
                fontStyle: 'italic',
                lineHeight: 1.35,
                fill: COLORS.tipText,
            });

            const tipBoxHeight = tipText.height() + tipInset * 2;
            const tipBox = new Konva.Rect({
                x: slot.x,
                y,
                width: slot.width,
                height: tipBoxHeight,
                fill: COLORS.tipBg,
                stroke: COLORS.tipBorder,
                strokeWidth: 1,
                cornerRadius: 8,
            });

            parent.add(tipBox);
            parent.add(tipText);
            y += tipBoxHeight;
        }

        return y - slot.y;
    }

    private drawCloseButton(parent: Konva.Group, x: number, y: number): void {
        const size = 32;
        const button = new Konva.Group({ x, y });
        const circle = new Konva.Circle({
            x: size / 2,
            y: size / 2,
            radius: size / 2,
            fill: COLORS.closeBg,
        });
        const cross = new Konva.Text({
            width: size,
            height: size,
            align: 'center',
            verticalAlign: 'middle',
            text: '✕',
            fontFamily: FONT,
            fontSize: 15,
            fill: COLORS.ink,
        });
        button.add(circle, cross);

        button.on('click tap', (event) => {
            event.cancelBubble = true;
            this.handlers?.onClose();
        });
        button.on('mouseenter', () => {
            circle.fill(COLORS.closeBgHover);
            this.setCursor('pointer');
            this.layer.batchDraw();
        });
        button.on('mouseleave', () => {
            circle.fill(COLORS.closeBg);
            this.setCursor('default');
            this.layer.batchDraw();
        });

        parent.add(button);
    }

    private setCursor(cursor: string): void {
        this.stage.container().style.cursor = cursor;
    }
}
