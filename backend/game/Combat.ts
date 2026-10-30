// Combat: one fight: gets questions, damages the enemy on right answers and the player on wrong ones, detects win/loss. (David)

import { Health } from "./Health";
import {Player} from "./Player";
import {Monster} from "./Monster";

class Combat {

    private player: Player;
    private enemy: Monster;
    private gameStatus: "active" | "won" | "lost";
    private questionResolved: boolean;

    constructor(player: Player, enemy: Monster) {
        this.player = player;
        this.enemy = enemy;
        this.gameStatus = "active";
        this.questionResolved = false;
    }

    // this boolean check prevents things like double clicking submit when answering a question and causing double damage 
    setQuestionResolvedToFalse() {
        this.questionResolved = false;
    }

    getGameStatus(): string {
        return this.gameStatus;
    }

    resolveAsnwer(isCorrect: boolean) {
        // call Oliver's math-specific checking
        
        // if answer is valid
        this.questionResolved = true;

        // damage the monster
        if(isCorrect) {

        }
        else { // damage the player

        }

        //check health
        if (this.enemy.hp <= 0) {
            this.gameWon();
        }
    }

    gameWon() { 
        this.gameStatus = "won";
        // TODO: logic connected to the frontend to display winning screen
    }

    applyDamage() {

    }

    checkBattleStatus() {

    }

}