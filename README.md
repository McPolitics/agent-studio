# Agent Studio

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
   ```bash
   # Generate project plan
   npm run director "Create a 2D platformer with jumping character and coins"
   
   # Start the agents
   npm run agents:start
   
   # Preview your game (in another terminal)
   npm run dev:web
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
IMAGE_GENERATION=disabled        # or 'local' for AI image generation

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

```
agent-studio/
├── 📁 scripts/              # Agent workers and core logic
│   ├── config.js            # Cross-platform configuration
│   ├── llm-client.js        # Universal LLM client
│   ├── task-queue.js        # File-based task queue
│   ├── director.js          # Project planning agent
│   ├── coder_agent.js       # Code generation agent
│   ├── designer_agent.py    # Asset creation agent
│   └── uiux_agent.js        # UI/UX design agent
├── 📁 web-game/             # Generated game files
│   ├── src/                 # Game source code
│   ├── assets/              # Generated assets
│   └── package.json         # Game dependencies
├── 📁 tasks/                # Task queue storage
│   ├── pending/             # Waiting tasks
│   ├── processing/          # Active tasks
│   ├── completed/           # Done tasks
│   └── failed/              # Failed tasks
├── 📁 output/               # Generated files
├── 📁 logs/                 # Application logs
├── .env                     # Configuration
└── setup.js                # Setup script
```

## 🛠️ Commands Reference

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
