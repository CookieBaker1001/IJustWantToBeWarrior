import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Tracer')
export class Tracer extends Component {

    @property
    lifetime: number = 0.5;

    private timer = 0;

    start() {

    }

    update(dt: number) {
        this.timer += dt;

        if (this.timer >= this.lifetime) {
            this.node.destroy();
        }
    }
}

