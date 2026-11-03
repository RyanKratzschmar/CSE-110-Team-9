import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { LevelMapScreenView } from "./LevelMapScreenView.ts";
import { LevelMapScreenModel } from "./LevelMapScreenModel.ts"

export class LevelMapScreenController extends ScreenController {
    private screenSwitcher: ScreenSwitcher;
    private model: LevelMapScreenModel;
    private view: LevelMapScreenView;

    private clickSound: HTMLAudioElement;

    constructor(screenSwitcher: ScreenSwitcher){
        super();
        this.screenSwitcher = screenSwitcher;
        this.model = new LevelMapScreenModel();

        this.view = new LevelMapScreenView(
            () => this.handleGoClick(),
        );

        this.clickSound = new Audio("/click.mp3");

    }

    
    // Handles click event on go button
    handleGoClick(): void {

        this.clickSound.currentTime = 0;
        this.clickSound.play();

        if(this.model.incrementLevel()){
            this.view.resetIconColor();
            this.model.incrementFloor();
        } else {
            this.view.updateIconColor(this.model.getLevel());
        }

        this.screenSwitcher.switchToScreen({ type: "game" });
    }
    
    startMapScreen(): void {
        this.view.show()
    }

    getView(): LevelMapScreenView {
        return this.view;
    }
}

