#!/usr/bin/env python3
"""
Test script for Designer Agent image generation
"""

import asyncio
import os
import sys
from pathlib import Path

# Add scripts directory to path
sys.path.append(str(Path(__file__).parent))

from designer_agent import DesignerAgent

async def test_image_generation():
    """Test the image generation functionality"""
    
    print("🧪 Testing Designer Agent Image Generation")
    print("=" * 50)
    
    # Create agent instance
    agent = DesignerAgent()
    
    # Initialize
    print("🔧 Initializing agent...")
    initialized = await agent.initialize()
    
    if not initialized:
        print("❌ Failed to initialize agent")
        return
    
    print(f"✅ Agent initialized successfully")
    print(f"Provider: {agent.config.get('image_generation_provider', 'disabled')}")
    
    # Test epic for image generation
    test_epic = {
        'id': 'test-epic-001',
        'title': 'Create Snake Game Character',
        'prompt': 'Create a pixel-art snake character sprite for a classic snake game. The snake should be green with a simple, clean design suitable for a retro-style game.',
        'description': 'Test epic for generating game assets'
    }
    
    print(f"\n🎨 Testing asset generation...")
    print(f"Epic: {test_epic['title']}")
    print(f"Prompt: {test_epic['prompt']}")
    
    # Test the asset generation
    try:
        result = await agent.process_task({'epic': test_epic, 'id': test_epic['id']})
        
        if result['success']:
            print(f"\n✅ Generation successful!")
            print(f"Duration: {result.get('duration', 0):.2f}s")
            
            if 'assets' in result:
                print(f"Generated {len(result['assets'])} assets:")
                for asset in result['assets']:
                    print(f"  - {asset['type']}: {asset['path']}")
                    print(f"    Description: {asset['description']}")
                    if 'provider' in asset:
                        print(f"    Provider: {asset['provider']}")
        else:
            print(f"❌ Generation failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Exception during generation: {e}")
    
    # Cleanup
    await agent.shutdown()
    print(f"\n👋 Test completed")

if __name__ == "__main__":
    asyncio.run(test_image_generation())
