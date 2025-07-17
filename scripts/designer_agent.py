#!/usr/bin/env python3
"""
Designer Agent - Generates visual assets using Stable Diffusion API
Specializes in creating game sprites, backgrounds, UI elements, and other visual content
"""

import asyncio
import aioredis
import aiohttp
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

# Configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
STABLE_DIFFUSION_URL = os.getenv('STABLE_DIFFUSION_URL', 'http://127.0.0.1:7860')
HF_API_TOKEN = os.getenv('HF_API_TOKEN', '')
STREAM_NAME = 'agent_tasks'
CONSUMER_GROUP = 'designer_agents'
CONSUMER_NAME = f'designer_{os.getpid()}'
POLL_INTERVAL = 5  # seconds

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('designer_agent')

class DesignerAgent:
    def __init__(self):
        self.redis = None
        self.session = None
        self.is_running = True
        self.project_root = Path(__file__).parent.parent
        self.assets_dir = self.project_root / 'web-game' / 'public' / 'assets'
        
    async def connect_redis(self):
        """Connect to Redis and setup consumer group"""
        try:
            logger.info(f"🔌 Connecting to Redis at {REDIS_URL}...")
            self.redis = await aioredis.from_url(REDIS_URL)
            
            # Test connection
            await self.redis.ping()
            logger.info("✅ Redis connection verified")
            
            # Create consumer group if it doesn't exist
            try:
                await self.redis.xgroup_create(STREAM_NAME, CONSUMER_GROUP, id='0', mkstream=True)
                logger.info(f"✅ Created consumer group: {CONSUMER_GROUP}")
            except Exception as e:
                if 'BUSYGROUP' in str(e):
                    logger.info(f"ℹ️  Consumer group {CONSUMER_GROUP} already exists")
                else:
                    raise
            
            logger.info(f"✅ Connected as consumer: {CONSUMER_NAME}")
            
        except Exception as e:
            raise Exception(f"Failed to connect to Redis: {e}")
    
    async def create_http_session(self):
        """Create HTTP session for API calls"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=300)  # 5 minutes for image generation
        )
    
    async def generate_image_stable_diffusion(self, prompt: str, negative_prompt: str = "", 
                                            width: int = 512, height: int = 512) -> Optional[bytes]:
        """Generate image using local Stable Diffusion API"""
        try:
            payload = {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "width": width,
                "height": height,
                "steps": 20,
                "cfg_scale": 7,
                "sampler_index": "Euler a",
                "seed": -1
            }
            
            async with self.session.post(
                f"{STABLE_DIFFUSION_URL}/sdapi/v1/txt2img",
                json=payload
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get('images'):
                        # Decode base64 image
                        image_data = base64.b64decode(result['images'][0])
                        return image_data
                else:
                    logger.error(f"Stable Diffusion API error: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Stable Diffusion generation failed: {e}")
            return None
    
    async def generate_image_huggingface(self, prompt: str) -> Optional[bytes]:
        """Generate image using Hugging Face Inference API as fallback"""
        if not HF_API_TOKEN:
            return None
            
        try:
            headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
            payload = {"inputs": prompt}
            
            async with self.session.post(
                "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    return await response.read()
                else:
                    logger.error(f"Hugging Face API error: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Hugging Face generation failed: {e}")
            return None
    
    def create_placeholder_image(self, width: int = 512, height: int = 512, 
                                text: str = "Placeholder") -> bytes:
        """Create a placeholder image when generation fails"""
        from PIL import Image, ImageDraw, ImageFont
        
        # Create image with gradient background
        img = Image.new('RGB', (width, height), color='#2C3E50')
        draw = ImageDraw.Draw(img)
        
        # Draw gradient effect
        for i in range(height):
            color_value = int(44 + (20 * i / height))  # Gradient from dark to slightly lighter
            draw.line([(0, i), (width, i)], fill=(color_value, color_value + 18, color_value + 30))
        
        # Add text
        try:
            # Try to use a nice font
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        # Calculate text position
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        
        # Draw text with outline
        outline_color = '#000000'
        text_color = '#FFFFFF'
        
        # Draw outline
        for adj in range(-2, 3):
            for adj2 in range(-2, 3):
                draw.text((x + adj, y + adj2), text, font=font, fill=outline_color)
        
        # Draw main text
        draw.text((x, y), text, font=font, fill=text_color)
        
        # Convert to bytes
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return buffer.getvalue()
    
    async def generate_image(self, prompt: str, width: int = 512, height: int = 512, 
                           filename: str = "generated") -> Optional[str]:
        """Generate image using available methods"""
        logger.info(f"🎨 Generating image: {prompt[:50]}...")
        
        negative_prompt = "blurry, low quality, distorted, ugly, bad anatomy, extra limbs"
        
        # Try Stable Diffusion first
        image_data = await self.generate_image_stable_diffusion(
            prompt, negative_prompt, width, height
        )
        
        # Fallback to Hugging Face
        if not image_data:
            logger.info("🔄 Trying Hugging Face API...")
            image_data = await self.generate_image_huggingface(prompt)
        
        # Final fallback to placeholder
        if not image_data:
            logger.warning("⚠️  Using placeholder image")
            image_data = self.create_placeholder_image(width, height, filename)
        
        return image_data
    
    async def save_image(self, image_data: bytes, filename: str, 
                        subfolder: str = "generated") -> str:
        """Save image data to assets directory"""
        # Ensure assets directory structure exists
        full_dir = self.assets_dir / subfolder
        full_dir.mkdir(parents=True, exist_ok=True)
        
        # Create full file path
        if not filename.endswith(('.png', '.jpg', '.jpeg')):
            filename += '.png'
        
        file_path = full_dir / filename
        
        # Save image
        with open(file_path, 'wb') as f:
            f.write(image_data)
        
        relative_path = f"assets/{subfolder}/{filename}"
        logger.info(f"✅ Saved image: {relative_path}")
        
        return relative_path
    
    def parse_asset_specifications(self, prompt: str) -> List[Dict]:
        """Parse the design prompt to extract individual asset specifications"""
        assets = []
        
        # Look for structured asset requests
        lines = prompt.split('\n')
        current_asset = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Asset definitions
            if line.lower().startswith(('sprite:', 'background:', 'ui:', 'icon:', 'texture:')):
                if current_asset:
                    assets.append(current_asset)
                
                asset_type, description = line.split(':', 1)
                current_asset = {
                    'type': asset_type.lower(),
                    'description': description.strip(),
                    'prompt': description.strip(),
                    'filename': self.generate_filename(description.strip()),
                    'width': 512,
                    'height': 512
                }
                
            elif line.lower().startswith('size:') and current_asset:
                size_parts = line[5:].strip().split('x')
                if len(size_parts) == 2:
                    try:
                        current_asset['width'] = int(size_parts[0])
                        current_asset['height'] = int(size_parts[1])
                    except ValueError:
                        pass
                        
            elif line.lower().startswith('filename:') and current_asset:
                current_asset['filename'] = line[9:].strip()
                
            elif current_asset and line and not line.startswith(('size:', 'filename:')):
                # Additional description
                current_asset['prompt'] += ' ' + line
        
        if current_asset:
            assets.append(current_asset)
        
        # If no structured format found, create single asset
        if not assets:
            assets.append({
                'type': 'general',
                'description': prompt,
                'prompt': prompt,
                'filename': 'generated_asset',
                'width': 512,
                'height': 512
            })
        
        return assets
    
    def generate_filename(self, description: str) -> str:
        """Generate a safe filename from description"""
        import re
        # Remove special characters and spaces
        safe_name = re.sub(r'[^a-zA-Z0-9\s]', '', description)
        # Replace spaces with underscores
        safe_name = re.sub(r'\s+', '_', safe_name.strip())
        # Truncate if too long
        safe_name = safe_name[:30].lower()
        return safe_name
    
    async def commit_changes(self, files: List[str], task_id: str, task_title: str):
        """Commit generated assets to git"""
        try:
            import subprocess
            
            # Add files to git
            for file in files:
                subprocess.run(['git', 'add', f'web-game/public/{file}'], 
                             cwd=self.project_root, check=True)
            
            # Create commit message
            commit_message = f"[Designer Agent] {task_title}\n\nTask ID: {task_id}\nFiles: {', '.join(files)}\nGenerated by: {CONSUMER_NAME}"
            
            # Commit changes
            subprocess.run(['git', 'commit', '-m', commit_message], 
                         cwd=self.project_root, check=True)
            
            logger.info(f"✅ Committed changes for task {task_id}")
            logger.info(f"   Files: {', '.join(files)}")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to commit changes for task {task_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Git commit error: {e}")
            return False
    
    async def process_task(self, task: Dict) -> Dict:
        """Process a design task"""
        task_id = task.get('id', 'unknown')
        title = task.get('title', 'Untitled Task')
        prompt = task.get('prompt', '')
        
        logger.info(f"\n🎨 Processing design task: {title}")
        logger.info(f"Task ID: {task_id}")
        logger.info(f"Prompt: {prompt[:100]}...")
        
        try:
            # Parse asset specifications
            assets = self.parse_asset_specifications(prompt)
            logger.info(f"📋 Parsed {len(assets)} assets to generate")
            
            generated_files = []
            
            # Generate each asset
            for i, asset in enumerate(assets):
                logger.info(f"🎯 Generating asset {i+1}/{len(assets)}: {asset['description'][:50]}...")
                
                # Generate image
                image_data = await self.generate_image(
                    asset['prompt'],
                    asset['width'],
                    asset['height'],
                    asset['filename']
                )
                
                if image_data:
                    # Save image
                    file_path = await self.save_image(
                        image_data,
                        asset['filename'],
                        asset['type']
                    )
                    generated_files.append(file_path)
            
            if generated_files:
                # Commit to git
                committed = await self.commit_changes(generated_files, task_id, title)
                
                if committed:
                    logger.info(f"✅ Task {task_id} completed successfully")
                    return {'success': True, 'files': generated_files}
                else:
                    logger.warning(f"⚠️  Task {task_id} completed but commit failed")
                    return {'success': True, 'files': generated_files, 'commit_failed': True}
            else:
                raise Exception("No assets were generated successfully")
                
        except Exception as e:
            logger.error(f"❌ Task {task_id} failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def poll_for_tasks(self):
        """Poll Redis stream for designer tasks"""
        while self.is_running:
            try:
                # Read from stream
                messages = await self.redis.xreadgroup(
                    CONSUMER_GROUP,
                    CONSUMER_NAME,
                    {STREAM_NAME: '>'},
                    count=1,
                    block=POLL_INTERVAL * 1000  # Convert to milliseconds
                )
                
                if messages:
                    for stream, msgs in messages:
                        for msg_id, fields in msgs:
                            task = dict(fields)
                            
                            # Only process tasks for this agent role
                            if task.get('role') == 'designer':
                                await self.process_task(task)
                                
                                # Acknowledge the message
                                await self.redis.xack(STREAM_NAME, CONSUMER_GROUP, msg_id)
                            else:
                                # Not for this agent, acknowledge but don't process
                                await self.redis.xack(STREAM_NAME, CONSUMER_GROUP, msg_id)
                
            except Exception as e:
                if self.is_running:
                    logger.error(f"❌ Error polling for tasks: {e}")
                    await asyncio.sleep(5)  # Wait before retrying
    
    async def run(self):
        """Main run loop"""
        try:
            logger.info("🚀 Designer Agent Starting...")
            logger.info(f"Consumer: {CONSUMER_NAME}")
            logger.info(f"Redis: {REDIS_URL}")
            logger.info(f"Stable Diffusion: {STABLE_DIFFUSION_URL}")
            logger.info(f"Stream: {STREAM_NAME}\n")
            
            # Initialize connections
            await self.connect_redis()
            await self.create_http_session()
            
            logger.info("✅ Designer Agent initialized and ready")
            logger.info("👀 Polling for designer tasks...\n")
            
            # Start polling
            await self.poll_for_tasks()
            
        except Exception as e:
            logger.error(f"❌ Fatal error: {e}")
            sys.exit(1)
    
    async def shutdown(self):
        """Graceful shutdown"""
        logger.info("\n🛑 Shutting down Designer Agent...")
        self.is_running = False
        
        if self.session:
            await self.session.close()
        
        if self.redis:
            await self.redis.close()
        
        logger.info("✅ Designer Agent stopped")

async def main():
    agent = DesignerAgent()
    
    # Setup signal handlers for graceful shutdown
    import signal
    
    def signal_handler(signum, frame):
        asyncio.create_task(agent.shutdown())
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await agent.run()
    except KeyboardInterrupt:
        await agent.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
