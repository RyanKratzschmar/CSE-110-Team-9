// PotionLabScreenModel: the brewing attempt in progress and the chosen difficulty. (Sally)
export class PotionLabScreenModel {
    private stepIndex: number = 1;
    private difficulty: number = 0;
    
    incrementStep(): void {
        this.stepIndex++;
    }

    setDifficulty(difficulty: number): void{
        this.difficulty = difficulty;
    }

    resetStep(): void{
        this.stepIndex = 1;
    }

    getStepIndex(): number{
        return this.stepIndex;
    }

    getDifficulty(): number{
        return this.difficulty;
    }
}