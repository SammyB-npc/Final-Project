class Enemy {
    constructor(scene, x, y) {
        this.scene = scene;
    this.sprite = scene.add.image(x, y, 'enemy');
    this.health = 100;

    this.speed = 175;

    // slightly reduced horizontal drift
    this.sprite._vx = Phaser.Math.Between(-45, 45);
    this.sprite._vy = this.speed * 0.6;
    console.log('Enemy created', { x: x, y: y, _vx: this.sprite._vx, _vy: this.sprite._vy });
    }

   
    destroy() {
        if (this.sprite) this.sprite.destroy();
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
        }
    }


}

export default Enemy;