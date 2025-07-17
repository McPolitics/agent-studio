const redis = require('redis');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const simpleGit = require('simple-git');
const chalk = require('chalk');

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const LLM_SERVER_URL = process.env.LLM_SERVER_URL || 'http://localhost:5000';
const STREAM_NAME = 'agent_tasks';
const CONSUMER_GROUP = 'coder_agents';
const CONSUMER_NAME = `coder_${process.pid}`;
const POLL_INTERVAL = 5000; // 5 seconds

let redisClient;
let git;
let isRunning = true;

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

CODING STANDARDS:
- Use ES6 classes and modules
- Follow Phaser.js best practices
- Include comprehensive comments
- Implement proper error handling
- Use meaningful variable and function names
- Optimize for performance

OUTPUT FORMAT:
For each file, provide:
1. File path (relative to web-game/)
2. Complete file content
3. Brief description of functionality

EXAMPLE OUTPUT:
---FILE: src/scenes/GameScene.js---
[Complete JavaScript code here]
---DESCRIPTION---
Main game scene implementing player movement and collision detection
---END---

TASK: {{TASK_PROMPT}}

Generate complete, production-ready code files.`;

async function connectRedis() {
  try {
    console.log(chalk.blue('🔌 Connecting to Redis...'));
    
    redisClient = redis.createClient({
      url: REDIS_URL,
      socket: {
        reconnectDelayOnFailure: 1000,
        commandTimeout: 5000
      }
    });

    redisClient.on('error', (err) => {
      console.error(chalk.red('Redis error:'), err);
    });

    await redisClient.connect();
    
    // Create consumer group if it doesn't exist
    try {
      await redisClient.xGroupCreate(STREAM_NAME, CONSUMER_GROUP, '0', { MKSTREAM: true });
      console.log(chalk.green(`✅ Created consumer group: ${CONSUMER_GROUP}`));
    } catch (error) {
      if (error.message.includes('BUSYGROUP')) {
        console.log(chalk.gray(`ℹ️  Consumer group ${CONSUMER_GROUP} already exists`));
      } else {
        throw error;
      }
    }
    
    console.log(chalk.green(`✅ Connected as consumer: ${CONSUMER_NAME}`));
    return redisClient;
  } catch (error) {
    throw new Error(`Failed to connect to Redis: ${error.message}`);
  }
}

async function initializeGit() {
  const projectRoot = path.resolve(__dirname, '../');
  git = simpleGit(projectRoot);
  
  try {
    // Check if git repo exists
    await git.status();
    console.log(chalk.green('✅ Git repository initialized'));
  } catch (error) {
    // Initialize git repo if it doesn't exist
    console.log(chalk.blue('📦 Initializing Git repository...'));
    await git.init();
    await git.addConfig('user.name', 'Coder Agent');
    await git.addConfig('user.email', 'coder@agent-studio.ai');
    console.log(chalk.green('✅ Git repository created'));
  }
}

async function callLLM(prompt) {
  try {
    const response = await axios.post(`${LLM_SERVER_URL}/v1/generate`, {
      prompt: prompt,
      max_tokens: 3000,
      temperature: 0.2,
      stop: ['---END---', '\n\nTASK:', '\n\nUSER:']
    }, {
      timeout: 60000
    });

    return response.data.text;
  } catch (error) {
    if (error.response) {
      throw new Error(`LLM Server error: ${error.response.status} - ${error.response.data?.error}`);
    }
    throw new Error(`LLM request failed: ${error.message}`);
  }
}

function parseCodeFiles(llmResponse) {
  const files = [];
  const filePattern = /---FILE:\s*(.+?)---([\s\S]*?)(?:---DESCRIPTION---\s*([\s\S]*?))?(?:---END---|$)/g;
  
  let match;
  while ((match = filePattern.exec(llmResponse)) !== null) {
    const [, filePath, content, description] = match;
    
    files.push({
      path: filePath.trim(),
      content: content.trim(),
      description: description ? description.trim() : ''
    });
  }
  
  if (files.length === 0) {
    // Fallback: treat entire response as single file content
    console.log(chalk.yellow('⚠️  No file markers found, treating as single file'));
    return [{
      path: 'src/generated/output.js',
      content: llmResponse.trim(),
      description: 'Generated code content'
    }];
  }
  
  return files;
}

async function writeFiles(files, taskId) {
  const webGameDir = path.resolve(__dirname, '../web-game');
  const writtenFiles = [];
  
  for (const file of files) {
    try {
      const fullPath = path.join(webGameDir, file.path);
      
      // Ensure directory exists
      await fs.ensureDir(path.dirname(fullPath));
      
      // Write file
      await fs.writeFile(fullPath, file.content, 'utf8');
      
      console.log(chalk.green(`✅ Created: ${file.path}`));
      if (file.description) {
        console.log(chalk.gray(`   ${file.description}`));
      }
      
      writtenFiles.push(file.path);
    } catch (error) {
      console.error(chalk.red(`❌ Failed to write ${file.path}:`), error.message);
    }
  }
  
  return writtenFiles;
}

async function commitChanges(files, taskId, taskTitle) {
  try {
    if (files.length === 0) {
      console.log(chalk.yellow('⚠️  No files to commit'));
      return;
    }
    
    // Add files to git
    for (const file of files) {
      await git.add(path.join('web-game', file));
    }
    
    // Create commit message
    const commitMessage = `[Coder Agent] ${taskTitle}\n\nTask ID: ${taskId}\nFiles: ${files.join(', ')}\nGenerated by: ${CONSUMER_NAME}`;
    
    // Commit changes
    await git.commit(commitMessage);
    
    console.log(chalk.green(`✅ Committed changes for task ${taskId}`));
    console.log(chalk.gray(`   Files: ${files.join(', ')}`));
    
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Failed to commit changes for task ${taskId}:`), error.message);
    return false;
  }
}

async function processTask(task) {
  const taskId = task.id;
  const title = task.title || 'Untitled Task';
  const prompt = task.prompt;
  
  console.log(chalk.blue(`\n🔧 Processing task: ${title}`));
  console.log(chalk.gray(`Task ID: ${taskId}`));
  console.log(chalk.gray(`Prompt: ${prompt.substring(0, 100)}...`));
  
  try {
    // Generate code using LLM
    const systemPrompt = CODER_SYSTEM_PROMPT.replace('{{TASK_PROMPT}}', prompt);
    console.log(chalk.blue('🤖 Generating code...'));
    
    const llmResponse = await callLLM(systemPrompt);
    console.log(chalk.green('✅ Code generated'));
    
    // Parse generated files
    const files = parseCodeFiles(llmResponse);
    console.log(chalk.blue(`📁 Parsed ${files.length} files`));
    
    // Write files to disk
    const writtenFiles = await writeFiles(files, taskId);
    
    if (writtenFiles.length > 0) {
      // Commit to git
      const committed = await commitChanges(writtenFiles, taskId, title);
      
      if (committed) {
        console.log(chalk.green(`✅ Task ${taskId} completed successfully`));
        return { success: true, files: writtenFiles };
      } else {
        console.log(chalk.yellow(`⚠️  Task ${taskId} completed but commit failed`));
        return { success: true, files: writtenFiles, commitFailed: true };
      }
    } else {
      throw new Error('No files were written successfully');
    }
    
  } catch (error) {
    console.error(chalk.red(`❌ Task ${taskId} failed:`), error.message);
    return { success: false, error: error.message };
  }
}

async function pollForTasks() {
  while (isRunning) {
    try {
      // Read from stream
      const messages = await redisClient.xReadGroup(
        CONSUMER_GROUP,
        CONSUMER_NAME,
        { key: STREAM_NAME, id: '>' },
        { COUNT: 1, BLOCK: POLL_INTERVAL }
      );
      
      if (messages && messages.length > 0) {
        for (const stream of messages) {
          for (const message of stream.messages) {
            const task = message.message;
            
            // Only process tasks for this agent role
            if (task.role === 'coder') {
              await processTask(task);
              
              // Acknowledge the message
              await redisClient.xAck(STREAM_NAME, CONSUMER_GROUP, message.id);
            } else {
              // Not for this agent, acknowledge but don't process
              await redisClient.xAck(STREAM_NAME, CONSUMER_GROUP, message.id);
            }
          }
        }
      }
      
    } catch (error) {
      if (isRunning) {
        console.error(chalk.red('❌ Error polling for tasks:'), error.message);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before retrying
      }
    }
  }
}

async function main() {
  try {
    console.log(chalk.blue('🚀 Coder Agent Starting...'));
    console.log(chalk.gray(`Consumer: ${CONSUMER_NAME}`));
    console.log(chalk.gray(`Redis: ${REDIS_URL}`));
    console.log(chalk.gray(`LLM Server: ${LLM_SERVER_URL}`));
    console.log(chalk.gray(`Stream: ${STREAM_NAME}\n`));

    // Initialize connections
    await connectRedis();
    await initializeGit();
    
    console.log(chalk.green('✅ Coder Agent initialized and ready'));
    console.log(chalk.blue('👀 Polling for coder tasks...\n'));
    
    // Start polling
    await pollForTasks();
    
  } catch (error) {
    console.error(chalk.red('❌ Fatal error:'), error.message);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log(chalk.yellow('\n🛑 Shutting down Coder Agent...'));
  isRunning = false;
  
  if (redisClient && redisClient.isOpen) {
    await redisClient.disconnect();
  }
  
  console.log(chalk.green('✅ Coder Agent stopped'));
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (require.main === module) {
  main();
}
