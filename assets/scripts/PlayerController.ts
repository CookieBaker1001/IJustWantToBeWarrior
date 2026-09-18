import {
    _decorator, Component, Node, RigidBody, input, Input, EventKeyboard, KeyCode,
    EventMouse, Vec3, PhysicsSystem, geometry, game, CCFloat
} from 'cc';
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

    private currentMovementVector = new Vec3();

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

    // update(dt: number) {
    //     if (this.jumpTimer < this.jumpTimerCap) this.jumpTimer += dt;

    //     const forward = this.node.forward.clone();
    //     forward.y = 0;
    //     forward.normalize();

    //     const right = this.node.right.clone();
    //     right.y = 0;
    //     right.normalize();

    //     this.WASDmovement = this.getTravelDirection(forward, right);
    //     this.getOtherKeyboardInput();

    //     this.checkGrounded();
    //     const acceleration = (this.isGrounded ? this.groundAcceleration : this.airAcceleration);

    //     if (this.running) this.currentMaxSpeed = this.runSpeed;
    //     else this.currentMaxSpeed = this.walkSpeed;
    //     if (this.WASDmovement.length() > 0) {
    //         this.currentMovementVector.add(this.WASDmovement.multiplyScalar(acceleration * dt));
    //         if (this.currentMovementVector.length() > this.currentMaxSpeed) {
    //             this.currentMovementVector.normalize().multiplyScalar(this.currentMaxSpeed);
    //         }
    //     } else {
    //         this.currentMovementVector.multiplyScalar((this.isGrounded ? 0.92 : 0.99));
    //     }

    //     const dashVelocity = new Vec3(0, 0, 0);

    //     if (this.dash && this.firstDashFrame) {
    //         dashVelocity.set(this.currentMovementVector.x, 0, this.currentMovementVector.z);
    //         dashVelocity.normalize().multiplyScalar(this.dashForce);
    //         this.firstDashFrame = false;
    //     }

    //     const velocity = new Vec3();
    //     this.rb.getLinearVelocity(velocity);

    //     velocity.x = this.currentMovementVector.x + dashVelocity.x;
    //     velocity.z = this.currentMovementVector.z + dashVelocity.z;

    //     this.rb.setLinearVelocity(velocity);
    // }

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

        if (this.WASDmovement.length() > 0) {

            const velocity = new Vec3();
            this.rb.getLinearVelocity(velocity);
            const movementDirection = this.WASDmovement.clone();
            const speedInMovementDirection =Vec3.dot(velocity, movementDirection);

            if (speedInMovementDirection < this.currentMaxSpeed) {
                const force = movementDirection.multiplyScalar(acceleration);
                this.rb.applyForce(force);
            }

            // const force = this.WASDmovement.clone().multiplyScalar(acceleration);
            // this.rb.applyForce(force);

        }

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

        //this.limitMovementSpeed();
    }

    limitMovementSpeed() {
        const velocity = new Vec3();
        this.rb.getLinearVelocity(velocity);

        const horizontalVelocity = new Vec3(velocity.x, 0, velocity.z);

        if (horizontalVelocity.length() > this.currentMaxSpeed) {
            horizontalVelocity.normalize().multiplyScalar(this.currentMaxSpeed);

            velocity.x = horizontalVelocity.x;
            velocity.z = horizontalVelocity.z;

            this.rb.setLinearVelocity(velocity);
        }
    }

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

