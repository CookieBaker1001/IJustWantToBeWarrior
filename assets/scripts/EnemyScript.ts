import {
    _decorator, Component, Node, find, CCFloat, Vec3, RigidBody,
    PhysicsSystem, geometry
} from 'cc';
const { ccclass, property } = _decorator; 

import { Gun } from './Gun';
import { Sword } from './Sword';
import { Shotgun } from './Shotgun';

@ccclass('EnemyScript')
export class EnemyScript extends Component {

    @property({ type: CCFloat })
    public speed: number = 3; // Meters per second

    @property({ type: CCFloat })
    public stopDistance: number = 4; // Meters before stopping

    @property({ type: CCFloat })
    public attackSpeed: number = 2.2; // Seconds between attacks
    private attackTimer: number = 0; // Timer to track attack cooldown

    @property({ type: Gun })
    public gun: Gun | null = null; // Reference to the Gun component

    @property({ type: Sword })
    public sword: Sword | null = null; // Reference to the Sword component

    @property({ type: Shotgun })
    public shotgun: Shotgun | null = null; // Reference to the Shotgun component

    @property({ type: Node })
    public eyes: Node | null = null; // Reference to the eyes node for aiming

    @property([Node])
    public faces: Node[] = [];

    private rb: RigidBody | null = null;
    private target: Node | null = null
    private pivot: Node | null = null;

    private movementDirection: Vec3 = new Vec3(0, 0, 0);
    private lookDirection: Vec3 = new Vec3(0, 0, 0);
    private currentMovementVector = new Vec3();

    private groundAcceleration = 18;
    private airAcceleration = 0.05;

    start() {
        const index = Math.floor(Math.random() * this.faces.length);
        this.faces.forEach((face, i) => {
            face.active = (i === index);
        });
        this.rb = this.node.getComponent(RigidBody);
        //this.eyes = this.node.getChildByName("Eyes");
        this.pivot = this.node.getChildByName("Pivot");
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
        if (this.movementDirection.length() < this.stopDistance) {
            this.movementDirection.set(0, 0, 0);
            this.attackTimer += dt;
            if (this.attackTimer >= this.attackSpeed) {
                this.attackTimer -= this.attackTimer;

                if (this.gun) {
                    const hitPoint = this.getAimPoint();
                    this.gun.attack(hitPoint);
                } else if (this.sword) {
                    this.sword.attack();
                } else {
                    const hitPoint = this.getAimPoint();
                    this.shotgun.attack(hitPoint);
                }
            }
            
        } else {
            this.movementDirection.normalize();
        }
        this.rotateToTarget(this.pivot, this.target);

        this.checkGrounded();
        this.tryTojump();
        const acceleration = (this.isGrounded ? this.groundAcceleration : this.airAcceleration);

        if (this.movementDirection.length() > 0) {
            this.currentMovementVector.add(this.movementDirection.multiplyScalar(acceleration * dt));
            if (this.currentMovementVector.length() > this.speed) {
                this.currentMovementVector.normalize().multiplyScalar(this.speed);
            }
        } else {
            this.currentMovementVector.multiplyScalar((this.isGrounded ? 0.92 : 0.99));
        }

        const velocity = new Vec3();
        this.rb.getLinearVelocity(velocity);

        velocity.x = this.currentMovementVector.x;
        velocity.z = this.currentMovementVector.z;

        this.rb.setLinearVelocity(velocity);

        if (this.node.worldPosition.y < -10) {
            this.node.destroy();
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
}

