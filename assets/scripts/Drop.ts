import { _decorator, Collider, Component, Node, Vec3, ITriggerEvent, CCInteger } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Drop')
export class Drop extends Component {

    @property({ type: CCInteger })
    public value: number = 10;

    private body: Node | null = null;
    private collider: Collider | null = null;

    start() {
        this.body = this.node.getChildByName("Body");
        this.collider = this.body?.getComponent(Collider);
        this.collider?.on('onTriggerEnter', this.onTriggerEnter, this);
    }

    update(dt: number) {
        const rot: Vec3 = this.body?.eulerAngles || Vec3.ZERO;
        rot.y += 90 * dt;
        this.body?.setRotationFromEuler(rot);
    }

    onTriggerEnter(event: ITriggerEvent) {
        console.log("Someone picked me up!", event.otherCollider.node.name);
        const otherNode = event.otherCollider.node;

        const hpScript = otherNode.getComponent("HealthScript");
        hpScript?.heal(this.value);
        this.node.destroy();
    }
}

