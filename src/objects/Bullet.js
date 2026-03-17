
class Bullet {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.image(x, y, 'bullet');
    this.sprite.setVelocityY(-400);
    this.sprite.setCollideWorldBounds(true);

  }

  update() {
    if (!this.sprite || !this.sprite.active) return;
    if (this.sprite.y < -50) {
      this.destroy();
    }
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}

export default Bullet;
