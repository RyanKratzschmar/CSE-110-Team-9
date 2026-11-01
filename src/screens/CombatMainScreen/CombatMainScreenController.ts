import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { CombatMainScreenView } from "./CombatMainScreenView.ts";
//import { CombatMainScreenModel } from "./CombatMainScreenModel.ts"

export class CombatMainScreenController extends ScreenController {
    //private model: CombatMainScreenModel;
    private view: CombatMainScreenView;
    private screenSwitcher: ScreenSwitcher;
    
    private clickSound: HTMLAudioElement;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;

        //this.model = new CombatMainScreenModel();
        this.view = new CombatMainScreenView(
            () => this.handleHintClick(),
            () => this.handleHintXClick(),
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

    startGame(): void {
        this.view.show()
    }

    getView(): CombatMainScreenView {
		return this.view;
	}
}