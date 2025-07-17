# 🎮 Agent Studio Project Management User Guide

> **Complete Guide to Multi-Project Game Development with AI Agents**

## 🌟 Overview

Agent Studio has evolved into a powerful **multi-project game development environment** that allows you to:

- **Create unlimited independent game projects**
- **Iterate and expand existing games with new features**
- **Manage multiple projects simultaneously**
- **Leverage AI for both code and visual asset generation**
- **Maintain professional project organization**

## 🏗️ Project Management System

### **Unique Project Folders**
Every project gets its own isolated environment:

```
📁 projects/
├── 2025-07-17T22-03-47_retro-blaster-fury_19af74c3/
│   ├── 📄 project.json          # Project metadata
│   ├── 📄 package.json          # Dependencies  
│   ├── 📄 vite.config.js        # Build configuration
│   ├── 📄 README.md             # Project documentation
│   ├── 📁 src/                  # Game source code
│   ├── 📁 assets/               # AI-generated assets
│   ├── 📁 epics/                # Project planning
│   ├── 📁 tasks/                # AI agent task queue
│   └── 📁 logs/                 # Development logs
└── 2025-07-17T22-25-24_tower-defense-pro_818cebc1/
    └── ... (similar structure)
```

### **Project Naming Convention**
- **Format**: `YYYY-MM-DDTHH-mm-ss_project-name_shortId`
- **Example**: `2025-07-17T22-03-47_retro-blaster-fury_19af74c3`
- **Benefits**: Chronological sorting, no conflicts, easy identification

---

## 🚀 Getting Started

### **1. Create Your First Project**

```bash
# Basic project creation
npm run director:new "Create a retro-style arcade shooter"

# With custom name
npm run director:new "Racing game with power-ups" --name "Speed Racer Pro"

# With auto-enqueue (automatically starts AI agents)
node scripts/director-enhanced.js new "Puzzle platformer" -e
```

**What happens:**
1. AI analyzes your prompt and creates 5-8 actionable epics
2. Unique project folder created with complete structure
3. Project becomes "active" for agent development
4. Epics optionally auto-enqueued for immediate AI development

### **2. Project Management Commands**

```bash
# List all projects
npm run director:list

# Show only active project
npm run director:list --active

# Switch between projects
npm run director activate 2025-07-17T22-03-47_retro-blaster-fury_19af74c3

# Continue development on active project
npm run director continue "Add boss battles"

# Continue with auto-enqueue
node scripts/director-enhanced.js continue "Add multiplayer" -e
```

---

## 🔄 Iterative Development Workflow

### **Adding Features to Existing Games**

The power of Agent Studio lies in its ability to **continuously expand games** without starting over:

#### **Example: Expanding a Racing Game**

```bash
# Initial creation
npm run director:new "Create a simple racing game"
# → Generates: Basic car controls, track, scoring

# First iteration: Add features
npm run director continue "Add power-ups and boost mechanics"
# → Generates: Power-up system, boost mechanics, visual effects

# Second iteration: Enhance gameplay  
npm run director continue "Add time trials and leaderboards"
# → Generates: Timing system, local storage, leaderboard UI

# Third iteration: Visual improvements
npm run director continue "Add particle effects and better graphics"
# → Generates: Particle systems, enhanced sprites, animations
```

#### **How Iteration Works**
1. **Context Preservation**: AI remembers original game concept
2. **Epic Merging**: New features integrate with existing systems
3. **Dependency Management**: New epics properly depend on existing work
4. **No Conflicts**: Each iteration adds to existing epic list

---

## 🎯 Best Practices

### **1. Project Creation Tips**

#### **Be Specific in Initial Prompts**
```bash
# ❌ Too vague
"Create a game"

# ✅ Clear and specific
"Create a tower defense game with unique upgrade paths and special abilities"

# ✅ Even better - includes style/theme
"Create a retro-style arcade shooter with power-ups, multiple weapon types, and boss battles"
```

#### **Use Descriptive Names**
```bash
# ❌ Generic
npm run director:new "Racing game"

# ✅ Descriptive
npm run director:new "Racing game" --name "Neon Street Racer"
```

### **2. Iteration Best Practices**

#### **Add Features Gradually**
```bash
# ✅ Focused additions
npm run director continue "Add sound effects and music"
npm run director continue "Add local multiplayer support" 
npm run director continue "Add achievements system"

# ❌ Too much at once
npm run director continue "Add sound, multiplayer, achievements, better graphics, and story mode"
```

#### **Build on Previous Features**
```bash
# First: Core mechanics
npm run director continue "Add jumping and double-jump mechanics"

# Then: Enhance with power-ups
npm run director continue "Add power-ups that enhance jumping abilities"

# Finally: Polish
npm run director continue "Add jump trail effects and landing particles"
```

### **3. Project Organization**

#### **Use Projects for Different Games**
```bash
# Separate projects for different game concepts
npm run director:new "Space exploration survival game"
npm run director:new "Medieval castle defense"
npm run director:new "Puzzle platformer with time mechanics"
```

#### **Use Continue for Feature Expansion**
```bash
# All these should be continue commands on same project:
npm run director continue "Add boss battles"
npm run director continue "Add weapon upgrades"  
npm run director continue "Add difficulty levels"
```

---

## 📋 Command Reference

### **Core Commands**

| Command | Purpose | Example |
|---------|---------|---------|
| `director:new` | Create new project | `npm run director:new "Tower defense game"` |
| `director:list` | List all projects | `npm run director:list` |
| `director continue` | Add features to project | `npm run director continue "Add multiplayer"` |
| `director activate` | Switch active project | `npm run director activate <projectId>` |

### **Advanced Options**

| Option | Short | Purpose | Example |
|--------|-------|---------|---------|
| `--name` | `-n` | Custom project name | `--name "Space Adventure"` |
| `--auto-enqueue` | `-e` | Auto-start AI agents | `-e` |
| `--active` | `-a` | Show active project only | `npm run director:list -a` |

### **Direct Script Usage**
For advanced features, use the director script directly:

```bash
cd scripts

# Create with auto-enqueue
node director-enhanced.js new "Puzzle game" -e

# Continue with auto-enqueue  
node director-enhanced.js continue "Add animations" -e

# All CLI options available
node director-enhanced.js --help
```

---

## 🎮 Example Development Sessions

### **Session 1: Creating a Complete Tower Defense Game**

```bash
# 1. Initial Creation
npm run director:new "Tower defense game with upgrade paths" --name "Tower Master"
# → Creates project: 2025-07-17T14-30-15_tower-master_abc123

# 2. Review generated epics
cat "projects/2025-07-17T14-30-15_tower-master_abc123/epics/epics.json"

# 3. Start development (auto-enqueue)
node scripts/director-enhanced.js continue "Begin development" -e

# 4. Add boss enemies
npm run director continue "Add boss enemies with special abilities"

# 5. Enhance graphics  
npm run director continue "Add particle effects and animations"

# 6. Add progression
npm run director continue "Add player progression and achievements"
```

### **Session 2: Multi-Project Management**

```bash
# Create multiple game projects
npm run director:new "Space exploration game" --name "Stellar Journey"
npm run director:new "Racing game with customization" --name "Speed Legends"  
npm run director:new "Puzzle platformer" --name "Mind Bender"

# List all projects
npm run director:list
# ★ 2025-07-17T15-45-22_mind-bender_def456 - Mind Bender (active)
#   2025-07-17T15-42-18_speed-legends_ghi789 - Speed Legends  
#   2025-07-17T15-40-12_stellar-journey_jkl012 - Stellar Journey

# Work on specific project
npm run director activate 2025-07-17T15-42-18_speed-legends_ghi789
npm run director continue "Add car customization system"

# Switch to another project
npm run director activate 2025-07-17T15-40-12_stellar-journey_jkl012  
npm run director continue "Add planet exploration mechanics"
```

### **Session 3: Feature-Rich Game Development**

```bash
# Start with core concept
npm run director:new "Metroidvania-style adventure game"

# Build core mechanics
npm run director continue "Add player movement, jumping, and basic combat"

# Add progression system
npm run director continue "Add ability unlocks and map progression"

# Enhance world
npm run director continue "Add NPCs, dialogue system, and story elements"

# Polish gameplay
npm run director continue "Add save system and multiple difficulty modes"

# Visual enhancements
npm run director continue "Add atmospheric lighting and weather effects"

# Audio implementation
npm run director continue "Add dynamic music and sound effects"
```

---

## 🔧 AI Agent Integration

### **Understanding Epic Generation**

When you create or continue a project, the Director Agent:

1. **Analyzes your prompt** using advanced LLM reasoning
2. **Generates 5-8 actionable epics** distributed across agents:
   - **Coder Agent**: Game logic, mechanics, systems
   - **Designer Agent**: Sprites, backgrounds, animations
   - **UI/UX Agent**: Interfaces, menus, user experience

3. **Creates dependencies** ensuring logical build order
4. **Assigns priorities** for optimal development flow

### **Epic Distribution Example**

For prompt: *"Add boss battles with special abilities"*

```json
[
  {
    "id": "setup-boss-system",
    "title": "Implement Boss Battle System", 
    "role": "coder",
    "priority": 5,
    "dependencies": ["core-game-engine"]
  },
  {
    "id": "boss-abilities",
    "title": "Implement Boss Special Abilities",
    "role": "coder", 
    "priority": 4,
    "dependencies": ["setup-boss-system"]
  },
  {
    "id": "boss-sprites",
    "title": "Design Boss Character Sprites",
    "role": "designer",
    "priority": 3,
    "dependencies": ["setup-boss-system"]
  },
  {
    "id": "boss-ui",
    "title": "Create Boss Health UI",
    "role": "uiux",
    "priority": 2, 
    "dependencies": ["setup-boss-system"]
  }
]
```

### **Auto-Enqueue Benefits**

Using `-e` flag automatically:
- ✅ **Enqueues epics** to project-specific task queue
- ✅ **Enables immediate AI development** without manual intervention
- ✅ **Maintains project isolation** - each project has its own queue
- ✅ **Preserves epic order** according to dependencies and priorities

---

## 🎨 AI Image Generation

Agent Studio includes comprehensive AI image generation:

### **Supported Providers**
- **OpenAI DALL-E 3/2**: Professional quality, realistic styles
- **Stable Diffusion**: Local generation, artistic styles
- **Automatic Integration**: Assets saved to project folders

### **Asset Types Generated**
- 🖼️ **Sprites**: Player characters, enemies, objects
- 🌄 **Backgrounds**: Environments, levels, scenes  
- 🎭 **UI Elements**: Buttons, icons, interfaces
- ✨ **Effects**: Particles, animations, special effects

### **Configuration**
```env
# OpenAI DALL-E (recommended)
OPENAI_API_KEY=your_api_key_here

# Local Stable Diffusion  
STABLE_DIFFUSION_URL=http://localhost:7860
```

---

## 🔍 Troubleshooting

### **Common Issues**

#### **"No active project found"**
```bash
# Solution: Create a project or activate existing one
npm run director:list
npm run director activate <projectId>
```

#### **Auto-enqueue not working with npm scripts**
```bash
# Issue: npm doesn't pass flags correctly
npm run director continue "feature" -e  # ❌ Doesn't work

# Solution: Use direct script execution  
node scripts/director-enhanced.js continue "feature" -e  # ✅ Works
```

#### **LLM connection errors**
```bash
# Check your configuration
node test-system.js

# Verify .env file
cat .env
```

### **Project Cleanup**

```bash
# Remove specific project
rm -rf "scripts/projects/2025-07-17T22-03-47_project-name_abc123"

# List project directories
ls scripts/projects/
```

---

## 📊 Monitoring Development

### **Project Statistics**
Each project tracks:
- **Creation date and time**
- **Total epics generated**
- **Features added over time**  
- **AI agent activity**

### **Task Queue Monitoring**
```bash
# Check active project's task queue
ls "scripts/projects/$(npm run director:list --active | grep -o '[0-9].*')/tasks/pending"

# Monitor agent progress
tail -f "scripts/projects/*/logs/*.log"
```

---

## 🎯 Advanced Workflows

### **Production Game Development**

1. **Planning Phase**
   ```bash
   npm run director:new "Complete RPG with combat system" --name "Epic Quest"
   ```

2. **Core Development**
   ```bash
   node scripts/director-enhanced.js continue "Character creation and stats" -e
   node scripts/director-enhanced.js continue "Combat system with skills" -e  
   node scripts/director-enhanced.js continue "Inventory and equipment" -e
   ```

3. **Content Expansion**
   ```bash
   npm run director continue "Multiple character classes"
   npm run director continue "Quest system and NPCs"
   npm run director continue "Multiple areas and dungeons"
   ```

4. **Polish Phase**
   ```bash
   npm run director continue "Save/load system"
   npm run director continue "Settings and options menu"
   npm run director continue "Performance optimization"
   ```

### **Rapid Prototyping**

```bash
# Quickly test game concepts
npm run director:new "Concept A: Physics puzzle game"
npm run director:new "Concept B: Real-time strategy"  
npm run director:new "Concept C: Social deduction game"

# Develop prototypes in parallel
npm run director activate concept-a-project-id
npm run director continue "Basic physics mechanics"

npm run director activate concept-b-project-id  
npm run director continue "Unit movement and selection"
```

---

## 🏆 Success Metrics

Agent Studio's project management system enables:

- ✅ **Unlimited concurrent projects** without conflicts
- ✅ **Professional project organization** 
- ✅ **Seamless feature iteration** on existing games
- ✅ **AI-powered development** for code and assets
- ✅ **Complete project isolation** and independence
- ✅ **Scalable workflow** from concept to completion

---

## 📚 Additional Resources

- 📖 **[Architecture Documentation](docs/architecture.md)** - Technical details
- 🎯 **[Agent Prompts](docs/prompts.md)** - AI agent configuration  
- 💬 **[Feedback System](docs/feedback.md)** - AI learning and improvement
- 🚀 **[Quick Start Guide](QUICKSTART.md)** - Get started in 5 minutes

---

*Ready to build unlimited games with AI? Start with `npm run director:new "your amazing game idea"` and let the agents bring your vision to life!* 🎮✨
