import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    console.log('🚀 BootScene: Loading initial assets...');
    
    // Track boot start
    if (window.trackGameEvent) {
      window.trackGameEvent('boot_scene_start');
    }

    // Create loading bar
    this.createLoadingBar();
    
    // Load essential assets
    this.loadEssentialAssets();
    
    // Set up loading event listeners
    this.setupLoadingEvents();
  }

  createLoadingBar() {
    const { width, height } = this.sys.game.config;
    
    // Loading bar background
    this.loadingBarBg = this.add.rectangle(
      width / 2, 
      height / 2 + 50, 
      400, 
      20, 
      0x333333
    );
    
    // Loading bar fill
    this.loadingBar = this.add.rectangle(
      width / 2 - 200, 
      height / 2 + 50, 
      0, 
      18, 
      0x007acc
    );
    
    // Loading text
    this.loadingText = this.add.text(
      width / 2, 
      height / 2, 
      'Loading...', 
      {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Percentage text
    this.percentText = this.add.text(
      width / 2, 
      height / 2 + 100, 
      '0%', 
      {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#888888',
        align: 'center'
      }
    ).setOrigin(0.5);
  }

  setupLoadingEvents() {
    // Update loading bar progress
    this.load.on('progress', (progress) => {
      this.loadingBar.width = 400 * progress;
      this.percentText.setText(Math.round(progress * 100) + '%');
    });

    // Update loading text for individual files
    this.load.on('fileprogress', (file) => {
      this.loadingText.setText(`Loading: ${file.key}`);
    });

    // Handle loading completion
    this.load.on('complete', () => {
      console.log('✅ BootScene: Assets loaded');
      this.loadingText.setText('Complete!');
      
      // Track boot completion
      if (window.trackGameEvent) {
        window.trackGameEvent('boot_scene_complete');
      }
    });

    // Handle loading errors
    this.load.on('loaderror', (file) => {
      console.error('❌ Failed to load:', file.key);
      this.loadingText.setText('Error loading: ' + file.key);
      this.loadingText.setColor('#ff4444');
      
      // Track loading error
      if (window.trackGameEvent) {
        window.trackGameEvent('boot_load_error', { file: file.key });
      }
    });
  }

  loadEssentialAssets() {
    // Load placeholder assets (these will be replaced by generated content)
    
    // Create simple colored rectangles as placeholder sprites
    this.createPlaceholderAssets();
    
    // You can add actual asset loading here:
    // this.load.image('background', 'assets/backgrounds/main-bg.png');
    // this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 32, frameHeight: 48 });
    // this.load.audio('bgm', 'assets/audio/background-music.mp3');
  }

  createPlaceholderAssets() {
    // Create simple colored textures as placeholders
    const graphics = this.add.graphics();
    
    // Player placeholder (blue rectangle)
    graphics.fillStyle(0x3498db);
    graphics.fillRect(0, 0, 32, 48);
    graphics.generateTexture('player-placeholder', 32, 48);
    
    // Enemy placeholder (red rectangle)
    graphics.clear();
    graphics.fillStyle(0xe74c3c);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('enemy-placeholder', 32, 32);
    
    // Platform placeholder (brown rectangle)
    graphics.clear();
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(0, 0, 128, 32);
    graphics.generateTexture('platform-placeholder', 128, 32);
    
    // Collectible placeholder (yellow circle)
    graphics.clear();
    graphics.fillStyle(0xf1c40f);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('coin-placeholder', 32, 32);
    
    // Background placeholder (gradient)
    graphics.clear();
    graphics.fillGradientStyle(0x2c3e50, 0x34495e, 0x2c3e50, 0x34495e, 1);
    graphics.fillRect(0, 0, 1024, 768);
    graphics.generateTexture('background-placeholder', 1024, 768);
    
    // Clean up graphics object
    graphics.destroy();
  }

  create() {
    console.log('🎮 BootScene: Initialization complete');
    
    // Add a small delay to show the loading screen
    this.time.delayedCall(500, () => {
      // Transition to menu scene
      this.scene.start('MenuScene');
    });
  }
}
