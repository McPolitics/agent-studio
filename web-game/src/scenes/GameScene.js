import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // Game state
    this.player = null;
    this.platforms = null;
    this.enemies = null;
    this.collectibles = null;
    this.cursors = null;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    
    // UI elements
    this.scoreText = null;
    this.livesText = null;
    this.levelText = null;
  }

  create() {
    console.log('🎮 GameScene: Creating game world...');
    
    const { width, height } = this.sys.game.config;
    
    // Track game scene start
    if (window.trackGameEvent) {
      window.trackGameEvent('game_scene_start', { level: this.level });
    }

    // Add background
    this.add.image(width / 2, height / 2, 'background-placeholder').setOrigin(0.5);
    
    // Create game world
    this.createWorld();
    this.createPlayer();
    this.createEnemies();
    this.createCollectibles();
    this.createUI();
    this.setupPhysics();
    this.setupControls();
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  createWorld() {
    // Create platforms group
    this.platforms = this.physics.add.staticGroup();
    
    // Ground platform
    const ground = this.platforms.create(512, 750, 'platform-placeholder');
    ground.setScale(8, 1).refreshBody(); // Make it wider
    
    // Floating platforms
    this.platforms.create(400, 568, 'platform-placeholder');
    this.platforms.create(50, 450, 'platform-placeholder');
    this.platforms.create(750, 420, 'platform-placeholder');
    this.platforms.create(900, 320, 'platform-placeholder');
    this.platforms.create(200, 250, 'platform-placeholder');
    this.platforms.create(600, 180, 'platform-placeholder');
  }

  createPlayer() {
    // Create player sprite
    this.player = this.physics.add.sprite(100, 450, 'player-placeholder');
    
    // Player physics
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.setTint(0x3498db); // Blue tint for visibility
    
    // Player animations (placeholder - will be replaced by generated sprites)
    this.anims.create({
      key: 'left',
      frames: [{ key: 'player-placeholder' }],
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'turn',
      frames: [{ key: 'player-placeholder' }],
      frameRate: 20
    });
    
    this.anims.create({
      key: 'right',
      frames: [{ key: 'player-placeholder' }],
      frameRate: 10,
      repeat: -1
    });
  }

  createEnemies() {
    // Create enemies group
    this.enemies = this.physics.add.group();
    
    // Add some enemies
    const enemy1 = this.enemies.create(400, 500, 'enemy-placeholder');
    const enemy2 = this.enemies.create(750, 350, 'enemy-placeholder');
    const enemy3 = this.enemies.create(200, 180, 'enemy-placeholder');
    
    // Configure enemy physics
    this.enemies.children.entries.forEach(enemy => {
      enemy.setBounce(1);
      enemy.setCollideWorldBounds(true);
      enemy.setVelocity(Phaser.Math.Between(-200, 200), 0);
      enemy.setTint(0xe74c3c); // Red tint
    });
  }

  createCollectibles() {
    // Create collectibles group
    this.collectibles = this.physics.add.group();
    
    // Add collectibles on platforms
    const collectiblePositions = [
      { x: 50, y: 400 },
      { x: 400, y: 520 },
      { x: 750, y: 370 },
      { x: 900, y: 270 },
      { x: 200, y: 200 },
      { x: 600, y: 130 },
      { x: 300, y: 300 },
      { x: 700, y: 500 }
    ];
    
    collectiblePositions.forEach(pos => {
      const collectible = this.collectibles.create(pos.x, pos.y, 'coin-placeholder');
      collectible.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      collectible.setTint(0xf1c40f); // Gold tint
    });
  }

  createUI() {
    // Score
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    // Lives
    this.livesText = this.add.text(16, 50, 'Lives: 3', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    // Level
    this.levelText = this.add.text(16, 84, 'Level: 1', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });

    // Instructions
    this.add.text(this.sys.game.config.width / 2, 50, 
      'Arrow Keys to Move • Space to Jump • Collect coins and avoid enemies!', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ecf0f1',
      align: 'center'
    }).setOrigin(0.5);

    // Pause button
    const pauseButton = this.add.text(this.sys.game.config.width - 80, 20, 'PAUSE', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#3498db'
    }).setInteractive();
    
    pauseButton.on('pointerup', () => this.pauseGame());
  }

  setupPhysics() {
    // Player collides with platforms
    this.physics.add.collider(this.player, this.platforms);
    
    // Enemies collide with platforms
    this.physics.add.collider(this.enemies, this.platforms);
    
    // Player overlaps with collectibles
    this.physics.add.overlap(this.player, this.collectibles, this.collectItem, null, this);
    
    // Player overlaps with enemies
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
  }

  setupControls() {
    // Create cursor keys
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Add WASD keys
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    
    // Add spacebar for jump
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Add escape key for pause
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    
    // Handle escape key
    this.escKey.on('down', () => this.pauseGame());
  }

  update() {
    if (!this.player) return;
    
    // Player movement
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play('left', true);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play('right', true);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play('turn');
    }
    
    // Jumping
    if ((this.cursors.up.isDown || this.wasd.W.isDown || this.spaceKey.isDown) && this.player.body.touching.down) {
      this.player.setVelocityY(-500);
      
      // Track jump
      if (window.trackGameEvent) {
        window.trackGameEvent('player_jump');
      }
    }
    
    // Check if player fell off the world
    if (this.player.y > this.sys.game.config.height) {
      this.loseLife();
    }
    
    // Check win condition
    if (this.collectibles.countActive(true) === 0) {
      this.levelComplete();
    }
  }

  collectItem(player, collectible) {
    collectible.disableBody(true, true);
    
    // Update score
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);
    
    // Track collectible
    if (window.trackGameEvent) {
      window.trackGameEvent('item_collected', { score: this.score });
    }
    
    // Visual feedback
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true
    });
  }

  hitEnemy(player, enemy) {
    // Player hit animation
    this.player.setTint(0xff0000);
    this.time.delayedCall(200, () => {
      this.player.clearTint();
    });
    
    // Knockback effect
    const knockbackX = player.x < enemy.x ? -200 : 200;
    player.setVelocity(knockbackX, -200);
    
    this.loseLife();
    
    // Track enemy hit
    if (window.trackGameEvent) {
      window.trackGameEvent('player_hit_enemy', { lives: this.lives });
    }
  }

  loseLife() {
    this.lives--;
    this.livesText.setText('Lives: ' + this.lives);
    
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      // Respawn player
      this.player.setPosition(100, 450);
      this.player.setVelocity(0, 0);
      
      // Flash lives text
      this.tweens.add({
        targets: this.livesText,
        alpha: 0,
        duration: 100,
        yoyo: true,
        repeat: 3
      });
    }
  }

  levelComplete() {
    console.log('🎉 Level complete!');
    
    // Track level completion
    if (window.trackGameEvent) {
      window.trackGameEvent('level_complete', { 
        level: this.level, 
        score: this.score,
        time: this.time.now
      });
    }
    
    // Show completion message
    const { width, height } = this.sys.game.config;
    const completionText = this.add.text(width / 2, height / 2, 'LEVEL COMPLETE!', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#2ecc71',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);
    
    // Next level or back to menu
    this.time.delayedCall(2000, () => {
      this.level++;
      if (this.level > 3) { // Max 3 levels for demo
        this.gameWin();
      } else {
        this.scene.restart(); // Restart with next level
      }
    });
  }

  gameOver() {
    console.log('💀 Game Over');
    
    // Track game over
    if (window.trackGameEvent) {
      window.trackGameEvent('game_over', { 
        score: this.score, 
        level: this.level,
        time: this.time.now
      });
    }
    
    // Pause physics
    this.physics.pause();
    
    // Player death animation
    this.player.setTint(0xff0000);
    this.player.anims.play('turn');
    
    // Show game over screen
    this.showGameOverScreen();
  }

  gameWin() {
    console.log('🏆 Game Complete!');
    
    // Track game win
    if (window.trackGameEvent) {
      window.trackGameEvent('game_complete', { 
        score: this.score,
        total_levels: this.level - 1
      });
    }
    
    const { width, height } = this.sys.game.config;
    const winText = this.add.text(width / 2, height / 2, 'CONGRATULATIONS!\nYOU WIN!', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);
    
    this.time.delayedCall(3000, () => {
      this.scene.start('MenuScene');
    });
  }

  showGameOverScreen() {
    const { width, height } = this.sys.game.config;
    
    // Dark overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);
    
    // Game over text
    const gameOverText = this.add.text(width / 2, height / 2 - 50, 'GAME OVER', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#e74c3c',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);
    
    // Final score
    const finalScoreText = this.add.text(width / 2, height / 2, `Final Score: ${this.score}`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Restart button
    const restartButton = this.add.text(width / 2, height / 2 + 60, 'RESTART', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#3498db',
      align: 'center'
    }).setOrigin(0.5).setInteractive();
    
    // Menu button
    const menuButton = this.add.text(width / 2, height / 2 + 100, 'MAIN MENU', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#95a5a6',
      align: 'center'
    }).setOrigin(0.5).setInteractive();
    
    // Button interactions
    restartButton.on('pointerup', () => {
      this.score = 0;
      this.lives = 3;
      this.level = 1;
      this.scene.restart();
    });
    
    menuButton.on('pointerup', () => {
      this.scene.start('MenuScene');
    });
  }

  pauseGame() {
    console.log('⏸️ Game paused');
    
    // Track pause
    if (window.trackGameEvent) {
      window.trackGameEvent('game_paused');
    }
    
    this.scene.pause();
    this.scene.launch('PauseScene');
  }
}
