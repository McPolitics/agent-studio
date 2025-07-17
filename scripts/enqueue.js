const redis = require('redis');
const fs = require('fs').promises;
const path = require('path');
const { Command } = require('commander');
const chalk = require('chalk');

const program = new Command();

program
  .name('enqueue')
  .description('Enqueue epics from JSON file into Redis streams for agent processing')
  .version('1.0.0')
  .argument('[file]', 'JSON file containing epics', 'epics.json')
  .option('-r, --redis <url>', 'Redis connection URL', 'redis://localhost:6379')
  .option('-s, --stream <name>', 'Redis stream name', 'agent_tasks')
  .option('--dry-run', 'Show what would be enqueued without actually doing it')
  .parse();

const options = program.opts();
const epicsFile = program.args[0] || 'epics.json';

let redisClient;

async function connectRedis() {
  try {
    console.log(chalk.blue(`🔌 Connecting to Redis at ${options.redis}...`));
    
    redisClient = redis.createClient({
      url: options.redis,
      socket: {
        reconnectDelayOnFailure: 1000,
        reconnectDelayOnClusterFailure: 1000,
        commandTimeout: 5000
      }
    });

    redisClient.on('error', (err) => {
      console.error(chalk.red('Redis error:'), err);
    });

    redisClient.on('connect', () => {
      console.log(chalk.green('✅ Connected to Redis'));
    });

    redisClient.on('reconnecting', () => {
      console.log(chalk.yellow('🔄 Reconnecting to Redis...'));
    });

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    console.log(chalk.green('✅ Redis connection verified'));
    
    return redisClient;
  } catch (error) {
    throw new Error(`Failed to connect to Redis: ${error.message}`);
  }
}

async function loadEpics(filePath) {
  try {
    console.log(chalk.blue(`📖 Loading epics from ${filePath}...`));
    
    const absolutePath = path.resolve(filePath);
    const fileContent = await fs.readFile(absolutePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    let epics;
    if (data.epics && Array.isArray(data.epics)) {
      // New format with metadata
      epics = data.epics;
      console.log(chalk.gray(`📊 Metadata: Created ${data.metadata?.created_at}, Total: ${data.metadata?.total_epics}`));
    } else if (Array.isArray(data)) {
      // Legacy format - direct array
      epics = data;
    } else {
      throw new Error('Invalid file format - expected array of epics or object with epics property');
    }

    if (epics.length === 0) {
      throw new Error('No epics found in file');
    }

    console.log(chalk.green(`✅ Loaded ${epics.length} epics`));
    return epics;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file: ${error.message}`);
    } else {
      throw new Error(`Failed to load epics: ${error.message}`);
    }
  }
}

function validateEpic(epic, index) {
  const required = ['id', 'role', 'title', 'prompt'];
  const missing = required.filter(field => !epic[field]);
  
  if (missing.length > 0) {
    throw new Error(`Epic ${index + 1} missing required fields: ${missing.join(', ')}`);
  }
  
  const validRoles = ['coder', 'designer', 'uiux'];
  if (!validRoles.includes(epic.role)) {
    throw new Error(`Epic ${index + 1} has invalid role "${epic.role}". Must be one of: ${validRoles.join(', ')}`);
  }
  
  return true;
}

async function enqueueEpic(epic, streamName) {
  const message = {
    id: epic.id,
    role: epic.role,
    title: epic.title,
    prompt: epic.prompt,
    priority: epic.priority || 5,
    dependencies: JSON.stringify(epic.dependencies || []),
    deliverables: JSON.stringify(epic.deliverables || []),
    created_at: new Date().toISOString(),
    status: 'pending'
  };

  if (options.dryRun) {
    console.log(chalk.yellow(`[DRY RUN] Would enqueue: ${epic.role}/${epic.id} - ${epic.title}`));
    return { id: 'dry-run', message };
  }

  try {
    const result = await redisClient.xAdd(streamName, '*', message);
    console.log(chalk.green(`✅ Enqueued: ${epic.role}/${epic.id} - ${epic.title}`));
    return { id: result, message };
  } catch (error) {
    console.error(chalk.red(`❌ Failed to enqueue ${epic.id}:`), error.message);
    throw error;
  }
}

function displayEnqueueSummary(results, epics) {
  console.log(chalk.yellow('\n📊 ENQUEUE SUMMARY'));
  console.log(chalk.yellow('='.repeat(50)));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(chalk.green(`✅ Successfully enqueued: ${successful.length}`));
  if (failed.length > 0) {
    console.log(chalk.red(`❌ Failed to enqueue: ${failed.length}`));
  }
  
  // Summary by role
  const byRole = {};
  successful.forEach(result => {
    const epic = epics.find(e => e.id === result.epic.id);
    if (epic) {
      byRole[epic.role] = (byRole[epic.role] || 0) + 1;
    }
  });
  
  console.log(chalk.cyan('\nBy Agent Role:'));
  Object.entries(byRole).forEach(([role, count]) => {
    console.log(`  ${role}: ${count} tasks`);
  });
  
  if (!options.dryRun) {
    console.log(chalk.blue(`\n🚀 Tasks are now in Redis stream: ${options.stream}`));
    console.log(chalk.blue('💡 Start the agent workers to begin processing'));
  }
  
  console.log(chalk.yellow('='.repeat(50)));
}

async function getStreamInfo(streamName) {
  try {
    const info = await redisClient.xInfoStream(streamName);
    return {
      length: info.length,
      lastId: info['last-generated-id'],
      firstEntry: info['first-entry'],
      lastEntry: info['last-entry']
    };
  } catch (error) {
    if (error.message.includes('no such key')) {
      return { length: 0, exists: false };
    }
    throw error;
  }
}

async function main() {
  try {
    console.log(chalk.blue('📤 Enqueue Agent Starting...'));
    console.log(chalk.gray(`Epics file: ${epicsFile}`));
    console.log(chalk.gray(`Redis URL: ${options.redis}`));
    console.log(chalk.gray(`Stream name: ${options.stream}`));
    if (options.dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN MODE - No actual enqueuing\n'));
    }

    // Load and validate epics
    const epics = await loadEpics(epicsFile);
    
    console.log(chalk.blue('🔍 Validating epics...'));
    epics.forEach((epic, index) => validateEpic(epic, index));
    console.log(chalk.green('✅ All epics validated successfully'));

    // Connect to Redis
    if (!options.dryRun) {
      await connectRedis();
      
      // Show current stream status
      const streamInfo = await getStreamInfo(options.stream);
      if (streamInfo.exists !== false) {
        console.log(chalk.gray(`📊 Current stream length: ${streamInfo.length} messages`));
      } else {
        console.log(chalk.gray('📊 Stream does not exist yet (will be created)'));
      }
    }

    // Enqueue epics
    console.log(chalk.blue(`\n📤 Enqueuing ${epics.length} epics...`));
    
    const results = [];
    for (const epic of epics) {
      try {
        const result = await enqueueEpic(epic, options.stream);
        results.push({ success: true, epic, result });
      } catch (error) {
        results.push({ success: false, epic, error });
      }
    }

    // Display summary
    displayEnqueueSummary(results, epics);

    // Final status
    const successful = results.filter(r => r.success).length;
    if (successful === epics.length) {
      console.log(chalk.green('\n🎉 All epics enqueued successfully!'));
    } else {
      console.log(chalk.yellow(`\n⚠️  ${successful}/${epics.length} epics enqueued`));
    }

    if (!options.dryRun) {
      console.log(chalk.blue('\n💡 Next steps:'));
      console.log(chalk.gray('   1. Start agent workers: npm run start:all'));
      console.log(chalk.gray('   2. Monitor progress in Redis: redis-cli XREAD STREAMS agent_tasks $'));
      console.log(chalk.gray('   3. Check web-game folder for generated files'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    
    if (error.message.includes('Failed to connect to Redis')) {
      console.log(chalk.yellow('\n💡 Troubleshooting:'));
      console.log(chalk.gray('   1. Make sure Redis is running: docker-compose up redis'));
      console.log(chalk.gray('   2. Check Redis connection: redis-cli ping'));
      console.log(chalk.gray('   3. Verify Redis URL is correct'));
    }
    
    process.exit(1);
  } finally {
    if (redisClient && redisClient.isOpen) {
      await redisClient.disconnect();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n🛑 Enqueue Agent interrupted'));
  if (redisClient && redisClient.isOpen) {
    await redisClient.disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(chalk.yellow('\n🛑 Enqueue Agent terminated'));
  if (redisClient && redisClient.isOpen) {
    await redisClient.disconnect();
  }
  process.exit(0);
});

if (require.main === module) {
  main();
}
