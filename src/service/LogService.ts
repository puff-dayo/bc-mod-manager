import {Logger} from "@/infrastructure/logging/Logger";

/**
 * Debug Method (Crash Reporter Generator)
 */
interface DebugMethod {
  name: string;
  method: () => string | Promise<string>;
}

/**
 * Log Service
 *
 * Application-level logging features built on top of the {@link Logger}
 * infrastructure: a registry of debug methods (crash-reporter generators) and
 * crash-report assembly/download. Low-level logging lives in {@link Logger};
 * the logging delegations below exist only for callers not yet migrated to it.
 */
export class LogService {
  private static debugMethods = new Map<string, DebugMethod>();

  /**
   * Register a debug method (crash reporter generator)
   * @param name - Name of the debug method
   * @param method - Function that returns debug information
   */
  static registerDebugMethod(name: string, method: () => string | Promise<string>): void {
    this.debugMethods.set(name, {name, method});
    Logger.debug(`Debug method registered: ${name}`);
  }

  /**
   * Unregister a debug method
   * @param name - Name of the debug method to remove
   */
  static unregisterDebugMethod(name: string): void {
    if (this.debugMethods.delete(name)) {
      Logger.debug(`Debug method unregistered: ${name}`);
    }
  }

  /**
   * Get all registered debug methods
   */
  static getDebugMethods(): string[] {
    return Array.from(this.debugMethods.keys());
  }

  /**
   * Execute a debug method and get its output
   * @param name - Name of the debug method
   */
  static async executeDebugMethod(name: string): Promise<string> {
    const debugMethod = this.debugMethods.get(name);
    if (!debugMethod) {
      throw new Error(`Debug method not found: ${name}`);
    }

    try {
      const result = await debugMethod.method();
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to execute debug method: ${name}`, {error: errorMsg});
      throw error;
    }
  }

  /**
   * Execute all debug methods and get their outputs
   */
  static async executeAllDebugMethods(): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    for (const [name, debugMethod] of this.debugMethods.entries()) {
      try {
        results[name] = await debugMethod.method();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results[name] = `ERROR: ${errorMsg}`;
        Logger.error(`Failed to execute debug method: ${name}`, {error: errorMsg});
      }
    }

    return results;
  }

  /**
   * Generate a crash report with logs and debug information
   */
  static async generateCrashReport(): Promise<string> {
    const report: string[] = [];

    report.push('='.repeat(80));
    report.push('BC MOD MANAGER - CRASH REPORT');
    report.push('='.repeat(80));
    report.push('');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push(`User Agent: ${navigator.userAgent}`);
    report.push(`Platform: ${navigator.platform}`);
    report.push(`Language: ${navigator.language}`);
    report.push('');

    // Add debug information
    report.push('='.repeat(80));
    report.push('DEBUG INFORMATION');
    report.push('='.repeat(80));
    report.push('');

    const debugResults = await this.executeAllDebugMethods();
    for (const [name, result] of Object.entries(debugResults)) {
      report.push(`--- ${name} ---`);
      report.push(result);
      report.push('');
    }

    // Add logs
    report.push('='.repeat(80));
    report.push('LOGS');
    report.push('='.repeat(80));
    report.push('');
    report.push(Logger.exportLogsAsText());

    return report.join('\n');
  }

  /**
   * Download crash report as a file
   */
  static async downloadCrashReport(): Promise<void> {
    try {
      const report = await this.generateCrashReport();
      const blob = new Blob([report], {type: 'text/plain'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bc-mod-manager-crash-report-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Logger.info('Crash report downloaded successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      Logger.error('Failed to download crash report', {error: errorMsg});
      throw error;
    }
  }
}
