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
const CONSUMER_GROUP = 'uiux_agents';
const CONSUMER_NAME = `uiux_${process.pid}`;
const POLL_INTERVAL = 5000; // 5 seconds

let redisClient;
let git;
let isRunning = true;

// UI/UX Agent System Prompt
const UIUX_SYSTEM_PROMPT = `You are a UI/UX Agent specializing in game interface design and user experience optimization. Your role is to create intuitive, visually appealing, and functional user interfaces for games.

EXPERTISE AREAS:
- Game UI/UX patterns and best practices
- Menu systems and navigation flows
- HUD (Heads-Up Display) design
- Responsive layout design
- Accessibility considerations
- User interaction patterns
- Visual hierarchy and information architecture

TECHNICAL STACK:
- HTML5 for structure
- CSS3 with modern features (Grid, Flexbox, Animations)
- JavaScript for interactivity
- Phaser.js UI integration
- JSON configuration files for UI data

OUTPUT FORMATS:
1. HTML prototypes with embedded CSS/JS
2. CSS stylesheets for game UI
3. JSON configuration files for UI elements
4. JavaScript modules for UI components
5. Figma-style JSON specifications

FILE STRUCTURE:
- web-game/ui/ - UI prototypes and mockups
- web-game/src/ui/ - UI components and systems
- web-game/src/styles/ - CSS stylesheets
- web-game/config/ui/ - UI configuration files

DESIGN PRINCIPLES:
- Mobile-first responsive design
- Accessibility (WCAG guidelines)
- Performance optimization
- Consistent visual language
- Intuitive user flows
- Clear visual hierarchy
- Smooth animations and transitions

OUTPUT FORMAT:
For each deliverable, provide:
1. File path (relative to web-game/)
2. Complete file content
3. Brief description of purpose and usage
4. Implementation notes

EXAMPLE OUTPUT:
---FILE: ui/game-hud.html---
[Complete HTML/CSS/JS code here]
---DESCRIPTION---
Interactive HUD prototype with health bar, score display, and minimap
---IMPLEMENTATION---
Integrate with Phaser scene using DOM overlay or convert to Phaser UI elements
---END---

TASK: {{TASK_PROMPT}}

Create polished, production-ready UI/UX deliverables.`;

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
    await git.status();
    console.log(chalk.green('✅ Git repository initialized'));
  } catch (error) {
    console.log(chalk.blue('📦 Initializing Git repository...'));
    await git.init();
    await git.addConfig('user.name', 'UI/UX Agent');
    await git.addConfig('user.email', 'uiux@agent-studio.ai');
    console.log(chalk.green('✅ Git repository created'));
  }
}

async function callLLM(prompt) {
  try {
    const response = await axios.post(`${LLM_SERVER_URL}/v1/generate`, {
      prompt: prompt,
      max_tokens: 3000,
      temperature: 0.1, // Lower temperature for more consistent UI output
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

function parseUIFiles(llmResponse) {
  const files = [];
  const filePattern = /---FILE:\s*(.+?)---([\s\S]*?)(?:---DESCRIPTION---\s*([\s\S]*?))?(?:---IMPLEMENTATION---\s*([\s\S]*?))?(?:---END---|$)/g;
  
  let match;
  while ((match = filePattern.exec(llmResponse)) !== null) {
    const [, filePath, content, description, implementation] = match;
    
    files.push({
      path: filePath.trim(),
      content: content.trim(),
      description: description ? description.trim() : '',
      implementation: implementation ? implementation.trim() : ''
    });
  }
  
  if (files.length === 0) {
    // Fallback: create HTML file with the response
    console.log(chalk.yellow('⚠️  No file markers found, creating HTML prototype'));
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Prototype</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #ffffff;
        }
        .prototype-container {
            max-width: 1200px;
            margin: 0 auto;
            background: #2a2a2a;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .prototype-content {
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
            background: #333;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #007acc;
        }
    </style>
</head>
<body>
    <div class="prototype-container">
        <h1>UI/UX Prototype</h1>
        <div class="prototype-content">${llmResponse.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>
</body>
</html>`;

    return [{
      path: 'ui/prototype.html',
      content: htmlContent,
      description: 'Generated UI/UX prototype',
      implementation: 'Review and implement based on specifications'
    }];
  }
  
  return files;
}

async function writeUIFiles(files, taskId) {
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
      if (file.implementation) {
        console.log(chalk.blue(`   💡 ${file.implementation}`));
      }
      
      writtenFiles.push(file.path);
      
      // Create accompanying documentation
      if (file.description || file.implementation) {
        const docPath = fullPath + '.md';
        const docContent = `# ${path.basename(file.path)}

## Description
${file.description || 'No description provided'}

## Implementation Notes
${file.implementation || 'No implementation notes provided'}

## Usage
This file was generated by the UI/UX Agent for task: ${taskId}

Generated at: ${new Date().toISOString()}
`;
        
        await fs.writeFile(docPath, docContent, 'utf8');
        console.log(chalk.blue(`📝 Created documentation: ${file.path}.md`));
        writtenFiles.push(file.path + '.md');
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to write ${file.path}:`), error.message);
    }
  }
  
  return writtenFiles;
}

async function generateUIManifest(files, taskId, taskTitle) {
  const webGameDir = path.resolve(__dirname, '../web-game');
  const manifestPath = path.join(webGameDir, 'ui', 'ui-manifest.json');
  
  try {
    // Read existing manifest or create new one
    let manifest = { version: '1.0.0', ui_components: [] };
    
    try {
      const existingManifest = await fs.readFile(manifestPath, 'utf8');
      manifest = JSON.parse(existingManifest);
    } catch (error) {
      // File doesn't exist, use default
    }
    
    // Add new components
    const newComponent = {
      id: taskId,
      title: taskTitle,
      files: files.filter(f => !f.endsWith('.md')),
      created_at: new Date().toISOString(),
      agent: CONSUMER_NAME
    };
    
    manifest.ui_components.push(newComponent);
    manifest.last_updated = new Date().toISOString();
    
    // Write updated manifest
    await fs.ensureDir(path.dirname(manifestPath));
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    
    console.log(chalk.blue('📋 Updated UI manifest'));
    return 'ui/ui-manifest.json';
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to update UI manifest:'), error.message);
    return null;
  }
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
    const commitMessage = `[UI/UX Agent] ${taskTitle}\n\nTask ID: ${taskId}\nFiles: ${files.join(', ')}\nGenerated by: ${CONSUMER_NAME}`;
    
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
  
  console.log(chalk.blue(`\n🎨 Processing UI/UX task: ${title}`));
  console.log(chalk.gray(`Task ID: ${taskId}`));
  console.log(chalk.gray(`Prompt: ${prompt.substring(0, 100)}...`));
  
  try {
    // Generate UI/UX designs using LLM
    const systemPrompt = UIUX_SYSTEM_PROMPT.replace('{{TASK_PROMPT}}', prompt);
    console.log(chalk.blue('🤖 Generating UI/UX designs...'));
    
    const llmResponse = await callLLM(systemPrompt);
    console.log(chalk.green('✅ UI/UX designs generated'));
    
    // Parse generated files
    const files = parseUIFiles(llmResponse);
    console.log(chalk.blue(`📁 Parsed ${files.length} UI files`));
    
    // Write files to disk
    const writtenFiles = await writeUIFiles(files, taskId);
    
    if (writtenFiles.length > 0) {
      // Generate UI manifest
      const manifestFile = await generateUIManifest(writtenFiles, taskId, title);
      if (manifestFile) {
        writtenFiles.push(manifestFile);
      }
      
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
            if (task.role === 'uiux') {
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
    console.log(chalk.blue('🚀 UI/UX Agent Starting...'));
    console.log(chalk.gray(`Consumer: ${CONSUMER_NAME}`));
    console.log(chalk.gray(`Redis: ${REDIS_URL}`));
    console.log(chalk.gray(`LLM Server: ${LLM_SERVER_URL}`));
    console.log(chalk.gray(`Stream: ${STREAM_NAME}\n`));

    // Initialize connections
    await connectRedis();
    await initializeGit();
    
    console.log(chalk.green('✅ UI/UX Agent initialized and ready'));
    console.log(chalk.blue('👀 Polling for UI/UX tasks...\n'));
    
    // Start polling
    await pollForTasks();
    
  } catch (error) {
    console.error(chalk.red('❌ Fatal error:'), error.message);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log(chalk.yellow('\n🛑 Shutting down UI/UX Agent...'));
  isRunning = false;
  
  if (redisClient && redisClient.isOpen) {
    await redisClient.disconnect();
  }
  
  console.log(chalk.green('✅ UI/UX Agent stopped'));
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (require.main === module) {
  main();
}
