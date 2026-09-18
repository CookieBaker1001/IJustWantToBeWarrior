import {
    _decorator, Component, CCFloat, geometry, PhysicsSystem, Vec3, RigidBody,
    ParticleSystem, SphereCollider, ITriggerEvent, Node,
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Explosion')
export class Explosion extends Component {

    @property({ type: CCFloat })
    public radius: number = 5;

    @property({ type: CCFloat })
    public damage: number = 50;

    @property({ type: CCFloat })
    public force: number = 50;

    @property({ type: CCFloat })
    public duration: number = 1;

    @property({ type: CCFloat })
    public latency: number = 1;

    @property({ type: ParticleSystem })
    public explosionEffect: ParticleSystem | null = null;

    @property({ type: CCFloat })
    public explosionWindow: number = 0.05;

    private collider: SphereCollider;
    private detonated: boolean = false;
    private explosionTimer: number = 0;

    onLoad() {
        this.collider = this.getComponent(SphereCollider);
        if (!this.collider) {
            console.error("Explosion has no SphereCollider!");
            return;
        }
        this.collider.radius = this.radius;
        this.collider.on('onTriggerEnter', this.onTriggerEnter, this);
        this.collider.enabled = false;
    }

    start() {
        //console.log("Bomb spawned");
        //this.explode();
    }

    explode() {
        console.log("BOOM");
        this.detonated = true;
        this.explosionTimer = this.explosionWindow;
        //this.affectedBodies.clear();
        this.collider.enabled = true;
        this.explosionEffect?.play();
    }

    private affectedBodies = new Set<RigidBody>();

    private onTriggerEnter(event: ITriggerEvent) {

        //console.log("Trigger enter", event.otherCollider.node.name);
        const other = event.otherCollider.node;
        const rb = this.findRigidBody(other);
        if (!rb) {
            return;
        }
        if (this.affectedBodies.has(rb)) {
            return;
        }
        this.affectedBodies.add(rb);
    }

    private findRigidBody(node: Node): RigidBody | null {

        let current: Node | null = node;
        while (current) {
            const rb = current.getComponent(RigidBody);
            if (rb) {
                return rb;
            }
            current = current.parent;
        }
        return null;
    }

    update(dt: number) {
        if (!this.detonated) {
            this.latency -= dt;
            if (this.latency <= 0) {
                this.explode();
            }
            return;
        }

        if (this.explosionTimer > 0) {
            this.explosionTimer -= dt;
            if (this.explosionTimer <= 0) {
                this.collider.enabled = false;
                this.applyExplosion();
            }
            return;
        }

        this.duration -= dt;
        if (this.duration <= 0) {
            this.node.destroy();
        }
    }

    applyExplosion() {
        //console.log("Elo");
        const center = this.node.getWorldPosition();
        for (const rb of this.affectedBodies) {
            //console.log("Applying explosion", this.affectedBodies.size, rb.node.name);
            const objectPosition = rb.node.getWorldPosition();
            const direction = new Vec3();
            Vec3.subtract(direction, objectPosition, center);
            const distance = direction.length();
            if (distance < 0.001) continue;
            direction.normalize();
            const radius = this.collider.radius;
            const strenght = (1 - distance / radius);
            const impulse = this.force * strenght;
            direction.multiplyScalar(impulse);
            rb.applyImpulse(direction);
            const healthScript = rb.node.getComponent("HealthScript");
            healthScript?.takeDamage(this.damage * strenght);
        }
    }
}

