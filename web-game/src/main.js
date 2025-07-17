import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#2c3e50',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 320,
      height: 240
    },
    max: {
      width: 1920,
      height: 1080
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false // Set to true for development
    }
  },
  render: {
    antialias: true,
    pixelArt: false
  },
  dom: {
    createContainer: true
  },
  scene: [BootScene, MenuScene, GameScene]
};

class AgentStudioGame {
  constructor() {
    this.game = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('🎮 Initializing Agent Studio Game...');
      
      // Track game initialization
      if (window.trackGameEvent) {
        window.trackGameEvent('game_init_start');
      }

      // Create Phaser game instance
      this.game = new Phaser.Game(config);
      
      // Add global error handling for Phaser
      this.game.events.on('ready', () => {
        console.log('✅ Phaser game ready');
        this.isInitialized = true;
        
        // Hide loading screen
        if (window.hideLoading) {
          window.hideLoading();
        }
        
        // Track successful initialization
        if (window.trackGameEvent) {
          window.trackGameEvent('game_init_success', {
            phaser_version: Phaser.VERSION,
            renderer: this.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas'
          });
        }
      });

      // Handle Phaser errors
      this.game.events.on('error', (error) => {
        console.error('Phaser error:', error);
        
        if (window.showError) {
          window.showError('Game engine error: ' + error.message);
        }
        
        // Report to Sentry
        if (window.Sentry) {
          window.Sentry.captureException(error);
        }
      });

      // Add game to window for debugging
      if (import.meta.env.DEV) {
        window.game = this.game;
        console.log('🔧 Game instance available as window.game for debugging');
      }

    } catch (error) {
      console.error('❌ Failed to initialize game:', error);
      
      if (window.showError) {
        window.showError('Failed to initialize game: ' + error.message);
      }
      
      // Report to Sentry
      if (window.Sentry) {
        window.Sentry.captureException(error);
      }
    }
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
      this.isInitialized = false;
    }
  }

  // Public API for external control
  pause() {
    if (this.game && this.game.scene.isActive()) {
      this.game.scene.pause();
    }
  }

  resume() {
    if (this.game && this.game.scene.isPaused()) {
      this.game.scene.resume();
    }
  }

  getScene(key) {
    return this.game ? this.game.scene.getScene(key) : null;
  }
}

// Initialize game when DOM is ready
const gameInstance = new AgentStudioGame();

// Auto-start game
document.addEventListener('DOMContentLoaded', () => {
  gameInstance.init();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    gameInstance.pause();
    if (window.trackGameEvent) {
      window.trackGameEvent('game_paused', { reason: 'page_hidden' });
    }
  } else {
    gameInstance.resume();
    if (window.trackGameEvent) {
      window.trackGameEvent('game_resumed', { reason: 'page_visible' });
    }
  }
});

// Handle window focus/blur
window.addEventListener('blur', () => {
  gameInstance.pause();
});

window.addEventListener('focus', () => {
  gameInstance.resume();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.trackGameEvent) {
    window.trackGameEvent('game_unload');
  }
  gameInstance.destroy();
});

// Export for external access
export default gameInstance;
