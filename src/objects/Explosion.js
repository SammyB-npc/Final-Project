class Explosion {
    constructor(scene, x, y) {
        this.scene = scene;
    this.sprite = scene.add.circle(x, y, 18, 0xff3333);

        scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 500,
            onComplete: () => this.destroy()
        });
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
    }
}

export default Explosion;