import type { WrongAnswerPopUpController } from "../../../frontend/src/wrongAnswerExplanationPopUp/controller/WrongAnswerPopUpController.ts";
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { CombatMainScreenView } from "./CombatMainScreenView.ts";
//import { CombatMainScreenModel } from "./CombatMainScreenModel.ts"

export class CombatMainScreenController extends ScreenController {
    //private model: CombatMainScreenModel;
    private view: CombatMainScreenView;
    private screenSwitcher: ScreenSwitcher;
    
    private clickSound: HTMLAudioElement;

    private explanationPopUp: WrongAnswerPopUpController;

    constructor(screenSwitcher: ScreenSwitcher, explanationPopUp: WrongAnswerPopUpController) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.explanationPopUp = explanationPopUp;

        //this.model = new CombatMainScreenModel();
        this.view = new CombatMainScreenView(
            () => this.handleHintClick(),
            () => this.handleHintXClick(),
            () => this.handleExplanationClick()
        );

        this.clickSound = new Audio("/click.mp3");

    }

    // Creates hint pop up
    handleHintClick(): void{
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.view.showHint();

    }

    // Hides hint pop up
    handleHintXClick(): void{
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.view.hideHint();
    }

    handleExplanationClick(): void{
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.explanationPopUp.showLongMultiplicationExplanation(123, 45);

    }

    startGame(): void {
        this.view.show()
    }

    getView(): CombatMainScreenView {
		return this.view;
	}
}