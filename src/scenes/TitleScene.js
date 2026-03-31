export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000);

        const border = this.add.graphics();
        border.lineStyle(3, 0xffffff, 1);
        border.strokeRect(0, 0, this.scale.width, this.scale.height);
        const stars = this.add.graphics();
        for (let i = 0; i < 180; i++) {
            const x = Phaser.Math.Between(0, this.scale.width);
            const y = Phaser.Math.Between(0, this.scale.height);
            const size = Phaser.Math.FloatBetween(0.5, 1.8);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);
            stars.fillStyle(0xffffff, alpha);
            stars.fillCircle(x, y, size);
        }

        this.add.text(centerX, centerY - 90, 'GALACTIC FIGHTER', {
            font: '64px monospace',
            fill: '#39ff14',
            stroke: '#0a3d0a',
            strokeThickness: 6
        }).setOrigin(0.5);

        const playButton = this.add.text(centerX, centerY + 40, 'PLAY', {
            font: '38px monospace',
            fill: '#39ff14',
            backgroundColor: '#001600',
            padding: { left: 26, right: 26, top: 12, bottom: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playButton.on('pointerover', () => playButton.setStyle({ fill: '#7dff6a', backgroundColor: '#003300' }));
        playButton.on('pointerout', () => playButton.setStyle({ fill: '#39ff14', backgroundColor: '#001600' }));
        playButton.on('pointerdown', () => this.scene.start('GameScene'));
    }
}
