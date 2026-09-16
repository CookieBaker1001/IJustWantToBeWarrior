import { _decorator, Component, CCFloat, Animation, BoxCollider, Node, ITriggerEvent } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Sword')
export class Sword extends Component {

    @property({ type: Animation })
    public swingAnimation: Animation | null = null;

    @property({ type: CCFloat })
    public swingTimer: number = 0.8;
    private attackTimer: number = this.swingTimer;

    @property({ type: BoxCollider })
    public swordCollider: BoxCollider | null = null;

    @property({ type: CCFloat })
    public damage: number = 25;

    @property({ type: Node })
    public owner: Node | null = null;

    start() {
        
    }

    onLoad() {
        console.log("Sword loaded", this.swordCollider);
        this.swordCollider.on('onTriggerEnter', this.onTriggerEnter, this);
        this.swordCollider.enabled = false;
    }

    update(dt: number) {
        if (this.attackTimer < this.swingTimer) {
            this.attackTimer += dt;
            if (this.attackTimer >= this.swingTimer) {
                this.swordCollider.enabled = false;
            }
        }
    }

    private hitObjects = new Set<Node>();

    onTriggerEnter(event: ITriggerEvent) {
        const otherNode = event.otherCollider.node;

        console.log("Sword trigger entered: other:" + otherNode);

        if (this.hitObjects.has(otherNode) || otherNode === this.owner) {
            return;
        }

        const hpScript = otherNode.getComponent('HealthScript');
        if (!hpScript) return;

        this.hitObjects.add(otherNode);

        hpScript.takeDamage(this.damage);
    }

    onDestroy() {
        this.swordCollider?.off(
            'onTriggerEnter',
            this.onTriggerEnter,
            this
        );
    }

    public attack() {
        if (this.attackTimer < this.swingTimer) return;
        this.attackTimer -= this.swingTimer;

        this.hitObjects.clear();
        this.swordCollider.enabled = true;

        this.swingAnimation.play();
    }
}

