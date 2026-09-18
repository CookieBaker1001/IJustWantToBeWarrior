import { _decorator, Component, Prefab, CCFloat, instantiate, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ExplosionSpawner')
export class ExplosionSpawner extends Component {

    @property({ type: Node })
    public pos: Node | null = null;

    @property({ type: Prefab })
    public bomb: Prefab | null = null;

    @property({ type: CCFloat })
    public spawnInterval: number = 5;
    private spawnTimer: number = 0;

    start() {

    }

    update(dt: number) {
        if (this.spawnTimer <= this.spawnInterval) {
            this.spawnTimer += dt;
        } else {
            //console.log("Spawning bomb at position: " + this.pos.getWorldPosition());
            this.spawnTimer -= this.spawnInterval;
            const b = instantiate(this.bomb);
            b.setParent(this.node);
            b.setPosition(this.pos.position);
        }
    }
}

