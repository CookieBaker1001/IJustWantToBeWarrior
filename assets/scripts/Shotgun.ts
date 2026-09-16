import {
    _decorator, Component, Node, CCFloat, Prefab, Vec3,
    PhysicsSystem, instantiate, Animation,
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Shotgun')
export class Shotgun extends Component {

    @property({ type: Prefab })
    tracerPrefab: Prefab | null = null;

    @property({ type: CCFloat })
    public shotTimer: number = 0.2;
    private attackTimer: number = this.shotTimer;

    @property({ type: Animation })
    public recoil: Animation | null = null;

    @property({ type: Node })
    public muzzle: Node | null = null;

    @property({ type: CCFloat })
    public damage: number = 20;

    start() {

    }

    update(dt: number) {
        if (this.attackTimer < this.shotTimer) {
            this.attackTimer += dt;
        }
    }

    public attack(hitPoint: Vec3) {
        if (this.attackTimer < this.shotTimer) return;
        this.attackTimer -= this.shotTimer;
        this.fire(hitPoint);
        this.recoil.play();
    }

    fire(hitPoint: Vec3) {
        this.spawnBeam(hitPoint);
        this.handleHit(hitPoint);
    }

    handleHit(hitPoint: Vec3) {
        const result = PhysicsSystem.instance.raycastClosestResult;
        const node = result.collider.node;

        const hpScript = node.getComponent('HealthScript');

        if (hpScript) {
            hpScript.takeDamage(this.damage);
        }
    }

    spawnBeam(endPoint: Vec3) {
        const tracer = instantiate(this.tracerPrefab!);
        this.node.scene.addChild(tracer);

        const start = this.muzzle.worldPosition.clone();
        const midpoint = new Vec3();
        Vec3.add(midpoint, start, endPoint);
        midpoint.multiplyScalar(0.5);
        tracer.setWorldPosition(midpoint);

        const direction = new Vec3();
        Vec3.subtract(direction, endPoint, start);
        direction.normalize();

        tracer.forward = direction;

        const length = Vec3.distance(start, endPoint);
        tracer.setScale(1, 1, length);
    }
}

