const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('./config');
const LLMClient = require('./llm-client');
const TaskQueue = require('./task-queue');
const ProjectManager = require('./project-manager');

// Configuration
const AGENT_ROLE = 'coder';
const POLL_INTERVAL = config.taskQueue.pollInterval;

let llmClient;
let taskQueue;
let projectManager;
let isRunning = true;
let currentProject = null;

// Coder Agent System Prompt
const CODER_SYSTEM_PROMPT = `You are a Coder Agent specializing in Phaser.js game development. Your role is to implement game logic, scenes, and interactive systems based on provided specifications.

TECHNICAL STACK:
- Phaser.js 3.x (latest)
- Vite for bundling
- ES6+ JavaScript
- Modern Web APIs

FILE STRUCTURE:
- src/scenes/ - Game scenes (GameScene.js, MenuScene.js, etc.)
- src/entities/ - Game objects and entities
- src/systems/ - Game systems (physics, audio, input)
- src/utils/ - Utility functions
- src/config/ - Game configuration
- src/ui/ - User interface components

CODING STANDARDS:
- Use ES6 classes and modules
- Follow Phaser.js best practices
- Include comprehensive comments
- Implement proper error handling
- Use meaningful variable and function names
- Optimize for performance
- Consider asset loading from ../assets/ directory

CURRENT PROJECT CONTEXT:
- Project: {{PROJECT_NAME}}
- Output Directory: {{OUTPUT_DIR}}
- Assets Directory: {{ASSETS_DIR}}

OUTPUT FORMAT:
For each file, provide:
1. File path (relative to src/)
2. Complete file content
3. Brief description of functionality

EXAMPLE OUTPUT:
---FILE: scenes/GameScene.js---
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    // ... implementation
}
export default GameScene;
---END---

Main game scene implementing player movement and collision detection
---END---

TASK: {{TASK_PROMPT}}

Generate complete, production-ready code files that integrate well with the existing project structure.`;

async function initializeAgent() {
  try {
    console.log(chalk.blue('🔧 Initializing Coder Agent...'));
    
    // Initialize project manager
    projectManager = new ProjectManager();
    
    // Get active project
    currentProject = await projectManager.getActiveProject();
    if (!currentProject) {
      console.log(chalk.yellow('⚠️  No active project found. Agent will use global task queue.'));
      console.log(chalk.cyan('💡 Use "director activate <projectId>" to set an active project.'));
    } else {
      console.log(chalk.green(`📁 Working with project: ${currentProject.name}`));
    }
    
    // Initialize task queue (project-specific if available)
    const queuePath = currentProject ? currentProject.folders.root : null;
    taskQueue = new TaskQueue(queuePath);
    await taskQueue.init();
    
    // Ensure directories exist
    await config.ensureDirectories();
    if (currentProject) {
      await fs.ensureDir(currentProject.folders.src);
      await fs.ensureDir(currentProject.folders.assets);
    }
    
    // Initialize LLM client
    llmClient = new LLMClient();
    
    // Check LLM health
    const isHealthy = await llmClient.checkHealth();
    if (!isHealthy) {
      throw new Error(`LLM provider ${config.llm.provider} is not available`);
    }
    
    console.log(chalk.green(`✅ Coder Agent initialized with ${config.llm.provider} LLM`));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize Coder Agent:'), error.message);
    return false;
  }
}

async function processTask(task) {
  const startTime = Date.now();
  console.log(chalk.blue(`🔨 Processing task: ${task.epic.title}`));
  
  try {
    // Determine output directory
    const outputDir = task.projectPath 
      ? path.join(task.projectPath, 'src')
      : (currentProject ? currentProject.folders.src : config.paths.gameOutput);
    
    const assetsDir = task.projectPath
      ? path.join(task.projectPath, 'assets')
      : (currentProject ? currentProject.folders.assets : config.paths.assets);
    
    // Prepare the prompt with project context
    let prompt = CODER_SYSTEM_PROMPT
      .replace('{{TASK_PROMPT}}', task.epic.prompt)
      .replace('{{PROJECT_NAME}}', task.projectId || currentProject?.name || 'Unknown')
      .replace('{{OUTPUT_DIR}}', outputDir)
      .replace('{{ASSETS_DIR}}', assetsDir);
    
    // Generate code using LLM
    console.log(chalk.blue('🧠 Generating code...'));
    const response = await llmClient.generateText(task.epic.prompt, CODER_SYSTEM_PROMPT, {
      temperature: 0.2,
      maxTokens: 4000
    });
    
    // Parse the response and extract files
    const files = parseGeneratedFiles(response);
    
    if (files.length === 0) {
      throw new Error('No files were generated from the response');
    }
    
    // Save files to the appropriate project directory
    const savedFiles = await saveGeneratedFiles(files, outputDir);
    
    const duration = Date.now() - startTime;
    console.log(chalk.green(`✅ Completed task: ${task.epic.title} (${duration}ms)`));
    console.log(chalk.gray(`   Generated ${savedFiles.length} files`));
    
    return {
      success: true,
      files: savedFiles,
      duration: duration,
      outputDir: outputDir
    };
    
  } catch (error) {
    console.error(chalk.red(`❌ Task failed: ${task.epic.title}`), error.message);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

function parseGeneratedFiles(response) {
  const files = [];
  const filePattern = /---FILE:\s*(.+?)---([\s\S]*?)---END---/g;
  
  let match;
  while ((match = filePattern.exec(response)) !== null) {
    const filePath = match[1].trim();
    const content = match[2].trim();
    
    files.push({
      path: filePath,
      content: content
    });
  }
  
  return files;
}

async function saveGeneratedFiles(files, outputDir) {
  const savedFiles = [];
  
  for (const file of files) {
    try {
      // Ensure the file path is safe and relative to src/
      const relativePath = file.path.startsWith('src/') ? file.path.substring(4) : file.path;
      const fullPath = path.join(outputDir, relativePath);
      
      // Ensure the directory exists
      await fs.ensureDir(path.dirname(fullPath));
      
      // Write the file
      await fs.writeFile(fullPath, file.content, 'utf8');
      
      console.log(chalk.green(`💾 Saved: ${relativePath}`));
      savedFiles.push({
        path: relativePath,
        fullPath: fullPath,
        size: file.content.length
      });
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to save ${file.path}:`), error.message);
    }
  }
  
  return savedFiles;
}

async function pollForTasks() {
  console.log(chalk.blue('🎯 Coder Agent polling for tasks...'));
  
  while (isRunning) {
    try {
      // Get next task for this agent role
      const task = await taskQueue.dequeue(AGENT_ROLE);
      
      if (task) {
        // Process the task
        const result = await processTask(task);
        
        if (result.success) {
          await taskQueue.completeTask(task.id, result);
        } else {
          await taskQueue.failTask(task.id, new Error(result.error));
        }
      }
      
      // Wait before polling again
      if (isRunning) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error in polling loop:'), error.message);
      
      // Wait a bit longer on error to avoid spam
      if (isRunning) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL * 2));
      }
    }
  }
}

async function shutdown() {
  console.log(chalk.yellow('🛑 Shutting down Coder Agent...'));
  isRunning = false;
  
  // Give some time for current task to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(chalk.gray('👋 Coder Agent shutdown complete'));
}

async function main() {
  try {
    console.log(chalk.blue('🚀 Starting Coder Agent...'));
    console.log(chalk.gray(`Platform: ${config.platform}`));
    console.log(chalk.gray(`LLM Provider: ${config.llm.provider}`));
    console.log(chalk.gray(`Poll Interval: ${POLL_INTERVAL}ms\n`));
    
    // Initialize the agent
    const initialized = await initializeAgent();
    if (!initialized) {
      process.exit(1);
    }
    
    // Start polling for tasks
    await pollForTasks();
    
  } catch (error) {
    console.error(chalk.red('❌ Fatal error:'), error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Received SIGINT, shutting down gracefully...'));
  shutdown().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 Received SIGTERM, shutting down gracefully...'));
  shutdown().then(() => process.exit(0));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('💥 Uncaught Exception:'), error);
  shutdown().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('💥 Unhandled Rejection at:'), promise, 'reason:', reason);
  shutdown().then(() => process.exit(1));
});

if (require.main === module) {
  main();
}
