import { _decorator, CCFloat, Component, Node, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EnemySpawner')
export class EnemySpawner extends Component {

    @property([Prefab])
    public enemyPrefabs: Prefab[] = [];

    @property([Node])
    public spawnPositions: Node[] = [];

    @property({ type: Node })
    public enemiesParent: Node | null = null;

    @property({ type: CCFloat })
    public spawnInterval: number = 5;
    private spawnTimer: number = 0;

    start() {

    }

    update(dt: number) {
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer -= this.spawnInterval;

            const randomEnemy = Math.floor(Math.random() * this.enemyPrefabs.length);
            const randomPosition = Math.floor(Math.random() * this.spawnPositions.length);
            const position = this.spawnPositions[randomPosition];
            
            const enemy = instantiate(this.enemyPrefabs[randomEnemy]);
            enemy.setParent(this.enemiesParent);
            enemy.setPosition(position.getPosition());
        }
    }
}

