import { _decorator, Component, CCFloat, Animation, BoxCollider, Node, ITriggerEvent, Vec3 } from 'cc';
import { RB_System } from './RB_System';
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

    @property({ type: Node })
    public blade: Node | null = null;

    @property({ type: CCFloat })
    public damage: number = 25;

    @property({ type: Node })
    public owner: Node | null = null;

    private bladeSweepRadius: number = 1.0;

    private windUpDelay: number = 0.16;
    private attackWindow: number = 0.48;

    start() {
        
    }

    onLoad() {
        //console.log("Sword loaded", this.swordCollider);
        // this.swordCollider.on('onTriggerEnter', this.onTriggerEnter, this);
        // this.swordCollider.enabled = false;
    }

    update(dt: number) {
        if (this.attackTimer < this.swingTimer) {
            this.attackTimer += dt;
            if (this.attackTimer >= this.swingTimer) {
                this.attacking = false;
                //this.swordCollider.enabled = false;
            }
        }

        if (!this.attacking) return;

        if (this.attackTimer < this.windUpDelay || this.attackTimer > this.attackWindow) return;

        //console.log("Sword");

        const currentBladePosition = this.blade.worldPosition.clone();

        const bodies = RB_System.instance?.getBodiesNearSegment(this.previousBladePosition, currentBladePosition, this.bladeSweepRadius);

        //console.log("Bodies near blade sweep:", bodies?.length);

        for (const rb of bodies) {
            console.log(rb.node.name);
            if (rb.node == this.owner || this.hitObjects.has(rb.node)) continue;
            this.hitObjects.add(rb.node);
            rb.node.getComponent('HealthScript')?.takeDamage(this.damage);
        }

        this.previousBladePosition.set(currentBladePosition);
    }

    private hitObjects = new Set<Node>();

    // onTriggerEnter(event: ITriggerEvent) {
    //     const otherNode = event.otherCollider.node;

    //     //console.log("Sword trigger entered: other:" + otherNode);

    //     if (this.hitObjects.has(otherNode) || otherNode === this.owner) {
    //         return;
    //     }

    //     const hpScript = otherNode.getComponent('HealthScript');
    //     if (!hpScript) return;

    //     this.hitObjects.add(otherNode);

    //     hpScript.takeDamage(this.damage);
    // }

    onDestroy() {
        //this.swordCollider?.off('onTriggerEnter', this.onTriggerEnter, this);
    }

    private previousBladePosition = new Vec3();
    private attacking: boolean = false;

    public attack() {
        if (this.attackTimer < this.swingTimer) return;
        this.attackTimer -= this.swingTimer;
        this.attacking = true;

        console.log("Sword attacking");
        this.hitObjects.clear();
        //this.swordCollider.enabled = true;

        this.swingAnimation.play();
    }
}

