import {
    _decorator, Component, Node, RigidBody, input, Input, EventKeyboard, KeyCode,
    EventMouse, Vec3, PhysicsSystem, geometry, game
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

    private walkSpeed = 5;
    private runSpeed = 10;
    private currentMaxSpeed = 5;

    private currentMovementVector = new Vec3();

    private groundAcceleration = 18;
    private airAcceleration = 0.05;

    private WASDmovement = new Vec3();


    private _w = false;
    private _a = false; 
    private _s = false;
    private _d = false;

    update(dt: number) {
        if (this.jumpTimer < this.jumpTimerCap) this.jumpTimer += dt;

        // this.node.setRotationFromEuler(0, this.cameraNode.yaw, 0);
        // if (this.cameraPivot) this.cameraPivot.setRotationFromEuler(this.pitch, 0, 0);

        const forward = this.node.forward.clone();
        forward.y = 0;
        forward.normalize();

        const right = this.node.right.clone();
        right.y = 0;
        right.normalize();

        this.WASDmovement = this.getTravelDirection(forward, right);

        this.checkGrounded();
        const acceleration = (this.isGrounded ? this.groundAcceleration : this.airAcceleration);

        if (this.running) this.currentMaxSpeed = this.runSpeed;
        else this.currentMaxSpeed = this.walkSpeed;
        if (this.WASDmovement.length() > 0) {
            this.currentMovementVector.add(this.WASDmovement.multiplyScalar(acceleration * dt));
            if (this.currentMovementVector.length() > this.currentMaxSpeed) {
                this.currentMovementVector.normalize().multiplyScalar(this.currentMaxSpeed);
            }
        } else {
            this.currentMovementVector.multiplyScalar((this.isGrounded ? 0.92 : 0.99));
        }

        const velocity = new Vec3();
        this.rb.getLinearVelocity(velocity);

        velocity.x = this.currentMovementVector.x;
        velocity.z = this.currentMovementVector.z;

        this.rb.setLinearVelocity(velocity);
    }

    getTravelDirection(forward: Vec3, right: Vec3): Vec3 {
        this.WASDmovement.set(0, 0, 0);
        if (!this.canMove) return this.WASDmovement;
        if (this.keys.has(KeyCode.KEY_W)) this.WASDmovement.add(forward);
        if (this.keys.has(KeyCode.KEY_S)) this.WASDmovement.subtract(forward);
        if (this.keys.has(KeyCode.KEY_A)) this.WASDmovement.subtract(right);
        if (this.keys.has(KeyCode.KEY_D)) this.WASDmovement.add(right);

        // if (this._w) this.WASDmovement.add(forward);
        // if (this._s) this.WASDmovement.subtract(forward);
        // if (this._a) this.WASDmovement.subtract(right);
        // if (this._d) this.WASDmovement.add(right);

        if (this.keys.has(KeyCode.SPACE)) this.jump();
        if (this.keys.has(KeyCode.SHIFT_LEFT)) this.running = true;
        else this.running = false;

        return this.WASDmovement.normalize();
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

    jump() {
        //console.log("Space: " + this.isGrounded);
        if (!this.isGrounded || this.jumpTimer < this.jumpTimerCap) return;
        //this.isGrounded = false;
        this.jumpTimer = 0;

        const velocity = new Vec3();
        this.rb.getLinearVelocity(velocity);

        velocity.y = this.jumpForce;
        this.rb.setLinearVelocity(velocity);

        //this.rb.applyImpulse(new Vec3(0, this.jumpForce, 0));
    }

    public onPlayerDeath() {
        this.canMove = false;
    }
}

