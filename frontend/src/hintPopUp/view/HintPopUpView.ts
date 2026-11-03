import Konva from 'konva';
import type { HintPopUpState } from '../model/HintPopUpModel';
import type { HintData, HintStep } from '../../../../backend/equations/hints/hint';

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
const PAD = 24;
const PANEL_MARGIN = 16;
const SCROLLBAR_GUTTER = 18;
const STEP_GAP = 22;

const COLORS = {
    overlay: 'rgba(15, 23, 42, 0.60)',
    panel: '#ffffff',
    ink: '#1e293b',
    muted: '#64748b',
    divider: '#e2e8f0',
    accent: '#0284c7',
    accentBg: '#e0f2fe',
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

/**
 * Renders the hints popup using text-only guidance, cards, and callout tips.
 */
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

        // Dark dim overlay
        const overlay = new Konva.Rect({
            x: 0,
            y: 0,
            width: sw,
            height: sh,
            fill: COLORS.overlay,
        });
        overlay.on('click tap', () => this.handlers?.onClose());
        this.layer.add(overlay);

        // Center card modal panel
        const pw = panelSize(sw, 320, 800);
        const ph = panelSize(sh, 360, 720);
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
                shadowBlur: 28,
                shadowOpacity: 0.22,
                shadowOffsetY: 10,
            }),
        );

        // Header Title
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

        // Viewport Group (clipping bounds)
        const viewport: Box = {
            x: PAD,
            y: headerBottom + 1,
            width: pw - PAD * 2,
            height: ph - headerBottom - 1 - 10,
        };

        const viewportGroup = new Konva.Group({
            x: viewport.x,
            y: viewport.y,
            clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
        });
        panel.add(viewportGroup);

        // Content
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
            y += this.drawStepText(content, step, i, y, contentWidth) + STEP_GAP;
        });
        const contentHeight = y;

        // Scrollbar
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

    /**
     * Draws a single text-based hint step card across the full available content width.
     */
    private drawStepText(
        parent: Konva.Group,
        step: HintStep,
        index: number,
        top: number,
        width: number,
    ): number {
        let y = top;

        // Badge: e.g. "HINT 1"
        const badge = new Konva.Text({
            x: 0,
            y,
            text: `HINT ${index + 1}`,
            fontFamily: FONT,
            fontSize: 12,
            fontStyle: 'bold',
            letterSpacing: 1,
            fill: COLORS.accent,
        });
        parent.add(badge);
        y += badge.height() + 6;

        // Step Title
        const title = new Konva.Text({
            x: 0,
            y,
            width,
            text: step.title,
            fontFamily: FONT,
            fontSize: 18,
            fontStyle: 'bold',
            fill: COLORS.ink,
        });
        parent.add(title);
        y += title.height() + 8;

        // Step Description
        const description = new Konva.Text({
            x: 0,
            y,
            width,
            text: step.description,
            fontFamily: FONT,
            fontSize: 15,
            lineHeight: 1.45,
            fill: COLORS.ink,
        });
        parent.add(description);
        y += description.height();

        // Bullet Details
        if (step.details.length > 0) {
            y += 10;
        }
        for (const detail of step.details) {
            const bullet = new Konva.Text({
                x: 0,
                y,
                text: '•',
                fontFamily: FONT,
                fontSize: 15,
                lineHeight: 1.4,
                fill: COLORS.accent,
            });
            parent.add(bullet);

            const detailText = new Konva.Text({
                x: 16,
                y,
                width: width - 16,
                text: detail,
                fontFamily: FONT,
                fontSize: 14,
                lineHeight: 1.4,
                fill: COLORS.ink,
            });
            parent.add(detailText);
            y += detailText.height() + 6;
        }

        // Tip Box Callout
        if (step.tip) {
            y += 8;
            const tipInset = 12;
            const tipTextWidth = width - tipInset * 2;

            const tipText = new Konva.Text({
                x: tipInset,
                y: y + tipInset,
                width: tipTextWidth,
                text: `💡 Tip: ${step.tip}`,
                fontFamily: FONT,
                fontSize: 13.5,
                fontStyle: 'italic',
                lineHeight: 1.4,
                fill: COLORS.tipText,
            });

            const tipBoxHeight = tipText.height() + tipInset * 2;
            const tipBox = new Konva.Rect({
                x: 0,
                y,
                width,
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

        return y - top;
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
