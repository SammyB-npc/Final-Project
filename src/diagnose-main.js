console.log('diagnose-main.js loaded');

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x101020,
  scene: {
    create() {
      this.add.text(20, 20, 'Phaser OK — diagnose page', { font: '28px monospace', fill: '#ffffff' });
      console.log('Phaser scene created');
    }
  }
};

new Phaser.Game(config);
