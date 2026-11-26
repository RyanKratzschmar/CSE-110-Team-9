import Konva from 'konva';
import type { HintPopUpState } from '../model/HintPopUpModel';
import type { HintData, HintStep } from '../../../../backend/equations/hints/hint';

export interface HintPopUpViewHandlers {
    onScrollBy(dy: number): void;
    onScrollTo(y: number): void;
    onClose(): void;
    onNextHint(): void;
    onPrevHint(): void;
}

interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Built {
    hint: HintData;
    currentStepIndex: number;
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
const STEP_GAP = 18;
const FOOTER_HEIGHT = 60;

const COLORS = {
    overlay: 'rgba(15, 23, 42, 0.60)',
    panel: '#ffffff',
    ink: '#1e293b',
    muted: '#64748b',
    divider: '#e2e8f0',
    accent: '#7c3aed',
    accentBg: '#ede9fe',
    pillInk: '#6d28d9',
    headerFrom: '#874FFF',
    headerTo: '#5B21B6',
    headerInk: '#ffffff',
    headerMuted: '#e9d5ff',
    tipBg: '#fffbeb',
    tipBorder: '#fde68a',
    tipStripe: '#f59e0b',
    tipText: '#854d0e',
    tipTitle: '#713f12',
    closeBg: 'rgba(255, 255, 255, 0.18)',
    closeBgHover: 'rgba(255, 255, 255, 0.32)',
    track: '#f1f5f9',
    thumb: '#c4b5fd',
    buttonPrevBg: '#ede9fe',
    buttonPrevHover: '#ddd6fe',
    buttonPrevText: '#6d28d9',
    buttonPrevBorder: '#c4b5fd',
    buttonNextBg: '#7c3aed',
    buttonNextHover: '#6d28d9',
    buttonNextText: '#ffffff',
    buttonDisabledBg: '#f1f5f9',
    buttonDisabledText: '#94a3b8',
    buttonDisabledBorder: '#e2e8f0',
} as const;
const PANEL_RADIUS = 20;

function panelSize(available: number, preferredMin: number, max: number): number {
    return Math.min(max, Math.max(available - PANEL_MARGIN * 2, Math.min(preferredMin, available)));
}

/**
 * Renders the hints popup displaying one hint card at a time with
 * Previous Hint and Next Hint navigation.
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
            b.currentStepIndex === state.currentStepIndex &&
            b.stageWidth === this.stage.width() &&
            b.stageHeight === this.stage.height();

        if (!upToDate) {
            this.build(hint, state.currentStepIndex);
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

    private build(hint: HintData, currentStepIndex: number): void {
        this.layer.destroyChildren();
        this.layer.visible(true);
        this.layer.moveToTop();
        this.setCursor('default');

        const sw = this.stage.width();
        const sh = this.stage.height();
        const totalSteps = hint.steps.length;
        const safeIndex = Math.max(0, Math.min(totalSteps - 1, currentStepIndex));
        const currentStep = hint.steps[safeIndex];

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
                cornerRadius: PANEL_RADIUS,
                shadowColor: '#000',
                shadowBlur: 32,
                shadowOpacity: 0.25,
                shadowOffsetY: 12,
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
            fill: COLORS.headerInk,
        });

        const subtitle = new Konva.Text({
            x: PAD,
            y: title.y() + title.height() + 4,
            text: `Step-by-step guidance (${safeIndex + 1} of ${totalSteps})`,
            fontFamily: FONT,
            fontSize: 13,
            fill: COLORS.headerMuted,
        });

        const headerBottom = subtitle.y() + subtitle.height() + 14;
        panel.add(this.headerBand(pw, headerBottom), title, subtitle);
        this.drawCloseButton(panel, pw - PAD - 32, PAD - 4);

        // Footer Navigation Controls
        const footerY = ph - FOOTER_HEIGHT;
        panel.add(
            new Konva.Line({
                points: [0, footerY, pw, footerY],
                stroke: COLORS.divider,
                strokeWidth: 1,
            }),
        );

        this.drawFooterNavigation(panel, pw, footerY, safeIndex, totalSteps);

        // Viewport Group (clipping bounds between header and footer)
        const viewport: Box = {
            x: PAD,
            y: headerBottom + 1,
            width: pw - PAD * 2,
            height: Math.max(0, footerY - headerBottom - 1 - 8),
        };

        const viewportGroup = new Konva.Group({
            x: viewport.x,
            y: viewport.y,
            clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
        });
        panel.add(viewportGroup);

        // Content (Only displays the current hint step)
        const content = new Konva.Group();
        viewportGroup.add(content);
        const contentWidth = viewport.width - SCROLLBAR_GUTTER;

        let y = STEP_GAP;
        if (currentStep) {
            y += this.drawStepText(content, currentStep, safeIndex, y, contentWidth, totalSteps) + STEP_GAP;
        }
        const contentHeight = y;

        // Scrollbar (appears if the single step content exceeds viewport height)
        let thumb: Konva.Rect | null = null;
        const trackY = viewport.y + 6;
        const trackHeight = viewport.height - 12;
        if (contentHeight > viewport.height && trackHeight > 0) {
            const trackX = viewport.x + viewport.width - 8;
            thumb = this.drawScrollbar(panel, trackX, trackY, trackHeight, viewport.height / contentHeight);
        }

        this.bindScrollInput(panel, thumb);

        this.built = {
            hint,
            currentStepIndex: safeIndex,
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

    private drawFooterNavigation(
        panel: Konva.Group,
        panelWidth: number,
        footerY: number,
        currentIndex: number,
        totalSteps: number,
    ): void {
        const btnWidth = 145;
        const btnHeight = 38;
        const btnY = footerY + (FOOTER_HEIGHT - btnHeight) / 2;

        // Previous Hint button
        const canPrev = currentIndex > 0;
        const prevGroup = new Konva.Group({ x: PAD, y: btnY });
        const prevBg = new Konva.Rect({
            width: btnWidth,
            height: btnHeight,
            fill: canPrev ? COLORS.buttonPrevBg : COLORS.buttonDisabledBg,
            stroke: canPrev ? COLORS.buttonPrevBorder : COLORS.buttonDisabledBorder,
            strokeWidth: 1,
            cornerRadius: 10,
        });
        const prevText = new Konva.Text({
            width: btnWidth,
            height: btnHeight,
            align: 'center',
            verticalAlign: 'middle',
            text: '← Previous Hint',
            fontFamily: FONT,
            fontSize: 13.5,
            fontStyle: 'bold',
            fill: canPrev ? COLORS.buttonPrevText : COLORS.buttonDisabledText,
        });
        prevGroup.add(prevBg, prevText);

        if (canPrev) {
            prevGroup.on('click tap', () => this.handlers?.onPrevHint());
            prevGroup.on('mouseenter', () => {
                prevBg.fill(COLORS.buttonPrevHover);
                this.setCursor('pointer');
                this.layer.batchDraw();
            });
            prevGroup.on('mouseleave', () => {
                prevBg.fill(COLORS.buttonPrevBg);
                this.setCursor('default');
                this.layer.batchDraw();
            });
        }
        panel.add(prevGroup);

        // Center Step Indicator
        const indicator = new Konva.Text({
            x: PAD + btnWidth,
            y: footerY,
            width: Math.max(0, panelWidth - (PAD + btnWidth) * 2),
            height: FOOTER_HEIGHT,
            align: 'center',
            verticalAlign: 'middle',
            text: `Hint ${currentIndex + 1} of ${totalSteps}`,
            fontFamily: FONT,
            fontSize: 14,
            fontStyle: 'bold',
            fill: COLORS.muted,
        });
        panel.add(indicator);

        // Next Hint button
        const canNext = currentIndex < totalSteps - 1;
        const nextX = panelWidth - PAD - btnWidth;
        const nextGroup = new Konva.Group({ x: nextX, y: btnY });
        const nextBg = new Konva.Rect({
            width: btnWidth,
            height: btnHeight,
            fill: canNext ? COLORS.buttonNextBg : COLORS.buttonDisabledBg,
            stroke: canNext ? COLORS.buttonNextBg : COLORS.buttonDisabledBorder,
            strokeWidth: 1,
            cornerRadius: 10,
        });
        const nextText = new Konva.Text({
            width: btnWidth,
            height: btnHeight,
            align: 'center',
            verticalAlign: 'middle',
            text: canNext ? 'Next Hint →' : '✓ Final Hint',
            fontFamily: FONT,
            fontSize: 13.5,
            fontStyle: 'bold',
            fill: canNext ? COLORS.buttonNextText : COLORS.buttonDisabledText,
        });
        nextGroup.add(nextBg, nextText);

        if (canNext) {
            nextGroup.on('click tap', () => this.handlers?.onNextHint());
            nextGroup.on('mouseenter', () => {
                nextBg.fill(COLORS.buttonNextHover);
                this.setCursor('pointer');
                this.layer.batchDraw();
            });
            nextGroup.on('mouseleave', () => {
                nextBg.fill(COLORS.buttonNextBg);
                this.setCursor('default');
                this.layer.batchDraw();
            });
        }
        panel.add(nextGroup);
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
        totalSteps: number,
    ): number {
        let y = top;

        // Badge: e.g. "HINT 1 OF 4"
        const badge = new Konva.Text({
            x: 10,
            y: y + 4,
            text: `HINT ${index + 1} OF ${totalSteps}`,
            fontFamily: FONT,
            fontSize: 12,
            fontStyle: 'bold',
            letterSpacing: 1,
            fill: COLORS.pillInk,
        });
        const pill = new Konva.Rect({
            x: 0,
            y,
            width: badge.width() + 20,
            height: badge.height() + 8,
            fill: COLORS.accentBg,
            cornerRadius: (badge.height() + 8) / 2,
        });
        parent.add(pill, badge);
        y += pill.height() + 10;

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
        y += title.height() + 10;

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
            y += 12;
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
            y += detailText.height() + 8;
        }

        // Tip Box Callout
        if (step.tip) {
            y += 10;
            const tipInset = 12;
            const tipStripeWidth = 5;
            const tipTextWidth = width - tipInset * 2 - tipStripeWidth;

            const tipText = new Konva.Text({
                x: tipInset + tipStripeWidth,
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
                cornerRadius: 10,
            });
            const tipStripe = new Konva.Rect({
                x: 0,
                y,
                width: tipStripeWidth,
                height: tipBoxHeight,
                fill: COLORS.tipStripe,
                cornerRadius: [10, 0, 0, 10],
            });

            parent.add(tipBox);
            parent.add(tipStripe);
            parent.add(tipText);
            y += tipBoxHeight;
        }

        return y - top;
    }

    private headerBand(width: number, height: number): Konva.Rect {
        return new Konva.Rect({
            width,
            height,
            cornerRadius: [PANEL_RADIUS, PANEL_RADIUS, 0, 0],
            fillLinearGradientStartPoint: { x: 0, y: 0 },
            fillLinearGradientEndPoint: { x: width, y: height },
            fillLinearGradientColorStops: [0, COLORS.headerFrom, 1, COLORS.headerTo],
        });
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
            fontStyle: 'bold',
            fill: COLORS.headerInk,
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
