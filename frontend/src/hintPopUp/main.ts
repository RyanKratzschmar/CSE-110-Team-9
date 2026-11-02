import Konva from 'konva';
import { HintPopUpController } from './controller/HintPopUpController';

const container = document.getElementById('app') ?? document.getElementById('container');
if (!(container instanceof HTMLDivElement)) {
    throw new Error('Missing #app or #container element in index.html');
}

const stage = new Konva.Stage({
    container,
    width: window.innerWidth,
    height: window.innerHeight,
});

export const hintPopUp = new HintPopUpController(stage);

window.addEventListener('resize', () => {
    stage.size({ width: window.innerWidth, height: window.innerHeight });
    hintPopUp.handleResize();
});

