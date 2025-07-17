const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('./config');
const LLMClient = require('./llm-client');
const TaskQueue = require('./task-queue');

// Configuration
const AGENT_ROLE = 'uiux';
const POLL_INTERVAL = config.taskQueue.pollInterval;

let llmClient;
let taskQueue;
let isRunning = true;

// UI/UX Agent System Prompt
const UIUX_SYSTEM_PROMPT = `You are a UI/UX Agent specializing in game interface design and user experience. Your role is to create intuitive, accessible, and visually appealing user interfaces for games.

TECHNICAL STACK:
- Phaser.js 3.x UI elements
- HTML5 Canvas and CSS
- Responsive design principles
- Accessibility standards

SPECIALTIES:
- Game menus and navigation
- HUD (Heads-Up Display) elements
- Settings and options panels
- Game over screens and modals
- Button and control layouts
- Visual feedback systems

UI/UX PRINCIPLES:
- Clear visual hierarchy
- Consistent design language
- Intuitive navigation patterns
- Accessible color schemes
- Responsive layouts
- Smooth animations and transitions

OUTPUT FORMAT:
For each file, provide:
1. File path (relative to web-game/)
2. Complete file content
3. Brief description of functionality

EXAMPLE OUTPUT:
---FILE: src/ui/MenuUI.js---
class MenuUI extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuUI' });
    }
    // ... implementation
}
export default MenuUI;
---END---

Main menu interface with start, settings, and quit buttons
---END---

TASK: {{TASK_PROMPT}}

Generate complete, accessible UI code files.`;

async function initializeAgent() {
  try {
    console.log(chalk.blue('🎨 Initializing UI/UX Agent...'));
    
    // Ensure directories exist
    await config.ensureDirectories();
    
    // Initialize LLM client
    llmClient = new LLMClient();
    
    // Initialize task queue
    taskQueue = new TaskQueue();
    await taskQueue.init();
    
    // Check LLM health
    const isHealthy = await llmClient.checkHealth();
    if (!isHealthy) {
      throw new Error(`LLM provider ${config.llm.provider} is not available`);
    }
    
    console.log(chalk.green(`✅ UI/UX Agent initialized with ${config.llm.provider} LLM`));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize UI/UX Agent:'), error.message);
    return false;
  }
}

async function processTask(task) {
  const startTime = Date.now();
  console.log(chalk.blue(`🎨 Processing task: ${task.epic.title}`));
  
  try {
    // Generate UI code using LLM
    console.log(chalk.blue('🧠 Generating UI code...'));
    const response = await llmClient.generateText(task.epic.prompt, UIUX_SYSTEM_PROMPT, {
      temperature: 0.2,
      maxTokens: 4000
    });
    
    // Parse the response and extract files
    const files = parseGeneratedFiles(response);
    
    if (files.length === 0) {
      throw new Error('No files were generated from the response');
    }
    
    // Save files to the web-game directory
    const savedFiles = await saveGeneratedFiles(files);
    
    const duration = Date.now() - startTime;
    console.log(chalk.green(`✅ Completed task: ${task.epic.title} (${duration}ms)`));
    console.log(chalk.gray(`   Generated ${savedFiles.length} files`));
    
    return {
      success: true,
      files: savedFiles,
      duration: duration
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

async function saveGeneratedFiles(files) {
  const savedFiles = [];
  const webGameDir = config.paths.webGame;
  
  for (const file of files) {
    try {
      // Ensure the file path is safe and within the web-game directory
      const relativePath = file.path.startsWith('src/') ? file.path : `src/${file.path}`;
      const fullPath = path.join(webGameDir, relativePath);
      
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
  console.log(chalk.blue('🎯 UI/UX Agent polling for tasks...'));
  
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
  console.log(chalk.yellow('🛑 Shutting down UI/UX Agent...'));
  isRunning = false;
  
  // Give some time for current task to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(chalk.gray('👋 UI/UX Agent shutdown complete'));
}

async function main() {
  try {
    console.log(chalk.blue('🚀 Starting UI/UX Agent...'));
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
