import {
    _decorator, Component, Node, RigidBody, input, Input, EventKeyboard, KeyCode,
    EventMouse, Vec3, PhysicsSystem, geometry, game, CCFloat
} from 'cc';
import { RB_System } from './RB_System';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {

    @property({ type: Node })
    cameraPivot: Node | null = null;
    @property({ type: RigidBody })
    rb: RigidBody | null = null;
    @property({ type: Node })
    cameraNode: Node | null = null;

    private keys = new Set<KeyCode>();
    private canMove: boolean = true;

    start() {
        document.addEventListener("pointerlockchange", this.onPointerLockChange);

        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);

        RB_System.instance?.registerBody(this.rb);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onPointerLockChange = () => {
        this.pointerLocked = document.pointerLockElement === game.canvas;
    }

    onMouseDown() {
        if (!this.pointerLocked) game.canvas?.requestPointerLock();
    }

    onKeyDown(event: EventKeyboard) {
        //this.requestPointerLock();
        this.keys.add(event.keyCode);
        switch (event.keyCode) {
            case KeyCode.KEY_W:
                this._w = true;
                break;
            case KeyCode.KEY_A:
                this._a = true;
                break;
            case KeyCode.KEY_S:
                this._s = true;
                break;
            case KeyCode.KEY_D:
                this._d = true;
                break;
        }
    }

    onKeyUp(event: EventKeyboard) {
        this.keys.delete(event.keyCode);
        switch (event.keyCode) {
            case KeyCode.KEY_W:
                this._w = false;
                break;
            case KeyCode.KEY_A:
                this._a = false;
                break;
            case KeyCode.KEY_S:
                this._s = false;
                break;
            case KeyCode.KEY_D:
                this._d = false;
                break;
        }
    }

    private pointerLocked = false;

    requestPointerLock() {
        console.log("Requesting pointer lock");
        console.log(game.canvas);
        console.log(document.pointerLockElement);

        const canvas = document.querySelector("canvas");
        console.log(canvas);
        canvas?.requestPointerLock();
        console.log("Done requesting pointer lock");
    }

    private running = false;

    @property({ type: CCFloat })
    public walkSpeed: number = 5;

    @property({ type: CCFloat })
    public runSpeed: number = 10;
    private currentMaxSpeed = 5;

    private groundAcceleration = 18;
    private airAcceleration = 0.05;

    private WASDmovement = new Vec3();

    private _w = false;
    private _a = false; 
    private _s = false;
    private _d = false;

    private dash = false;
    private firstDashFrame = false;

    @property({ type: CCFloat })
    public dashForce: number = 20;

    @property({ type: CCFloat })
    public dashCooldown: number = 1;
    private dashTimer: number = 0;

    private counterForce = 1.0;

    update(dt: number) {
        if (this.jumpTimer < this.jumpTimerCap) this.jumpTimer += dt;
        if (this.dashTimer < this.dashCooldown) this.dashTimer += dt;

        const forward = this.node.forward.clone();
        forward.y = 0;
        forward.normalize();

        const right = this.node.right.clone();
        right.y = 0;
        right.normalize();

        this.WASDmovement = this.getTravelDirection(forward, right);
        this.getOtherKeyboardInput();

        this.checkGrounded();
        const acceleration = (this.isGrounded ? this.groundAcceleration : this.airAcceleration);

        this.currentMaxSpeed = this.running ? this.runSpeed : this.walkSpeed;

        const velocity = new Vec3();
        this.rb.getLinearVelocity(velocity);
        let resultingForce = new Vec3();

        if (this.WASDmovement.length() > 0) {
            const movementDirection = this.WASDmovement.clone();
            const speedInMovementDirection = Vec3.dot(velocity, movementDirection);
            if (speedInMovementDirection < this.currentMaxSpeed) {
                resultingForce = movementDirection.multiplyScalar(acceleration);
            }
        }
        const counterForce = this.getCounterForce();
        const totalForce = resultingForce.add(counterForce);
        this.rb.applyForce(totalForce);

        // if (this.WASDmovement.length() > 0) {
            
        //     const movementDirection = this.WASDmovement.clone();
        //     const speedInMovementDirection = Vec3.dot(velocity, movementDirection);

        //     if (speedInMovementDirection < this.currentMaxSpeed) {
        //         const force = movementDirection.multiplyScalar(acceleration);
        //         const counterForce = this.getCounterForce();
        //         const totalForce = force.subtract(counterForce);
        //         this.rb.applyForce(totalForce);
        //     }

        //     // let force = movementDirection.multiplyScalar(acceleration);

        //     // // Only apply counterforce while grounded
        //     // if (this.isGrounded) {

        //     //     // Only horizontal velocity matters
        //     //     const horizontalVelocity = new Vec3(
        //     //         velocity.x,
        //     //         0,
        //     //         velocity.z
        //     //     );

        //     //     const speed = horizontalVelocity.length();

        //     //     if (speed > 0.001) {

        //     //         const velocityDirection =
        //     //             horizontalVelocity.clone().normalize();

        //     //         // 1 = perfectly aligned
        //     //         // 0 = perpendicular
        //     //         // -1 = completely opposite
        //     //         const alignment =
        //     //             Vec3.dot(velocityDirection, movementDirection);

        //     //         // 0 = aligned
        //     //         // 0.5 = perpendicular
        //     //         // 1 = opposite
        //     //         const misalignment =
        //     //             (1 - alignment) / 2;

        //     //         const counterForceStrength =
        //     //             this.counterForce * speed * misalignment;

        //     //         const counterForce =
        //     //             velocityDirection
        //     //                 .clone()
        //     //                 .multiplyScalar(-counterForceStrength);

        //     //         force.add(counterForce);
        //     //     }
        //     // }

        //     // if (speedInMovementDirection < this.currentMaxSpeed) {
        //     //     this.rb.applyForce(force);
        //     // }
        // }

        if (this.dash && this.firstDashFrame && this.dashTimer >= this.dashCooldown) {
            this.dashTimer -= this.dashCooldown;
            const dashDirection = this.WASDmovement.length() > 0
                ? this.WASDmovement.clone()
                : this.node.forward.clone();

            dashDirection.y = 0;
            dashDirection.normalize();

            const impulse = dashDirection.multiplyScalar(this.dashForce);

            this.rb.applyImpulse(impulse);

            this.firstDashFrame = false;
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
        const desiredDirection = this.WASDmovement.clone();
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

    // limitMovementSpeed() {
    //     const velocity = new Vec3();
    //     this.rb.getLinearVelocity(velocity);

    //     const horizontalVelocity = new Vec3(velocity.x, 0, velocity.z);

    //     if (horizontalVelocity.length() > this.currentMaxSpeed) {
    //         horizontalVelocity.normalize().multiplyScalar(this.currentMaxSpeed);

    //         velocity.x = horizontalVelocity.x;
    //         velocity.z = horizontalVelocity.z;

    //         this.rb.setLinearVelocity(velocity);
    //     }
    // }

    getTravelDirection(forward: Vec3, right: Vec3): Vec3 {
        this.WASDmovement.set(0, 0, 0);
        if (!this.canMove) return this.WASDmovement;
        if (this.keys.has(KeyCode.KEY_W)) this.WASDmovement.add(forward);
        if (this.keys.has(KeyCode.KEY_S)) this.WASDmovement.subtract(forward);
        if (this.keys.has(KeyCode.KEY_A)) this.WASDmovement.subtract(right);
        if (this.keys.has(KeyCode.KEY_D)) this.WASDmovement.add(right);

        return this.WASDmovement.normalize();
    }

    getOtherKeyboardInput() {
        if (this.keys.has(KeyCode.SPACE)) this.jump();
        if (this.keys.has(KeyCode.SHIFT_LEFT)) this.running = true;
        else this.running = false;
        if (this.keys.has(KeyCode.CTRL_LEFT)) {
            if (!this.dash) this.firstDashFrame = true;
            this.dash = true;
        } else {
            this.dash = false;
            this.firstDashFrame = false;
        }
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

    private jumpForce = 5;
    private jumpTimerCap = 1;
    private jumpTimer = 1;
    private isGrounded = true;

    // jump() {
    //     //console.log("Space: " + this.isGrounded);
    //     if (!this.isGrounded || this.jumpTimer < this.jumpTimerCap) return;
    //     //this.isGrounded = false;
    //     this.jumpTimer = 0;

    //     const velocity = new Vec3();
    //     this.rb.getLinearVelocity(velocity);

    //     velocity.y = this.jumpForce;
    //     this.rb.setLinearVelocity(velocity);

    //     //this.rb.applyImpulse(new Vec3(0, this.jumpForce, 0));
    // }

    jump() {
        if (!this.isGrounded || this.jumpTimer < this.jumpTimerCap) return;
        this.jumpTimer = 0;

        this.rb.applyImpulse(new Vec3(0, this.jumpForce, 0));
    }

    public onPlayerDeath() {
        this.canMove = false;
    }
}

