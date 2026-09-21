import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ProgressionScript')
export class ProgressionScript extends Component {

    @property({ type: Label })
    public scoreLabel: Label = null;

    private currentScore: number = 0;

    start() {
        this.updateScore();
    }

    update(dt: number) {
        
    }

    public addScore(amount: number) {
        this.currentScore += amount;
        this.updateScore();
    }

    updateScore() {
        this.scoreLabel.string = this.currentScore.toString() + " XP";
    }
}

