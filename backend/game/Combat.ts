// Combat: one fight: gets questions, damages the enemy on right answers and the player on wrong ones, detects win/loss. (David)

import {Player} from "./Player";
import {Monster} from "./Monster";

export class Combat {

    private player: Player;
    private enemy: Monster;
    private gameStatus: "active" | "won" | "lost";
    private questionResolved: boolean;

    constructor(player: Player, enemy: Monster) {
        this.player = player;
        this.enemy = enemy;
        this.gameStatus = "active";
        this.questionResolved = false;

        this.checkBattleStatus();
    }

    // this boolean check prevents things like double clicking submit when answering a question and causing double damage 
    setQuestionResolvedToFalse() {
        if (this.gameStatus === "active") {
            this.questionResolved = false;
        }
    }

    getGameStatus(): "active" | "won" | "lost" {
        return this.gameStatus;
    }

    getPlayerHp(): number {
        return this.player.hp;
    }

    getEnemyHp(): number {
        return this.enemy.hp;
    }

    resolveAnswer(isCorrect: boolean) {
        // call Oliver's math-specific checking
       
        //Ignore repeated submissions or answers after combat ends.
        if (this.gameStatus !== "active" || this.questionResolved) {
            return;
        }
        // if answer is valid
        this.questionResolved = true;

        // damage the monster
        if(isCorrect) {
            this.enemy.takeDamage(this.player.attack);
        }
        else { // damage the player
            this.player.takeDamage(this.enemy.attack);
        }

        this.checkBattleStatus();
    }
    

    private checkBattleStatus(): void {
        if (this.player.isDead()) {
            this.gameStatus = "lost";
        } else if (this.enemy.hp <= 0) {
            this.gameStatus = "won";
        }
    }

}