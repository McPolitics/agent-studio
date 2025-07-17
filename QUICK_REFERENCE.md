# 🚀 Agent Studio Quick Reference

> **Essential Commands and Workflows for Rapid Game Development**

## 📋 Command Quick Reference

### **Project Management**
```bash
# Create new projects
npm run director:new "Your game idea"                    # Basic creation
npm run director:new "Game idea" --name "Custom Name"    # With custom name
node scripts/director-enhanced.js new "Game idea" -e     # With auto-development

# Project navigation  
npm run director:list                                     # List all projects
npm run director:list --active                          # Show active project
npm run director activate <project-id>                  # Switch projects

# Feature expansion
npm run director continue "Add new features"             # Basic iteration
node scripts/director-enhanced.js continue "Features" -e # With auto-development
```

### **Development Workflow**
```bash
# Start AI agents (works on active project)
npm run agents:start

# Preview game (from project folder)
cd scripts/projects/your-project-folder && npm run dev

# Build for production
cd scripts/projects/your-project-folder && npm run build
```

### **System Management**
```bash
# Check system health
node test-system.js

# View configuration
cat .env

# Monitor task queues
ls scripts/projects/*/tasks/pending/
```

---

## 🎮 Common Game Development Patterns

### **🏗️ Foundation Building**
```bash
# 1. Create core concept
npm run director:new "2D platformer with basic jumping mechanics"

# 2. Add core gameplay
npm run director continue "Add enemies, coins, and collision detection"

# 3. Build game systems
npm run director continue "Add health system and power-ups"

# 4. Expand content
npm run director continue "Add multiple levels and checkpoints"

# 5. Polish experience
npm run director continue "Add particle effects and sound"
```

### **🎯 Genre-Specific Templates**

#### **Arcade Shooter**
```bash
npm run director:new "Top-down space shooter with enemy waves and power-ups"
npm run director continue "Add boss battles with unique attack patterns"
npm run director continue "Add weapon upgrades and special abilities"
npm run director continue "Add particle effects and screen shake"
```

#### **Platformer**
```bash
npm run director:new "2D platformer with precise jump controls and collectibles"
npm run director continue "Add wall-jumping and double-jump mechanics"
npm run director continue "Add moving platforms and environmental hazards"
npm run director continue "Add character animations and visual feedback"
```

#### **Tower Defense**
```bash
npm run director:new "Tower defense with unique upgrade paths and special abilities"
npm run director continue "Add multiple enemy types with different behaviors"
npm run director continue "Add environmental effects and tower combinations"
npm run director continue "Add progression system and achievements"
```

#### **Puzzle Game**
```bash
npm run director:new "Match-3 puzzle game with cascading effects and combos"
npm run director continue "Add special pieces and power-up combinations"
npm run director continue "Add level progression and objectives"
npm run director continue "Add juice effects and satisfying feedback"
```

---

## 🔄 Multi-Project Workflows

### **🎨 Creative Exploration**
```bash
# Create multiple concepts
npm run director:new "Concept A: Gravity manipulation puzzle"
npm run director:new "Concept B: Time-rewinding platformer"  
npm run director:new "Concept C: Perspective-shifting adventure"

# Develop prototypes
npm run director activate concept-a-id
npm run director continue "Build core gravity mechanics"

npm run director activate concept-b-id
npm run director continue "Implement time rewind system"
```

### **🏭 Production Pipeline**
```bash
# Main project development
npm run director activate main-project-id
npm run director continue "Polish core gameplay loop"

# Asset creation project
npm run director activate asset-project-id  
npm run director continue "Generate consistent art style"

# Testing/experimental project
npm run director activate test-project-id
npm run director continue "Test new mechanic ideas"
```

---

## 🛠️ Troubleshooting Quick Fixes

### **Common Issues**

#### **"No active project found"**
```bash
npm run director:list                    # See all projects
npm run director activate <project-id>   # Set active project
```

#### **LLM connection errors**
```bash
node test-system.js                      # Check system status
cat .env                                 # Verify configuration
```

#### **Auto-enqueue not working**
```bash
# Use direct script instead of npm
cd scripts
node director-enhanced.js continue "feature" -e
```

#### **Project folder issues**
```bash
# Check project structure
ls scripts/projects/your-project-id/
```

### **Reset Commands**
```bash
# Clear task queues
rm scripts/projects/*/tasks/pending/*

# Reset active project
rm scripts/.active-project

# Fresh project start
rm -rf scripts/projects/problem-project-id/
```

---

## 💡 Pro Tips

### **🎯 Effective Prompting**
- **Be specific**: "Add boss enemies with dive-bomb attacks" vs "Add enemies"
- **Reference existing**: "Enhance the jumping system with wall-jumping"
- **Include style**: "Add retro-style particle effects"
- **Focus scope**: One system per iteration

### **📁 Project Organization**
- **Descriptive names**: Use `--name "Stellar Adventure"` not `--name "Game1"`
- **Logical grouping**: Group related experiments/prototypes
- **Regular cleanup**: Remove abandoned prototype projects
- **Version branches**: Use git branches for major feature experiments

### **🔄 Development Rhythm**
- **Start simple**: Begin with core mechanics only
- **Build incrementally**: Add one feature category at a time  
- **Test frequently**: Verify each addition before continuing
- **Polish last**: Save effects and juice for final iterations

### **🤖 AI Agent Optimization**
- **Use auto-enqueue (-e)** for well-defined systems
- **Manual review** for experimental features
- **Check epics** before committing to large changes
- **Monitor task queues** for agent activity

---

## 📊 Project Status Monitoring

### **Health Checks**
```bash
# System status
node test-system.js

# Project activity
npm run director:list

# Task queue status  
find scripts/projects -name "pending" -exec ls {} \;

# Agent logs
tail -f scripts/projects/*/logs/agent-activity.log
```

### **Performance Metrics**
```bash
# Project statistics
cat scripts/projects/your-project/project.json | grep -A 10 "statistics"

# Epic completion rate
ls scripts/projects/your-project/tasks/completed/ | wc -l

# Development timeline
ls -la scripts/projects/your-project/epics/
```

---

## 🚀 Advanced Usage

### **Batch Operations**
```bash
# Create multiple related projects
for concept in "Racing" "Puzzle" "Shooter"; do
  npm run director:new "$concept game prototype" --name "$concept Proto"
done

# Mass feature addition
for project in $(npm run director:list | grep -o '[0-9].*'); do
  npm run director activate $project
  npm run director continue "Add sound effects"
done
```

### **Custom Workflows**
```bash
# Development sprint workflow
npm run director continue "Sprint 1: Core mechanics" 
# ... develop and test ...
npm run director continue "Sprint 2: Content expansion"
# ... develop and test ...
npm run director continue "Sprint 3: Polish and effects"
```

### **Integration with Tools**
```bash
# Git integration
cd scripts/projects/your-project
git init && git add . && git commit -m "Initial project"

# CI/CD preparation  
npm run build                            # Test build process
npm test                                 # Run any tests
```

---

## 📖 Learning Path

### **Beginner** (First Time)
1. Read **[Quick Start Guide](QUICKSTART.md)** 
2. Create first project: `npm run director:new "Simple platformer"`
3. Try iteration: `npm run director continue "Add coins"`
4. Start agents: `npm run agents:start`

### **Intermediate** (Getting Comfortable)  
1. Read **[Project Management User Guide](PROJECT_MANAGEMENT_USER_GUIDE.md)**
2. Try multi-project workflow
3. Use auto-enqueue features
4. Experiment with different game genres

### **Advanced** (Mastering the System)
1. Read **[Best Practices Guide](BEST_PRACTICES.md)**
2. Read **[Technical Reference](PROJECT_MANAGEMENT_TECHNICAL_REFERENCE.md)**
3. Customize agent prompts and templates
4. Integrate with professional development workflows

---

*Keep this reference handy for quick access to Agent Studio's most useful commands and patterns!* 🎮✨
