const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { Command } = require('commander');
const chalk = require('chalk');

const program = new Command();

program
  .name('director')
  .description('Director Agent - Breaks down user prompts into actionable epics')
  .version('1.0.0')
  .argument('<prompt>', 'User prompt describing the game or project to build')
  .option('-o, --output <file>', 'Output file for epics', 'epics.json')
  .option('-s, --server <url>', 'LLM server URL', 'http://localhost:5000')
  .parse();

const options = program.opts();
const userPrompt = program.args[0];

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

async function callLLMServer(prompt, maxTokens = 2000) {
  try {
    console.log(chalk.blue('🤖 Calling LLM server...'));
    
    const response = await axios.post(`${options.server}/v1/generate`, {
      prompt: prompt,
      max_tokens: maxTokens,
      temperature: 0.3,
      stop: ['\n\n---', '\n\nUSER:', '\n\nASSISTANT:']
    }, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data.text;
  } catch (error) {
    if (error.response) {
      throw new Error(`LLM Server error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to LLM server. Make sure it\'s running on ' + options.server);
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

function parseEpicsFromResponse(text) {
  try {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const epics = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(epics)) {
      throw new Error('Response is not an array');
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

    return epics;
  } catch (error) {
    throw new Error(`Failed to parse epics: ${error.message}`);
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
    console.log(chalk.gray(`LLM server: ${options.server}`));
    console.log(chalk.gray(`Output file: ${options.output}\n`));

    // Generate epics
    const response = await callLLMServer(DIRECTOR_SYSTEM_PROMPT);
    console.log(chalk.green('✅ Received response from LLM server'));

    // Parse epics
    const epics = parseEpicsFromResponse(response);
    console.log(chalk.green(`✅ Parsed ${epics.length} epics successfully`));

    // Display summary
    displayEpicsSummary(epics);

    // Save to file
    const outputPath = await saveEpics(epics, options.output);

    console.log(chalk.green('\n🎉 Director Agent completed successfully!'));
    console.log(chalk.blue(`💡 Next step: Run the enqueue script to add epics to the work queue`));
    console.log(chalk.gray(`   node enqueue.js ${outputPath}`));

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    
    if (error.message.includes('Cannot connect to LLM server')) {
      console.log(chalk.yellow('\n💡 Troubleshooting:'));
      console.log(chalk.gray('   1. Make sure Docker is running'));
      console.log(chalk.gray('   2. Start the LLM server: docker-compose up llm-server'));
      console.log(chalk.gray('   3. Or run the local server: node llm_server.js'));
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
