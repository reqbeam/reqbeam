import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { createObjectCsvWriter } from 'csv-writer';
import { LogEntry, LogSummary, ExportOptions } from '../types.js';

export class Logger {
  private static instance: Logger;
  private logsFile: string;
  private logsDir: string;

  private constructor() {
    this.logsDir = path.join(os.homedir(), '.postmind', 'logs');
    this.logsFile = path.join(this.logsDir, 'logs.json');
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log a request execution
   */
  public async logRequest(
    name: string,
    status: number,
    duration: number,
    success: boolean,
    environment?: string,
    details?: any
  ): Promise<string> {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      type: 'request',
      name,
      status: `${status} ${this.getStatusText(status)}`,
      duration,
      timestamp: new Date().toISOString(),
      details,
      environment,
      success
    };

    await this.saveLogEntry(logEntry);
    return logEntry.id;
  }

  /**
   * Log a test execution
   */
  public async logTest(
    name: string,
    passedTests: number,
    totalTests: number,
    duration: number,
    success: boolean,
    details?: any
  ): Promise<string> {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      type: 'test',
      name,
      status: `${passedTests}/${totalTests} Passed`,
      duration,
      timestamp: new Date().toISOString(),
      details,
      success
    };

    await this.saveLogEntry(logEntry);
    return logEntry.id;
  }

  /**
   * Log a collection execution
   */
  public async logCollection(
    name: string,
    status: number,
    duration: number,
    success: boolean,
    environment?: string,
    details?: any
  ): Promise<string> {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      type: 'collection',
      name,
      status: `${status} ${this.getStatusText(status)}`,
      duration,
      timestamp: new Date().toISOString(),
      details,
      environment,
      success
    };

    await this.saveLogEntry(logEntry);
    return logEntry.id;
  }

  /**
   * List all logs with optional filtering
   */
  public async listLogs(limit?: number, type?: string): Promise<LogEntry[]> {
    const logs = await this.loadLogs();
    
    let filteredLogs = logs;
    
    if (type && type !== 'all') {
      filteredLogs = logs.filter(log => log.type === type);
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (limit) {
      filteredLogs = filteredLogs.slice(0, limit);
    }
    
    return filteredLogs;
  }

  /**
   * Get a specific log by ID
   */
  public async getLog(logId: string): Promise<LogEntry | null> {
    const logs = await this.loadLogs();
    return logs.find(log => log.id === logId) || null;
  }

  /**
   * Get log summary statistics
   */
  public async getLogSummary(): Promise<LogSummary> {
    const logs = await this.loadLogs();
    
    const total = logs.length;
    const passed = logs.filter(log => log.success).length;
    const failed = total - passed;
    const averageDuration = total > 0 ? logs.reduce((sum, log) => sum + log.duration, 0) / total : 0;
    const lastRun = logs.length > 0 ? logs[0].timestamp : undefined;

    return {
      total,
      passed,
      failed,
      averageDuration: Math.round(averageDuration),
      lastRun
    };
  }

  /**
   * Export logs to file
   */
  public async exportLogs(options: ExportOptions): Promise<void> {
    const logs = await this.loadLogs();
    
    let filteredLogs = logs;
    
    // Filter by type
    if (options.type && options.type !== 'all') {
      filteredLogs = logs.filter(log => log.type === options.type);
    }
    
    // Filter by date range
    if (options.startDate) {
      const startDate = new Date(options.startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startDate);
    }
    
    if (options.endDate) {
      const endDate = new Date(options.endDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endDate);
    }

    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    await fs.ensureDir(logsDir);
    
    // If filePath is not absolute, make it relative to logs directory
    const exportPath = path.isAbsolute(options.filePath) 
      ? options.filePath 
      : path.join(logsDir, options.filePath);
    
    await fs.ensureDir(path.dirname(exportPath));

    if (options.format === 'json') {
      await fs.writeJson(exportPath, filteredLogs, { spaces: 2 });
    } else if (options.format === 'csv') {
      const csvWriter = createObjectCsvWriter({
        path: exportPath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'type', title: 'Type' },
          { id: 'name', title: 'Name' },
          { id: 'status', title: 'Status' },
          { id: 'duration', title: 'Duration (ms)' },
          { id: 'timestamp', title: 'Timestamp' },
          { id: 'success', title: 'Success' },
          { id: 'environment', title: 'Environment' }
        ]
      });

      await csvWriter.writeRecords(filteredLogs);
    }
  }

  /**
   * Clear all logs
   */
  public async clearLogs(): Promise<void> {
    await fs.ensureDir(this.logsDir);
    await fs.writeJson(this.logsFile, []);
  }

  /**
   * Format logs for display
   */
  public formatLogsList(logs: LogEntry[]): string {
    if (logs.length === 0) {
      return 'No logs found.';
    }

    const table = [
      ['ID', 'TYPE', 'STATUS', 'DURATION'],
      ...logs.map(log => [
        log.id.substring(0, 8) + '...',
        log.type.toUpperCase(),
        log.status,
        `${log.duration}ms`
      ])
    ];

    // Simple table formatting
    const colWidths = [12, 8, 15, 10];
    let output = '\n📋 Execution Logs\n';
    output += '═'.repeat(60) + '\n\n';

    for (let i = 0; i < table.length; i++) {
      const row = table[i];
      let line = '';
      
      for (let j = 0; j < row.length; j++) {
        const cell = row[j].toString();
        const width = colWidths[j];
        line += cell.padEnd(width);
        if (j < row.length - 1) {
          line += ' │ ';
        }
      }
      
      output += line + '\n';
      
      if (i === 0) {
        output += '─'.repeat(60) + '\n';
      }
    }

    output += '\n';
    return output;
  }

  /**
   * Format single log details
   */
  public formatLogDetails(log: LogEntry): string {
    let output = `\n📄 Log Details\n`;
    output += `═══════════════════════════════════════\n\n`;
    output += `ID: ${log.id}\n`;
    output += `Type: ${log.type.toUpperCase()}\n`;
    output += `Name: ${log.name}\n`;
    output += `Status: ${log.status}\n`;
    output += `Duration: ${log.duration}ms\n`;
    output += `Success: ${log.success ? 'Yes' : 'No'}\n`;
    output += `Timestamp: ${new Date(log.timestamp).toLocaleString()}\n`;
    
    if (log.environment) {
      output += `Environment: ${log.environment}\n`;
    }
    
    if (log.details) {
      output += `\nDetails:\n${JSON.stringify(log.details, null, 2)}\n`;
    }
    
    return output;
  }

  /**
   * Load logs from file
   */
  private async loadLogs(): Promise<LogEntry[]> {
    await fs.ensureDir(this.logsDir);
    
    if (await fs.pathExists(this.logsFile)) {
      return await fs.readJson(this.logsFile);
    }
    
    return [];
  }

  /**
   * Save log entry to file
   */
  private async saveLogEntry(logEntry: LogEntry): Promise<void> {
    const logs = await this.loadLogs();
    logs.unshift(logEntry); // Add to beginning
    
    // Keep only last 1000 entries
    const trimmedLogs = logs.slice(0, 1000);
    
    await fs.ensureDir(this.logsDir);
    await fs.writeJson(this.logsFile, trimmedLogs, { spaces: 2 });
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get status text for HTTP status code
   */
  private getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    
    return statusTexts[status] || 'Unknown';
  }
}
