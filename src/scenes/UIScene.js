export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.score = 0;
        this.health = 3;
    }

    create() {
        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#fff'
        });

        this.healthText = this.add.text(16, 50, `Health: ${this.health}`, {
            fontSize: '32px',
            fill: '#fff'
        });

        this.gameOverText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, '', {
            fontSize: '64px',
            fill: '#ff0000'
        }).setOrigin(0.5);
    }

    updateScore(points) {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    updateHealth(amount) {
        this.health += amount;
        this.healthText.setText(`Health: ${this.health}`);
        if (this.health <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.gameOverText.setText('MISSION FALIED');
        this.scene.pause('GameScene');
    }

    reset() {
        this.score = 0;
        this.health = 3;
        this.scoreText.setText(`Score: ${this.score}`);
        this.healthText.setText(`Health: ${this.health}`);
        this.gameOverText.setText('');
        this.scene.resume('GameScene');
    }
}