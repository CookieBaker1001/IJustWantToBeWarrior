import { _decorator, Component, BoxCollider, ITriggerEvent } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LandmineScipt')
export class LandmineScipt extends Component {

    @property({ type: BoxCollider })
    public collider: BoxCollider | null = null;

    start() {
        this.collider.on('onTriggerEnter', this.onTriggerEnter, this);
    }

    update(deltaTime: number) {
        
    }

    onTriggerEnter(event: ITriggerEvent) {
        console.log("Landmine triggered!");
        const otherNode = event.otherCollider.node;
        otherNode.getComponent("HealthScript")?.takeDamage(20);
    }
}

