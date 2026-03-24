export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Starry background for the title screen.
        this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000814);

        const stars = this.add.graphics();
        for (let i = 0; i < 180; i++) {
            const x = Phaser.Math.Between(0, this.scale.width);
            const y = Phaser.Math.Between(0, this.scale.height);
            const size = Phaser.Math.FloatBetween(0.5, 1.8);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);
            stars.fillStyle(0xffffff, alpha);
            stars.fillCircle(x, y, size);
        }

        this.add.text(centerX, centerY - 90, 'Galactic fighter', {
            font: '64px monospace',
            fill: '#ffffff',
            stroke: '#3a7bd5',
            strokeThickness: 6
        }).setOrigin(0.5);

        const playButton = this.add.text(centerX, centerY + 40, 'PLAY', {
            font: '38px monospace',
            fill: '#ffe066',
            backgroundColor: '#143d6b',
            padding: { left: 26, right: 26, top: 12, bottom: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playButton.on('pointerover', () => playButton.setStyle({ fill: '#ffffff', backgroundColor: '#1f5f9e' }));
        playButton.on('pointerout', () => playButton.setStyle({ fill: '#ffe066', backgroundColor: '#143d6b' }));
        playButton.on('pointerdown', () => this.scene.start('GameScene'));
    }
}
