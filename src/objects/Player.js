class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        this.sprite.setCollideWorldBounds(true);
    this.health = 3;
    this.speed = 485;
    this.fullMovement = false;
    }

    move(left, right, up, down) {
        if (this.fullMovement) {
       
            const vx = (right ? 1 : 0) - (left ? 1 : 0);
            const vy = (down ? 1 : 0) - (up ? 1 : 0);
            this.sprite.setVelocityX(vx * this.speed);
            this.sprite.setVelocityY(vy * this.speed);
        } else {

            if (left) {
                this.sprite.setVelocityX(-this.speed);
            } else if (right) {
                this.sprite.setVelocityX(this.speed);
            } else {
                this.sprite.setVelocityX(0);
            }

            this.sprite.setVelocityY(0);
        }
    }

    enableFullMovement() {
        if (this.fullMovement) return;
        this.fullMovement = true;
    }

    disableFullMovement() {
        if (!this.fullMovement) return;
        this.fullMovement = false;

    }

    shoot() {
   
            const key = 'triangle-bullet';
            if (!this.scene.textures.exists(key)) {
                const size = 24;
                const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
                g.fillStyle(0xffff66, 1);
                g.beginPath();
           
                g.moveTo(size/2, 0);
                g.lineTo(size, size);
                g.lineTo(0, size);
                g.closePath();
                g.fillPath();
                g.generateTexture(key, size, size);
                g.destroy();
            }

       
            const makeBullet = (offsetX = 0, vx = 0) => {
                const b = this.scene.add.image(this.sprite.x + offsetX, this.sprite.y - 20, key);
                b.setOrigin(0.5, 0.5);
                b._vy = -700; // 
                b._vx = vx; // 
                b._damage = 1;
                b.setDepth(5);
                this.scene.bullets.add(b);
                return b;
            };

            if (this.doubleShot) {
  
                makeBullet(-5, -40);
                makeBullet(5, 40);
                console.log('Player.shoot -> double triangle bullets');
            } else {
                const b = makeBullet(0, 0);
                console.log('Player.shoot -> triangle bullet created', { x: b.x, y: b.y, _vy: b._vy });
            }
    }

    
    shootSemiCircleOnce(count = 13) {
        const scene = this.scene;
        const key = 'triangle-bullet';
        if (!scene.textures.exists(key)) {
    
            const size = 24;
            const g = scene.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffff66, 1);
            g.beginPath();
            g.moveTo(size/2, 0);
            g.lineTo(size, size);
            g.lineTo(0, size);
            g.closePath();
            g.fillPath();
            g.generateTexture(key, size, size);
            g.destroy();
        }

        const speed = 420;
        // angles from -PI (left) to 0 (right) sweep the upper half-circle (through -PI/2 = up)
        for (let i = 0; i < count; i++) {
            const t = count === 1 ? 0.5 : i / (count - 1);
            const theta = -Math.PI + t * Math.PI; // -PI .. 0
            const vx = Math.cos(theta) * speed;
            const vy = Math.sin(theta) * speed;
            const b = scene.add.image(this.sprite.x, this.sprite.y - 10, key).setDepth(5);
            b._vx = vx;
            b._vy = vy;
            b._damage = 1;
            // add to scene bullets group if available
            if (scene.bullets) scene.bullets.add(b);
        }
        console.log('Player.shootSemiCircleOnce -> fired', count, 'bullets');
    }

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        this.sprite.destroy();
    }
}

export default Player;