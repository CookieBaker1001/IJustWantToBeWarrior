import { _decorator, Collider, Component, Node, Vec3, ITriggerEvent, CCInteger, Enum } from 'cc';
const { ccclass, property } = _decorator;

export enum DropType {
    Health,
    PistolAmmo,
    ShotgunAmmo,
    Score
}

@ccclass('Drop')
export class Drop extends Component {

    @property({ type: Enum(DropType) })
    public type: DropType = DropType.Health;

    @property({ type: CCInteger })
    public valueMin: number = 10;

    @property({ type: CCInteger })
    public valueMax: number = 10;

    private body: Node | null = null;
    private collider: Collider | null = null;

    start() {
        this.body = this.node.getChildByName("Body");
        this.collider = this.node.getComponentInChildren(Collider);
        this.collider?.on('onTriggerEnter', this.onTriggerEnter, this);

        this.offsetSpawn();
    }

    offsetSpawn() {
        const randomX = (Math.random() - 0.5);
        const randomZ = (Math.random() - 0.5);
        const pos = new Vec3(this.node.position.x + randomX, this.node.position.y, this.node.position.z + randomZ);
        this.node.setPosition(pos);
    }

    onDestroy() {
        this.collider?.off('onTriggerEnter', this.onTriggerEnter, this);
    }

    update(dt: number) {
        const rot: Vec3 = this.body?.eulerAngles || Vec3.ZERO;
        rot.y += 90 * dt;
        this.body?.setRotationFromEuler(rot);
    }

    onTriggerEnter(event: ITriggerEvent) {
        //console.log("Someone picked me up!", event.otherCollider.node.name);
        const otherNode = event.otherCollider.node;

        switch (this.type) {
            case DropType.Health:
                this.heal(otherNode);
                break;
            case DropType.PistolAmmo:
                this.replenish(0, otherNode);
                break;
            case DropType.ShotgunAmmo:
                this.replenish(1, otherNode);
                break;
            case DropType.Score:
                this.score(otherNode);
                break;
        }
    }

    heal(otherNode: Node) {
        const hpScript = otherNode.getComponent("HealthScript");
        if (!hpScript) return;
        const value = Math.floor(Math.random() * (this.valueMax - this.valueMin + 1)) + this.valueMin;
        hpScript?.heal(value);
        this.node.destroy();
    }

    replenish(ammoType: number, otherNode: Node) {
        const weaponController = otherNode.getComponent("WeaponController");
        if (!weaponController) return;
        const value = Math.floor(Math.random() * (this.valueMax - this.valueMin + 1)) + this.valueMin;
        weaponController?.replenish(value, ammoType);
        this.node.destroy();
    }

    score(otherNode: Node) {
        const progressionScript = otherNode.getComponent("ProgressionScript");
        if (!progressionScript) return;
        const value = Math.floor(Math.random() * (this.valueMax - this.valueMin + 1)) + this.valueMin;
        progressionScript?.addScore(value);
        this.node.destroy();
    }
}

