import {
    _decorator, Component, CCFloat, Label, Sprite,
    Vec3, find, Node, ProgressBar, Prefab, instantiate,
} from 'cc';
import { RB_System } from './RB_System';
const { ccclass, property } = _decorator;

@ccclass('HealthScript')
export class HealthScript extends Component {

    @property({ type: Prefab })
    public healEffect: Prefab | null = null;

    @property({ type: Label })
    public hpLabel: Label | null = null;

    @property({ type: ProgressBar })
    public hpBar: ProgressBar | null = null;

    @property({ type: Sprite })
    public hpSprite: Sprite | null = null;
    private hpSpriteParent: Node | null = null;

    @property({ type: CCFloat })
    public maxHealth: number = 100;

    @property([Prefab])
    public deathPrefabs: Prefab[] = [];

    private currentHealth: number = this.maxHealth;

    @property({ type: CCFloat })
    public hpPerSecond: number = 0.5;
    private hpTimer: number = 0;

    private target: Node | null = null;
    private isDead: boolean = false;

    start() {
        this.currentHealth = this.maxHealth;
        this.updateHP();

        if (this.hpSprite) {
            this.target = find("Player");
            this.hpSpriteParent = this.hpSprite?.node.parent || null;
        }
    }

    update(dt: number) {
        if (this.currentHealth < this.maxHealth) this.hpTimer += (this.hpPerSecond * dt);
        if (this.hpTimer >= 1) {
            this.hpTimer -= 1;
            this.currentHealth += 1;
            this.updateHP();
        }
        if (this.hpSprite) {
            this.hpSpriteParent.lookAt(this.target?.worldPosition || Vec3.ZERO);
        }
    }

    public takeDamage(amount: number) {
        const intAmount = Math.ceil(amount);
        this.currentHealth -= intAmount;
        this.updateHP();
        if (this.currentHealth <= 0) {
            if (this.node.name !== "Player") this.die();
            else {
                this.node.getComponent("PlayerController").onPlayerDeath();
            }
        }
    }

    public heal(amount: number) {
        this.currentHealth += amount;
        if (this.currentHealth > this.maxHealth) {
            this.currentHealth = this.maxHealth;
        }
        this.updateHP();
        if (this.healEffect) {
            const effect = instantiate(this.healEffect);
            this.node.scene!.addChild(effect);
            effect.setWorldPosition(this.node.worldPosition.clone());
            //console.log("Spawned heal effect", effect.getWorldPosition());
        }
    }

    private updateHP() {
        if (this.hpLabel) {
            this.hpLabel.string = ("HP: " + this.currentHealth.toString());
            this.hpBar.progress = this.currentHealth / this.maxHealth;
        }
        else if (this.hpSprite) {
            const fillPercentage = this.currentHealth / this.maxHealth;
            this.hpSprite.node.scale = new Vec3(fillPercentage, 1, 1);
        }
    }

    public blowUp() {
        //console.log("Blew up by comming close to player");
        this.die();
    }

    private die() {
        if (this.isDead) return;
        this.isDead = true;
        //console.log("Died");

        for (const prefab of this.deathPrefabs) {
            const object = instantiate(prefab);
            object.setWorldPosition(this.node.worldPosition.clone());
            this.node.scene!.addChild(object);
        }

        // if (this.deathPrefab !== null) {
        //     const object = instantiate(this.deathPrefab);
        //     object.setWorldPosition(this.node.worldPosition.clone());
        //     this.node.scene!.addChild(object);
        //     //console.log("Successfully instantiated death prefab at: " + this.node.worldPosition);
        //     //console.log(object);
        // }
        RB_System.instance?.unregisterBody_N(this.node);
        this.node.destroy();
    }
}


