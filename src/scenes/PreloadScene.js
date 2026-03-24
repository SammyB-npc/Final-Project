export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
       
        this.load.image('player', 'assets/spritesheets/player.png');
        this.load.image('enemy', 'assets/spritesheets/enemy.png');
        this.load.image('bullet', 'assets/spritesheets/bullet.png');
        this.load.image('explosion', 'assets/spritesheets/explosion.png');

        
        this.load.audio('shoot', 'assets/audio/shoot.wav');
        this.load.audio('explosion', 'assets/audio/explosion.wav');
        this.load.audio('backgroundMusic', 'assets/audio/background.mp3');

     
    }

    create() {
        this.scene.start('TitleScene');
    }
}