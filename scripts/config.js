const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Load environment variables
require('dotenv').config();

/**
 * Configuration module for Agent Studio
 * Handles cross-platform compatibility and environment setup
 */
class Config {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isLinux = this.platform === 'linux';
    this.isMac = this.platform === 'darwin';
    
    // Set path separator
    this.pathSep = this.isWindows ? '\\' : '/';
    
    // Set shell command prefix
    this.shellPrefix = this.isWindows ? 'powershell.exe -Command' : 'bash -c';
  }

  // LLM Configuration
  get llm() {
    return {
      provider: process.env.LLM_PROVIDER || 'ollama',
      ollama: {
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama2:7b'
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
      },
      local: {
        url: process.env.LOCAL_LLM_URL || 'http://localhost:5000'
      }
    };
  }

  // Server Configuration
  get server() {
    return {
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || 'localhost'
    };
  }

  // Task Queue Configuration
  get taskQueue() {
    const baseDir = process.env.TASK_QUEUE_DIRECTORY || './tasks';
    return {
      type: process.env.TASK_QUEUE_TYPE || 'file',
      directory: path.resolve(baseDir),
      pollInterval: parseInt(process.env.TASK_POLL_INTERVAL) || 2000,
      maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS) || 3,
      taskTimeout: parseInt(process.env.TASK_TIMEOUT) || 300000
    };
  }

  // File Paths
  get paths() {
    const rootDir = process.cwd();
    return {
      root: rootDir,
      output: path.resolve(process.env.OUTPUT_DIR || './output'),
      gameOutput: path.resolve(process.env.GAME_OUTPUT_DIR || './web-game'),
      assets: path.resolve(process.env.ASSETS_DIR || './web-game/assets'),
      logs: path.resolve(process.env.LOGS_DIR || './logs'),
      tasks: this.taskQueue.directory,
      scripts: path.resolve('./scripts'),
      webGame: path.resolve('./web-game')
    };
  }

  // Agent Configuration
  get agents() {
    return {
      maxConcurrentTasks: this.taskQueue.maxConcurrentTasks,
      taskTimeout: this.taskQueue.taskTimeout,
      imageGeneration: process.env.IMAGE_GENERATION || 'disabled',
      stableDiffusionUrl: process.env.STABLE_DIFFUSION_API_URL || 'http://localhost:7860'
    };
  }

  // Development Settings
  get dev() {
    return {
      debug: process.env.DEBUG === 'true',
      verboseLogging: process.env.VERBOSE_LOGGING === 'true',
      watchMode: process.env.WATCH_MODE === 'true',
      nodeEnv: process.env.NODE_ENV || 'development'
    };
  }

  // Platform-specific helpers
  async ensureDirectories() {
    const dirs = Object.values(this.paths).filter(p => typeof p === 'string');
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.warn(`Warning: Could not create directory ${dir}:`, error.message);
      }
    }
  }

  getShellCommand(command) {
    if (this.isWindows) {
      return `powershell.exe -Command "${command.replace(/"/g, '`"')}"`;
    }
    return command;
  }

  // Get appropriate command for running Python
  getPythonCommand() {
    if (this.isWindows) {
      return 'python';  // Usually 'python' on Windows
    }
    return 'python3';   // Usually 'python3' on Linux/Mac
  }

  // Get appropriate command for running Node.js
  getNodeCommand() {
    return 'node';  // Same on all platforms
  }

  // Get appropriate command for running npm
  getNpmCommand() {
    return this.isWindows ? 'npm.cmd' : 'npm';
  }
}

// Export singleton instance
module.exports = new Config();
