const fs = require('fs').promises;
const path = require('path');
const { Command } = require('commander');
const chalk = require('chalk');
const config = require('./config');
const TaskQueue = require('./task-queue');

const program = new Command();

program
  .name('enqueue')
  .description('Enqueue epics from JSON file into task queue')
  .version('1.0.0')
  .argument('[file]', 'JSON file containing epics', 'epics.json')
  .option('--dry-run', 'Show what would be enqueued without actually doing it')
  .parse();

const options = program.opts();
const epicsFile = program.args[0] || 'epics.json';
const taskQueue = new TaskQueue();

async function loadEpics(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);
    console.log(chalk.blue(`📂 Loading epics from ${resolvedPath}...`));
    
    const fileContent = await fs.readFile(resolvedPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Handle both direct arrays and objects with epics property
    const epics = Array.isArray(data) ? data : data.epics;
    
    if (!Array.isArray(epics)) {
      throw new Error('File does not contain a valid epics array');
    }
    
    console.log(chalk.green(`✅ Loaded ${epics.length} epics from file`));
    return epics;
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file: ${error.message}`);
    } else {
      throw error;
    }
  }
}

function validateEpics(epics) {
  const errors = [];
  
  for (let i = 0; i < epics.length; i++) {
    const epic = epics[i];
    const prefix = `Epic ${i + 1}`;
    
    if (!epic.id) {
      errors.push(`${prefix}: Missing 'id' field`);
    }
    
    if (!epic.role) {
      errors.push(`${prefix}: Missing 'role' field`);
    } else if (!['coder', 'designer', 'uiux'].includes(epic.role)) {
      errors.push(`${prefix}: Invalid role '${epic.role}'. Must be: coder, designer, or uiux`);
    }
    
    if (!epic.title) {
      errors.push(`${prefix}: Missing 'title' field`);
    }
    
    if (!epic.prompt) {
      errors.push(`${prefix}: Missing 'prompt' field`);
    }
    
    if (epic.priority && (epic.priority < 1 || epic.priority > 5)) {
      errors.push(`${prefix}: Priority must be between 1 and 5`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Epic validation failed:\n${errors.join('\n')}`);
  }
  
  console.log(chalk.green('✅ All epics validated successfully'));
}

function displayEpicsSummary(epics) {
  console.log(chalk.yellow('\n📋 EPICS TO ENQUEUE'));
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

async function enqueueEpics(epics) {
  console.log(chalk.blue('\n📥 Enqueuing epics to task queue...'));
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const epic of epics) {
    try {
      const taskId = await taskQueue.enqueue(epic);
      console.log(chalk.green(`✅ Enqueued: ${epic.title} (${taskId})`));
      results.success++;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to enqueue: ${epic.title} - ${error.message}`));
      results.failed++;
      results.errors.push({ epic: epic.title, error: error.message });
    }
  }
  
  return results;
}

async function main() {
  try {
    console.log(chalk.blue('📥 Enqueue Script Starting...'));
    console.log(chalk.gray(`Input file: ${epicsFile}`));
    console.log(chalk.gray(`Dry run: ${options.dryRun ? 'Yes' : 'No'}\n`));

    // Ensure directories exist
    await config.ensureDirectories();
    
    // Initialize task queue
    await taskQueue.init();
    
    // Load and validate epics
    const epics = await loadEpics(epicsFile);
    validateEpics(epics);
    
    // Display summary
    displayEpicsSummary(epics);
    
    if (options.dryRun) {
      console.log(chalk.yellow('\n🧪 DRY RUN: No epics were actually enqueued'));
      console.log(chalk.gray(`Would have enqueued ${epics.length} epics`));
      return;
    }
    
    // Enqueue epics
    const results = await enqueueEpics(epics);
    
    // Show final stats
    const stats = await taskQueue.getQueueStats();
    
    console.log(chalk.green('\n🎉 Enqueue completed!'));
    console.log(chalk.green(`✅ Successfully enqueued: ${results.success} epics`));
    
    if (results.failed > 0) {
      console.log(chalk.red(`❌ Failed to enqueue: ${results.failed} epics`));
      results.errors.forEach(({ epic, error }) => {
        console.log(chalk.red(`   - ${epic}: ${error}`));
      });
    }
    
    console.log(chalk.blue('\n📊 Current queue stats:'));
    console.log(chalk.gray(`   Pending: ${stats.pending}`));
    console.log(chalk.gray(`   Processing: ${stats.processing}`));
    console.log(chalk.gray(`   Completed: ${stats.completed}`));
    console.log(chalk.gray(`   Failed: ${stats.failed}`));
    
    console.log(chalk.blue('\n💡 Next step: Start the agents to process the queue'));
    console.log(chalk.gray('   npm run agents:start'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    
    if (error.message.includes('File not found')) {
      console.log(chalk.yellow('\n💡 Troubleshooting:'));
      console.log(chalk.gray('   1. Make sure you have run the director script first'));
      console.log(chalk.gray('   2. Check the file path is correct'));
      console.log(chalk.gray('   3. Try: node director.js "your game idea"'));
    }
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Enqueue script interrupted'));
  process.exit(0);
});

if (require.main === module) {
  main();
}
