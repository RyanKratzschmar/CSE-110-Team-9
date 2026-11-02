export class LevelMapScreenModel {
    
    private level: number = 1;
    private floor: number = 1;
    

    // Increments Level and returns true if level reset
    incrementLevel() : boolean {
        if(this.level < 5){
            this.level++;
            return false;
        } else {
            this.level = 1;
            return true;
        }
    }

    // Increments Floor Number
    incrementFloor() : void {
        this.floor++;
    }

    // Returns the current level
    getLevel() : number {
        return this.level;
    }

    // Returns Current Floor
    getFloor() : number {
        return this.floor;
    }

}