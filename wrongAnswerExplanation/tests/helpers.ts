import Konva from 'konva';
import { isCellVisible, type CellKind, type WorkLayout } from '../src/wrongAnswerExplanationPopUp';

export function createStage(width = 800, height = 600): Konva.Stage {
    const container = document.createElement('div');
    document.body.appendChild(container);
    return new Konva.Stage({ container, width, height });
}

export function destroyStage(stage: Konva.Stage): void {
    const container = stage.container();
    stage.destroy();
    container.remove();
}

export function rowText(layout: WorkLayout, step: number, row: number, kinds: readonly CellKind[] = ['digit', 'placeholder']): string {
    return layout.cells
        .filter((c) => c.row === row && kinds.includes(c.kind) && isCellVisible(c, step))
        .sort((a, b) => a.col - b.col)
        .map((c) => c.text)
        .join('');
}

export function popupLayer(stage: Konva.Stage): Konva.Layer {
    return stage.getLayers()[0];
}

export function panelGroup(stage: Konva.Stage): Konva.Group {
    return popupLayer(stage).getChildren()[1] as Konva.Group;
}

export function overlayRect(stage: Konva.Stage): Konva.Rect {
    return popupLayer(stage).getChildren()[0] as Konva.Rect;
}

export function contentGroup(stage: Konva.Stage): Konva.Group {
    const viewport = popupLayer(stage).findOne((n: Konva.Node) => n instanceof Konva.Group && n.clipWidth() > 0) as Konva.Group;
    return viewport.getChildren()[0] as Konva.Group;
}

export function scrollThumb(stage: Konva.Stage): Konva.Rect | undefined {
    return popupLayer(stage).findOne((n: Konva.Node) => n instanceof Konva.Rect && n.draggable()) as Konva.Rect | undefined;
}

export function closeButton(stage: Konva.Stage): Konva.Group {
    return (popupLayer(stage).findOne('Circle') as Konva.Circle).getParent() as Konva.Group;
}

export function stepLabels(stage: Konva.Stage): string[] {
    return popupLayer(stage)
        .find('Text')
        .map((t) => (t as Konva.Text).text())
        .filter((text) => /^STEP \d+$/.test(text));
}

export function pressKey(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, cancelable: true });
    window.dispatchEvent(event);
    return event;
}
