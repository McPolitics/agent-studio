const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

/**
 * File-based task queue system
 * Replaces Redis for local single-machine operation
 */
class TaskQueue {
  constructor() {
    this.queueDir = config.paths.tasks;
    this.pendingDir = path.join(this.queueDir, 'pending');
    this.processingDir = path.join(this.queueDir, 'processing');
    this.completedDir = path.join(this.queueDir, 'completed');
    this.failedDir = path.join(this.queueDir, 'failed');
    
    this.pollInterval = config.taskQueue.pollInterval;
    this.isPolling = false;
  }

  async init() {
    // Create queue directories
    await fs.mkdir(this.queueDir, { recursive: true });
    await fs.mkdir(this.pendingDir, { recursive: true });
    await fs.mkdir(this.processingDir, { recursive: true });
    await fs.mkdir(this.completedDir, { recursive: true });
    await fs.mkdir(this.failedDir, { recursive: true });
  }

  /**
   * Add a task to the queue
   */
  async enqueue(epic) {
    const taskId = this.generateTaskId();
    const task = {
      id: taskId,
      epic,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    const taskFile = path.join(this.pendingDir, `${taskId}.json`);
    await fs.writeFile(taskFile, JSON.stringify(task, null, 2));
    
    console.log(`📥 Enqueued task: ${epic.title} (${taskId})`);
    return taskId;
  }

  /**
   * Get next task for specific agent role
   */
  async dequeue(agentRole) {
    try {
      const files = await fs.readdir(this.pendingDir);
      const taskFiles = files.filter(f => f.endsWith('.json'));

      for (const fileName of taskFiles) {
        const taskPath = path.join(this.pendingDir, fileName);
        
        try {
          const taskContent = await fs.readFile(taskPath, 'utf8');
          const task = JSON.parse(taskContent);

          // Check if task is for this agent role
          if (task.epic.role === agentRole) {
            // Move task to processing
            const processingPath = path.join(this.processingDir, fileName);
            await fs.rename(taskPath, processingPath);
            
            task.status = 'processing';
            task.processedAt = new Date().toISOString();
            task.processingPath = processingPath;
            
            await fs.writeFile(processingPath, JSON.stringify(task, null, 2));
            
            console.log(`📤 Dequeued task: ${task.epic.title} (${task.id})`);
            return task;
          }
        } catch (error) {
          console.error(`Error reading task file ${fileName}:`, error.message);
        }
      }

      return null; // No tasks available for this role
    } catch (error) {
      console.error('Error dequeuing task:', error.message);
      return null;
    }
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId, result = null) {
    const processingPath = path.join(this.processingDir, `${taskId}.json`);
    const completedPath = path.join(this.completedDir, `${taskId}.json`);

    try {
      const taskContent = await fs.readFile(processingPath, 'utf8');
      const task = JSON.parse(taskContent);
      
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      if (result) {
        task.result = result;
      }

      await fs.writeFile(completedPath, JSON.stringify(task, null, 2));
      await fs.unlink(processingPath);
      
      console.log(`✅ Completed task: ${task.epic.title} (${taskId})`);
    } catch (error) {
      console.error(`Error completing task ${taskId}:`, error.message);
    }
  }

  /**
   * Mark task as failed
   */
  async failTask(taskId, error) {
    const processingPath = path.join(this.processingDir, `${taskId}.json`);
    const failedPath = path.join(this.failedDir, `${taskId}.json`);

    try {
      const taskContent = await fs.readFile(processingPath, 'utf8');
      const task = JSON.parse(taskContent);
      
      task.status = 'failed';
      task.failedAt = new Date().toISOString();
      task.error = error.toString();

      await fs.writeFile(failedPath, JSON.stringify(task, null, 2));
      await fs.unlink(processingPath);
      
      console.log(`❌ Failed task: ${task.epic.title} (${taskId})`);
    } catch (err) {
      console.error(`Error failing task ${taskId}:`, err.message);
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId) {
    const directories = [
      { dir: this.pendingDir, status: 'pending' },
      { dir: this.processingDir, status: 'processing' },
      { dir: this.completedDir, status: 'completed' },
      { dir: this.failedDir, status: 'failed' }
    ];

    for (const { dir, status } of directories) {
      const taskPath = path.join(dir, `${taskId}.json`);
      try {
        const taskContent = await fs.readFile(taskPath, 'utf8');
        const task = JSON.parse(taskContent);
        return { ...task, status };
      } catch (error) {
        // Task not in this directory, continue
      }
    }

    return null; // Task not found
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const [pending, processing, completed, failed] = await Promise.all([
        fs.readdir(this.pendingDir),
        fs.readdir(this.processingDir),
        fs.readdir(this.completedDir),
        fs.readdir(this.failedDir)
      ]);

      return {
        pending: pending.filter(f => f.endsWith('.json')).length,
        processing: processing.filter(f => f.endsWith('.json')).length,
        completed: completed.filter(f => f.endsWith('.json')).length,
        failed: failed.filter(f => f.endsWith('.json')).length
      };
    } catch (error) {
      console.error('Error getting queue stats:', error.message);
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }
  }

  /**
   * Clean up old completed/failed tasks
   */
  async cleanup(maxAge = 24 * 60 * 60 * 1000) { // 24 hours by default
    const now = Date.now();
    const dirs = [this.completedDir, this.failedDir];

    for (const dir of dirs) {
      try {
        const files = await fs.readdir(dir);
        
        for (const fileName of files) {
          if (!fileName.endsWith('.json')) continue;
          
          const filePath = path.join(dir, fileName);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            console.log(`🧹 Cleaned up old task: ${fileName}`);
          }
        }
      } catch (error) {
        console.error(`Error cleaning up directory ${dir}:`, error.message);
      }
    }
  }

  generateTaskId() {
    return crypto.randomUUID();
  }
}

module.exports = TaskQueue;
