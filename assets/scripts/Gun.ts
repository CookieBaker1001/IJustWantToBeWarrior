import {
    _decorator, Component, Node, Animation, Prefab, Vec3,
    PhysicsSystem, geometry, Camera, instantiate, CCFloat
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Gun')
export class Gun extends Component {

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

    @property({ type: CCFloat })
    public range: number = 50;

    start() {
        // this.recoil = this.node.getComponent(Animation) || null;
        // this.muzzle = this.node.getChildByName("Muzzle") || null;

        // console.log("Muzzle looks like this1: " + this.muzzle.getWorldPosition());
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
        //const endPoint: Vec3 = this.generatePoints(hitPoint);
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

    generatePoints(hitPoint: Vec3) {
        const ray = new geometry.Ray();

        ray.o.set(this.muzzle.position);
        ray.d.set(hitPoint);

        const missPoint = new Vec3();

        Vec3.scaleAndAdd(
            missPoint,
            ray.o,
            ray.d,
            this.range
        );

        const hit = PhysicsSystem.instance.raycastClosest(
            ray,
            0xffffffff,
            this.range,
        );

        let endPoint = missPoint;

        if (hit) {
            endPoint = PhysicsSystem.instance.raycastClosestResult.hitPoint.clone();

            const result = PhysicsSystem.instance.raycastClosestResult;
            const node = result.collider.node;

            const hpScript = node.getComponent('HealthScript');
            console.log("HealthScript: " + hpScript);


            if (hpScript) {
                hpScript.takeDamage(20);
            }

            // if (node.name.includes("Enemy")) {
            //     node.getComponent('EnemyScript')?.takeDamage(20);
            // }
            // if (node.name.includes("Destroyable")) {
            //     node.destroy();
            // }

            const destroyableComponent = node.getComponent('Destroyable');
            if (destroyableComponent) {
                node.destroy();
            }
        }

        return endPoint;
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

