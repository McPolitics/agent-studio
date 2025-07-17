# Feedback and Issue Reporting

This document provides guidance on monitoring Agent Studio deployments and reporting issues when things go wrong.

## 🔍 Monitoring Dashboard

### Accessing Dashboards

**Grafana (Local Development)**
- URL: http://localhost:3000
- Username: admin
- Password: admin
- Dashboards: Agent Studio Overview, System Health, Performance Metrics

**Prometheus (Metrics)**
- URL: http://localhost:9090
- Query interface for custom metrics
- Alert manager for threshold monitoring

**Sentry (Error Tracking)**
- URL: http://localhost:9000 (local) or your Sentry project URL
- Real-time error capture and performance monitoring
- User feedback and crash reports

### Key Metrics to Monitor

**Agent Performance**:
- Task completion rate
- Average processing time
- Queue depth and backlog
- Error rate by agent type

**System Health**:
- CPU and memory usage
- Redis queue statistics
- LLM server response times
- Asset generation success rate

**Game Performance**:
- Build success/failure rate
- Deployment status
- User engagement metrics
- Error rate in production

## 🚨 Automated Issue Reporting

### GitHub Issues Integration

When CI/CD failures occur, the system automatically creates GitHub issues:

```bash
# Example automated issue creation
curl -X POST https://api.github.com/repos/YOUR_REPO/agent-studio/issues \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "❌ Deployment Failed - Build #123",
    "body": "**Error**: Build failed during asset optimization\n**Branch**: main\n**Commit**: abc123\n**Time**: 2024-01-15 14:30 UTC\n\n**Logs**: https://github.com/repo/actions/runs/123456\n\n**Steps to Reproduce**:\n1. Push changes to main branch\n2. Build process starts\n3. Fails at asset optimization step\n\n**Expected**: Successful deployment\n**Actual**: Build failure",
    "labels": ["bug", "deployment", "high-priority"]
  }'
```

### Webhook Configuration

Set up webhooks for external notification systems:

```javascript
// Webhook notification function
async function notifyFailure(error, context) {
  const payload = {
    text: `🚨 Agent Studio Alert`,
    attachments: [{
      color: 'danger',
      fields: [
        { title: 'Error', value: error.message, short: false },
        { title: 'Component', value: context.component, short: true },
        { title: 'Time', value: new Date().toISOString(), short: true }
      ]
    }]
  };
  
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
```

## 📊 Manual Issue Reporting

### Using GitHub Issues

**For Development Issues**:
1. Go to: https://github.com/YOUR_REPO/agent-studio/issues/new
2. Select appropriate template:
   - 🐛 Bug Report
   - ✨ Feature Request
   - 📚 Documentation
   - 🚀 Performance Issue

**Bug Report Template**:
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [Windows/macOS/Linux]
- Node.js Version: [version]
- Python Version: [version]
- Browser: [Chrome/Firefox/Safari]

## Screenshots/Logs
[Attach relevant screenshots or log files]

## Additional Context
[Any other relevant information]
```

### Sample Curl Commands for API Testing

**Test LLM Server Health**:
```bash
curl -f http://localhost:5000/health
```

**Test LLM Generation**:
```bash
curl -X POST http://localhost:5000/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a simple game character",
    "max_tokens": 100
  }'
```

**Test Redis Connection**:
```bash
redis-cli ping
```

**Check Redis Queue Status**:
```bash
redis-cli XLEN agent_tasks
redis-cli XINFO STREAM agent_tasks
```

**Monitor Agent Processing**:
```bash
redis-cli XREAD STREAMS agent_tasks 0
```

## 🔧 Common Issues and Solutions

### Build Failures

**Symptom**: Web game build fails during CI/CD
**Diagnosis**:
```bash
# Check build logs
npm run build 2>&1 | tee build.log

# Check for dependency issues
npm audit
npm outdated
```

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Update dependencies
npm update
```

### Agent Processing Failures

**Symptom**: Agents not processing tasks from queue
**Diagnosis**:
```bash
# Check Redis queue
redis-cli XLEN agent_tasks
redis-cli XINFO GROUPS agent_tasks

# Check agent logs
docker-compose logs coder-agent
docker-compose logs designer-agent
```

**Solution**:
```bash
# Restart agents
docker-compose restart coder-agent designer-agent uiux-agent

# Reset consumer groups if needed
redis-cli XGROUP DESTROY agent_tasks coder_agents
redis-cli XGROUP CREATE agent_tasks coder_agents 0
```

### LLM Server Issues

**Symptom**: LLM server not responding or slow responses
**Diagnosis**:
```bash
# Check server health
curl -I http://localhost:5000/health

# Monitor resource usage
htop
nvidia-smi  # For GPU systems
```

**Solution**:
```bash
# Restart LLM server
docker-compose restart llm-server

# Check model file integrity
ls -la models/llama2-7b/
md5sum models/llama2-7b/llama2-7b-q4_0.gguf
```

### Asset Generation Failures

**Symptom**: Designer agent fails to generate images
**Diagnosis**:
```bash
# Check Stable Diffusion API
curl http://127.0.0.1:7860/

# Check Hugging Face API (if configured)
curl -H "Authorization: Bearer $HF_API_TOKEN" \
  https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5
```

**Solution**:
```bash
# Restart Stable Diffusion service
# Or configure Hugging Face API token
export HF_API_TOKEN="your_token_here"
```

## 📈 Performance Optimization Tips

### LLM Inference Optimization

```bash
# Monitor GPU usage
watch -n 1 nvidia-smi

# Optimize model loading
export CUDA_VISIBLE_DEVICES=0
export OMP_NUM_THREADS=8
```

### Redis Queue Optimization

```bash
# Monitor Redis performance
redis-cli --latency-history
redis-cli INFO stats

# Optimize Redis configuration
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Build Performance

```javascript
// Vite optimization
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['phaser'],
          utils: ['src/utils/index.js']
        }
      }
    }
  }
});
```

## 📝 Log Analysis

### Important Log Locations

**Application Logs**:
- `scripts/` - Agent execution logs
- `web-game/` - Build and runtime logs
- Docker containers - `docker-compose logs [service]`

**System Logs**:
- Redis: `/var/log/redis/redis-server.log`
- Nginx: `/var/log/nginx/access.log`
- System: `/var/log/syslog`

### Log Analysis Commands

```bash
# Tail live logs
tail -f scripts/agent.log

# Search for errors
grep -i error scripts/*.log | tail -20

# Count error types
grep -o "Error: [^"]*" scripts/agent.log | sort | uniq -c

# Monitor specific agent
docker-compose logs -f coder-agent | grep "Task.*completed"
```

## 🆘 Emergency Procedures

### System Recovery

**Complete System Reset**:
```bash
# Stop all services
docker-compose down

# Clear Redis data
redis-cli FLUSHALL

# Reset Git repository (if needed)
git reset --hard HEAD

# Restart services
docker-compose up -d
```

**Rollback Deployment**:
```bash
# Revert to previous commit
git revert HEAD

# Force redeploy
git push origin main --force-with-lease
```

### Data Recovery

**Backup Important Data**:
```bash
# Export Redis data
redis-cli --rdb backup.rdb

# Backup generated assets
tar -czf assets-backup.tar.gz web-game/public/assets/

# Export configuration
cp -r config/ config-backup/
```

## 📞 Contact and Support

### Reporting Channels

1. **GitHub Issues**: For bugs and feature requests
2. **GitHub Discussions**: For questions and ideas
3. **Email**: [Your support email]
4. **Discord/Slack**: [Your community channels]

### Response Time Expectations

| Priority | Response Time | Resolution Time |
|----------|---------------|-----------------|
| Critical | 1 hour | 4 hours |
| High | 4 hours | 24 hours |
| Medium | 24 hours | 1 week |
| Low | 1 week | 1 month |

### Information to Include

When reporting issues, please include:
- Operating system and version
- Node.js and Python versions
- Error messages and stack traces
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or logs
- System resource usage (CPU, memory, disk)

This feedback system ensures rapid identification and resolution of issues in the Agent Studio platform.
