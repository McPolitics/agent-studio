const express = require('express');
const cors = require('cors');
const { promisify } = require('util');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Metrics for monitoring
const promClient = require('prom-client');
const register = new promClient.Registry();

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  registers: [register]
});

const llmRequestsTotal = new promClient.Counter({
  name: 'llm_requests_total',
  help: 'Total number of LLM inference requests',
  registers: [register]
});

const llmRequestDuration = new promClient.Histogram({
  name: 'llm_request_duration_seconds',
  help: 'Duration of LLM inference requests in seconds',
  registers: [register]
});

// Middleware for metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path
    }, duration);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Main inference endpoint
app.post('/v1/generate', async (req, res) => {
  const start = Date.now();
  
  try {
    const { prompt, max_tokens = 100, temperature = 0.7, stop = [] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field: prompt' 
      });
    }

    llmRequestsTotal.inc();

    // Check if we have a quantized model available
    const modelPath = path.join(__dirname, '../models/llama2-7b/llama2-7b-q4_0.gguf');
    
    try {
      await fs.access(modelPath);
      
      // Use llama.cpp for inference
      const llamaCppPath = path.join(__dirname, '../scripts/llama.cpp/main');
      const command = [
        llamaCppPath,
        '-m', modelPath,
        '-p', `"${prompt}"`,
        '-n', max_tokens,
        '--temp', temperature,
        '--repeat_penalty', '1.1',
        '--ctx_size', '2048',
        '--batch_size', '512'
      ].join(' ');

      const execAsync = promisify(exec);
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 30000,
        maxBuffer: 1024 * 1024 
      });

      if (stderr && !stderr.includes('warning')) {
        console.error('llama.cpp stderr:', stderr);
      }

      // Parse the output to extract generated text
      const lines = stdout.split('\n');
      const textStart = lines.findIndex(line => line.includes(prompt));
      const generatedText = lines.slice(textStart)
        .join('\n')
        .replace(prompt, '')
        .trim();

      const duration = (Date.now() - start) / 1000;
      llmRequestDuration.observe(duration);

      res.json({
        text: generatedText,
        model: 'llama2-7b-q4_0',
        usage: {
          prompt_tokens: prompt.split(' ').length,
          completion_tokens: generatedText.split(' ').length,
          total_tokens: prompt.split(' ').length + generatedText.split(' ').length
        },
        inference_time: duration
      });

    } catch (modelError) {
      console.log('Quantized model not found, using mock response');
      
      // Mock response for development/testing
      const mockResponses = [
        "This is a generated response from the LLM server.",
        "The AI agent system is working correctly.",
        "Generated content for game development tasks.",
        "Mock LLM response for testing purposes."
      ];
      
      const mockText = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      
      const duration = (Date.now() - start) / 1000;
      llmRequestDuration.observe(duration);

      res.json({
        text: mockText,
        model: 'mock-llm',
        usage: {
          prompt_tokens: prompt.split(' ').length,
          completion_tokens: mockText.split(' ').length,
          total_tokens: prompt.split(' ').length + mockText.split(' ').length
        },
        inference_time: duration,
        note: 'Using mock response - run quantize_model.sh to use real LLM'
      });
    }

  } catch (error) {
    console.error('Error during inference:', error);
    
    const duration = (Date.now() - start) / 1000;
    llmRequestDuration.observe(duration);
    
    res.status(500).json({ 
      error: 'Internal server error during inference',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 LLM Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📈 Metrics: http://localhost:${port}/metrics`);
  console.log(`🤖 Generation endpoint: POST http://localhost:${port}/v1/generate`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});
