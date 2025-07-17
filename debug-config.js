#!/usr/bin/env node

// Debug script to check configuration loading
const config = require('./scripts/config');
const LLMClient = require('./scripts/llm-client');

console.log('🔍 Debugging LLM Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log(`LLM_PROVIDER: "${process.env.LLM_PROVIDER}"`);
console.log(`OPENAI_API_KEY: "${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'NOT SET'}"`);
console.log(`OPENAI_MODEL: "${process.env.OPENAI_MODEL}"`);
console.log();

// Check config object
console.log('Config Object:');
console.log(`Provider: "${config.llm.provider}"`);
console.log(`OpenAI API Key: "${config.llm.openai.apiKey ? config.llm.openai.apiKey.substring(0, 20) + '...' : 'NOT SET'}"`);
console.log(`OpenAI Model: "${config.llm.openai.model}"`);
console.log();

// Check LLM client
const llmClient = new LLMClient();
console.log('LLM Client:');
console.log(`Provider: "${llmClient.provider}"`);
console.log(`Config: ${JSON.stringify(llmClient.config, null, 2)}`);
console.log();

// Test API key validation
if (llmClient.provider === 'openai') {
  if (llmClient.config.openai.apiKey) {
    console.log('✅ OpenAI API key is configured');
  } else {
    console.log('❌ OpenAI API key is missing');
  }
} else {
  console.log(`⚠️ Provider is "${llmClient.provider}", not "openai"`);
}
