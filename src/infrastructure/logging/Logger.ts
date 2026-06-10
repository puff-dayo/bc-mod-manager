/**
 * Log Level
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

/**
 * Log Entry
 */
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
}

/**
 * Logger
 *
 * Cross-cutting, low-level logging infrastructure: an in-memory ring buffer of
 * log entries mirrored to the console. Every layer (infrastructure, repository,
 * service, presentation) may depend on this. Higher-level concerns such as the
 * debug-method registry and crash-report generation live in `service/LogService`.
 */
export class Logger {
  private static readonly MAX_LOGS = 1000; // Maximum number of logs to keep
  private static logs: LogEntry[] = [];

  /**
   * Add a log entry
   * @param level - Log level
   * @param message - Log message
   * @param data - Optional additional data
   */
  static log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      data,
    };

    this.logs.push(entry);

    // Keep only the last MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.splice(0, this.logs.length - this.MAX_LOGS);
    }

    // Also log to console
    const consoleMsg = `[${level}] ${message}`;
    switch (level) {
      case 'DEBUG':
        console.debug(consoleMsg, data);
        break;
      case 'INFO':
        console.info(consoleMsg, data);
        break;
      case 'WARN':
        console.warn(consoleMsg, data);
        break;
      case 'ERROR':
        console.error(consoleMsg, data);
        break;
    }
  }

  /**
   * Convenience methods for different log levels
   */
  static debug(message: string, data?: any): void {
    this.log('DEBUG', message, data);
  }

  static info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }

  static warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }

  static error(message: string, data?: any): void {
    this.log('ERROR', message, data);
  }

  /**
   * Get all logs
   */
  static getAllLogs(): LogEntry[] {
    return [...this.logs]; // Return a copy to prevent external modification
  }

  /**
   * Get logs filtered by level
   */
  static getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs within a time range
   */
  static getLogsByTimeRange(startTime: number, endTime: number): LogEntry[] {
    return this.logs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime);
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON string
   */
  static exportLogsAsJSON(): string {
    const logs = this.getAllLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export logs as text
   */
  static exportLogsAsText(): string {
    const logs = this.getAllLogs();
    return logs.map(log => {
      const date = new Date(log.timestamp).toISOString();
      const dataStr = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
      return `[${date}] [${log.level}] ${log.message}${dataStr}`;
    }).join('\n');
  }

  /**
   * Get log statistics
   */
  static getLogStats(): Record<LogLevel, number> {
    const logs = this.getAllLogs();
    const stats: Record<LogLevel, number> = {
      ['DEBUG']: 0,
      ['INFO']: 0,
      ['WARN']: 0,
      ['ERROR']: 0,
    };

    logs.forEach(log => {
      stats[log.level]++;
    });

    return stats;
  }
}
