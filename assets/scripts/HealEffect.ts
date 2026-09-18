import { _decorator, CCFloat, Component, ParticleSystem } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HealEffect')
export class HealEffect extends Component {

    @property({ type: ParticleSystem })
    public healEffect: ParticleSystem | null = null;

    @property({ type: CCFloat })
    public duration: number = 1;
    private timer: number = 0;

    start() {
        this.healEffect?.play();
    }

    update(dt: number) {
        this.timer += dt;
        if (this.timer >= this.duration) {
            this.node.destroy();
        }
    }
}

