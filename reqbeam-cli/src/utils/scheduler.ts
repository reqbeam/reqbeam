import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import * as cron from 'node-cron';
import { ScheduledJob } from '../types.js';

export class Scheduler {
  private static instance: Scheduler;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private schedulesFile: string;

  private constructor() {
    this.schedulesFile = path.join(os.homedir(), '.reqbeam', 'schedules.json');
  }

  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  /**
   * Schedule a test run with cron expression
   */
  public async scheduleTestRun(cronExpression: string, command: string): Promise<string> {
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error('Invalid cron expression');
    }

    const jobId = this.generateJobId();
    const job: ScheduledJob = {
      id: jobId,
      name: `Test Run - ${new Date().toLocaleString()}`,
      cronExpression,
      command,
      isActive: true,
      createdAt: new Date().toISOString(),
      nextRun: this.getNextRunTime(cronExpression)
    };

    // Create the cron job
    const task = cron.schedule(cronExpression, async () => {
      console.log(`🕒 Running scheduled test: ${job.name}`);
      try {
        // Execute the command
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        await execAsync(command);
        console.log(`✅ Scheduled test completed: ${job.name}`);
        
        // Update last run time
        job.lastRun = new Date().toISOString();
        await this.saveSchedules();
      } catch (error) {
        console.error(`❌ Scheduled test failed: ${job.name}`, error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set(jobId, task);
    await this.saveJob(job);
    
    // Start the job
    task.start();
    
    return jobId;
  }

  /**
   * List all scheduled jobs
   */
  public async listScheduledJobs(): Promise<ScheduledJob[]> {
    const schedules = await this.loadSchedules();
    return Object.values(schedules);
  }

  /**
   * Stop a scheduled job
   */
  public async stopJob(jobId: string): Promise<void> {
    const task = this.jobs.get(jobId);
    if (task) {
      task.stop();
      this.jobs.delete(jobId);
    }

    const schedules = await this.loadSchedules();
    if (schedules[jobId]) {
      schedules[jobId].isActive = false;
      await this.saveSchedules();
    }
  }

  /**
   * Delete a scheduled job
   */
  public async deleteJob(jobId: string): Promise<void> {
    await this.stopJob(jobId);
    
    const schedules = await this.loadSchedules();
    delete schedules[jobId];
    await this.saveSchedules();
  }

  /**
   * Start all scheduled jobs on CLI startup
   */
  public async startAllJobs(): Promise<void> {
    const schedules = await this.loadSchedules();
    
    for (const job of Object.values(schedules)) {
      if (job.isActive) {
        const task = cron.schedule(job.cronExpression, async () => {
          console.log(`🕒 Running scheduled job: ${job.name}`);
          try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            
            await execAsync(job.command);
            console.log(`✅ Scheduled job completed: ${job.name}`);
            
            // Update last run time
            job.lastRun = new Date().toISOString();
            await this.saveSchedules();
          } catch (error) {
            console.error(`❌ Scheduled job failed: ${job.name}`, error);
          }
        }, {
          scheduled: false
        });

        this.jobs.set(job.id, task);
        task.start();
      }
    }
  }

  /**
   * Stop all scheduled jobs
   */
  public stopAllJobs(): void {
    this.jobs.forEach((task) => {
      task.stop();
    });
    this.jobs.clear();
  }

  /**
   * Load schedules from file
   */
  private async loadSchedules(): Promise<Record<string, ScheduledJob>> {
    if (await fs.pathExists(this.schedulesFile)) {
      return await fs.readJson(this.schedulesFile);
    }
    return {};
  }

  /**
   * Save schedules to file
   */
  private async saveSchedules(): Promise<void> {
    const schedules = await this.loadSchedules();
    await fs.ensureDir(path.dirname(this.schedulesFile));
    await fs.writeJson(this.schedulesFile, schedules, { spaces: 2 });
  }

  /**
   * Save a single job
   */
  private async saveJob(job: ScheduledJob): Promise<void> {
    const schedules = await this.loadSchedules();
    schedules[job.id] = job;
    await this.saveSchedules();
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get next run time for cron expression
   */
  private getNextRunTime(cronExpression: string): string {
    // This is a simplified implementation
    // In a real implementation, you'd use a library like 'cron-parser'
    return 'Next run time calculation not implemented';
  }

  /**
   * Format scheduled jobs for display
   */
  public formatScheduledJobs(jobs: ScheduledJob[]): string {
    if (jobs.length === 0) {
      return 'No scheduled jobs found.';
    }

    let output = '\n🕒 Scheduled Jobs\n';
    output += '═══════════════════════════════════════\n\n';

    for (const job of jobs) {
      const status = job.isActive ? '🟢 Active' : '🔴 Inactive';
      const lastRun = job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never';
      
      output += `ID: ${job.id}\n`;
      output += `Name: ${job.name}\n`;
      output += `Cron: ${job.cronExpression}\n`;
      output += `Command: ${job.command}\n`;
      output += `Status: ${status}\n`;
      output += `Last Run: ${lastRun}\n`;
      output += `Created: ${new Date(job.createdAt).toLocaleString()}\n`;
      output += '─'.repeat(40) + '\n\n';
    }

    return output;
  }
}
