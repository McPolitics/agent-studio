#!/usr/bin/env python3
"""
Designer Agent - Generates visual assets for games
Specializes in creating game sprites, backgrounds, UI elements, and other visual content
"""

import asyncio
import json
import os
import sys
import time
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import base64
from PIL import Image
import io

# Add scripts directory to path for imports
sys.path.append(str(Path(__file__).parent))

try:
    from config_py import Config
    from task_queue_py import TaskQueue
except ImportError:
    print("❌ Required Python modules not found. Creating them...")
    # We'll create these files if they don't exist

# Configuration
AGENT_ROLE = 'designer'

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('designer_agent')

class DesignerAgent:
    def __init__(self):
        self.config = None
        self.task_queue = None
        self.session = None
        self.is_running = True
        self.project_root = Path(__file__).parent.parent
        self.assets_dir = self.project_root / 'web-game' / 'assets'
        
    async def initialize(self):
        """Initialize the designer agent"""
        try:
            logger.info("🎨 Initializing Designer Agent...")
            
            # Load configuration
            self.config = self.load_config()
            
            # Initialize task queue
            self.task_queue = TaskQueue(self.config)
            await self.task_queue.init()
            
            # Ensure assets directory exists
            self.assets_dir.mkdir(parents=True, exist_ok=True)
            
            # Setup HTTP session
            import aiohttp
            self.session = aiohttp.ClientSession()
            
            logger.info(f"✅ Designer Agent initialized")
            logger.info(f"   Assets directory: {self.assets_dir}")
            logger.info(f"   Image generation: {self.config.get('image_generation', 'disabled')}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Designer Agent: {e}")
            return False
    
    def load_config(self):
        """Load configuration from environment or defaults"""
        return {
            'image_generation': os.getenv('IMAGE_GENERATION', 'disabled'),
            'stable_diffusion_url': os.getenv('STABLE_DIFFUSION_API_URL', 'http://localhost:7860'),
            'task_queue_directory': os.getenv('TASK_QUEUE_DIRECTORY', './tasks'),
            'poll_interval': int(os.getenv('TASK_POLL_INTERVAL', '2000')) / 1000,  # Convert to seconds
            'debug': os.getenv('DEBUG', 'false').lower() == 'true'
        }
    
    async def process_task(self, task):
        """Process a design task"""
        start_time = time.time()
        logger.info(f"🎨 Processing task: {task['epic']['title']}")
        
        try:
            epic = task['epic']
            
            # Generate assets based on the task prompt
            if self.config['image_generation'] == 'disabled':
                # Create placeholder assets
                assets = await self.create_placeholder_assets(epic)
            else:
                # Generate real assets using AI
                assets = await self.generate_ai_assets(epic)
            
            duration = time.time() - start_time
            logger.info(f"✅ Completed task: {epic['title']} ({duration:.2f}s)")
            logger.info(f"   Generated {len(assets)} assets")
            
            return {
                'success': True,
                'assets': assets,
                'duration': duration
            }
            
        except Exception as e:
            logger.error(f"❌ Task failed: {task['epic']['title']} - {e}")
            return {
                'success': False,
                'error': str(e),
                'duration': time.time() - start_time
            }
    
    async def create_placeholder_assets(self, epic):
        """Create placeholder assets when image generation is disabled"""
        assets = []
        
        # Determine what types of assets to create based on the prompt
        prompt = epic['prompt'].lower()
        title = epic['title'].lower()
        
        asset_types = []
        if any(word in prompt or word in title for word in ['sprite', 'character', 'player']):
            asset_types.append('character')
        if any(word in prompt or word in title for word in ['background', 'scene', 'environment']):
            asset_types.append('background')
        if any(word in prompt or word in title for word in ['ui', 'button', 'menu', 'interface']):
            asset_types.append('ui')
        if any(word in prompt or word in title for word in ['icon', 'item', 'powerup']):
            asset_types.append('icon')
        
        # If no specific types detected, create a general game asset
        if not asset_types:
            asset_types = ['general']
        
        for asset_type in asset_types:
            asset_path = await self.create_placeholder_image(asset_type, epic['id'])
            if asset_path:
                assets.append({
                    'type': asset_type,
                    'path': str(asset_path.relative_to(self.project_root)),
                    'description': f"Placeholder {asset_type} for {epic['title']}"
                })
        
        return assets
    
    async def create_placeholder_image(self, asset_type, epic_id):
        """Create a simple placeholder image"""
        try:
            # Define image properties based on type
            size_map = {
                'character': (64, 64),
                'background': (800, 600),
                'ui': (128, 32),
                'icon': (32, 32),
                'general': (128, 128)
            }
            
            color_map = {
                'character': (100, 149, 237),  # Cornflower blue
                'background': (135, 206, 235), # Sky blue
                'ui': (169, 169, 169),         # Dark gray
                'icon': (255, 215, 0),         # Gold
                'general': (144, 238, 144)     # Light green
            }
            
            size = size_map.get(asset_type, (128, 128))
            color = color_map.get(asset_type, (128, 128, 128))
            
            # Create image
            img = Image.new('RGB', size, color)
            
            # Save image
            filename = f"{asset_type}_{epic_id}_{int(time.time())}.png"
            asset_path = self.assets_dir / filename
            img.save(asset_path)
            
            logger.info(f"💾 Created placeholder asset: {filename}")
            return asset_path
            
        except Exception as e:
            logger.error(f"❌ Failed to create placeholder image: {e}")
            return None
    
    async def generate_ai_assets(self, epic):
        """Generate assets using AI (Stable Diffusion)"""
        # This would implement actual AI image generation
        # For now, fall back to placeholders
        logger.warning("AI asset generation not fully implemented, using placeholders")
        return await self.create_placeholder_assets(epic)
    
    async def poll_for_tasks(self):
        """Main polling loop for tasks"""
        logger.info("🎯 Designer Agent polling for tasks...")
        
        while self.is_running:
            try:
                # Get next task for this agent role
                task = await self.task_queue.dequeue(AGENT_ROLE)
                
                if task:
                    # Process the task
                    result = await self.process_task(task)
                    
                    if result['success']:
                        await self.task_queue.complete_task(task['id'], result)
                    else:
                        await self.task_queue.fail_task(task['id'], Exception(result['error']))
                
                # Wait before polling again
                if self.is_running:
                    await asyncio.sleep(self.config['poll_interval'])
                
            except Exception as e:
                logger.error(f"❌ Error in polling loop: {e}")
                
                # Wait a bit longer on error to avoid spam
                if self.is_running:
                    await asyncio.sleep(self.config['poll_interval'] * 2)
    
    async def shutdown(self):
        """Shutdown the agent gracefully"""
        logger.info("🛑 Shutting down Designer Agent...")
        self.is_running = False
        
        if self.session:
            await self.session.close()
        
        # Give some time for current task to complete
        await asyncio.sleep(1)
        
        logger.info("👋 Designer Agent shutdown complete")

# Task Queue implementation for Python
class TaskQueue:
    def __init__(self, config):
        self.config = config
        self.queue_dir = Path(config['task_queue_directory'])
        self.pending_dir = self.queue_dir / 'pending'
        self.processing_dir = self.queue_dir / 'processing'
        self.completed_dir = self.queue_dir / 'completed'
        self.failed_dir = self.queue_dir / 'failed'
    
    async def init(self):
        """Initialize task queue directories"""
        for dir_path in [self.queue_dir, self.pending_dir, self.processing_dir, 
                        self.completed_dir, self.failed_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    async def dequeue(self, agent_role):
        """Get next task for specific agent role"""
        try:
            task_files = [f for f in self.pending_dir.glob('*.json')]
            
            for task_file in task_files:
                try:
                    with open(task_file, 'r') as f:
                        task = json.load(f)
                    
                    # Check if task is for this agent role
                    if task['epic']['role'] == agent_role:
                        # Move task to processing
                        processing_path = self.processing_dir / task_file.name
                        task_file.rename(processing_path)
                        
                        task['status'] = 'processing'
                        task['processedAt'] = time.time()
                        task['processingPath'] = str(processing_path)
                        
                        with open(processing_path, 'w') as f:
                            json.dump(task, f, indent=2)
                        
                        logger.info(f"📤 Dequeued task: {task['epic']['title']} ({task['id']})")
                        return task
                
                except Exception as e:
                    logger.error(f"Error reading task file {task_file}: {e}")
            
            return None  # No tasks available for this role
            
        except Exception as e:
            logger.error(f"Error dequeuing task: {e}")
            return None
    
    async def complete_task(self, task_id, result=None):
        """Mark task as completed"""
        processing_path = self.processing_dir / f"{task_id}.json"
        completed_path = self.completed_dir / f"{task_id}.json"
        
        try:
            with open(processing_path, 'r') as f:
                task = json.load(f)
            
            task['status'] = 'completed'
            task['completedAt'] = time.time()
            if result:
                task['result'] = result
            
            with open(completed_path, 'w') as f:
                json.dump(task, f, indent=2)
            
            processing_path.unlink()
            
            logger.info(f"✅ Completed task: {task['epic']['title']} ({task_id})")
            
        except Exception as e:
            logger.error(f"Error completing task {task_id}: {e}")
    
    async def fail_task(self, task_id, error):
        """Mark task as failed"""
        processing_path = self.processing_dir / f"{task_id}.json"
        failed_path = self.failed_dir / f"{task_id}.json"
        
        try:
            with open(processing_path, 'r') as f:
                task = json.load(f)
            
            task['status'] = 'failed'
            task['failedAt'] = time.time()
            task['error'] = str(error)
            
            with open(failed_path, 'w') as f:
                json.dump(task, f, indent=2)
            
            processing_path.unlink()
            
            logger.info(f"❌ Failed task: {task['epic']['title']} ({task_id})")
            
        except Exception as e:
            logger.error(f"Error failing task {task_id}: {e}")

async def main():
    """Main entry point"""
    agent = DesignerAgent()
    
    try:
        print("🚀 Starting Designer Agent...")
        print(f"Platform: {sys.platform}")
        print(f"Python: {sys.version}")
        
        # Initialize the agent
        initialized = await agent.initialize()
        if not initialized:
            sys.exit(1)
        
        # Start polling for tasks
        await agent.poll_for_tasks()
        
    except KeyboardInterrupt:
        print("\n🛑 Received interrupt, shutting down gracefully...")
        await agent.shutdown()
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        await agent.shutdown()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
