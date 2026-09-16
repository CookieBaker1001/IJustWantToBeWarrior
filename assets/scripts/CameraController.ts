import { _decorator, Component, Node, input, Input, EventMouse, EventKeyboard, KeyCode, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraController')
export class CameraController extends Component {

    @property({ type: Node })
    camera: Node | null = null;
    @property({ type: Node })
    cameraPivot: Node | null = null;
    @property({ type: Node })
    characterModel: Node | null = null;

    yaw = 0;
    pitch = 15;
    distance = 5;
    firstPerson = true;
    mouseSensitivity = 0.15;

    private keys = new Set<KeyCode>();

    start() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    onKeyDown(event: EventKeyboard) {
        this.keys.add(event.keyCode);
    }

    onKeyUp(event: EventKeyboard) {
        this.keys.delete(event.keyCode);
    }

    onMouseMove(event: EventMouse) {
        //this.requestPointerLock();
        this.yaw -= event.getDeltaX() * this.mouseSensitivity;
        this.pitch += event.getDeltaY() * this.mouseSensitivity;

        if (this.pitch < -90) this.pitch = -90;
        else if (this.pitch > 85) this.pitch = 85;
    }

    update(dt: number) {
        this.node.setRotationFromEuler(0, this.yaw, 0);
        if (this.cameraPivot) this.cameraPivot.setRotationFromEuler(this.pitch, 0, 0);

        // const target = this.firstPerson ? this.firstPOS : this.thirdPOS;
        // Vec3.lerp(this.camera.position, this.camera.position, target, dt * 10);
        // this.camera.setPosition(this.camera.position);
    }
}


