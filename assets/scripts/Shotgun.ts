import {
    _decorator, Component, Node, CCFloat, Prefab, Vec3,
    PhysicsSystem, instantiate, Animation, geometry,
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

    @property({ type: CCFloat })
    public pellets: number = 6;

    @property({ type: CCFloat })
    public spread: number = 0.15;

    @property({ type: CCFloat })
    public range: number = 20;

    start() {

    }

    update(dt: number) {
        if (this.attackTimer < this.shotTimer) {
            this.attackTimer += dt;
        }
    }

    public attack(hitPoint: Vec3, direction: Vec3) : boolean {
        if (this.attackTimer < this.shotTimer) return false;
        this.attackTimer -= this.shotTimer;
        this.fire(hitPoint, direction);
        this.recoil.play();
        return true;
    }

    fire(hitPoint: Vec3, direction: Vec3) {
        this.spawnBeam(hitPoint);
        this.handleHit(hitPoint);

        for (let i = 0; i < (this.pellets-1); i++) {

            const pelletDirection = this.getRandomDirection(direction);

            const ray = new geometry.Ray();

            ray.o.set(this.muzzle.worldPosition);
            ray.d.set(pelletDirection);

            const hit = PhysicsSystem.instance.raycastClosest(
                ray,
                0xffffffff,
                this.range
            );
            const endpoint = new Vec3();

            if (hit) {
                endpoint.set(
                    PhysicsSystem.instance
                        .raycastClosestResult
                        .hitPoint
                );
            } else {
                Vec3.scaleAndAdd(
                    endpoint,
                    ray.o,
                    ray.d,
                    this.range
                );
            }
            this.spawnBeam(endpoint);
            this.handleHit(endpoint);
        }
        // this.handleHit(hitPoint);
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

    getRandomDirection(direction: Vec3): Vec3 {
        // const result = direction.clone();
        // const randomX = (Math.random() - 0.5) * spread;
        // const randomY = (Math.random() - 0.5) * spread;
        // result.x += randomX;
        // result.y += randomY;
        // result.normalize();
        // return result;

        const forward = direction.clone().normalize();
        const up = new Vec3(0, 1, 0);
        const right = new Vec3();
        Vec3.cross(right, forward, up);
        right.normalize();
        const correctedUp = new Vec3();
        Vec3.cross(correctedUp, right, forward);
        correctedUp.normalize();
        const horizontal = (Math.random() - 0.5) * this.spread;
        const vertical = (Math.random() - 0.5) * this.spread;
        const result = forward.clone();
        Vec3.scaleAndAdd(result, result, right, horizontal);
        Vec3.scaleAndAdd(result, result, correctedUp, vertical);
        result.normalize();
        return result;
    }
}

