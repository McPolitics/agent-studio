const fs = require('fs').promises;
const path = require('path');
const { Command } = require('commander');
const chalk = require('chalk');
const config = require('./config');
const LLMClient = require('./llm-client');
const TaskQueue = require('./task-queue');

const program = new Command();

program
  .name('director')
  .description('Director Agent - Breaks down user prompts into actionable epics')
  .version('1.0.0')
  .argument('<prompt>', 'User prompt describing the game or project to build')
  .option('-o, --output <file>', 'Output file for epics', 'epics.json')
  .option('--auto-enqueue', 'Automatically enqueue epics after generation', false)
  .parse();

const options = program.opts();
const userPrompt = program.args[0];

const llmClient = new LLMClient();
const taskQueue = new TaskQueue();

const DIRECTOR_SYSTEM_PROMPT = `You are the Director Agent in an autonomous development studio. Your role is to break down user requests into specific, actionable epics for specialized agents.

AGENTS AVAILABLE:
- Coder Agent: Creates game logic, scenes, and interactive systems using Phaser.js
- Designer Agent: Generates visual assets, sprites, backgrounds, and UI elements
- UI/UX Agent: Designs user interfaces, menus, HUD elements, and user experience flows

EPIC FORMAT:
Return a JSON array of epics. Each epic must have:
{
  "id": "unique_identifier",
  "role": "coder|designer|uiux", 
  "title": "Brief title",
  "prompt": "Detailed instructions for the agent",
  "priority": 1-5 (1=highest),
  "dependencies": ["epic_id1", "epic_id2"],
  "deliverables": ["specific output files expected"]
}

GUIDELINES:
- Break complex requests into 5-15 epics
- Each epic should be completable by one agent in 1-2 hours
- Include specific technical requirements
- Consider dependencies between epics
- Prioritize foundational work (game engine setup, core mechanics) first
- Be specific about Phaser.js features, asset formats, and file structures

USER REQUEST: "${userPrompt}"

Respond with ONLY the JSON array of epics, no other text.`;

async function generateEpics(prompt) {
  console.log(chalk.blue('🎬 Director Agent initializing...'));
  
  // Initialize task queue
  await taskQueue.init();
  
  // Check LLM health
  const isHealthy = await llmClient.checkHealth();
  if (!isHealthy) {
    throw new Error(`LLM provider ${config.llm.provider} is not available. Please check your configuration.`);
  }

  console.log(chalk.green(`✅ Connected to ${config.llm.provider} LLM`));
  console.log(chalk.blue('🧠 Generating project breakdown...'));

  try {
    const response = await llmClient.generateText(prompt, DIRECTOR_SYSTEM_PROMPT, {
      temperature: 0.3,
      maxTokens: 3000
    });

    // Parse the JSON response
    let epics;
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      epics = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error(chalk.red('❌ Failed to parse LLM response as JSON'));
      console.error('Response:', response);
      throw parseError;
    }

    if (!Array.isArray(epics)) {
      throw new Error('LLM response is not an array of epics');
    }

    // Validate epic structure
    for (const epic of epics) {
      if (!epic.id || !epic.role || !epic.title || !epic.prompt) {
        throw new Error(`Invalid epic structure: ${JSON.stringify(epic)}`);
      }
      
      if (!['coder', 'designer', 'uiux'].includes(epic.role)) {
        throw new Error(`Invalid role "${epic.role}" in epic ${epic.id}`);
      }
    }

    console.log(chalk.green(`✅ Generated ${epics.length} epics`));
    return epics;

  } catch (error) {
    console.error(chalk.red('❌ Error generating epics:'), error.message);
    throw error;
  }
}

async function saveEpics(epics, outputFile) {
  const outputPath = path.resolve(outputFile);
  
  const output = {
    metadata: {
      created_at: new Date().toISOString(),
      user_prompt: userPrompt,
      total_epics: epics.length,
      agents: {
        coder: epics.filter(e => e.role === 'coder').length,
        designer: epics.filter(e => e.role === 'designer').length,
        uiux: epics.filter(e => e.role === 'uiux').length
      }
    },
    epics: epics
  };

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(chalk.green(`✅ Saved ${epics.length} epics to ${outputPath}`));
  
  return outputPath;
}

async function enqueueEpics(epics) {
  console.log(chalk.blue('📥 Enqueuing epics to task queue...'));
  
  for (const epic of epics) {
    await taskQueue.enqueue(epic);
  }
  
  const stats = await taskQueue.getQueueStats();
  console.log(chalk.green(`✅ Enqueued ${epics.length} epics. Queue stats: ${JSON.stringify(stats)}`));
}

function displayEpicsSummary(epics) {
  console.log(chalk.yellow('\n📋 EPICS SUMMARY'));
  console.log(chalk.yellow('='.repeat(50)));
  
  const byRole = {
    coder: epics.filter(e => e.role === 'coder'),
    designer: epics.filter(e => e.role === 'designer'),
    uiux: epics.filter(e => e.role === 'uiux')
  };

  for (const [role, roleEpics] of Object.entries(byRole)) {
    if (roleEpics.length > 0) {
      console.log(chalk.cyan(`\n${role.toUpperCase()} AGENT (${roleEpics.length} epics):`));
      
      roleEpics
        .sort((a, b) => (a.priority || 5) - (b.priority || 5))
        .forEach(epic => {
          const priority = '★'.repeat(6 - (epic.priority || 5));
          console.log(`  ${priority} ${epic.title}`);
          if (epic.dependencies && epic.dependencies.length > 0) {
            console.log(`    └─ Depends on: ${epic.dependencies.join(', ')}`);
          }
        });
    }
  }
  
  console.log(chalk.yellow('\n' + '='.repeat(50)));
}

async function main() {
  try {
    console.log(chalk.blue('🎬 Director Agent Starting...'));
    console.log(chalk.gray(`User prompt: "${userPrompt}"`));
    console.log(chalk.gray(`LLM provider: ${config.llm.provider}`));
    console.log(chalk.gray(`Output file: ${options.output}\n`));

    // Ensure directories exist
    await config.ensureDirectories();

    // Generate epics
    const epics = await generateEpics(userPrompt);

    // Display summary
    displayEpicsSummary(epics);

    // Save to file
    const outputPath = await saveEpics(epics, options.output);

    // Optionally enqueue epics
    if (options.autoEnqueue) {
      await enqueueEpics(epics);
    }

    console.log(chalk.green('\n🎉 Director Agent completed successfully!'));
    
    if (!options.autoEnqueue) {
      console.log(chalk.blue(`💡 Next step: Run the enqueue script to add epics to the work queue`));
      console.log(chalk.gray(`   node enqueue.js ${outputPath}`));
    } else {
      console.log(chalk.blue(`💡 Epics have been automatically enqueued. Start the agents to begin processing:`));
      console.log(chalk.gray(`   npm run agents:start`));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    
    if (error.message.includes('not available')) {
      console.log(chalk.yellow('\n💡 Troubleshooting:'));
      console.log(chalk.gray('   1. Check your .env configuration'));
      console.log(chalk.gray('   2. Make sure your LLM provider is running'));
      console.log(chalk.gray('   3. For Ollama: ollama serve && ollama pull llama2:7b'));
    }
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Director Agent interrupted'));
  process.exit(0);
});

if (require.main === module) {
  main();
}
