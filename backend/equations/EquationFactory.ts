// EquationFactory: the list of equation types; picks one and creates it for a given difficulty. New types are added here. (Oliver)
import { RandomEquation } from "./RandomEquation"
import { MultiplicationEquation } from "./MultiplicationEquation"
import { DivisionEquation } from "./DivisionEquation"
import { MultiOperationEquation } from "./MultiOperatorEquation";
// import multi operator equation

// Types of equations, should import and use these directly instead of passing a string through
export type equationType = {type: "Combat"} | {type: "Potion"} | {type: "Upgrade"};

// Function to get an equation of a given type and difficulty
export function getEquation(type: equationType, difficulty: number): RandomEquation {
    
    let coinflip = Math.random()

    switch(type.type) {
        case "Combat":
            // Return either a multiplication or division question with said difficulty
            if (coinflip < 0.5) {
                return new MultiplicationEquation(difficulty);
            } else {
                return new DivisionEquation(difficulty);
            }
            

        case "Potion":
            // Return a multi operation equation with said difficulty
            return new MultiOperationEquation(difficulty);

        case "Upgrade":
            // Ignore the difficulty, return a multiplication or division equation with 
            if (coinflip < 0.5) {
                return new MultiplicationEquation(-1.0);
            } else {
                return new DivisionEquation(-1.0);
            }
    }
}