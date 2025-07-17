# Agent Studio

> Autonomous AI-Powered Game Development Studio

Agent Studio is a revolutionary autonomous development system that uses specialized AI agents to create complete game projects from simple text prompts. The system breaks down complex development tasks into manageable epics and distributes them across specialized agents for parallel execution.

## 🎯 Overview

The Agent Studio employs a director-agent architecture where:

1. **Director Agent** analyzes user prompts and creates actionable development epics
2. **Specialized Agents** execute tasks in parallel:
   - **Coder Agent**: Implements game logic using Phaser.js
   - **Designer Agent**: Generates visual assets via Stable Diffusion
   - **UI/UX Agent**: Creates user interfaces and experience flows
3. **Integration Pipeline** assembles components into a complete playable game

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Prompt   │───▶│  Director Agent  │───▶│  Epic Queue     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌─────────────────────────────────┼─────────────────────────────────┐
                       ▼                                 ▼                                 ▼
               ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
               │  Coder Agent    │              │ Designer Agent  │              │  UI/UX Agent    │
               │                 │              │                 │              │                 │
               │ • Game Logic    │              │ • Sprites       │              │ • Menus         │
               │ • Physics       │              │ • Backgrounds   │              │ • HUD           │
               │ • Scenes        │              │ • Effects       │              │ • Prototypes    │
               └─────────────────┘              └─────────────────┘              └─────────────────┘
                       │                                 │                                 │
                       └─────────────────────────────────┼─────────────────────────────────┘
                                                         ▼
                                              ┌─────────────────┐
                                              │   Web Game      │
                                              │                 │
                                              │ • Vite + Phaser │
                                              │ • Deployed      │
                                              │ • Monitored     │
                                              └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

**Development Machine (Ryzen 5 + 6700 XT recommended):**
- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- Git
- 16GB+ RAM
- 50GB+ free storage

**Infrastructure (HP MicroServer or similar):**
- Redis for task queuing
- Prometheus & Grafana for monitoring
- CI/CD pipeline support

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd agent-studio
   code .  # Open in VS Code
   ```

2. **Install Dependencies**
   ```bash
   # Run VS Code Task: "Setup Project"
   # OR manually:
   cd scripts && npm install
   pip install -r requirements.txt
   cd ../web-game && npm install
   ```

3. **Start Infrastructure**
   ```bash
   # Run VS Code Task: "Start Docker Services"
   # OR manually:
   docker-compose -f config/docker-compose.yml up -d
   ```

4. **Optional: Setup Local LLM**
   ```bash
   # Run VS Code Task: "Quantize Model"
   # This downloads and quantizes Llama 2-7B (requires ~20GB)
   ```

### Usage

#### Method 1: VS Code Tasks (Recommended)

1. **Ctrl+Shift+P** → "Tasks: Run Task"
2. Select **"Run Director"**
3. Enter your game idea when prompted
4. Run **"Start All Agents"** to begin processing
5. Run **"Serve Web Game"** to preview results

#### Method 2: Command Line

```bash
# 1. Generate epics from prompt
node scripts/director.js "Create a 2D platformer with collectibles"

# 2. Enqueue epics for processing
node scripts/enqueue.js

# 3. Start agents (in separate terminals)
node scripts/coder_agent.js
python scripts/designer_agent.py
node scripts/uiux_agent.js

# 4. Start web game development server
cd web-game && npm run dev
```

## 🎮 Features

### Automated Game Development
- **Code Generation**: Complete Phaser.js scenes and game logic
- **Asset Creation**: AI-generated sprites, backgrounds, and UI elements
- **UI/UX Design**: Responsive interfaces and user experience flows
- **Version Control**: Automatic Git commits for all generated content

### Development Tools
- **VS Code Integration**: Tasks and launch configurations
- **Hot Reloading**: Live preview during development
- **Error Handling**: Comprehensive error tracking and reporting
- **Monitoring**: Real-time metrics via Prometheus/Grafana

### Production Ready
- **CI/CD Pipeline**: Automated testing and deployment
- **Performance Optimized**: Minified builds with chunking
- **Error Tracking**: Sentry integration for production monitoring
- **Analytics**: Game usage tracking and insights

## 🔧 Configuration

### Environment Variables

```bash
# LLM Configuration
LLM_SERVER_URL=http://localhost:5000
HUGGINGFACE_API_TOKEN=your_token_here

# Infrastructure
REDIS_URL=redis://localhost:6379
STABLE_DIFFUSION_URL=http://127.0.0.1:7860

# Monitoring
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ID=your_analytics_id

# Deployment
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id
```

### Hardware Mapping

**Development Workstation:**
- **CPU**: AMD Ryzen 5 (LLM inference, compilation)
- **GPU**: RX 6700 XT (Stable Diffusion, game rendering)
- **RAM**: 16-32GB (model loading, parallel processing)
- **Storage**: NVMe SSD (fast model access, build times)

**Infrastructure Server:**
- **Device**: HP MicroServer Gen10+ or similar
- **Role**: Redis queue, CI/CD, monitoring stack
- **Network**: Gigabit LAN for fast asset transfer
- **Storage**: RAID for reliability

## 📊 Monitoring

### Metrics Available
- **Agent Performance**: Task completion rates, processing times
- **Resource Usage**: CPU, memory, GPU utilization
- **Game Analytics**: Player interactions, performance metrics
- **Infrastructure**: Redis queue depth, response times

### Dashboards
- Access Grafana at `http://localhost:3000` (admin/admin)
- View real-time agent activity and system health
- Monitor game deployment and user engagement

## 🛠️ Development

### Adding New Agent Types

1. Create agent script in `scripts/`
2. Add system prompt to `docs/prompts.md`
3. Update VS Code tasks and launch configs
4. Add monitoring metrics
5. Document in architecture

### Custom Game Templates

1. Modify Director Agent prompts
2. Add specialized Coder Agent templates
3. Create Designer Agent style guides
4. Update UI/UX Agent components

### Extending Infrastructure

1. Add services to `docker-compose.yml`
2. Update Prometheus scraping config
3. Create Grafana dashboards
4. Document monitoring setup

## 🚨 Troubleshooting

### Common Issues

**"Cannot connect to LLM server"**
- Ensure Docker services are running
- Check if model quantization completed
- Verify port 5000 is available

**"Redis connection failed"**
- Run `docker-compose up redis`
- Check Redis health: `redis-cli ping`

**"Agent not processing tasks"**
- Verify epics were enqueued: `redis-cli XLEN agent_tasks`
- Check agent logs for errors
- Ensure correct role assignment in epics

**"Build failures"**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all dependencies installed

### Performance Optimization

**Slow LLM Inference:**
- Use GPU acceleration with ROCm/CUDA
- Reduce model size (use smaller quantization)
- Implement request batching

**Asset Generation Timeouts:**
- Increase Stable Diffusion timeout
- Use Hugging Face API as fallback
- Cache frequently used assets

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add agent or infrastructure improvements
4. Test with sample prompts
5. Submit pull request with documentation

## 🎉 Getting Help

- **Documentation**: See `docs/` directory
- **Issues**: GitHub issue tracker
- **Discussions**: GitHub discussions for ideas
- **Monitoring**: Check Grafana dashboards for system health

---

**Agent Studio** - Where AI meets Game Development 🤖🎮
