#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('./scripts/config');
const LLMClient = require('./scripts/llm-client');
const TaskQueue = require('./scripts/task-queue');

async function testSystem() {
  console.log(chalk.blue('🧪 Testing Agent Studio System...\n'));
  
  const results = {
    config: false,
    directories: false,
    llm: false,
    taskQueue: false
  };

  try {
    // Test 1: Configuration
    console.log(chalk.blue('1. Testing configuration...'));
    console.log(chalk.gray(`   Platform: ${config.platform}`));
    console.log(chalk.gray(`   LLM Provider: ${config.llm.provider}`));
    console.log(chalk.gray(`   Task Queue Directory: ${config.taskQueue.directory}`));
    results.config = true;
    console.log(chalk.green('   ✅ Configuration loaded successfully\n'));

    // Test 2: Directories
    console.log(chalk.blue('2. Testing directory structure...'));
    await config.ensureDirectories();
    
    const requiredDirs = [
      config.paths.tasks,
      config.paths.output,
      config.paths.logs,
      config.paths.webGame
    ];
    
    for (const dir of requiredDirs) {
      const exists = await fs.pathExists(dir);
      if (exists) {
        console.log(chalk.gray(`   ✅ ${path.relative(process.cwd(), dir)}`));
      } else {
        console.log(chalk.red(`   ❌ ${path.relative(process.cwd(), dir)}`));
        throw new Error(`Directory ${dir} does not exist`);
      }
    }
    results.directories = true;
    console.log(chalk.green('   ✅ All directories exist\n'));

    // Test 3: LLM Client
    console.log(chalk.blue('3. Testing LLM client...'));
    const llmClient = new LLMClient();
    const isHealthy = await llmClient.checkHealth();
    
    if (isHealthy) {
      console.log(chalk.green(`   ✅ ${config.llm.provider} LLM is available`));
      results.llm = true;
    } else {
      console.log(chalk.yellow(`   ⚠️  ${config.llm.provider} LLM is not available`));
      console.log(chalk.gray('   This is expected if you haven\'t configured your LLM provider yet'));
    }
    console.log('');

    // Test 4: Task Queue
    console.log(chalk.blue('4. Testing task queue...'));
    const taskQueue = new TaskQueue();
    await taskQueue.init();
    
    const stats = await taskQueue.getQueueStats();
    console.log(chalk.gray(`   Queue stats: ${JSON.stringify(stats)}`));
    
    // Test enqueue/dequeue
    const testEpic = {
      id: 'test-epic',
      role: 'coder',
      title: 'Test Epic',
      prompt: 'This is a test epic',
      priority: 3,
      dependencies: [],
      deliverables: ['test.js']
    };
    
    await taskQueue.enqueue(testEpic);
    const task = await taskQueue.dequeue('coder');
    
    if (task && task.epic.id === 'test-epic') {
      await taskQueue.completeTask(task.id, { test: true });
      console.log(chalk.green('   ✅ Task queue working correctly'));
      results.taskQueue = true;
    } else {
      throw new Error('Task queue test failed');
    }
    console.log('');

    // Summary
    console.log(chalk.blue('📊 Test Results:'));
    console.log(chalk.gray('='.repeat(30)));
    
    const testItems = [
      { name: 'Configuration', result: results.config },
      { name: 'Directory Structure', result: results.directories },
      { name: 'LLM Client', result: results.llm },
      { name: 'Task Queue', result: results.taskQueue }
    ];
    
    let passed = 0;
    for (const item of testItems) {
      const status = item.result ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      console.log(`${status} ${item.name}`);
      if (item.result) passed++;
    }
    
    console.log(chalk.gray('='.repeat(30)));
    console.log(`${chalk.blue('Total:')} ${passed}/${testItems.length} tests passed`);
    
    if (passed === testItems.length) {
      console.log(chalk.green('\n🎉 All tests passed! Agent Studio is ready to use.'));
      console.log(chalk.blue('\n💡 Next steps:'));
      console.log(chalk.gray('   1. Configure your LLM provider in .env (if not already done)'));
      console.log(chalk.gray('   2. Run: npm run director "your game idea"'));
      console.log(chalk.gray('   3. Run: npm run agents:start'));
    } else {
      console.log(chalk.yellow('\n⚠️  Some tests failed. Please check the configuration.'));
      if (!results.llm) {
        console.log(chalk.gray('\n💡 To fix LLM issues:'));
        console.log(chalk.gray('   - Edit .env with your LLM provider settings'));
        console.log(chalk.gray('   - For Ollama: make sure ollama serve is running'));
        console.log(chalk.gray('   - For APIs: check your API keys'));
      }
    }

  } catch (error) {
    console.error(chalk.red(`\n❌ Test failed: ${error.message}`));
    process.exit(1);
  }
}

if (require.main === module) {
  testSystem().catch(console.error);
}
