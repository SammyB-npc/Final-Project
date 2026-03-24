import Player from '../objects/Player.js';
import Enemy from '../objects/Enemy.js';
import Explosion from '../objects/Explosion.js';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/constants.js';

// Single, consistent GameScene implementation.
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.enemies = null;
        this.bullets = null;
    this.enemyBullets = null;
        this.explosions = null;
        this.cursors = null;
        this.spaceKey = null;
    this.score = 0;
        this.gameOver = false;
        this.debugText = null;
    // round/wave state (simple defaults only)
    this.round = 1;
    this.enemiesPerRoundBase = 5;
    this.roundTarget = 0;
    this.spawnedThisRound = 0;
    this.waveTimer = null;
    this.roundLabel = null;
    // boss state
    this.bossIsChasing = false;
    this.bossShootTimer = null;
    this.bossChaseTimer = null;
    // post-boss boost settings
    this.postBossBoostRounds = 2;
    this.boostRoundsRemaining = 0;
    this.postBossExtraEnemies = 3; // extra enemies per boosted round
    // pause state
    this.paused = false;
    this.pausedLabel = null;
    // power-up per-round settings (initialized here; timers created in startWave)
    this.basePowerUpsPerRound = 1;
    this.powerUpsPerRoundIncrement = 1; // add this many extra per round
    this.powerUpsTarget = 0;
    this.powerUpsSpawnedThisRound = 0;
    this.powerUpTimer = null;
    }

    preload() {}

    create() {
    console.log('GameScene.create entered');

    // ── Space background ──────────────────────────────────────────────────
    // Solid black base
    this.add.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, 0x000000).setDepth(-10);

    // Galaxy nebula in the middle (layered oval gradients at a 45-degree tilt)
    // Base ellipse is wide, then rotated so it appears both horizontal and vertical.
    const gfx = this.add.graphics().setDepth(-9);
    const cx = SCREEN_WIDTH / 2;
    const cy = SCREEN_HEIGHT / 2;
    const galaxyAngle = Phaser.Math.DegToRad(-45);
    // Outer glow - deep purple/blue oval
    for (let r = 160; r >= 10; r -= 10) {
        const t = r / 160;
        const alpha = (1 - t) * 0.18;
        gfx.fillStyle(0x3a0a8e, alpha);
        gfx.save();
        gfx.translateCanvas(cx, cy);
        gfx.rotateCanvas(galaxyAngle);
        gfx.fillEllipse(0, 0, r * 3.2, r * 1.0);
        gfx.restore();
    }
    // Brighter violet/pink core oval
    for (let r = 70; r >= 2; r -= 4) {
        const t = r / 70;
        const alpha = (1 - t) * 0.35 + 0.05;
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            { r: 120, g: 20,  b: 160 },
            { r: 255, g: 180, b: 230 },
            70, r
        );
        gfx.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), alpha);
        gfx.save();
        gfx.translateCanvas(cx, cy);
        gfx.rotateCanvas(galaxyAngle);
        gfx.fillEllipse(0, 0, r * 3.2, r * 1.0);
        gfx.restore();
    }
    // Bright white-yellow centre
    gfx.fillStyle(0xffffee, 0.55);
    gfx.save();
    gfx.translateCanvas(cx, cy);
    gfx.rotateCanvas(galaxyAngle);
    gfx.fillEllipse(0, 0, 32, 10);
    gfx.restore();

    const dustGfx = this.add.graphics().setDepth(-8);
    const rng = new Phaser.Math.RandomDataGenerator(['space-seed']);
    for (let i = 0; i < 120; i++) {
        const angle = rng.realInRange(0, Math.PI * 2);
        const dist  = rng.realInRange(10, 165);
        const localX = Math.cos(angle) * dist * 1.6;
        const localY = Math.sin(angle) * dist * 0.5;
        const px = cx + (localX * Math.cos(galaxyAngle) - localY * Math.sin(galaxyAngle));
        const py = cy + (localX * Math.sin(galaxyAngle) + localY * Math.cos(galaxyAngle));
        const sz = rng.realInRange(0.5, 2.2);
        const alpha = rng.realInRange(0.15, 0.7);
        dustGfx.fillStyle(0xffffff, alpha);
        dustGfx.fillCircle(px, py, sz);
    }

    // Stars – static layer
    const starGfx = this.add.graphics().setDepth(-7);
    for (let i = 0; i < 220; i++) {
        const sx = rng.integerInRange(0, SCREEN_WIDTH);
        const sy = rng.integerInRange(0, SCREEN_HEIGHT);
        const size = rng.realInRange(0.4, 1.8);
        const alpha = rng.realInRange(0.4, 1.0);
        starGfx.fillStyle(0xffffff, alpha);
        starGfx.fillCircle(sx, sy, size);
    }

    // Twinkling stars – a handful that animate
    this._twinkleStars = [];
    for (let i = 0; i < 30; i++) {
        const sx = rng.integerInRange(0, SCREEN_WIDTH);
        const sy = rng.integerInRange(0, SCREEN_HEIGHT);
        const baseAlpha = rng.realInRange(0.5, 1.0);
        const speed     = rng.realInRange(0.8, 2.5);
        // draw as small Graphics objects so we can re-draw each frame
        const tg = this.add.graphics().setDepth(-6);
        this._twinkleStars.push({ gfx: tg, x: sx, y: sy, baseAlpha, speed, phase: rng.realInRange(0, Math.PI * 2) });
    }
    // ─────────────────────────────────────────────────────────────────────

        // groups
        this.enemies = this.add.group();
        this.bullets = this.add.group();
    this.enemyBullets = this.add.group();
        this.explosions = this.add.group();
    this.powerUps = this.add.group();

    // draw a thin white outline to show play area boundaries
    const outline = this.add.graphics();
    outline.lineStyle(2, 0xffffff, 1);
    outline.strokeRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // player (expects Player to attach a .sprite and provide move/shoot)
    this.player = new Player(this, SCREEN_WIDTH / 2, SCREEN_HEIGHT - 50);

    // lives
    this.lives = 10;
    this.livesText = this.add.text(12, 36, `Lives: ${this.lives}`, { font: '18px monospace', fill: '#ff6666' }).setDepth(150);

    // score display
    this.score = this.score || 0;
    this.scoreText = this.add.text(12, 12, `Score: ${this.score}`, { font: '18px monospace', fill: '#66ccff' }).setDepth(150);

        // input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // ensure player has no active double-shot when starting
        if (this.player) this.player.doubleShot = false;
        // start first wave (shows round label then begins spawning)
        try {
            this.startWave();
        } catch (err) {
            console.error('Error during startWave:', err);
            if (window && window.showError) window.showError('Error during startWave: ' + (err && err.stack ? err.stack : err));
            throw err;
        }

                    // debug overlay (stacked under lives)
                    this.debugText = this.add
                        .text(12, 64, '', { font: '14px monospace', fill: '#00ff00' })
                        .setDepth(100);

                    // restart button (top-right) - use actual canvas width to avoid overlap on small windows
                    const rightX = (this.scale && this.scale.width) ? this.scale.width - 12 : SCREEN_WIDTH - 12;
                    this.restartText = this.add
                        .text(rightX, 12, 'RESTART', { font: '18px monospace', fill: '#ffffff' })
                        .setOrigin(1, 0)
                        .setDepth(200)
                        .setInteractive({ useHandCursor: true });

                    this.restartText.on('pointerdown', () => { this.scene.restart(); });
                    this.restartText.on('pointerover', () => this.restartText.setStyle({ fill: '#ffff66' }));
                    this.restartText.on('pointerout', () => this.restartText.setStyle({ fill: '#ffffff' }));

                            // pause/resume button (top-right, left of restart)
                            this.pauseText = this.add
                                .text(rightX - 100, 12, 'PAUSE', { font: '18px monospace', fill: '#ffffff' })
                                .setOrigin(1, 0)
                                .setDepth(200)
                                .setInteractive({ useHandCursor: true });
                            this.pauseText.on('pointerdown', () => this.togglePause());
                            this.pauseText.on('pointerover', () => this.pauseText.setStyle({ fill: '#ffff66' }));
                            this.pauseText.on('pointerout', () => this.pauseText.setStyle({ fill: '#ffffff' }));

        // ensure physics world running if present
        if (this.physics && this.physics.resume) this.physics.resume();
    }

        togglePause() {
            this.paused = !this.paused;
            if (this.paused) {
                if (this.physics && this.physics.world) this.physics.world.pause();
                if (this.waveTimer) this.waveTimer.paused = true;
                this.pauseText.setText('RESUME');
                // show centered paused label
                if (!this.pausedLabel) this.pausedLabel = this.add.text(SCREEN_WIDTH/2, SCREEN_HEIGHT/2, 'PAUSED', { font: '48px monospace', fill: '#ffffff' }).setOrigin(0.5).setDepth(300);
            } else {
                if (this.physics && this.physics.world) this.physics.world.resume();
                if (this.waveTimer) this.waveTimer.paused = false;
                this.pauseText.setText('PAUSE');
                if (this.pausedLabel) { this.pausedLabel.destroy(); this.pausedLabel = null; }
            }
        }

    update(time, delta) {
        if (this.gameOver) return;

        const dt = delta / 1000;

        // Animate twinkling stars
        if (this._twinkleStars) {
            const t = time / 1000;
            this._twinkleStars.forEach(s => {
                const alpha = s.baseAlpha * (0.4 + 0.6 * Math.abs(Math.sin(t * s.speed + s.phase)));
                s.gfx.clear();
                s.gfx.fillStyle(0xffffff, alpha);
                s.gfx.fillCircle(s.x, s.y, 1.5);
            });
        }

        // player movement and shooting
        if (this.player) {
            // support full 2D movement when enabled (arrow keys), otherwise horizontal via cursors
            if (this.player.fullMovement) {
                const up = this.cursors.up.isDown;
                const down = this.cursors.down.isDown;
                const left = this.cursors.left.isDown;
                const right = this.cursors.right.isDown;
                this.player.move(left, right, up, down);
            } else {
                this.player.move(this.cursors.left.isDown, this.cursors.right.isDown, false, false);
            }
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                const b = this.player.shoot();
                // If the player returns the bullet or has created one, ensure it's tracked in our group
                if (b) this.bullets.add(b);
            }
        }

        // update bullets (manual movement: use _vy)
        this.bullets.getChildren().forEach(b => {
            if (!b) return;
        if (b._vy !== undefined) b.y += b._vy * dt;
        if (b._vx !== undefined) b.x += b._vx * dt;
            if (b.y < -50) b.destroy();
        });

        // update enemy bullets (boss/projectile shots)
        this.enemyBullets.getChildren().forEach(eb => {
            if (!eb) return;
            if (eb._vy !== undefined) eb.y += eb._vy * dt;
            if (eb._vx !== undefined) eb.x += eb._vx * dt;
            // remove if out of bounds
            if (eb.y > SCREEN_HEIGHT + 50 || eb.y < -100 || eb.x < -100 || eb.x > SCREEN_WIDTH + 100) {
                if (eb.destroy) eb.destroy();
            }
        });

        // update enemies (movement and bounce)
        this.enemies.getChildren().forEach(e => {
            if (!e) return;
            if (e._vx !== undefined) e.x += e._vx * dt;
            if (e._vy !== undefined) e.y += e._vy * dt;
            // horizontal bounce off page edges
            const leftBound = 20;
            const rightBound = SCREEN_WIDTH - 20;
            if (e.isBoss) {
                // boss behavior: if chasing, move towards player; otherwise bounce horizontally at the top
                if (this.bossIsChasing && this.player && this.player.sprite) {
                    // simple chase: move horizontally and slowly vertically towards player
                    const px = this.player.sprite.x;
                    const py = this.player.sprite.y;
                    const dx = px - e.x;
                    const dy = py - e.y;
                    // normalize and apply some speed multiplier
                    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                    const chaseSpeed = 120;
                    e.x += (dx / dist) * chaseSpeed * dt;
                    e.y += (dy / dist) * (chaseSpeed * 0.6) * dt;
                } else {
                    if (e.x < leftBound) { e.x = leftBound; e._vx = Math.abs(e._vx); }
                    else if (e.x > rightBound) { e.x = rightBound; e._vx = -Math.abs(e._vx); }
                }
            } else {
                if (e.x < leftBound) { e.x = leftBound; e._vx = Math.abs(e._vx); }
                else if (e.x > rightBound) { e.x = rightBound; e._vx = -Math.abs(e._vx); }
            }
            // destroy enemies when they hit the bottom of the screen and deduct a life
            const bottomBound = SCREEN_HEIGHT - 10;
            if (e.y > bottomBound) {
                // enemy reached bottom: deduct a life
                if (e.destroy) e.destroy();
                this.loseLife();
            }
        });

                // update power-ups (fall like enemies)
                this.powerUps.getChildren().forEach(pu => {
                    if (!pu) return;
                    if (pu._vy !== undefined) pu.y += pu._vy * dt;
                    // if it reaches bottom, destroy it (it missed)
                    if (pu.y > SCREEN_HEIGHT - 10) {
                        if (pu.destroy) pu.destroy();
                    }
                });

        // simple AABB collision bullets <-> enemies
        const enemiesArr = this.enemies.getChildren();
        const bulletsArr = this.bullets.getChildren();
        enemiesArr.forEach(enemy => {
            bulletsArr.forEach(bullet => {
                if (!enemy || !bullet) return;
                const a = enemy.getBounds();
                const bb = bullet.getBounds();
                const collided = !(a.right < bb.left || a.left > bb.right || a.bottom < bb.top || a.top > bb.bottom);
                if (collided) {
                    // remove bullet
                    if (bullet.destroy) bullet.destroy();

                    // if enemy has health, decrement and only destroy when <= 0
                    if (typeof enemy._health === 'number' && enemy._health > 0) {
                        enemy._health -= (bullet._damage || 1);
                        // flash tint to indicate hit
                        if (enemy.setTint) enemy.setTint(0xff9999);
                        this.time.delayedCall(80, () => { if (enemy.clearTint) enemy.clearTint(); }, [], this);
                        if (enemy._health <= 0) {
                            const wasBoss = !!enemy.isBoss;
                            if (enemy.destroy) enemy.destroy();
                            this.score += (wasBoss ? 200 : 10);
                            // update score UI
                            if (this.updateScoreText) this.updateScoreText();
                            this.createExplosion(enemy.x, enemy.y);
                            // camera shake: stronger on boss rounds but tuned smaller
                            try { if (this.cameras && this.cameras.main) this.cameras.main.shake(160, wasBoss ? 0.02 : 0.006); } catch(e) {}
                            // if this enemy was a boss, perform boss-cleanup
                            if (wasBoss) {
                                // stop boss timers
                                if (this.bossShootTimer) { this.bossShootTimer.remove(false); this.bossShootTimer = null; }
                                if (this.bossChaseTimer) { this.bossChaseTimer.remove(false); this.bossChaseTimer = null; }
                                this.bossIsChasing = false;
                                // reset player: disable full movement, move to bottom center, stop velocity
                                if (this.player) {
                                    this.player.disableFullMovement();
                                    if (this.player.sprite) {
                                        this.player.sprite.setVelocity(0,0);
                                        this.player.sprite.x = SCREEN_WIDTH / 2;
                                        this.player.sprite.y = SCREEN_HEIGHT - 50;
                                    }
                                    this.player.doubleShot = false;
                                }
                                // spawn a power-up on boss death
                                this.spawnPowerUp(enemy.x, enemy.y);
                            }
                        }
                    } else {
                        // normal enemy with no health field: destroy immediately
                        if (enemy.destroy) enemy.destroy();
                        this.score += 10;
                        // update score UI
                        if (this.updateScoreText) this.updateScoreText();
                        this.createExplosion(enemy.x, enemy.y);
                        // small camera shake on normal kill
                        try { if (this.cameras && this.cameras.main) this.cameras.main.shake(100, 0.006); } catch(e) {}
                    }
                }
            });
        });
                // check bullets hitting powerups
                this.powerUps.getChildren().forEach(pu => {
                    this.bullets.getChildren().forEach(b => {
                        if (!pu || !b) return;
                        const a = pu.getBounds();
                        const bb = b.getBounds();
                        const hit = !(a.right < bb.left || a.left > bb.right || a.bottom < bb.top || a.top > bb.bottom);
                        if (hit) {
                            if (b.destroy) b.destroy();
                            if (pu.destroy) pu.destroy();
                            // handle power-up types
                            if (pu.powerType === 'blue') {
                                console.log('Blue power-up collected: firing semi-circle');
                                if (this.player && typeof this.player.shootSemiCircleOnce === 'function') {
                                    this.player.shootSemiCircleOnce(13); // fire once
                                }
                            } else {
                                // grant double shot for remainder of round
                                if (this.player) this.player.doubleShot = true;
                                console.log('Power-up collected: doubleShot enabled for round', this.round);
                            }
                            // do not cancel the round power-up schedule here;
                            // rounds after 5 should still spawn two total per round
                        }
                    });
                });

        // player collision with enemies
        if (this.player && this.player.sprite) {
            const p = this.player.sprite.getBounds();
            enemiesArr.forEach(enemy => {
                if (!enemy) return;
                const a = enemy.getBounds();
                const hit = !(a.right < p.left || a.left > p.right || a.bottom < p.top || a.top > p.bottom);
                if (hit) {
                    this.gameOver = true;
                    // stop timers
                    if (this.waveTimer) { this.waveTimer.remove(false); this.waveTimer = null; }
                    this.showGameOver();
                }
            });
            // player collision with enemy bullets
            this.enemyBullets.getChildren().forEach(eb => {
                if (!eb) return;
                const bB = eb.getBounds();
                const pB = this.player.sprite.getBounds();
                const hitB = !(bB.right < pB.left || bB.left > pB.right || bB.bottom < pB.top || bB.top > pB.bottom);
                if (hitB) {
                    if (eb.destroy) eb.destroy();
                    // penalize player: lose a life
                    this.loseLife();
                }
            });
        }

                // debug overlay
        const bCount = this.bullets.getLength();
        const eCount = this.enemies.getLength();
        const firstBullet = this.bullets.getChildren()[0];
        const bInfo = firstBullet ? `bullet vy=${Math.round(firstBullet._vy || 0)}` : 'bullet vy=—';
        const firstEnemy = this.enemies.getChildren()[0];
        const eInfo = firstEnemy ? `enemy vy=${Math.round(firstEnemy._vy || 0)} vx=${Math.round(firstEnemy._vx || 0)}` : 'enemy vy=— vx=—';
        const paused = !!(this.physics && this.physics.world && this.physics.world.isPaused);
                if (this.debugText) this.debugText.setText([`round=${this.round} bullets=${bCount} enemies=${eCount}`, bInfo, eInfo, `physicsPaused=${paused}`]);

                // advance round when wave finished and all enemies cleared
                                if (this.spawnedThisRound >= this.roundTarget && this.enemies.getLength() === 0) {
                                    // small delay before next round
                                    this.spawnedThisRound = 0; // reset for next round
                                    // cleanup power-up timer for completed round
                                    if (this.powerUpTimer) { this.powerUpTimer.remove(false); this.powerUpTimer = null; }
                                    this.powerUpsSpawnedThisRound = 0;
                                    // remove any remaining power-ups and reset player doubleShot
                                    this.powerUps.getChildren().forEach(p => { if (p && p.destroy) p.destroy(); });
                                    if (this.player) this.player.doubleShot = false;
                                    this.round += 1;
                                    this.time.delayedCall(1000, () => this.startWave(), [], this);
                                }
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(50, SCREEN_WIDTH - 50);
        const y = -20;
        const enemyObj = new Enemy(this, x, y);
        // Support both patterns: Enemy returns an object with .sprite, or returns the sprite directly
        const sprite = enemyObj && enemyObj.sprite ? enemyObj.sprite : enemyObj;
        if (sprite) {
            // ensure manual velocity fields exist for consistent movement
                        if (sprite._vx === undefined) sprite._vx = Phaser.Math.Between(-30, 30);
                        if (sprite._vy === undefined) sprite._vy = 80 + Phaser.Math.Between(0, 80);
                        this.enemies.add(sprite);
                        console.log('spawnEnemy -> added', { x: sprite.x, y: sprite.y, _vx: sprite._vx, _vy: sprite._vy });
        }
    }

        // Wave control: start a wave that spawns N enemies over time
            startWave() {
                    // every 5th round is a boss round
                    const isBossRound = (this.round % 5 === 0);
                    if (isBossRound) {
                        this.roundTarget = 1; // only one boss
                        // schedule boosted rounds after this boss
                        this.boostRoundsRemaining = this.postBossBoostRounds;
                    } else {
                        // increase enemies per round by +3 each round: 5, 8, 11, ...
                        let baseTarget = this.enemiesPerRoundBase + (this.round - 1) * 3;
                        // if we have boost rounds remaining, add extra enemies and consume one boost
                        if (this.boostRoundsRemaining > 0) {
                            baseTarget += this.postBossExtraEnemies;
                            this.boostRoundsRemaining -= 1;
                        }
                        this.roundTarget = baseTarget;
                    }
                this.spawnedThisRound = 0;
                // show round label in center
                if (this.roundLabel) { this.roundLabel.destroy(); this.roundLabel = null; }
                    const labelText = isBossRound ? 'BOSS INCOMING' : `ROUND ${this.round}`;
                    this.roundLabel = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, labelText, { font: '48px monospace', fill: '#ffffff' }).setOrigin(0.5).setDepth(200);
                // fade out and remove after 1400ms
                this.tweens.add({ targets: this.roundLabel, alpha: { from: 1, to: 0 }, duration: 1400, ease: 'Power1', onComplete: () => { if (this.roundLabel) { this.roundLabel.destroy(); this.roundLabel = null; } } });

                // spawn enemies every 600ms after a short delay to let the label show
                if (this.waveTimer) { this.waveTimer.remove(false); this.waveTimer = null; }
                        this.time.delayedCall(1400, () => {
                            if (isBossRound) {
                                // spawn the boss after label
                                this.spawnBoss();
                            } else {
                                this.waveTimer = this.time.addEvent({ delay: 600, callback: this.spawnEnemyForWave, callbackScope: this, loop: true });
                            }
                            // configure per-round power-ups:
                            // rounds 1-5 => 1 power-up, rounds 6+ => 2 power-ups
                            if (this.powerUpTimer) { this.powerUpTimer.remove(false); this.powerUpTimer = null; }
                            this.powerUpsTarget = this.round > 5 ? 2 : 1;
                            this.powerUpsSpawnedThisRound = 0;
                            this.powerUpTimer = this.time.addEvent({ delay: 900, callback: this.spawnPowerUpForRound, callbackScope: this, loop: true });
                        }, [], this);

                console.log('Starting round', this.round, 'target', this.roundTarget);
            }

        spawnEnemyForWave() {
            if (this.spawnedThisRound >= this.roundTarget) {
                if (this.waveTimer) { this.waveTimer.remove(false); this.waveTimer = null; }
                return;
            }
            this.spawnedThisRound += 1;
            // spawn slightly above the screen and with random x
            const x = Phaser.Math.Between(50, SCREEN_WIDTH - 50);
            const y = Phaser.Math.Between(-40, -10);
            const enemyObj = new Enemy(this, x, y);
            const sprite = enemyObj && enemyObj.sprite ? enemyObj.sprite : enemyObj;
            if (sprite) {
                // ensure velocities are set by Enemy, but override if missing
                if (sprite._vx === undefined) sprite._vx = Phaser.Math.Between(-60, 60);
                if (sprite._vy === undefined) sprite._vy = 80 + Phaser.Math.Between(0, 80);
                this.enemies.add(sprite);
                                console.log('spawnEnemyForWave ->', { x: sprite.x, y: sprite.y, _vx: sprite._vx, _vy: sprite._vy, spawned: this.spawnedThisRound });
                                // (power-ups are handled by a dedicated timer now)
            }
        }

            loseLife() {
                this.lives = Math.max(0, (this.lives || 0) - 1);
                if (this.livesText) this.livesText.setText(`Lives: ${this.lives}`);
                console.log('Life lost, remaining:', this.lives);
                if (this.lives <= 0) {
                    this.gameOver = true;
                    // stop any wave timers
                    if (this.waveTimer) { this.waveTimer.remove(false); this.waveTimer = null; }
                    this.showGameOver();
                }
            }

            updateScoreText() {
                if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);
            }

            showGameOver() {
                // persist highscore in localStorage
                try {
                    const key = 'space_invaders_highscore';
                    const prev = parseInt(window.localStorage.getItem(key) || '0', 10) || 0;
                    const cur = this.score || 0;
                    const high = Math.max(prev, cur);
                    window.localStorage.setItem(key, String(high));
                    const txt = `GAME OVER\nScore: ${cur}\nHighscore: ${high}`;
                    this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, txt, { font: '28px monospace', fill: '#ffdddd', align: 'center' }).setOrigin(0.5).setDepth(400);
                } catch (e) {
                    console.warn('Could not persist highscore', e);
                    this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, `GAME OVER\nScore: ${this.score}`, { font: '28px monospace', fill: '#ffdddd', align: 'center' }).setOrigin(0.5).setDepth(400);
                }
            }

    createExplosion(x, y) {
        const explosion = new Explosion(this, x, y);
        const s = explosion && explosion.sprite ? explosion.sprite : explosion;
        if (s) this.explosions.add(s);
    }

        spawnBoss() {
            // single large enemy centered at top
            const x = SCREEN_WIDTH / 2;
            const y = -60;
            const enemyObj = new Enemy(this, x, y);
            const sprite = enemyObj && enemyObj.sprite ? enemyObj.sprite : enemyObj;
            if (sprite) {
                // scale up visually and give health
                if (sprite.setScale) sprite.setScale(3);
                sprite._health = 20; // requires many hits
                    sprite._vx = 80; // move across the top
                    sprite._vy = 30; // slow descent into visible area
                    sprite.isBoss = true;
                this.enemies.add(sprite);
                console.log('spawnBoss ->', { x: sprite.x, y: sprite.y, _vx: sprite._vx, _vy: sprite._vy, health: sprite._health });
            // record that we've spawned the boss for this round
            this.spawnedThisRound = (this.roundTarget || 1);
                // boss will shoot periodically while alive
                if (this.bossShootTimer) { this.bossShootTimer.remove(false); this.bossShootTimer = null; }
                this.bossShootTimer = this.time.addEvent({ delay: 900, callback: this.shootBossBullet, callbackScope: this, loop: true });
                // after a delay, enable chase mode and grant player full 2D movement (arrow keys)
                if (this.bossChaseTimer) { this.bossChaseTimer.remove(false); this.bossChaseTimer = null; }
                this.bossChaseTimer = this.time.delayedCall(4500, () => {
                    this.bossIsChasing = true;
                    console.log('Boss is now chasing the player');
                    if (this.player) {
                        this.player.enableFullMovement();
                    }
                }, [], this);
            }
        }

        shootBossBullet() {
            // find current boss sprite (there should be only one large boss)
            const boss = this.enemies.getChildren().find(e => e && e.isBoss);
            if (!boss) return;
            // create a small red triangle texture used for boss bullets (cache per round)
            const key = `boss-bullet-red`;
            if (!this.textures.exists(key)) {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                g.fillStyle(0xff2222, 1);
                // triangle pointing down
                g.beginPath();
                g.moveTo(4, 0);
                g.lineTo(8, 12);
                g.lineTo(0, 12);
                g.closePath();
                g.fillPath();
                g.generateTexture(key, 8, 12);
                g.destroy();
            }
            // spawn bullet at boss position
            const bx = boss.x;
            const by = boss.y + (boss.displayHeight ? boss.displayHeight / 2 : 20);
            const b = this.add.image(bx, by, key);
            b.setDepth(120);
            // aim towards player position
            const targetX = (this.player && this.player.sprite) ? this.player.sprite.x : SCREEN_WIDTH / 2;
            const targetY = (this.player && this.player.sprite) ? this.player.sprite.y : SCREEN_HEIGHT;
            const dx = targetX - bx;
            const dy = targetY - by;
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            const speed = 240;
            b._vx = (dx / dist) * speed;
            b._vy = (dy / dist) * speed;
            // mark as enemy bullet and add to group
            b.isEnemyBullet = true;
            this.enemyBullets.add(b);
        }

            spawnPowerUp(x, y) {
                const size = 28;
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                        // default power-up color: yellow
                        g.fillStyle(0xffff00, 1);
                        g.fillCircle(size/2, size/2, size/2);
                        const key = `powerup-${this.round}`;
                g.generateTexture(key, size, size);
                g.destroy();
                const pu = this.add.image(x, y, key);
                pu.setDepth(150);
                pu._vy = 40; // slowly drop
                        // default type
                        pu.powerType = 'yellow';
                this.powerUps.add(pu);
                console.log('spawnPowerUp ->', { x: x, y: y });
            }

                    spawnPowerUpForRound() {
                        if (this.powerUpsSpawnedThisRound >= this.powerUpsTarget) {
                            if (this.powerUpTimer) { this.powerUpTimer.remove(false); this.powerUpTimer = null; }
                            return;
                        }
                        this.powerUpsSpawnedThisRound += 1;
                        const x = Phaser.Math.Between(60, SCREEN_WIDTH - 60);
                        const y = Phaser.Math.Between(-40, -10);
                            // choose a random type for each spawn: yellow or blue (can repeat)
                            const chooseBlue = Phaser.Math.Between(0, 1) === 0; // 50/50
                            if (chooseBlue) {
                                // create blue power-up texture
                                const size = 28;
                                const g2 = this.make.graphics({ x: 0, y: 0, add: false });
                                g2.fillStyle(0x3399ff, 1);
                                g2.fillCircle(size/2, size/2, size/2);
                                const key2 = `powerup-blue-${this.round}`;
                                g2.generateTexture(key2, size, size);
                                g2.destroy();
                                const pu = this.add.image(x, y, key2).setDepth(150);
                                pu._vy = 40;
                                pu.powerType = 'blue';
                                this.powerUps.add(pu);
                                console.log('spawnPowerUpForRound -> blue', { x, y });
                            } else {
                                this.spawnPowerUp(x, y);
                            }
                    }
}