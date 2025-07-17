const axios = require('axios');
const config = require('./config');

/**
 * Universal LLM client supporting multiple providers
 */
class LLMClient {
  constructor() {
    this.provider = config.llm.provider;
    this.config = config.llm;
  }

  getProvider() {
    return this.provider;
  }

  async initialize() {
    // Initialization logic if needed
    return true;
  }

  async chat(messages, options = {}) {
    switch (this.provider) {
      case 'ollama':
        return this.ollamaChat(messages, options);
      case 'openai':
        return this.openaiChat(messages, options);
      case 'anthropic':
        return this.anthropicChat(messages, options);
      case 'local':
        return this.localChat(messages, options);
      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  async ollamaChat(messages, options = {}) {
    try {
      const response = await axios.post(`${this.config.ollama.url}/api/chat`, {
        model: this.config.ollama.model,
        messages: messages,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048
        }
      });

      return response.data.message.content;
    } catch (error) {
      console.error('Ollama API error:', error.message);
      throw new Error(`Ollama chat failed: ${error.message}`);
    }
  }

  async openaiChat(messages, options = {}) {
    if (!this.config.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.config.openai.model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.openai.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error.message);
      throw new Error(`OpenAI chat failed: ${error.message}`);
    }
  }

  async anthropicChat(messages, options = {}) {
    if (!this.config.anthropic.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      // Convert messages format for Anthropic
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');
      
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: this.config.anthropic.model,
        system: systemMessage?.content,
        messages: userMessages,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7
      }, {
        headers: {
          'x-api-key': this.config.anthropic.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      });

      return response.data.content[0].text;
    } catch (error) {
      console.error('Anthropic API error:', error.message);
      throw new Error(`Anthropic chat failed: ${error.message}`);
    }
  }

  async localChat(messages, options = {}) {
    try {
      const response = await axios.post(`${this.config.local.url}/chat`, {
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048
      });

      return response.data.content || response.data.message;
    } catch (error) {
      console.error('Local LLM API error:', error.message);
      throw new Error(`Local LLM chat failed: ${error.message}`);
    }
  }

  async generateText(prompt, systemPrompt = null, options = {}) {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    return this.chat(messages, options);
  }

  async checkHealth() {
    try {
      switch (this.provider) {
        case 'ollama':
          await axios.get(`${this.config.ollama.url}/api/tags`);
          return true;
        case 'openai':
          if (!this.config.openai.apiKey) return false;
          await axios.get('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${this.config.openai.apiKey}` }
          });
          return true;
        case 'anthropic':
          if (!this.config.anthropic.apiKey) return false;
          // Anthropic doesn't have a simple health check, so we'll assume it's available
          return true;
        case 'local':
          await axios.get(`${this.config.local.url}/health`);
          return true;
        default:
          return false;
      }
    } catch (error) {
      console.error(`${this.provider} health check failed:`, error.message);
      return false;
    }
  }
}

module.exports = LLMClient;
