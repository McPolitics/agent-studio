#!/bin/bash

# Model Quantization Script for Agent Studio
# Downloads and quantizes Llama 2-7B model using ggml format

set -e

echo "🚀 Starting Llama 2-7B model quantization..."

# Create models directory if it doesn't exist
mkdir -p ../models/llama2-7b

# Check if we have enough disk space (at least 20GB)
AVAILABLE_SPACE=$(df --output=avail -BG . | tail -n1 | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 20 ]; then
    echo "❌ Error: Need at least 20GB free space. Available: ${AVAILABLE_SPACE}GB"
    exit 1
fi

echo "✅ Disk space check passed (${AVAILABLE_SPACE}GB available)"

# Install dependencies if not present
if ! command -v git-lfs &> /dev/null; then
    echo "📦 Installing git-lfs..."
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
    sudo apt-get install git-lfs
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not installed"
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install --user huggingface_hub transformers torch bitsandbytes accelerate

# Clone llama.cpp if not present
if [ ! -d "llama.cpp" ]; then
    echo "📥 Cloning llama.cpp repository..."
    git clone https://github.com/ggerganov/llama.cpp.git
fi

cd llama.cpp

# Build llama.cpp
echo "🔨 Building llama.cpp..."
make clean
make -j$(nproc)

# Download Llama 2-7B model from Hugging Face
echo "📥 Downloading Llama 2-7B model from Hugging Face..."
python3 -c "
from huggingface_hub import snapshot_download
import os

model_id = 'meta-llama/Llama-2-7b-hf'
local_dir = '../models/llama2-7b-original'

print(f'Downloading {model_id} to {local_dir}...')
try:
    snapshot_download(
        repo_id=model_id,
        local_dir=local_dir,
        local_dir_use_symlinks=False
    )
    print('✅ Model downloaded successfully!')
except Exception as e:
    print(f'❌ Error downloading model: {e}')
    print('💡 Note: You may need to authenticate with Hugging Face Hub')
    print('   Run: huggingface-cli login')
    exit(1)
"

# Convert to GGUF format
echo "🔄 Converting model to GGUF format..."
python3 convert.py ../models/llama2-7b-original --outdir ../models/llama2-7b --outtype f16

# Quantize to 4-bit
echo "⚡ Quantizing model to 4-bit..."
./quantize ../models/llama2-7b/ggml-model-f16.gguf ../models/llama2-7b/llama2-7b-q4_0.gguf q4_0

# Clean up intermediate files
echo "🧹 Cleaning up intermediate files..."
rm -rf ../models/llama2-7b-original
rm -f ../models/llama2-7b/ggml-model-f16.gguf

# Verify the quantized model
if [ -f "../models/llama2-7b/llama2-7b-q4_0.gguf" ]; then
    MODEL_SIZE=$(du -h ../models/llama2-7b/llama2-7b-q4_0.gguf | cut -f1)
    echo "✅ Quantization complete! Model size: $MODEL_SIZE"
    echo "📁 Quantized model saved to: ../models/llama2-7b/llama2-7b-q4_0.gguf"
else
    echo "❌ Error: Quantization failed - output file not found"
    exit 1
fi

cd ..

echo "🎉 Model quantization completed successfully!"
echo "💡 You can now start the LLM server with: docker-compose up llm-server"
