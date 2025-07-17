# Agent Studio

> **Multi-Project AI-Powered Game Development Studio**

Welcome to Agent Studio - an revolutionary autonomous development system that creates complete games from simple text prompts using specialized AI agents. **Now featuring advanced project management for unlimited game development!**

## ✨ Key Features

- 🎬 **Director Agent**: Intelligent project breakdown and epic planning
- 🔧 **Coder Agent**: Phaser.js game development and systems programming  
- 🎨 **Designer Agent**: AI-generated sprites, backgrounds, and visual assets (OpenAI DALL-E + Stable Diffusion)
- 🎛️ **UI/UX Agent**: User interface design and experience optimization
- 🚀 **Automated Pipeline**: From concept to deployed game in minutes
- 🗂️ **Multi-Project Management**: Create unlimited independent games
- 🔄 **Iterative Development**: Continuously expand existing games with new features
- 💻 **Cross-Platform**: Works on Windows and Linux without Docker
- 🔌 **Multiple LLM Providers**: Supports Ollama, OpenAI, Anthropic, and local models

## 🎮 **NEW: Project Management System**

Agent Studio now supports **unlimited concurrent game projects** with professional organization:

### **Unique Project Folders**
- Each game gets its own isolated environment
- Timestamped unique IDs prevent conflicts
- Complete project structure with build system
- Professional organization ready for version control

### **Iterative Development**
- **Continue existing projects** with new features
- **Smart epic merging** preserves context
- **Unlimited iterations** without starting over
- **AI remembers** your game's history and goals

### **Examples**
```bash
# Create multiple independent games
npm run director:new "Retro arcade shooter with power-ups"
npm run director:new "Tower defense with unique upgrade paths" 
npm run director:new "Puzzle platformer with gravity mechanics"

# Expand existing games with new features
npm run director continue "Add boss battles and special abilities"
npm run director continue "Add multiplayer support and leaderboards"
npm run director continue "Add particle effects and animations"
```

**📖 [Complete Project Management Guide →](PROJECT_MANAGEMENT_USER_GUIDE.md)**

> Autonomous AI-Powered Game Development Studio

Welcome to Agent Studio - an innovative autonomous development system that creates complete games from simple text prompts using specialized AI agents. **Now simplified for single-machine operation on Windows and Linux!**

## ✨ Features

- 🎬 **Director Agent**: Intelligent project breakdown and task planning
- 🔧 **Coder Agent**: Phaser.js game development and systems programming  
- 🎨 **Designer Agent**: AI-generated sprites, backgrounds, and visual assets
- 🎛️ **UI/UX Agent**: User interface design and experience optimization
- 🚀 **Automated Pipeline**: From concept to deployed game in minutes
- � **Cross-Platform**: Works on Windows and Linux without Docker
- 🔌 **Multiple LLM Providers**: Supports Ollama, OpenAI, Anthropic, and local models

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm**
- **Python 3.9+** and **pip** (optional, for Designer Agent)
- **LLM Provider** (Ollama, OpenAI account, or local LLM)

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd agent-studio
   node setup.js
   ```

2. **Configure Your LLM Provider**
   
   Edit `.env` file with your preferred provider:
   
   **For Ollama (Recommended for local use):**
   ```env
   LLM_PROVIDER=ollama
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=llama2:7b
   ```
   
   **For OpenAI:**
   ```env
   LLM_PROVIDER=openai
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-3.5-turbo
   ```
   
   **For Anthropic:**
   ```env
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=your_api_key_here
   ANTHROPIC_MODEL=claude-3-haiku-20240307
   ```

3. **Start Creating Games!**
   
   **Create Your First Project:**
   ```bash
   # Create new game project
   npm run director:new "Create a 2D platformer with jumping character and coins"
   
   # With custom name
   npm run director:new "Create a racing game" --name "Speed Racer Pro"
   
   # With auto-development (AI agents start immediately)
   cd scripts && node director-enhanced.js new "Tower defense game" -e
   ```
   
   **Project Management:**
   ```bash
   # List all your game projects
   npm run director:list
   
   # Switch between projects
   npm run director activate <project-id>
   
   # Show active project
   npm run director:list --active
   ```
   
   **Expand Existing Games:**
   ```bash
   # Add features to active project
   npm run director continue "Add boss battles and power-ups"
   
   # Add features with auto-development
   cd scripts && node director-enhanced.js continue "Add multiplayer" -e
   ```
   
   **Start AI Development:**
   ```bash
   # Start the AI agents (works on active project)
   npm run agents:start
   
   # Preview your game (navigate to project folder first)
   cd scripts/projects/your-project-folder
   npm run dev
   ```

## 🎯 Quick Examples

### **Multi-Project Workflow**
```bash
# Create different game types
npm run director:new "Space exploration survival game"
npm run director:new "Medieval castle defense with upgrades"  
npm run director:new "Puzzle platformer with time mechanics"

# Work on specific games
npm run director activate space-exploration-project-id
npm run director continue "Add alien encounters and trading"

npm run director activate castle-defense-project-id  
npm run director continue "Add siege weapons and magic spells"
```

### **Iterative Game Development**
```bash
# Start simple
npm run director:new "Basic racing game"

# Build complexity over time
npm run director continue "Add power-ups and boost mechanics"
npm run director continue "Add time trials and leaderboards" 
npm run director continue "Add car customization and tracks"
npm run director continue "Add weather effects and day/night cycle"
```

## 📚 Configuration

### Environment Variables

Create a `.env` file (or copy from `.env.example`) with:

```env
# LLM Configuration
LLM_PROVIDER=ollama              # ollama, openai, anthropic, local
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2:7b

# OpenAI (if using)
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Application Settings
PORT=3000
DEBUG=true

# Image Generation Configuration
IMAGE_GENERATION_PROVIDER=disabled  # openai, stable-diffusion, local, disabled
OPENAI_IMAGE_API_KEY=your_key_here   # For DALL-E image generation
OPENAI_IMAGE_MODEL=dall-e-3          # dall-e-2 or dall-e-3
STABLE_DIFFUSION_API_URL=http://localhost:7860  # For local Stable Diffusion

# File Paths
TASK_QUEUE_DIRECTORY=./tasks
OUTPUT_DIR=./output
ASSETS_DIR=./web-game/assets
```

### LLM Provider Setup

#### Ollama (Local, Free)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh  # Linux
# Or download from https://ollama.ai for Windows

# Start Ollama
ollama serve

# Pull a model
ollama pull llama2:7b
```

#### OpenAI
1. Get API key from https://platform.openai.com
2. Set `OPENAI_API_KEY` in `.env`

#### Anthropic
1. Get API key from https://console.anthropic.com
2. Set `ANTHROPIC_API_KEY` in `.env`

## 🎮 Usage

### Step-by-Step Game Creation

1. **Generate Epics**
   ```bash
   npm run director "Create a space shooter with power-ups and levels"
   ```

2. **Review Generated Plan**
   ```bash
   cat epics.json  # View the generated development plan
   ```

3. **Enqueue Tasks** (if not auto-enqueued)
   ```bash
   npm run enqueue epics.json
   ```

4. **Start Agents**
   ```bash
   npm run agents:start
   ```

5. **Preview Game**
   ```bash
   npm run dev:web
   # Visit http://localhost:5173
   ```

### Individual Agent Commands

```bash
# Run only specific agents
npm run agent:coder     # Code generation
npm run agent:designer  # Asset creation  
npm run agent:uiux      # Interface design

# Director with options
cd scripts
node director.js "your game idea" --auto-enqueue

# Enqueue with dry run
node enqueue.js epics.json --dry-run
```

## 🗂️ Project Structure

Agent Studio now creates **unique project folders** for each game, enabling multiple projects and iterative development:

```
agent-studio/
├── 📁 projects/             # All game projects
│   ├── 📁 2025-01-01_space-game_abc123/
│   │   ├── 📄 project.json  # Project metadata
│   │   ├── 📄 package.json  # Dependencies
│   │   ├── 📁 src/          # Game source code
│   │   ├── 📁 assets/       # AI-generated assets
│   │   ├── 📁 tasks/        # Project task queue
│   │   ├── 📁 epics/        # Project planning
│   │   ├── 📁 dist/         # Built game
│   │   └── 📁 logs/         # Project logs
│   └── 📁 2025-01-02_puzzle-game_def456/
├── 📁 scripts/              # Agent workers and core logic
│   ├── project-manager.js   # Project management
│   ├── director-enhanced.js # Enhanced project director
│   ├── config.js            # Cross-platform configuration
│   ├── llm-client.js        # Universal LLM client
│   ├── task-queue.js        # Project-aware task queue
│   ├── coder_agent.js       # Code generation agent
│   ├── designer_agent.py    # Asset creation agent
│   └── uiux_agent.js        # UI/UX design agent
├── � active-project.json   # Currently active project
├── .env                     # Configuration
└── setup.js                # Setup script
```

## 🛠️ Commands Reference

### 🏗️ Project Management

**Create New Projects:**
```bash
npm run director:new "game concept"           # Auto-generated name
npm run director:new "concept" --name "Name"  # Custom name
npm run director:new "concept" --auto-enqueue # Auto-start development
```

**Continue Existing Projects:**
```bash
npm run director:list                         # List all projects
npm run director:list --active              # Show active project only
npm run director activate <projectId>        # Switch active project
npm run director continue "new features"     # Add to active project
npm run director continue <projectId> "features" # Add to specific project
```

**Legacy Support:**
```bash
npm run director "game concept"              # Creates new project (legacy)
npm run director:legacy "concept"           # Original director
```

### 🏭 Development Workflow

**Agent Operations:**
```bash
npm run agents:start                        # Start all agents (uses active project)
npm run agent:coder                         # Start only coder agent
npm run agent:designer                      # Start only designer agent  
npm run agent:uiux                          # Start only UI/UX agent
```

**Game Development:**
```bash
cd projects/your-project-folder             # Navigate to project
npm install                                 # Install dependencies
npm run dev                                 # Start development server
npm run build                               # Build for production
npm run preview                             # Preview built game
```

### Setup & Installation
```bash
node setup.js              # Full setup
npm run setup              # Install all dependencies
npm run install:scripts    # Install Node.js dependencies
npm run install:python     # Install Python dependencies
npm run install:web        # Install web game dependencies
```

### Development
```bash
npm run director "prompt"  # Generate development plan
npm run enqueue [file]     # Add tasks to queue
npm run agents:start       # Start all agents
npm run dev:web           # Start game development server
npm run build             # Build game for production
npm run preview           # Preview built game
```

### Maintenance
```bash
npm run clean             # Clean tasks and logs
npm run clean:tasks       # Clean task queue
npm run clean:logs        # Clean log files
```

## 🎨 AI Image Generation

Agent Studio supports multiple AI image generation providers to create game assets automatically.

### Supported Providers

#### OpenAI DALL-E (Recommended)
- **High Quality**: Excellent for game assets and sprites
- **Cost**: Pay per image generated
- **Setup**: Requires OpenAI API key

```env
IMAGE_GENERATION_PROVIDER=openai
OPENAI_IMAGE_API_KEY=your_openai_api_key
OPENAI_IMAGE_MODEL=dall-e-3        # or dall-e-2
OPENAI_IMAGE_SIZE=1024x1024        # 1024x1024, 512x512, or 256x256
OPENAI_IMAGE_QUALITY=standard      # standard or hd
```

#### Stable Diffusion (Local)
- **Free**: Run locally with your own hardware
- **Customizable**: Full control over models and settings
- **Setup**: Requires local Stable Diffusion installation

```env
IMAGE_GENERATION_PROVIDER=stable-diffusion
STABLE_DIFFUSION_API_URL=http://localhost:7860
STABLE_DIFFUSION_MODEL=stable-diffusion-v1-5
```

#### Disabled (Default)
- **Placeholder Assets**: Creates simple colored rectangles
- **No Cost**: Free to use
- **Quick Start**: No additional setup required

```env
IMAGE_GENERATION_PROVIDER=disabled
```

### Image Generation Settings

```env
# Style and format
IMAGE_GENERATION_STYLE=pixel-art    # pixel-art, realistic, cartoon
IMAGE_GENERATION_FORMAT=png         # png, jpg, webp
MAX_IMAGE_SIZE=1024                 # Maximum dimension in pixels
ENABLE_IMAGE_UPSCALING=false        # Experimental upscaling
```

### Testing Image Generation

```bash
# Test the image generation system
cd scripts
python test_image_generation.py
```

The Designer Agent will automatically analyze your game requirements and generate appropriate assets like:
- **Character sprites** for players and enemies
- **Background images** for game environments  
- **UI elements** for buttons and interface
- **Game icons** for items and power-ups

## 🔧 Troubleshooting

### Common Issues

**LLM Provider Not Available**
```bash
# Check your provider is running
ollama list                 # For Ollama
curl http://localhost:11434 # Test Ollama connection
```

**Python Agent Issues**
```bash
# Install Python dependencies manually
pip install -r scripts/requirements.txt

# Check Python installation
python --version  # Windows
python3 --version # Linux
```

**Task Queue Issues**
```bash
# Clean and restart
npm run clean:tasks
npm run director "new prompt"
```

**File Permission Issues (Linux)**
```bash
# Fix permissions
chmod +x setup.js
chmod +x scripts/*.js
```

### Debug Mode

Set `DEBUG=true` in `.env` for verbose logging.

## 📚 Comprehensive Documentation

### **📖 User Guides**
- **[� Documentation Index](DOCUMENTATION_INDEX.md)** - Navigate all documentation easily
- **[�🚀 Quick Reference Card](QUICK_REFERENCE.md)** - Essential commands and workflows  
- **[Project Management User Guide](PROJECT_MANAGEMENT_USER_GUIDE.md)** - Complete guide to multi-project development
- **[Best Practices Guide](BEST_PRACTICES.md)** - Professional development patterns and recommendations
- **[Quick Start Guide](QUICKSTART.md)** - Get started in 5 minutes

### **🔧 Technical References**  
- **[Project Management Technical Reference](PROJECT_MANAGEMENT_TECHNICAL_REFERENCE.md)** - Deep technical documentation
- **[Architecture Documentation](docs/architecture.md)** - System design and components
- **[Agent Prompts Reference](docs/prompts.md)** - AI agent configuration and prompts

### **🎯 Feature Documentation**
- **[AI Image Generation Guide](AI_IMAGE_GENERATION_SUCCESS.md)** - OpenAI DALL-E and Stable Diffusion integration
- **[Project Management Features](PROJECT_MANAGEMENT_FINAL_SUCCESS.md)** - Complete feature overview
- **[Feedback System](docs/feedback.md)** - AI learning and improvement mechanisms

### **🚀 Advanced Topics**
- **Multi-project game development workflows**
- **Iterative feature development strategies** 
- **AI agent optimization and customization**
- **Professional project organization patterns**
- **Scaling from prototype to production**

## 🎯 Example Workflows

### Simple Platformer Game
```bash
npm run director "2D platformer with Mario-style physics, coins, and enemies"
npm run agents:start
npm run dev:web
```

### Space Shooter
```bash
npm run director "Top-down space shooter with laser weapons and asteroid obstacles"
npm run agents:start
npm run dev:web
```

### Puzzle Game
```bash
npm run director "Match-3 puzzle game with colorful gems and power-ups"
npm run agents:start
npm run dev:web
```

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both Windows and Linux
5. Submit a pull request

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check the `docs/` directory

---

**Agent Studio** - From idea to game in minutes! 🚀

MIT License - see [LICENSE](LICENSE) file for details.

---

**Agent Studio** - Where AI meets Game Development 🤖🎮
