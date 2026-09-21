import {
    _decorator, Component, Node, find, CCFloat, Vec3, RigidBody,
    PhysicsSystem, geometry, Sprite, Prefab, instantiate
} from 'cc';
const { ccclass, property } = _decorator; 

import { Gun } from './Gun';
import { Sword } from './Sword';
import { Shotgun } from './Shotgun';
import { HealthScript } from './HealthScript';
import { RB_System } from './RB_System';

@ccclass('EnemyScript')
export class EnemyScript extends Component {

    @property({ type: CCFloat })
    public speed: number = 3; // Meters per second

    @property({ type: CCFloat })
    public stopDistance: number = 4; // Meters before stopping

    @property({ type: CCFloat })
    public attackRange: number = 5; // Meters for attack range

    @property({ type: CCFloat })
    public attackSpeed: number = 2.2; // Seconds between attacks
    private attackTimer: number = 0; // Timer to track attack cooldown

    @property({ type: CCFloat })
    public weaponType: number = 0; // 1 = Gun, 2 = Sword, 3 = Shotgun

    @property({ type: Node })
    public weaponNode: Node | null = null; // Reference to the weapon node

    private gun: Gun | null = null; // Reference to the Gun component
    private sword: Sword | null = null; // Reference to the Sword component
    private shotgun: Shotgun | null = null; // Reference to the Shotgun component

    @property({ type: Prefab })
    public explosionPrefab: Prefab | null = null; // Reference to the explosion prefab

    @property({ type: Node })
    public eyes: Node | null = null; // Reference to the eyes node for aiming

    @property([Node])
    public faces: Node[] = [];

    @property({ type: Sprite })
    public attackWindupSprite: Sprite | null = null;

    private rb: RigidBody | null = null;
    private target: Node | null = null
    private pivot: Node | null = null;

    private movementDirection: Vec3 = new Vec3(0, 0, 0);
    private lookDirection: Vec3 = new Vec3(0, 0, 0);

    private groundAcceleration = 18;
    private airAcceleration = 0.05;

    private hpScript: HealthScript | null = null;

    start() {
        const index = Math.floor(Math.random() * this.faces.length);
        this.faces.forEach((face, i) => {
            face.active = (i === index);
        });
        this.rb = this.node.getComponent(RigidBody);
        RB_System.instance?.registerBody(this.rb);
        //this.eyes = this.node.getChildByName("Eyes");
        this.pivot = this.node.getChildByName("Pivot");

        // Fetches the appropriate weapon in the cild of the weapon node based on the weaponType property
        if (this.weaponType === 1) {
            this.gun = this.weaponNode?.getChildByName("Pistol")?.getComponent(Gun);
        } else if (this.weaponType === 2) {
            this.sword = this.weaponNode?.getChildByName("Sword")?.getComponent(Sword);
        } else if (this.weaponType === 3) {
            this.shotgun = this.weaponNode?.getChildByName("Shotgun")?.getComponent(Shotgun);
        }

        this.hpScript = this.node.getComponent(HealthScript);
    }

    tmpTargetPos: Vec3;

    update(dt: number) {
        if (this.target == null) {
            this.findTarget();
            return;
        }
        if (this.jumpTimer_Counter < this.jumpTimer) this.jumpTimer_Counter += dt;

        this.lookDirection = this.getMovementDirection(this.node, this.target);
        this.movementDirection = this.lookDirection.clone();

        this.rotateToTarget(this.pivot, this.target);

        this.checkGrounded();
        const acceleration = (this.isGrounded ? this.groundAcceleration : this.airAcceleration);

        if (this.movementDirection.length() < this.attackRange) {

            this.attackTimer += dt;
            this.updateAttackTimerUI();

            if (this.attackTimer >= this.attackSpeed) {
                this.attackTimer -= this.attackSpeed;
                this.performAttack();
            }

            if (this.movementDirection.length() < this.stopDistance) {
                this.movementDirection.set(0, 0, 0);
            }
        } else {
            this.movementDirection.normalize();
            this.attackTimer = Math.max(0, this.attackTimer - (dt / 4));
            this.updateAttackTimerUI();
        }

        const velocity = new Vec3();
        this.rb.getLinearVelocity(velocity);
        let resultingForce = new Vec3();

        if (this.movementDirection.length() > 0) {
            const desiredMovementDirection = this.movementDirection.clone();
            const speedInMovementDirection = Vec3.dot(velocity, desiredMovementDirection);
            if (speedInMovementDirection < this.speed) {
                resultingForce = desiredMovementDirection.multiplyScalar(acceleration);
            }
        }
        const counterForce = this.getCounterForce();
        const totalForce = resultingForce.add(counterForce);
        this.rb.applyForce(totalForce);

        // if (this.movementDirection.length() > 0) {

        //     const velocity = new Vec3();
        //     this.rb.getLinearVelocity(velocity);
        //     const movementDirection = this.movementDirection.clone();
        //     const speedInMovementDirection = Vec3.dot(velocity, movementDirection);

        //     if (speedInMovementDirection < this.speed) {
        //         const force = movementDirection.multiplyScalar(acceleration);
        //         this.rb.applyForce(force);
        //     }
        // }

        // if (this.movementDirection.length() > 0) {
        //     this.currentMovementVector.add(this.movementDirection.multiplyScalar(acceleration * dt));
        //     if (this.currentMovementVector.length() > this.speed) {
        //         this.currentMovementVector.normalize().multiplyScalar(this.speed);
        //     }
        // } else {
        //     this.currentMovementVector.multiplyScalar((this.isGrounded ? 0.92 : 0.99));
        // }

        // const velocity = new Vec3();
        // this.rb.getLinearVelocity(velocity);

        // velocity.x = this.currentMovementVector.x;
        // velocity.z = this.currentMovementVector.z;

        // this.rb.setLinearVelocity(velocity);

        if (this.node.worldPosition.y < -10) {
            this.healthScript?.takeDamage(9999);
        }
    }

    getCounterForce(): Vec3 {

        const velocity = new Vec3();
        this.rb.getLinearVelocity(velocity);

        // Only consider horizontal movement
        velocity.y = 0;
        const speed = velocity.length();

        // No movement = no counterforce
        if (speed < 0.001) return new Vec3();

        const velocityDirection = velocity.clone().normalize();
        const desiredDirection = this.movementDirection.clone();
        desiredDirection.y = 0;
        let dot;

        if (desiredDirection.length() > 0.001) {
            desiredDirection.normalize();
            dot = Vec3.dot(velocityDirection, desiredDirection);
        } else {
            dot = 0; // No desired direction, treat as perpendicular
        }
        // 0 when aligned, 1 when perpendicular,
        // 1 when moving completely opposite as well.
        const counterForceFactor = Math.max(0, Math.min(1, 1 - dot));

        // Opposite the current velocity
        return velocityDirection.multiplyScalar(-counterForceFactor * speed);

        // const velocity = new Vec3();
        // this.rb.getLinearVelocity(velocity);
        // velocity.normalize();
        // const dot = Vec3.dot(this.node.forward, velocity);
        // const res = velocity.clone().multiplyScalar(Math.max(0, Math.min(1, 1 - dot)));
        // return res;
    }

    performAttack() {
        if (this.weaponType === 1) {
            const hitPoint = this.getAimPoint();
            this.gun.attack(hitPoint);
        } else if (this.weaponType === 2) {
            this.sword.attack();
        } else if (this.weaponType === 3) {
            const hitPoint = this.getAimPoint();
            this.shotgun.attack(hitPoint, this.eyes.forward.clone());
        } else if (this.weaponType === 4) {
            this.blowUp();
        } else {
            console.log("Unknown weapon type / I don't have a weapon");
        }
    }

    rotateToTarget(fromNode: Node, toNode: Node) {
        const res = new Vec3(toNode.position.x, toNode.position.y + 0.5, toNode.position.z);
        fromNode.lookAt(res);
    }

    getMovementDirection(fromNode: Node, toNode: Node): Vec3 {
        const direction = new Vec3();
        direction.x = toNode.position.x - fromNode.position.x;
        direction.z = toNode.position.z - fromNode.position.z;
        direction.y = toNode.position.y - fromNode.position.y;
        return direction;
    }

    checkGrounded() {
        const world = PhysicsSystem.instance;

        const origin = this.node.worldPosition.clone();
        const direction = new Vec3(0, -1, 0);
        const maxDistance = 1.05;

        this.isGrounded = world.raycastClosest(
            new geometry.Ray(origin.x, origin.y, origin.z, direction.x, direction.y, direction.z), maxDistance
        );
    }

    getAimPoint(): Vec3 {
        const ray = new geometry.Ray();
        ray.o.set(this.eyes.worldPosition);
        ray.d.set(this.eyes.forward);
        ray.d.normalize();
        const maxDistance = 100;
        const endPoint = new Vec3();
        Vec3.scaleAndAdd(
            endPoint,
            ray.o,
            ray.d,
            maxDistance
        );
        const hit = PhysicsSystem.instance.raycastClosest(
            ray,
            0xffffffff,
            maxDistance
        );
        if (hit) {
            return PhysicsSystem.instance
                .raycastClosestResult
                .hitPoint
                .clone();
        }
        return endPoint;
    }

    tryTojump() {
        if (!this.isGrounded || this.jumpTimer_Counter < this.jumpTimer) return;
        if (this.movementDirection.length() == 0) return;
        const die: number = Math.random();
        if (die <= 0.005) {
            this.jump();
        }
    }

    @property({ type: CCFloat })
    public jumpTimer = 1;

    private jumpTimer_Counter = 0;

    private jumpForce = 5;
    private isGrounded = true;

    jump() {
        //console.log("Space: " + this.isGrounded);

        //this.isGrounded = false;
        this.jumpTimer_Counter = 0;

        const velocity = new Vec3();
        this.rb.getLinearVelocity(velocity);

        velocity.y = this.jumpForce;
        this.rb.setLinearVelocity(velocity);

        //this.rb.applyImpulse(new Vec3(0, this.jumpForce, 0));
    }

    findTarget() {
        this.target = find('Player');
    }

    blowUp() {
        this.hpScript.blowUp();
    }

    updateAttackTimerUI() {
        this.attackWindupSprite.node.scale = new Vec3((this.attackTimer / this.attackSpeed), 1, 1);
    }
}

