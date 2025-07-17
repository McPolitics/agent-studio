#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const os = require('os');

const isWindows = os.platform() === 'win32';

async function main() {
  try {
    console.log(chalk.blue('🚀 Setting up Agent Studio...'));
    console.log(chalk.gray(`Platform: ${os.platform()}`));
    console.log(chalk.gray(`Architecture: ${os.arch()}\n`));

    // Check prerequisites
    await checkPrerequisites();

    // Setup directories
    await setupDirectories();

    // Install dependencies
    await installDependencies();

    // Create .env file if it doesn't exist
    await setupEnvironment();

    // Setup complete
    console.log(chalk.green('\n🎉 Setup completed successfully!'));
    console.log(chalk.blue('\n📖 Next steps:'));
    console.log(chalk.gray('1. Configure your .env file with your LLM provider settings'));
    console.log(chalk.gray('2. Run: npm run director "your game idea"'));
    console.log(chalk.gray('3. Run: npm run agents:start'));
    console.log(chalk.gray('4. Run: npm run dev:web'));

  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'), error.message);
    process.exit(1);
  }
}

async function checkPrerequisites() {
  console.log(chalk.blue('🔍 Checking prerequisites...'));

  // Check Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(chalk.green(`✅ Node.js: ${nodeVersion}`));
  } catch (error) {
    throw new Error('Node.js is required but not installed');
  }

  // Check npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(chalk.green(`✅ npm: ${npmVersion}`));
  } catch (error) {
    throw new Error('npm is required but not installed');
  }

  // Check Python
  const pythonCommands = isWindows ? ['python', 'py'] : ['python3', 'python'];
  let pythonFound = false;
  
  for (const cmd of pythonCommands) {
    try {
      const pythonVersion = execSync(`${cmd} --version`, { encoding: 'utf8' }).trim();
      console.log(chalk.green(`✅ Python: ${pythonVersion} (${cmd})`));
      pythonFound = true;
      break;
    } catch (error) {
      // Try next command
    }
  }

  if (!pythonFound) {
    console.log(chalk.yellow('⚠️  Python not found. Designer agent will be disabled.'));
  }

  // Check pip
  try {
    const pipVersion = execSync('pip --version', { encoding: 'utf8' }).trim();
    console.log(chalk.green(`✅ pip: ${pipVersion}`));
  } catch (error) {
    console.log(chalk.yellow('⚠️  pip not found. Python dependencies will need manual installation.'));
  }
}

async function setupDirectories() {
  console.log(chalk.blue('📁 Setting up directories...'));

  const directories = [
    './tasks',
    './tasks/pending',
    './tasks/processing',
    './tasks/completed',
    './tasks/failed',
    './logs',
    './output',
    './web-game/assets'
  ];

  for (const dir of directories) {
    await fs.ensureDir(dir);
    console.log(chalk.gray(`   Created: ${dir}`));
  }

  console.log(chalk.green('✅ Directories created'));
}

async function installDependencies() {
  console.log(chalk.blue('📦 Installing dependencies...'));

  // Install root dependencies
  console.log(chalk.gray('Installing root dependencies...'));
  execSync('npm install', { stdio: 'inherit' });

  // Install scripts dependencies
  console.log(chalk.gray('Installing scripts dependencies...'));
  execSync('npm install', { cwd: './scripts', stdio: 'inherit' });

  // Install web-game dependencies
  console.log(chalk.gray('Installing web-game dependencies...'));
  execSync('npm install', { cwd: './web-game', stdio: 'inherit' });

  // Install Python dependencies (if Python is available)
  try {
    console.log(chalk.gray('Installing Python dependencies...'));
    execSync('pip install -r scripts/requirements.txt', { stdio: 'inherit' });
  } catch (error) {
    console.log(chalk.yellow('⚠️  Failed to install Python dependencies. Install manually if needed.'));
  }

  console.log(chalk.green('✅ Dependencies installed'));
}

async function setupEnvironment() {
  console.log(chalk.blue('⚙️  Setting up environment...'));

  const envPath = './.env';
  const envExamplePath = './.env.example';

  if (await fs.pathExists(envPath)) {
    console.log(chalk.gray('Environment file already exists, skipping...'));
    return;
  }

  if (await fs.pathExists(envExamplePath)) {
    await fs.copy(envExamplePath, envPath);
    console.log(chalk.green(`✅ Created .env file from .env.example`));
    console.log(chalk.yellow('⚠️  Please configure your .env file with your LLM provider settings'));
  } else {
    // Create a basic .env file
    const basicEnv = `# Agent Studio Configuration
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2:7b

# Set to your preferred provider and configure accordingly
# LLM_PROVIDER=openai
# OPENAI_API_KEY=your_key_here

# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=your_key_here

IMAGE_GENERATION=disabled
DEBUG=true
`;
    await fs.writeFile(envPath, basicEnv);
    console.log(chalk.green('✅ Created basic .env file'));
  }
}

// Run the setup
if (require.main === module) {
  main();
}
