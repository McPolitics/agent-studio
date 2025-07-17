const fs = require('fs').promises;
const path = require('path');
const { Command } = require('commander');
const chalk = require('chalk');
const config = require('./config');
const LLMClient = require('./llm-client');
const TaskQueue = require('./task-queue');
const ProjectManager = require('./project-manager');

const program = new Command();
const llmClient = new LLMClient(config.llm);
const projectManager = new ProjectManager(path.join(__dirname, 'projects'));

program
  .name('director')
  .description('AI Agent Studio Director - Enhanced with Project Management')
  .version('1.0.0');

// Create new project command
program
  .command('new')
  .description('Create a new project')
  .argument('<prompt>', 'User prompt describing the game or project to build')
  .option('-n, --name <n>', 'Project name (auto-generated from prompt if not provided)')
  .option('-d, --description <desc>', 'Project description')
  .option('-e, --auto-enqueue', 'Automatically enqueue epics after generation', false)
  .action(async (prompt, options) => {
    await createNewProject(prompt, options);
  });

// Continue existing project command
program
  .command('continue')
  .description('Continue working on an existing project')
  .argument('[projectId]', 'Project ID to continue (uses active project if not specified)')
  .argument('[additionalPrompt]', 'Additional features or changes to implement')
  .option('-e, --auto-enqueue', 'Automatically enqueue epics after generation', false)
  .action(async (projectId, additionalPrompt, options) => {
    await continueProject(projectId, additionalPrompt, options);
  });

// List projects command
program
  .command('list')
  .description('List all projects')
  .option('-a, --active', 'Show only active project')
  .action(async (options) => {
    await listProjects(options);
  });

// Activate project command
program
  .command('activate')
  .description('Set a project as active')
  .argument('<projectId>', 'Project ID to activate')
  .action(async (projectId) => {
    await activateProject(projectId);
  });

// Director system prompt
const DIRECTOR_SYSTEM_PROMPT = `You are a Director Agent responsible for breaking down user requests into actionable epics for specialized AI agents.

You work with three types of agents:
1. CODER AGENT: Handles all programming, game logic, Phaser.js implementation
2. DESIGNER AGENT: Creates visual assets, sprites, animations, textures  
3. UI/UX AGENT: Designs user interfaces, menus, HUD elements

Create a JSON array of epics with this structure:
{
  "id": "unique_epic_id", 
  "title": "Epic Title",
  "description": "Detailed description",
  "role": "coder|designer|uiux",
  "priority": 1-5,
  "dependencies": ["epic_id1", "epic_id2"],
  "deliverables": ["file1.js", "sprite.png"]
}

Rules:
- Each epic should be focused and actionable
- Prioritize foundational work (game engine setup, core mechanics) first
- Be specific about Phaser.js features, asset formats, and file structures
- Dependencies should reflect logical build order
- Aim for 5-8 epics total

USER REQUEST: "{{prompt}}"

Respond with ONLY the JSON array of epics, no other text.`;

async function generateEpics(prompt, project = null) {
  console.log(chalk.blue('🧠 Generating project breakdown...'));
  
  // Check LLM health
  const isHealthy = await llmClient.checkHealth();
  if (!isHealthy) {
    throw new Error(`LLM provider ${config.llm.provider} is not available. Please check your configuration.`);
  }

  console.log(chalk.green(`✅ Connected to ${config.llm.provider} LLM`));

  try {
    const systemPrompt = DIRECTOR_SYSTEM_PROMPT.replace('{{prompt}}', prompt);
    
    const response = await llmClient.generateText(prompt, systemPrompt, {
      temperature: 0.3,
      maxTokens: 3000
    });

    // Parse the JSON response
    let epics;
    try {
      epics = JSON.parse(response);
    } catch (parseError) {
      // Try to extract JSON from response if it's wrapped in other text
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        epics = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse LLM response as JSON: ${parseError.message}`);
      }
    }

    if (!Array.isArray(epics)) {
      throw new Error('LLM response is not an array of epics');
    }

    console.log(chalk.green(`✅ Generated ${epics.length} epics`));
    return epics;

  } catch (error) {
    console.error(chalk.red('❌ Error generating epics:'), error.message);
    throw error;
  }
}

async function createNewProject(prompt, options) {
  try {
    console.log(chalk.blue('🎬 Director Agent Starting - New Project Mode...'));
    
    // Generate epics first
    const epics = await generateEpics(prompt);
    
    // Create project
    const project = await projectManager.createProject(prompt, {
      name: options.name,
      description: options.description
    });
    
    console.log(chalk.green(`🎯 Created project: ${project.name} (${project.id})`));
    
    // Save epics to project
    const epicsFile = path.join(project.folders.epics, 'epics.json');
    await fs.writeFile(epicsFile, JSON.stringify(epics, null, 2));
    
    // Set as active project
    await projectManager.setActiveProject(project.id);
    console.log(chalk.green(`🎯 Set active project: ${project.id}`));
    
    // Display summary
    displayEpicsSummary(epics);
    
    // Auto-enqueue if requested
    if (options.autoEnqueue) {
      await enqueueEpics(epics, project);
    }
    
    console.log(chalk.green('🎉 Project creation completed!'));
    console.log(chalk.cyan(`💡 Next steps:`));
    console.log(chalk.cyan(`   1. Review epics: cat "${epicsFile}"`));
    console.log(chalk.cyan(`   2. Start agents: npm run agents:start`));
    console.log(chalk.cyan(`   3. Monitor progress in: ${project.folders.tasks}`));
    
  } catch (error) {
    console.error(chalk.red('❌ Error creating project:'), error.message);
    process.exit(1);
  }
}

async function continueProject(projectId, additionalPrompt, options) {
  try {
    console.log(chalk.blue('🎬 Director Agent Starting - Continue Project Mode...'));
    
    // Handle case where first argument might be the prompt if no project ID provided
    if (projectId && !additionalPrompt && (projectId.includes(' ') || !projectId.includes('-'))) {
      // First argument looks like a prompt, not a project ID
      additionalPrompt = projectId;
      projectId = null;
    }
    
    // Get project to continue
    let project;
    if (projectId && projectId.trim() !== '') {
      project = await projectManager.getProject(projectId);
    } else {
      project = await projectManager.getActiveProject();
      if (!project) {
        console.log(chalk.red('❌ No active project found. Please specify a project ID or create a new project.'));
        await listProjects({});
        return;
      }
    }
    
    console.log(`📁 Continuing project: ${project.name} (${project.id})`);
    console.log(`📝 Original prompt: "${project.userPrompt}"`);
    
    if (additionalPrompt) {
      console.log(`➕ Additional work: "${additionalPrompt}"`);
    }
    
    // Set as active
    await projectManager.setActiveProject(project.id);
    console.log(chalk.green(`🎯 Set active project: ${project.id}`));
    
    // Create enhanced prompt
    const fullPrompt = additionalPrompt 
      ? `Original project: ${project.userPrompt}\n\nAdditional requirements: ${additionalPrompt}`
      : `Continue and enhance the existing project: ${project.userPrompt}`;
    
    // Generate new epics
    console.log(chalk.blue('🧠 Generating additional epics...'));
    const newEpics = await generateEpics(fullPrompt, project);
    
    // Load existing epics
    let existingEpics = [];
    const epicsFile = path.join(project.folders.epics, 'epics.json');
    try {
      const existingData = await fs.readFile(epicsFile, 'utf8');
      existingEpics = JSON.parse(existingData);
    } catch {
      // No existing epics file
    }
    
    // Merge epics (avoiding duplicates by ID)
    const allEpics = [...existingEpics];
    for (const newEpic of newEpics) {
      if (!existingEpics.find(e => e.id === newEpic.id)) {
        allEpics.push(newEpic);
      }
    }
    
    // Save updated epics
    await fs.writeFile(epicsFile, JSON.stringify(allEpics, null, 2));
    
    console.log(chalk.green(`✅ Generated ${newEpics.length} new epics`));
    console.log(chalk.blue(`📊 Total epics: ${allEpics.length} (${existingEpics.length} existing + ${newEpics.length} new)`));
    
    // Display summary of new epics only
    displayEpicsSummary(newEpics);
    
    // Auto-enqueue if requested
    if (options.autoEnqueue) {
      await enqueueEpics(newEpics, project);
    }
    
    console.log(chalk.green('🎉 Project continuation completed!'));
    console.log(chalk.cyan(`💡 Next steps:`));
    console.log(chalk.cyan(`   1. Review epics: cat "${epicsFile}"`));
    console.log(chalk.cyan(`   2. Start agents: npm run agents:start`));
    console.log(chalk.cyan(`   3. Monitor progress in: ${project.folders.tasks}`));
    
  } catch (error) {
    console.error(chalk.red('❌ Error continuing project:'), error.message);
    process.exit(1);
  }
}

async function listProjects(options) {
  try {
    const projects = await projectManager.listProjects();
    
    if (options.active) {
      const activeProject = await projectManager.getActiveProject();
      if (activeProject) {
        console.log(chalk.green(`📁 Active Project: ${activeProject.name} (${activeProject.id})`));
        console.log(chalk.gray(`   Created: ${new Date(activeProject.createdAt).toLocaleString()}`));
        console.log(chalk.gray(`   Prompt: "${activeProject.userPrompt}"`));
      } else {
        console.log(chalk.yellow('📁 No active project set'));
      }
      return;
    }
    
    if (projects.length === 0) {
      console.log(chalk.yellow('📂 No projects found. Create one with: director new "your prompt"'));
      return;
    }
    
    console.log(chalk.blue(`📂 Found ${projects.length} projects:`));
    console.log('');
    
    const activeProject = await projectManager.getActiveProject();
    
    for (const project of projects) {
      const isActive = activeProject && activeProject.id === project.id;
      const marker = isActive ? chalk.green('★') : ' ';
      
      console.log(`${marker} ${chalk.cyan(project.id)} - ${chalk.white(project.name)}`);
      console.log(`   ${chalk.gray(new Date(project.createdAt).toLocaleString())}`);
      console.log(`   ${chalk.gray(`"${project.userPrompt}"`)}`);
      console.log('');
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error listing projects:'), error.message);
    process.exit(1);
  }
}

async function activateProject(projectId) {
  try {
    const project = await projectManager.getProject(projectId);
    await projectManager.setActiveProject(projectId);
    
    console.log(chalk.green(`🎯 Activated project: ${project.name} (${project.id})`));
    console.log(chalk.gray(`   Created: ${new Date(project.createdAt).toLocaleString()}`));
    console.log(chalk.gray(`   Prompt: "${project.userPrompt}"`));
    
  } catch (error) {
    console.error(chalk.red('❌ Error activating project:'), error.message);
    process.exit(1);
  }
}

function displayEpicsSummary(epics) {
  console.log(chalk.blue('📋 EPICS SUMMARY'));
  console.log('='.repeat(50));
  
  const epicsByRole = {
    coder: epics.filter(e => e.role === 'coder'),
    designer: epics.filter(e => e.role === 'designer'),
    uiux: epics.filter(e => e.role === 'uiux')
  };
  
  for (const [role, roleEpics] of Object.entries(epicsByRole)) {
    if (roleEpics.length > 0) {
      const roleTitle = role === 'uiux' ? 'UI/UX AGENT' : `${role.toUpperCase()} AGENT`;
      console.log(`${chalk.cyan(roleTitle)} (${roleEpics.length} epics):`);
      
      // Sort by priority
      roleEpics.sort((a, b) => (a.priority || 1) - (b.priority || 1));
      
      for (const epic of roleEpics) {
        const stars = '★'.repeat(epic.priority || 1);
        console.log(`  ${chalk.yellow(stars)} ${epic.title}`);
        
        if (epic.dependencies && epic.dependencies.length > 0) {
          console.log(`    └─ Depends on: ${epic.dependencies.join(', ')}`);
        }
      }
    }
  }
  console.log('='.repeat(50));
}

async function enqueueEpics(epics, project) {
  console.log(chalk.blue('📥 Auto-enqueuing epics to project task queue...'));
  
  // Use project-specific task queue
  const taskQueue = new TaskQueue(project.folders.tasks);
  await taskQueue.init();
  
  for (const epic of epics) {
    const task = {
      id: epic.id,
      epic: epic,
      projectId: project.id,
      projectPath: project.folders.root,
      createdAt: new Date().toISOString()
    };
    
    await taskQueue.enqueue(epic.role, task);
    console.log(chalk.green(`✅ Enqueued to project queue: ${epic.title}`));
  }
  
  console.log(chalk.green(`🎉 Auto-enqueued ${epics.length} epics to project ${project.name}!`));
}

// Execute the program
program.parse();
