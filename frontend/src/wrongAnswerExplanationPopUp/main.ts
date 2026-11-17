import Konva from 'konva';
import { WrongAnswerPopUpController } from './controller/WrongAnswerPopUpController';

const container = document.getElementById('app');
if (!(container instanceof HTMLDivElement)) {
  throw new Error('Missing <div id="app"> in index.html');
}

const stage = new Konva.Stage({
  container,
  width: window.innerWidth,
  height: window.innerHeight,
});

export const wrongAnswerPopUp = new WrongAnswerPopUpController(stage);

window.addEventListener('resize', () => {
  stage.size({ width: window.innerWidth, height: window.innerHeight });
  wrongAnswerPopUp.handleResize();
});