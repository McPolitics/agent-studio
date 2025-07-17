const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

/**
 * Project Manager - Handles project creation, organization, and iteration
 */
class ProjectManager {
  constructor() {
    this.projectsDir = path.resolve('./projects');
    this.activeProjectFile = path.resolve('./active-project.json');
  }

  /**
   * Create a new project with unique folder structure
   */
  async createProject(name, description, userPrompt) {
    // Generate unique project ID and folder name
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const shortId = crypto.randomBytes(4).toString('hex');
    const sanitizedName = this.sanitizeName(name);
    const projectId = `${timestamp}_${sanitizedName}_${shortId}`;
    
    const projectDir = path.join(this.projectsDir, projectId);
    
    // Create project structure
    await this.ensureProjectStructure(projectDir);
    
    // Create project metadata
    const projectMetadata = {
      id: projectId,
      name: name,
      description: description,
      userPrompt: userPrompt,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'active',
      version: '1.0.0',
      folders: {
        root: projectDir,
        src: path.join(projectDir, 'src'),
        assets: path.join(projectDir, 'assets'),
        dist: path.join(projectDir, 'dist'),
        tasks: path.join(projectDir, 'tasks'),
        logs: path.join(projectDir, 'logs'),
        epics: path.join(projectDir, 'epics')
      },
      statistics: {
        totalEpics: 0,
        completedEpics: 0,
        generatedAssets: 0,
        codeFiles: 0
      }
    };
    
    // Save project metadata
    await fs.writeFile(
      path.join(projectDir, 'project.json'),
      JSON.stringify(projectMetadata, null, 2)
    );
    
    // Set as active project
    await this.setActiveProject(projectId);
    
    console.log(`📁 Created new project: ${projectId}`);
    console.log(`📍 Location: ${projectDir}`);
    
    return projectMetadata;
  }

  /**
   * List all available projects
   */
  async listProjects() {
    try {
      await fs.access(this.projectsDir);
    } catch {
      return [];
    }

    const entries = await fs.readdir(this.projectsDir, { withFileTypes: true });
    const projects = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const projectPath = path.join(this.projectsDir, entry.name);
          const metadataPath = path.join(projectPath, 'project.json');
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
          projects.push(metadata);
        } catch (error) {
          console.warn(`Warning: Could not read project metadata for ${entry.name}`);
        }
      }
    }

    return projects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  }

  /**
   * Get project by ID
   */
  async getProject(projectId) {
    const projectDir = path.join(this.projectsDir, projectId);
    const metadataPath = path.join(projectDir, 'project.json');
    
    try {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
      return metadata;
    } catch (error) {
      throw new Error(`Project not found: ${projectId}`);
    }
  }

  /**
   * Set active project
   */
  async setActiveProject(projectId) {
    const project = await this.getProject(projectId);
    
    await fs.writeFile(
      this.activeProjectFile,
      JSON.stringify({ 
        projectId: projectId,
        setAt: new Date().toISOString()
      }, null, 2)
    );
    
    // Update project's last modified time
    project.lastModified = new Date().toISOString();
    await this.updateProject(project);
    
    console.log(`🎯 Set active project: ${projectId}`);
    return project;
  }

  /**
   * Get currently active project
   */
  async getActiveProject() {
    try {
      const activeData = JSON.parse(await fs.readFile(this.activeProjectFile, 'utf8'));
      return await this.getProject(activeData.projectId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update project metadata
   */
  async updateProject(projectMetadata) {
    projectMetadata.lastModified = new Date().toISOString();
    
    const projectPath = path.join(this.projectsDir, projectMetadata.id);
    const metadataPath = path.join(projectPath, 'project.json');
    
    await fs.writeFile(metadataPath, JSON.stringify(projectMetadata, null, 2));
    return projectMetadata;
  }

  /**
   * Create project folder structure
   */
  async ensureProjectStructure(projectDir) {
    const folders = [
      projectDir,
      path.join(projectDir, 'src'),
      path.join(projectDir, 'src', 'scenes'),
      path.join(projectDir, 'src', 'entities'),
      path.join(projectDir, 'src', 'ui'),
      path.join(projectDir, 'src', 'utils'),
      path.join(projectDir, 'assets'),
      path.join(projectDir, 'assets', 'images'),
      path.join(projectDir, 'assets', 'audio'),
      path.join(projectDir, 'assets', 'data'),
      path.join(projectDir, 'dist'),
      path.join(projectDir, 'tasks'),
      path.join(projectDir, 'tasks', 'pending'),
      path.join(projectDir, 'tasks', 'processing'),
      path.join(projectDir, 'tasks', 'completed'),
      path.join(projectDir, 'tasks', 'failed'),
      path.join(projectDir, 'logs'),
      path.join(projectDir, 'epics')
    ];

    for (const folder of folders) {
      await fs.mkdir(folder, { recursive: true });
    }

    // Create initial project files
    await this.createInitialProjectFiles(projectDir);
  }

  /**
   * Create initial project files
   */
  async createInitialProjectFiles(projectDir) {
    // package.json
    const packageJson = {
      name: path.basename(projectDir).toLowerCase(),
      version: "1.0.0",
      description: "Game created with Agent Studio",
      main: "src/main.js",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        phaser: "^3.70.0"
      },
      devDependencies: {
        vite: "^5.0.0"
      }
    };

    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // vite.config.js
    const viteConfig = `import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true
  }
});
`;

    await fs.writeFile(path.join(projectDir, 'vite.config.js'), viteConfig);

    // index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game - Agent Studio</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="main.js"></script>
</body>
</html>
`;

    await fs.writeFile(path.join(projectDir, 'src', 'index.html'), indexHtml);

    // README.md
    const readme = `# ${path.basename(projectDir)}

Game created with Agent Studio.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Preview

\`\`\`bash
npm run preview
\`\`\`
`;

    await fs.writeFile(path.join(projectDir, 'README.md'), readme);

    // .gitignore
    const gitignore = `node_modules/
dist/
.env
logs/
tasks/processing/
tasks/completed/
tasks/failed/
*.log
.DS_Store
Thumbs.db
`;

    await fs.writeFile(path.join(projectDir, '.gitignore'), gitignore);
  }

  /**
   * Sanitize project name for folder usage
   */
  sanitizeName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
  }

  /**
   * Get project statistics
   */
  async updateProjectStats(projectId) {
    const project = await this.getProject(projectId);
    
    // Count files in different directories
    const srcFiles = await this.countFilesInDir(path.join(project.folders.src));
    const assetFiles = await this.countFilesInDir(path.join(project.folders.assets));
    const completedTasks = await this.countFilesInDir(path.join(project.folders.tasks, 'completed'));
    const totalTasks = await this.countFilesInDir(path.join(project.folders.tasks, 'pending')) +
                     await this.countFilesInDir(path.join(project.folders.tasks, 'processing')) +
                     completedTasks +
                     await this.countFilesInDir(path.join(project.folders.tasks, 'failed'));

    project.statistics = {
      totalEpics: totalTasks,
      completedEpics: completedTasks,
      generatedAssets: assetFiles,
      codeFiles: srcFiles
    };

    await this.updateProject(project);
    return project.statistics;
  }

  /**
   * Count files in directory
   */
  async countFilesInDir(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.filter(entry => entry.isFile()).length;
    } catch {
      return 0;
    }
  }

  /**
   * Generate project summary
   */
  async getProjectSummary(projectId) {
    const project = await this.getProject(projectId);
    const stats = await this.updateProjectStats(projectId);
    
    return {
      ...project,
      statistics: stats,
      isActive: (await this.getActiveProject())?.id === projectId
    };
  }
}

module.exports = ProjectManager;
