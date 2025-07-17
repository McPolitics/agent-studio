#!/usr/bin/env node

// Test OpenAI connection directly
const LLMClient = require('./scripts/llm-client');

async function testOpenAI() {
  console.log('🧪 Testing OpenAI Connection...\n');
  
  const llmClient = new LLMClient();
  
  console.log(`Provider: ${llmClient.provider}`);
  console.log(`API Key: ${llmClient.config.openai.apiKey ? llmClient.config.openai.apiKey.substring(0, 20) + '...' : 'NOT SET'}`);
  console.log(`Model: ${llmClient.config.openai.model}\n`);
  
  try {
    // Test health check
    console.log('Testing health check...');
    const isHealthy = await llmClient.checkHealth();
    console.log(`Health check result: ${isHealthy ? '✅ Healthy' : '❌ Failed'}\n`);
    
    if (isHealthy) {
      // Test simple chat
      console.log('Testing simple chat...');
      const response = await llmClient.generateText('Say hello in one word', null, { maxTokens: 10 });
      console.log(`Response: "${response}"\n`);
      console.log('✅ OpenAI connection successful!');
    }
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 This looks like an API key issue. Check that your key is valid and has credits.');
    } else if (error.message.includes('404')) {
      console.log('\n💡 This looks like a URL or model issue. Check the OpenAI model name.');
    } else if (error.message.includes('429')) {
      console.log('\n💡 Rate limit exceeded. Wait a moment and try again.');
    }
  }
}

testOpenAI();
