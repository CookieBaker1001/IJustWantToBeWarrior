import {
    _decorator, Component, Node, input, Input, EventKeyboard, Camera, Prefab, KeyCode,
    EventMouse, PhysicsSystem, geometry, Vec3, instantiate, Animation, Label,
    CCInteger,
} from 'cc';
const { ccclass, property } = _decorator;

import { Gun } from './Gun';
import { Sword } from './Sword';
import { Shotgun } from './Shotgun';

@ccclass('WeaponController')
export class WeaponController extends Component {

    @property(Camera)
    camera: Camera | null = null;

    @property({ type: Node })
    weapon1: Node | null = null;
    @property({ type: Node })
    weapon2: Node | null = null;
    @property({ type: Node })
    weapon3: Node | null = null;

    private gun: Gun | null = null;
    private sword: Sword | null = null;
    private shotgun: Shotgun | null = null;

    @property({ type: CCInteger })
    private chosenWeapon: number = 0;

    @property({ type: CCInteger })
    private startPistolAmmo: number = 0;
    private pistolAmmo: number = 0;

    @property({ type: CCInteger })
    private startShotgunAmmo: number = 0;
    private shotgunAmmo: number = 0;

    @property({ type: Label })
    public pistolAmmoLabel: Label | null = null;

    @property({ type: Label })
    public shotgunAmmoLabel: Label | null = null;

    start() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);

        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        this.gun = this.weapon1?.getComponent(Gun) || null;
        this.sword = this.weapon2?.getComponent(Sword) || null;
        this.shotgun = this.weapon3?.getComponent(Shotgun) || null;

        this.pistolAmmo = this.startPistolAmmo;
        this.shotgunAmmo = this.startShotgunAmmo;

        this.updateAmmoLabels(0);
        this.updateAmmoLabels(1);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);

        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this)
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this)
    }

    onKeyDown(event: EventKeyboard) {
        if (event.keyCode === KeyCode.DIGIT_1) {
            this.chosenWeapon = 0;
            this.weapon1.active = true;
            this.weapon2.active = false;
            this.weapon3.active = false;
        }
        if (event.keyCode === KeyCode.DIGIT_2) {
            this.chosenWeapon = 1;
            this.weapon1.active = false;
            this.weapon2.active = true;
            this.weapon3.active = false;
        }
        if (event.keyCode === KeyCode.DIGIT_3) {
            this.chosenWeapon = 2;
            this.weapon1.active = false;
            this.weapon2.active = false;
            this.weapon3.active = true;
        }
    }

    onKeyUp(event: EventKeyboard) {

    }

    onMouseDown(event: EventMouse) {
        if (event.getButton() !== EventMouse.BUTTON_LEFT) return;

        if (this.chosenWeapon === 0) {
            this.firePistol();
        }
        else if (this.chosenWeapon === 1) {
            this.swingSword();
        }
        else if (this.chosenWeapon === 2) {
            this.fireShotgun();
        }
    }

    onMouseUp(event: EventMouse) {
        //if (event.getButton() === EventMouse.BUTTON_LEFT) this.firing = false;
    }

    update(dt: number) {

    }

    swingSword() {
        this.sword.attack();
    }

    private successfullyFired: boolean = false;
    firePistol() {
        if (this.pistolAmmo <= 0) return;
        const hitPoint = this.getAimPoint();
        this.successfullyFired = this.gun.attack(hitPoint);
        if (this.successfullyFired) {
            this.pistolAmmo--;
            this.updateAmmoLabels(0);
        }
    }

    fireShotgun() {
        if (this.shotgunAmmo <= 0) return;
        const hitPoint = this.getAimPoint();
        const direction = this.getDirection();
        this.successfullyFired = this.shotgun.attack(hitPoint, direction);
        if (this.successfullyFired) {
            this.shotgunAmmo--;
            this.updateAmmoLabels(1);
        }
    }

    getDirection(): Vec3 {
        const direction = this.camera.node.forward.clone();
        return direction;
    }

    getAimPoint(): Vec3 {
        const ray = new geometry.Ray();
        this.camera.screenPointToRay(
            this.camera.camera.width * 0.5,
            this.camera.camera.height * 0.5,
            ray
        );
        const maxDistance = (this.chosenWeapon === 0) ? this.gun.range : this.shotgun.range;
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

    public replenish(amount: number, ammoType: number) {
        if (ammoType === 0) {
            this.pistolAmmo += amount;
            this.updateAmmoLabels(0);
        } else if (ammoType === 1) {
            this.shotgunAmmo += amount;
            this.updateAmmoLabels(1);
        }
    }

    private updateAmmoLabels(ammoType: number) {
        if (ammoType === 0 && this.pistolAmmoLabel) {
            this.pistolAmmoLabel.string = "x" + this.pistolAmmo;
        } else if (ammoType === 1 && this.shotgunAmmoLabel) {
            this.shotgunAmmoLabel.string = "x" + this.shotgunAmmo;
        }
    }
}

