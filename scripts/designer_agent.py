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
import aiohttp
import urllib.parse

# Add scripts directory to path for imports
sys.path.append(str(Path(__file__).parent))

# We don't need these imports anymore - using built-in config loading
try:
    # These imports are not needed in the simplified version
    pass
except ImportError:
    print("Required Python modules not found. Creating them...")
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
            logger.info("Designer Agent initializing...")
            
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
            
            logger.info(f"Designer Agent initialized")
            logger.info(f"   Assets directory: {self.assets_dir}")
            provider = self.config.get('image_generation_provider', 'disabled')
            if provider == 'disabled':
                provider = self.config.get('image_generation', 'disabled')  # Legacy support
            logger.info(f"   Image generation provider: {provider}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Designer Agent: {e}")
            return False
    
    def load_config(self):
        """Load configuration from environment or defaults"""
        # Load environment variables from .env file if it exists
        env_path = self.project_root / '.env'
        if env_path.exists():
            from dotenv import load_dotenv
            load_dotenv(env_path)
        
        return {
            # Image generation settings
            'image_generation_provider': os.getenv('IMAGE_GENERATION_PROVIDER', 'disabled'),
            'image_generation': os.getenv('IMAGE_GENERATION', 'disabled'),  # Legacy support
            
            # OpenAI DALL-E settings
            'openai_image_api_key': os.getenv('OPENAI_IMAGE_API_KEY', os.getenv('OPENAI_API_KEY', '')),
            'openai_image_model': os.getenv('OPENAI_IMAGE_MODEL', 'dall-e-3'),
            'openai_image_size': os.getenv('OPENAI_IMAGE_SIZE', '1024x1024'),
            'openai_image_quality': os.getenv('OPENAI_IMAGE_QUALITY', 'standard'),
            
            # Stable Diffusion settings
            'stable_diffusion_url': os.getenv('STABLE_DIFFUSION_API_URL', 'http://localhost:7860'),
            'stable_diffusion_model': os.getenv('STABLE_DIFFUSION_MODEL', 'stable-diffusion-v1-5'),
            
            # General settings
            'image_generation_style': os.getenv('IMAGE_GENERATION_STYLE', 'pixel-art'),
            'image_generation_format': os.getenv('IMAGE_GENERATION_FORMAT', 'png'),
            'max_image_size': int(os.getenv('MAX_IMAGE_SIZE', '1024')),
            'enable_image_upscaling': os.getenv('ENABLE_IMAGE_UPSCALING', 'false').lower() == 'true',
            
            # Task queue settings
            'task_queue_directory': os.getenv('TASK_QUEUE_DIRECTORY', './data/tasks'),
            'poll_interval': int(os.getenv('TASK_POLL_INTERVAL', '2000')) / 1000,  # Convert to seconds
            'debug': os.getenv('DEBUG', 'false').lower() == 'true'
        }
    
    async def process_task(self, task):
        """Process a design task"""
        start_time = time.time()
        logger.info(f"Processing task: {task['epic']['title']}")
        
        try:
            epic = task['epic']
            
            # Generate assets based on the task prompt
            provider = self.config.get('image_generation_provider', 'disabled')
            if provider == 'disabled':
                provider = self.config.get('image_generation', 'disabled')  # Legacy support
            
            if provider == 'disabled':
                # Create placeholder assets
                assets = await self.create_placeholder_assets(epic)
            else:
                # Generate real assets using AI
                assets = await self.generate_ai_assets(epic, provider)
            
            duration = time.time() - start_time
            logger.info(f"Completed task: {epic['title']} ({duration:.2f}s)")
            logger.info(f"   Generated {len(assets)} assets")
            
            return {
                'success': True,
                'assets': assets,
                'duration': duration
            }
            
        except Exception as e:
            logger.error(f"Task failed: {task['epic']['title']} - {e}")
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
            
            logger.info(f"Created placeholder asset: {filename}")
            return asset_path
            
        except Exception as e:
            logger.error(f"Failed to create placeholder image: {e}")
            return None
    
    async def generate_ai_assets(self, epic, provider):
        """Generate assets using AI image generation"""
        assets = []
        
        try:
            # Analyze the epic to determine what assets to generate
            asset_requests = self.analyze_epic_for_assets(epic)
            
            for asset_request in asset_requests:
                logger.info(f"Generating {asset_request['type']} asset: {asset_request['prompt']}")
                
                # Generate the asset using the specified provider
                if provider == 'openai':
                    asset_path = await self.generate_openai_image(asset_request, epic['id'])
                elif provider == 'stable-diffusion':
                    asset_path = await self.generate_stable_diffusion_image(asset_request, epic['id'])
                elif provider == 'local':
                    asset_path = await self.generate_local_image(asset_request, epic['id'])
                else:
                    logger.warning(f"Unknown provider '{provider}', falling back to placeholder")
                    asset_path = await self.create_placeholder_image(asset_request['type'], epic['id'])
                
                if asset_path:
                    assets.append({
                        'type': asset_request['type'],
                        'path': str(asset_path.relative_to(self.project_root)),
                        'description': asset_request['description'],
                        'prompt': asset_request['prompt'],
                        'provider': provider
                    })
                    
        except Exception as e:
            logger.error(f"AI asset generation failed: {e}")
            # Fall back to placeholder assets
            logger.info("Falling back to placeholder assets")
            assets = await self.create_placeholder_assets(epic)
        
        return assets
    
    def analyze_epic_for_assets(self, epic):
        """Analyze an epic to determine what assets need to be generated"""
        prompt = epic['prompt'].lower()
        title = epic['title'].lower()
        
        assets = []
        base_style = self.config.get('image_generation_style', 'pixel-art')
        
        # Determine asset types based on keywords
        if any(word in prompt or word in title for word in ['sprite', 'character', 'player', 'snake']):
            assets.append({
                'type': 'character',
                'prompt': f"{base_style} game character sprite, {epic['prompt']}, clean background, game asset",
                'description': f"Character sprite for {epic['title']}",
                'size': (64, 64)
            })
        
        if any(word in prompt or word in title for word in ['background', 'scene', 'environment', 'map']):
            assets.append({
                'type': 'background',
                'prompt': f"{base_style} game background, {epic['prompt']}, tileable, game environment",
                'description': f"Background for {epic['title']}",
                'size': (800, 600)
            })
        
        if any(word in prompt or word in title for word in ['ui', 'button', 'menu', 'interface', 'hud']):
            assets.append({
                'type': 'ui',
                'prompt': f"{base_style} game UI element, {epic['prompt']}, clean design, user interface",
                'description': f"UI element for {epic['title']}",
                'size': (128, 32)
            })
        
        if any(word in prompt or word in title for word in ['icon', 'item', 'powerup', 'food', 'pickup']):
            assets.append({
                'type': 'icon',
                'prompt': f"{base_style} game icon, {epic['prompt']}, small item, game asset",
                'description': f"Game icon for {epic['title']}",
                'size': (32, 32)
            })
        
        # If no specific types detected, create a general game asset
        if not assets:
            assets.append({
                'type': 'general',
                'prompt': f"{base_style} game asset, {epic['prompt']}, video game art",
                'description': f"Game asset for {epic['title']}",
                'size': (128, 128)
            })
        
        return assets
    
    async def generate_openai_image(self, asset_request, epic_id):
        """Generate image using OpenAI DALL-E"""
        try:
            api_key = self.config.get('openai_image_api_key')
            if not api_key:
                raise ValueError("OpenAI API key not configured")
            
            # Prepare the API request
            url = "https://api.openai.com/v1/images/generations"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            # Optimize prompt for DALL-E
            optimized_prompt = self.optimize_prompt_for_dalle(asset_request['prompt'])
            
            payload = {
                "model": self.config.get('openai_image_model', 'dall-e-3'),
                "prompt": optimized_prompt,
                "size": self.config.get('openai_image_size', '1024x1024'),
                "quality": self.config.get('openai_image_quality', 'standard'),
                "n": 1
            }
            
            # Make the API request
            async with self.session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    image_url = result['data'][0]['url']
                    
                    # Download and save the image
                    return await self.download_and_save_image(
                        image_url, 
                        asset_request['type'], 
                        epic_id,
                        target_size=asset_request.get('size')
                    )
                else:
                    error_text = await response.text()
                    raise Exception(f"OpenAI API error {response.status}: {error_text}")
                    
        except Exception as e:
            logger.error(f"OpenAI image generation failed: {e}")
            return None
    
    async def generate_stable_diffusion_image(self, asset_request, epic_id):
        """Generate image using Stable Diffusion API"""
        try:
            api_url = self.config.get('stable_diffusion_url', 'http://localhost:7860')
            
            # Prepare the API request for Automatic1111 API format
            url = f"{api_url}/sdapi/v1/txt2img"
            
            payload = {
                "prompt": asset_request['prompt'],
                "negative_prompt": "blurry, low quality, distorted, ugly, bad anatomy",
                "steps": 20,
                "cfg_scale": 7,
                "width": asset_request.get('size', (512, 512))[0],
                "height": asset_request.get('size', (512, 512))[1],
                "sampler_name": "DPM++ 2M Karras"
            }
            
            # Make the API request
            async with self.session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    
                    # The image is returned as base64
                    if result.get('images') and len(result['images']) > 0:
                        image_data = base64.b64decode(result['images'][0])
                        
                        # Save the image
                        return await self.save_image_data(
                            image_data,
                            asset_request['type'],
                            epic_id,
                            target_size=asset_request.get('size')
                        )
                else:
                    error_text = await response.text()
                    raise Exception(f"Stable Diffusion API error {response.status}: {error_text}")
                    
        except Exception as e:
            logger.error(f"Stable Diffusion image generation failed: {e}")
            return None
    
    async def generate_local_image(self, asset_request, epic_id):
        """Generate image using local AI model (placeholder for custom implementations)"""
        logger.warning("Local image generation not implemented, using placeholder")
        return await self.create_placeholder_image(asset_request['type'], epic_id)
    
    def optimize_prompt_for_dalle(self, prompt):
        """Optimize prompt specifically for DALL-E"""
        # DALL-E works better with descriptive, clear prompts
        optimizations = {
            'pixel-art': 'pixel art style, 8-bit graphics, retro video game',
            'sprite': 'clean sprite with transparent background',
            'game asset': 'video game asset, professional game art'
        }
        
        optimized = prompt
        for key, replacement in optimizations.items():
            if key in prompt.lower():
                optimized = optimized.replace(key, replacement)
        
        # Add quality modifiers for DALL-E
        optimized += ", high quality, clean design, professional game art"
        
        return optimized
    
    async def download_and_save_image(self, image_url, asset_type, epic_id, target_size=None):
        """Download image from URL and save it"""
        try:
            async with self.session.get(image_url) as response:
                if response.status == 200:
                    image_data = await response.read()
                    return await self.save_image_data(image_data, asset_type, epic_id, target_size)
                else:
                    raise Exception(f"Failed to download image: {response.status}")
        except Exception as e:
            logger.error(f"Failed to download and save image: {e}")
            return None
    
    async def save_image_data(self, image_data, asset_type, epic_id, target_size=None):
        """Save image data to file with optional resizing"""
        try:
            # Load image from bytes
            img = Image.open(io.BytesIO(image_data))
            
            # Convert to RGBA if needed (for transparency support)
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Resize if target size is specified
            if target_size and img.size != target_size:
                img = img.resize(target_size, Image.Resampling.LANCZOS)
            
            # Generate filename
            timestamp = int(time.time())
            filename = f"{asset_type}_{epic_id}_{timestamp}.png"
            asset_path = self.assets_dir / filename
            
            # Save the image
            img.save(asset_path, 'PNG')
            
            logger.info(f"Generated AI asset: {filename} ({img.size[0]}x{img.size[1]})")
            return asset_path
            
        except Exception as e:
            logger.error(f"Failed to save image data: {e}")
            return None
    
    async def poll_for_tasks(self):
        """Main polling loop for tasks"""
        logger.info("Designer Agent polling for tasks...")
        
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
                logger.error(f"Error in polling loop: {e}")
                
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
            
            logger.info(f"Completed task: {task['epic']['title']} ({task_id})")
            
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
            
            logger.info(f"Failed task: {task['epic']['title']} ({task_id})")
            
        except Exception as e:
            logger.error(f"Error failing task {task_id}: {e}")

async def main():
    """Main entry point"""
    agent = DesignerAgent()
    
    try:
        print("Starting Designer Agent...")
        print(f"Platform: {sys.platform}")
        print(f"Python: {sys.version}")
        
        # Initialize the agent
        initialized = await agent.initialize()
        if not initialized:
            sys.exit(1)
        
        # Start polling for tasks
        await agent.poll_for_tasks()
        
    except KeyboardInterrupt:
        print("\nReceived interrupt, shutting down gracefully...")
        await agent.shutdown()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        await agent.shutdown()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
