const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const WORLD_WIDTH = 1800;
const WORLD_HEIGHT = 1200;

class HuntScene extends Phaser.Scene {
  constructor() {
    super("HuntScene");
    this.enemies = [];
    this.enemySpawnTimer = 0;
    this.attackCooldown = 0;
    this.ladyAttackCooldown = 0;
    this.damageCooldown = 0;
    this.killCount = 0;
  }

  preload() {}

  create() {
    this.createTextures();
    this.createWorld();
    this.createActors();
    this.createHud();
    this.createInput();

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.delilah, true, 0.12, 0.12);
    this.physics.world.setBounds(40, 40, WORLD_WIDTH - 80, WORLD_HEIGHT - 80);

    this.spawnEnemyWave(10);
  }

  createTextures() {
    this.makeCircleTexture("shadow", 40, "#000000", 0.28);
    this.makeCircleTexture("enemy", 24, "#5b1515", 1, "#9e332b", 3);
    this.makeCircleTexture("enemyElite", 30, "#311010", 1, "#d34a3d", 4);
    this.makeCircleTexture("lady", 42, "#22201e", 1, "#c7c0b0", 3);
    this.makeCircleTexture("spark", 8, "#e4d19a", 1);

    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x1c1712, 1);
    g.fillRoundedRect(6, 14, 28, 32, 7);
    g.fillStyle(0xa33322, 1);
    g.fillCircle(20, 11, 10);
    g.fillStyle(0x1a0c08, 1);
    g.fillRect(11, 2, 18, 12);
    g.fillStyle(0x090909, 1);
    g.fillRect(18, 38, 4, 22);
    g.generateTexture("delilah", 40, 64);
    g.clear();

    g.lineStyle(7, 0x050505, 1);
    g.beginPath();
    g.moveTo(6, 38);
    g.lineTo(78, 6);
    g.strokePath();
    g.fillStyle(0x050505, 1);
    g.fillTriangle(76, 0, 96, 2, 82, 18);
    g.generateTexture("spearArc", 104, 52);
    g.clear();

    g.fillStyle(0x211a12, 1);
    g.fillRect(0, 0, 72, 34);
    g.lineStyle(2, 0x5a452d, 1);
    g.strokeRect(1, 1, 70, 32);
    g.generateTexture("scrap", 72, 34);
    g.clear();
  }

  makeCircleTexture(key, radius, fill, alpha = 1, stroke = null, strokeWidth = 0) {
    const size = radius * 2 + strokeWidth * 2 + 4;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    if (stroke) {
      g.lineStyle(strokeWidth, Phaser.Display.Color.HexStringToColor(stroke).color, alpha);
    }
    g.fillStyle(Phaser.Display.Color.HexStringToColor(fill).color, alpha);
    g.fillCircle(size / 2, size / 2, radius);
    if (stroke) {
      g.strokeCircle(size / 2, size / 2, radius);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }

  createWorld() {
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x17120d);

    for (let i = 0; i < 180; i += 1) {
      const x = Phaser.Math.Between(80, WORLD_WIDTH - 80);
      const y = Phaser.Math.Between(80, WORLD_HEIGHT - 80);
      const color = Phaser.Math.RND.pick([0x2a2118, 0x35271a, 0x100f0d, 0x4a3822]);
      const width = Phaser.Math.Between(8, 46);
      const height = Phaser.Math.Between(3, 16);
      const stain = this.add.rectangle(x, y, width, height, color, Phaser.Math.FloatBetween(0.35, 0.75));
      stain.rotation = Phaser.Math.FloatBetween(-0.6, 0.6);
    }

    this.boundaries = this.physics.add.staticGroup();
    this.makeBoundary(WORLD_WIDTH / 2, 15, WORLD_WIDTH, 30);
    this.makeBoundary(WORLD_WIDTH / 2, WORLD_HEIGHT - 15, WORLD_WIDTH, 30);
    this.makeBoundary(15, WORLD_HEIGHT / 2, 30, WORLD_HEIGHT);
    this.makeBoundary(WORLD_WIDTH - 15, WORLD_HEIGHT / 2, 30, WORLD_HEIGHT);

    for (let i = 0; i < 18; i += 1) {
      const x = Phaser.Math.Between(140, WORLD_WIDTH - 140);
      const y = Phaser.Math.Between(130, WORLD_HEIGHT - 130);
      const scrap = this.physics.add.staticImage(x, y, "scrap");
      scrap.setRotation(Phaser.Math.FloatBetween(-0.8, 0.8));
      scrap.refreshBody();
      this.boundaries.add(scrap);
    }

    this.add.text(64, 58, "LADY & DELILAH: THE HUNT", {
      fontFamily: "Georgia",
      fontSize: "30px",
      color: "#d8c59d",
      stroke: "#000000",
      strokeThickness: 5,
    }).setDepth(3);
  }

  makeBoundary(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0x050403, 0.98);
    this.physics.add.existing(wall, true);
    this.boundaries.add(wall);
  }

  createActors() {
    this.delilahStats = {
      maxHealth: 100,
      health: 100,
      xp: 0,
      level: 1,
      xpToLevel: 60,
      attackDamage: 34,
    };

    this.delilahShadow = this.add.image(0, 0, "shadow").setScale(0.8, 0.42).setDepth(2);
    this.delilah = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "delilah");
    this.delilah.setDepth(6);
    this.delilah.setCollideWorldBounds(true);
    this.delilah.body.setSize(28, 36).setOffset(6, 22);

    this.ladyShadow = this.add.image(0, 0, "shadow").setScale(1.22, 0.52).setDepth(2);
    this.lady = this.physics.add.sprite(this.delilah.x - 80, this.delilah.y + 44, "lady");
    this.lady.setDepth(5);
    this.lady.setCollideWorldBounds(true);
    this.lady.body.setCircle(35, 5, 5);

    this.delilah = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "delilah");
this.delilah.setScale(1.0); // 👈 ADD THIS LINE
this.delilah.setDepth(6);
this.delilah.setCollideWorldBounds(true);
this.delilah.body.setSize(28, 36).setOffset(6, 22);

    this.physics.add.collider(this.delilah, this.boundaries);
    this.physics.add.collider(this.lady, this.boundaries);
    this.physics.add.collider(this.delilah, this.lady);
  }

  createInput() {
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.input.on("pointerdown", (pointer) => {
      if (this.attackCooldown > 0 || this.delilahStats.health <= 0) {
        return;
      }
      const world = pointer.positionToCamera(this.cameras.main);
      this.performSpearAttack(world.x, world.y);
    });
  }

  createHud() {
    this.hud = this.add.container(18, 18).setScrollFactor(0).setDepth(50);
    this.add.rectangle(0, 0, 390, 116, 0x070605, 0.78).setOrigin(0).setScrollFactor(0).setDepth(49);

    this.healthBack = this.add.rectangle(28, 30, 240, 18, 0x2b1110).setOrigin(0, 0.5);
    this.healthFill = this.add.rectangle(28, 30, 240, 18, 0xb42d25).setOrigin(0, 0.5);
    this.xpBack = this.add.rectangle(28, 64, 240, 12, 0x161b1c).setOrigin(0, 0.5);
    this.xpFill = this.add.rectangle(28, 64, 0, 12, 0xb89b4a).setOrigin(0, 0.5);
    this.hudText = this.add.text(28, 82, "", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#efe1bd",
    });
    this.objectiveText = this.add.text(286, 24, "", {
      fontFamily: "Georgia",
      fontSize: "15px",
      color: "#b9a681",
      lineSpacing: 4,
    });

    this.hud.add([this.healthBack, this.healthFill, this.xpBack, this.xpFill, this.hudText, this.objectiveText]);
  }

  spawnEnemyWave(count) {
    for (let i = 0; i < count; i += 1) {
      this.spawnEnemy();
    }
  }

  spawnEnemy() {
    const side = Phaser.Math.Between(0, 3);
    const margin = 120;
    const x = side === 0 ? margin : side === 1 ? WORLD_WIDTH - margin : Phaser.Math.Between(margin, WORLD_WIDTH - margin);
    const y = side === 2 ? margin : side === 3 ? WORLD_HEIGHT - margin : Phaser.Math.Between(margin, WORLD_HEIGHT - margin);
    const elite = Phaser.Math.Between(1, 6) === 1;

    const enemy = this.physics.add.sprite(x, y, elite ? "enemyElite" : "enemy");
    enemy.setDepth(4);
    enemy.setCollideWorldBounds(true);
    enemy.body.setCircle(elite ? 27 : 22, 3, 3);
    enemy.maxHealth = elite ? 88 : 52;
    enemy.health = enemy.maxHealth;
    enemy.speed = elite ? 78 : 96;
    enemy.damage = elite ? 14 : 9;
    enemy.xpValue = elite ? 34 : 18;
    enemy.nextWander = 0;
    enemy.wander = new Phaser.Math.Vector2();
    enemy.shadow = this.add.image(enemy.x, enemy.y + 14, "shadow").setScale(elite ? 0.82 : 0.64, 0.3).setDepth(2);
    enemy.barBack = this.add.rectangle(enemy.x, enemy.y - 28, 34, 5, 0x1a0807).setDepth(8);
    enemy.barFill = this.add.rectangle(enemy.x - 17, enemy.y - 28, 34, 5, 0xd54d3f).setOrigin(0, 0.5).setDepth(9);

    this.physics.add.collider(enemy, this.boundaries);
    this.physics.add.collider(enemy, this.delilah, () => this.hurtDelilah(enemy.damage));
    this.physics.add.collider(enemy, this.lady);
    this.enemies.push(enemy);
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.ladyAttackCooldown = Math.max(0, this.ladyAttackCooldown - delta);
    this.damageCooldown = Math.max(0, this.damageCooldown - delta);
    this.enemySpawnTimer += delta;

    if (this.delilahStats.health > 0) {
      this.updateDelilah();
      this.updateLady(delta);
      this.updateEnemies(time, dt);
      this.updateCombatPrompts(delta);
    } else {
      this.delilah.setVelocity(0, 0);
      this.lady.setVelocity(0, 0);
    }

    if (this.enemySpawnTimer > 4600 && this.enemies.length < 18 && this.delilahStats.health > 0) {
      this.enemySpawnTimer = 0;
      this.spawnEnemy();
    }

    this.updateShadowsAndBars();
    this.updateHud();
  }

  updateDelilah() {
    const velocity = new Phaser.Math.Vector2(0, 0);
    if (this.keys.left.isDown) velocity.x -= 1;
    if (this.keys.right.isDown) velocity.x += 1;
    if (this.keys.up.isDown) velocity.y -= 1;
    if (this.keys.down.isDown) velocity.y += 1;

    velocity.normalize().scale(220 + this.delilahStats.level * 6);
    this.delilah.setVelocity(velocity.x, velocity.y);

    if (velocity.x !== 0) {
      this.delilah.setFlipX(velocity.x < 0);
    }
  }

  updateLady(delta) {
    const targetEnemy = this.findNearestEnemy(this.lady.x, this.lady.y, 250);
    const followDistance = Phaser.Math.Distance.Between(this.lady.x, this.lady.y, this.delilah.x, this.delilah.y);
    const target = targetEnemy && followDistance < 430 ? targetEnemy : this.delilah;
    const desiredRange = target === this.delilah ? 82 : 34;
    const distance = Phaser.Math.Distance.Between(this.lady.x, this.lady.y, target.x, target.y);

    if (distance > desiredRange) {
      this.physics.moveToObject(this.lady, target, target === this.delilah ? 190 : 250);
    } else {
      this.lady.setVelocity(0, 0);
    }

    if (this.lady.body.velocity.x !== 0) {
      this.lady.setFlipX(this.lady.body.velocity.x < 0);
    }

    if (targetEnemy && Phaser.Math.Distance.Between(this.lady.x, this.lady.y, targetEnemy.x, targetEnemy.y) < 72) {
      this.ladyAttack(targetEnemy);
    }
  }

  updateEnemies(time, dt) {
    this.enemies.forEach((enemy) => {
      const distanceToDelilah = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.delilah.x, this.delilah.y);
      if (distanceToDelilah < 620) {
        this.physics.moveToObject(enemy, this.delilah, enemy.speed);
      } else {
        if (time > enemy.nextWander) {
          enemy.nextWander = time + Phaser.Math.Between(900, 1800);
          enemy.wander.set(Phaser.Math.FloatBetween(-1, 1), Phaser.Math.FloatBetween(-1, 1)).normalize();
        }
        enemy.setVelocity(enemy.wander.x * enemy.speed * 0.45, enemy.wander.y * enemy.speed * 0.45);
      }

      enemy.rotation += (enemy.body.velocity.x * 0.0007 + enemy.body.velocity.y * 0.0003) * dt * 60;
    });
  }

  updateCombatPrompts(delta) {
    this.children.list
      .filter((child) => child.isFloatingText)
      .forEach((child) => {
        child.y -= 0.035 * delta;
        child.alpha -= 0.0018 * delta;
        if (child.alpha <= 0) child.destroy();
      });
  }

  performSpearAttack(targetX, targetY) {
    this.attackCooldown = 360;
    const angle = Phaser.Math.Angle.Between(this.delilah.x, this.delilah.y, targetX, targetY);
    const hitX = this.delilah.x + Math.cos(angle) * 58;
    const hitY = this.delilah.y + Math.sin(angle) * 58;

    const arc = this.add.image(this.delilah.x, this.delilah.y, "spearArc");
    arc.setOrigin(0.12, 0.5);
    arc.setRotation(angle);
    arc.setDepth(12);
    arc.setTint(0x050505);
    this.tweens.add({
      targets: arc,
      alpha: 0,
      scaleX: 1.25,
      duration: 145,
      onComplete: () => arc.destroy(),
    });

    this.enemies.slice().forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(hitX, hitY, enemy.x, enemy.y);
      const angleToEnemy = Phaser.Math.Angle.Between(this.delilah.x, this.delilah.y, enemy.x, enemy.y);
      const facing = Math.abs(Phaser.Math.Angle.Wrap(angle - angleToEnemy));
      if (distance < 78 && facing < 0.95) {
        this.damageEnemy(enemy, this.delilahStats.attackDamage, "spear");
      }
    });
  }

  ladyAttack(enemy) {
    if (this.ladyAttackCooldown > 0) {
      return;
    }
    this.ladyAttackCooldown = 620;
    this.damageEnemy(enemy, 22 + this.delilahStats.level * 3, "lady");
    this.cameras.main.shake(70, 0.002);
  }

  damageEnemy(enemy, amount, source) {
    if (!enemy.active) return;

    enemy.health -= amount;
    enemy.setTint(source === "lady" ? 0xd9d2bf : 0xede1a6);
    this.time.delayedCall(90, () => {
      if (enemy.active) enemy.clearTint();
    });

    this.spawnFloatingText(enemy.x, enemy.y - 34, `-${Math.round(amount)}`, source === "lady" ? "#d8d1c6" : "#f1dfa4");

    if (enemy.health <= 0) {
      this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    this.killCount += 1;
    this.gainXp(enemy.xpValue);
    this.addDeathBurst(enemy.x, enemy.y);

    if (enemy.shadow) enemy.shadow.destroy();
    if (enemy.barBack) enemy.barBack.destroy();
    if (enemy.barFill) enemy.barFill.destroy();

    this.enemies = this.enemies.filter((other) => other !== enemy);
    enemy.destroy();
  }

  addDeathBurst(x, y) {
    for (let i = 0; i < 7; i += 1) {
      const spark = this.add.image(x, y, "spark").setDepth(11).setTint(Phaser.Math.RND.pick([0x7c201c, 0xc7a54c, 0x2a2a27]));
      this.tweens.add({
        targets: spark,
        x: x + Phaser.Math.Between(-44, 44),
        y: y + Phaser.Math.Between(-36, 36),
        alpha: 0,
        duration: Phaser.Math.Between(260, 520),
        onComplete: () => spark.destroy(),
      });
    }
  }

  gainXp(amount) {
    this.delilahStats.xp += amount;
    this.spawnFloatingText(this.delilah.x, this.delilah.y - 60, `+${amount} XP`, "#d5b45a");

    while (this.delilahStats.xp >= this.delilahStats.xpToLevel) {
      this.delilahStats.xp -= this.delilahStats.xpToLevel;
      this.delilahStats.level += 1;
      this.delilahStats.xpToLevel = Math.floor(this.delilahStats.xpToLevel * 1.45);
      this.delilahStats.maxHealth += 18;
      this.delilahStats.health = this.delilahStats.maxHealth;
      this.delilahStats.attackDamage += 7;
      this.spawnFloatingText(this.delilah.x, this.delilah.y - 88, `LEVEL ${this.delilahStats.level}`, "#f2d16b");
      this.cameras.main.flash(220, 184, 155, 70);
    }
  }

  hurtDelilah(amount) {
    if (this.damageCooldown > 0 || this.delilahStats.health <= 0) {
      return;
    }
    this.damageCooldown = 640;
    this.delilahStats.health = Math.max(0, this.delilahStats.health - amount);
    this.delilah.setTint(0xf1a09a);
    this.time.delayedCall(120, () => this.delilah.clearTint());
    this.cameras.main.shake(100, 0.003);

    if (this.delilahStats.health <= 0) {
      this.add.text(this.delilah.x - 210, this.delilah.y - 108, "THE WASTELAND TAKES ITS DUE", {
        fontFamily: "Georgia",
        fontSize: "30px",
        color: "#d8c59d",
        stroke: "#000000",
        strokeThickness: 6,
      }).setDepth(60);
    }
  }

  findNearestEnemy(x, y, range) {
    let nearest = null;
    let bestDistance = range;
    this.enemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = enemy;
      }
    });
    return nearest;
  }

  spawnFloatingText(x, y, text, color) {
    const label = this.add.text(x, y, text, {
      fontFamily: "Georgia",
      fontSize: "18px",
      color,
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(40);
    label.isFloatingText = true;
  }

  updateShadowsAndBars() {
    this.delilahShadow.setPosition(this.delilah.x, this.delilah.y + 24);
    this.ladyShadow.setPosition(this.lady.x, this.lady.y + 17);

    this.enemies.forEach((enemy) => {
      if (enemy.shadow) enemy.shadow.setPosition(enemy.x, enemy.y + 14);
      if (enemy.barBack) enemy.barBack.setPosition(enemy.x, enemy.y - 28);
      if (enemy.barFill) {
        enemy.barFill.setPosition(enemy.x - 17, enemy.y - 28);
        enemy.barFill.width = 34 * Phaser.Math.Clamp(enemy.health / enemy.maxHealth, 0, 1);
      }
    });
  }

  updateHud() {
    const healthPercent = Phaser.Math.Clamp(this.delilahStats.health / this.delilahStats.maxHealth, 0, 1);
    const xpPercent = Phaser.Math.Clamp(this.delilahStats.xp / this.delilahStats.xpToLevel, 0, 1);
    this.healthFill.width = 240 * healthPercent;
    this.xpFill.width = 240 * xpPercent;
    this.hudText.setText(`Health ${Math.ceil(this.delilahStats.health)}/${this.delilahStats.maxHealth}   XP ${this.delilahStats.xp}/${this.delilahStats.xpToLevel}   Level ${this.delilahStats.level}`);
    this.objectiveText.setText(`Kills: ${this.killCount}\nLady hunts near you\nBlack spear ready${this.attackCooldown > 0 ? "..." : ""}`);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#090806",
  pixelArt: false,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: HuntScene,
};

new Phaser.Game(config);
