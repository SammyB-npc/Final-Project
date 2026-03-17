class Collision {
  constructor(gameScene) {
    this.gameScene = gameScene;
  }

  checkPlayerBulletCollision(playerSprite, bulletsGroup) {
    bulletsGroup.getChildren().forEach(bullet => {
      if (this.isCollidingSprites(playerSprite, bullet)) {
        bullet.destroy();
        if (playerSprite.takeDamage) playerSprite.takeDamage();
      }
    });
  }

  checkEnemyBulletCollision(enemiesGroup, bulletsGroup) {
    enemiesGroup.getChildren().forEach(enemy => {
      bulletsGroup.getChildren().forEach(bullet => {
        if (this.isCollidingSprites(enemy, bullet)) {
          bullet.destroy();
          if (enemy.destroy) enemy.destroy();
          if (this.gameScene && this.gameScene.createExplosion) this.gameScene.createExplosion(enemy.x, enemy.y);
        }
      });
    });
  }

  isCollidingSprites(a, b) {
    if (!a || !b || !a.getBounds || !b.getBounds) return false;
    const A = a.getBounds();
    const B = b.getBounds();
    return !(A.right < B.left || A.left > B.right || A.bottom < B.top || A.top > B.bottom);
  }
}

export default Collision;