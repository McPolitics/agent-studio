# Quick Start Guide

## 🚀 Getting Started with Agent Studio

This guide will get you up and running with Agent Studio in just a few minutes!

### Prerequisites Check

Before you start, make sure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Python 3.9+** - [Download here](https://python.org/) (optional)
- **Git** - [Download here](https://git-scm.com/)

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd agent-studio

# Run the automated setup
node setup.js
```

The setup script will:
- ✅ Check your system requirements
- ✅ Create necessary directories
- ✅ Install all dependencies
- ✅ Create a `.env` configuration file

### 2. Configure Your LLM Provider

Edit the `.env` file created in the previous step:

#### Option A: Ollama (Free, Local)
```env
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2:7b
```

**Setup Ollama:**
1. Install Ollama from https://ollama.ai
2. Start the service: `ollama serve`
3. Pull a model: `ollama pull llama2:7b`

#### Option B: OpenAI (Paid, Cloud)
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

Get your API key from https://platform.openai.com

#### Option C: Anthropic (Paid, Cloud)
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

Get your API key from https://console.anthropic.com

### 3. Create Your First Game

```bash
# Generate a development plan
npm run director "Create a simple 2D platformer with a jumping character and collectible coins"

# Start the AI agents
npm run agents:start

# In another terminal, start the game preview
npm run dev:web
```

### 4. Watch the Magic Happen

1. **Director Agent** breaks down your idea into specific tasks
2. **Coder Agent** generates Phaser.js game code
3. **Designer Agent** creates placeholder assets (or AI-generated if configured)
4. **UI/UX Agent** designs the user interface
5. **Game Preview** shows your game at http://localhost:5173

### 5. Game Development Workflow

```bash
# Clean previous tasks (optional)
npm run clean

# Generate new game concept
npm run director "Create a space shooter with power-ups and enemies"

# Start agents (they'll automatically pick up the new tasks)
npm run agents:start

# Monitor progress by watching the terminal output
# Files will be generated in the web-game/ directory
```

## 🎮 Example Game Ideas

Try these prompts with the director agent:

```bash
# Classic platformer
npm run director "2D platformer like Mario with jumping, enemies, and power-ups"

# Space shooter
npm run director "Top-down space shooter with multiple weapon types and asteroid fields"

# Puzzle game
npm run director "Match-3 puzzle game with cascading gems and special effects"

# Racing game
npm run director "Simple racing game with multiple tracks and car upgrades"

# Adventure game
npm run director "Point-and-click adventure with inventory system and dialogue"
```

## 🔧 Troubleshooting

### "LLM provider not available"
- Check your `.env` configuration
- For Ollama: Make sure `ollama serve` is running
- For API providers: Verify your API keys

### "Python agent failed to start"
- Install Python dependencies: `pip install -r scripts/requirements.txt`
- The Designer agent is optional - other agents will still work

### "Tasks not processing"
- Check that agents are running: `npm run agents:start`
- Clean task queue: `npm run clean:tasks`
- Restart with a new prompt

### "Game not loading"
- Make sure web dev server is running: `npm run dev:web`
- Check browser console for errors
- Verify files are being generated in `web-game/src/`

## 📚 Next Steps

Once you're comfortable with the basics:

1. **Customize Agent Prompts** - Edit the system prompts in agent files
2. **Enable AI Image Generation** - Configure Stable Diffusion for the Designer Agent
3. **Extend Game Types** - Modify agents to support new game genres
4. **Add Custom Assets** - Place custom sprites in `web-game/assets/`

## 🆘 Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Look at generated `epics.json` to understand task breakdown
- Monitor agent logs for debugging information
- Create an issue on GitHub if you encounter problems

---

**Happy game developing!** 🎮✨
