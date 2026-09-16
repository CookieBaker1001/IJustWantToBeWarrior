import {
    _decorator, Component, CCFloat, Label, Sprite,
    Vec3, find, Node, ProgressBar,
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HealthScript')
export class HealthScript extends Component {

    @property({ type: Label })
    public hpLabel: Label | null = null;

    @property({ type: ProgressBar })
    public hpBar: ProgressBar | null = null;

    @property({ type: Sprite })
    public hpSprite: Sprite | null = null;
    private hpSpriteParent: Node | null = null;

    @property({ type: CCFloat })
    public maxHealth: number = 100;

    private currentHealth: number = this.maxHealth;

    @property({ type: CCFloat })
    public hpPerSecond: number = 0.5;
    private hpTimer: number = 0;

    private target: Node | null = null;

    // @property({ type: CCFloat })
    // public invincibillityTime: number = 0.25;
    // private invincibilityTimer: number = this.invincibillityTime;

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
        // if (this.invincibilityTimer < this.invincibillityTime) {
        //     this.invincibilityTimer += dt;
        // }
    }

    public takeDamage(amount: number) {
        //if (this.invincibilityTimer < this.invincibillityTime) return;
        this.currentHealth -= amount;
        this.updateHP();
        if (this.currentHealth <= 0) {
            if (this.node.name !== "Player") this.node.destroy();
            else {
                this.node.getComponent("PlayerController").onPlayerDeath();
            }
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
}

