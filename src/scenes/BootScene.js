export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
      
        this.load.image('loading', 'assets/spritesheets/loading.png');
    }

    create() {

        this.scene.start('PreloadScene');
    }
}