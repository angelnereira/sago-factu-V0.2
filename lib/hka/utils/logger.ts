/**
 * Sistema de logging estructurado para operaciones HKA
 * Guarda logs en archivo y permite debugging de XMLs
 */

import { promises as fs } from 'fs';
import { join } from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  invoiceId?: string;
  organizationId?: string;
  operation: string;
  message: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export class HKALogger {
  private static instance: HKALogger;
  private logFile: string;
  private maxLogFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxLogFiles: number = 5;

  private constructor() {
    this.logFile = '/tmp/hka-operations.log';
  }

  public static getInstance(): HKALogger {
    if (!HKALogger.instance) {
      HKALogger.instance = new HKALogger();
    }
    return HKALogger.instance;
  }

  /**
   * Log a message with structured data
   */
  private async log(
    level: LogLevel,
    operation: string,
    message: string,
    data?: {
      invoiceId?: string;
      organizationId?: string;
      data?: any;
      error?: Error;
    }
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      invoiceId: data?.invoiceId,
      organizationId: data?.organizationId,
      operation,
      message,
      data: data?.data,
      error: data?.error
        ? {
            message: data.error.message,
            stack: data.error.stack,
            code: (data.error as any).code,
          }
        : undefined,
    };

    // Console output (colored)
    const consoleMessage = this.formatConsoleMessage(entry);
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(consoleMessage);
        break;
      case LogLevel.INFO:
        console.info(consoleMessage);
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage);
        break;
      case LogLevel.ERROR:
        console.error(consoleMessage);
        break;
    }

    // File output (JSON structured)
    try {
      await this.appendToLogFile(entry);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  /**
   * Format message for console output
   */
  private formatConsoleMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleString('es-PA');
    const levelEmoji = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
    }[entry.level];

    let msg = `${levelEmoji} [${timestamp}] [${entry.level}] ${entry.operation}`;
    if (entry.invoiceId) {
      msg += ` [Invoice: ${entry.invoiceId.substring(0, 8)}...]`;
    }
    if (entry.organizationId) {
      msg += ` [Org: ${entry.organizationId.substring(0, 8)}...]`;
    }
    msg += `: ${entry.message}`;

    if (entry.data && Object.keys(entry.data).length > 0) {
      msg += `\n   Data: ${JSON.stringify(entry.data, null, 2)}`;
    }

    if (entry.error) {
      msg += `\n   Error: ${entry.error.message}`;
      if (entry.error.stack) {
        msg += `\n   Stack: ${entry.error.stack.split('\n').slice(0, 3).join('\n')}`;
      }
    }

    return msg;
  }

  /**
   * Append log entry to file
   */
  private async appendToLogFile(entry: LogEntry): Promise<void> {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.logFile, logLine, 'utf-8');

      // Rotate log file if too large
      await this.rotateLogFileIfNeeded();
    } catch (error) {
      // If file doesn't exist, create it
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.writeFile(this.logFile, JSON.stringify(entry) + '\n', 'utf-8');
      } else {
        throw error;
      }
    }
  }

  /**
   * Rotate log file if it exceeds max size
   */
  private async rotateLogFileIfNeeded(): Promise<void> {
    try {
      const stats = await fs.stat(this.logFile);
      if (stats.size > this.maxLogFileSize) {
        // Rotate existing logs
        for (let i = this.maxLogFiles - 1; i >= 1; i--) {
          const oldFile = `${this.logFile}.${i}`;
          const newFile = `${this.logFile}.${i + 1}`;
          try {
            await fs.rename(oldFile, newFile);
          } catch {
            // File doesn't exist, continue
          }
        }

        // Move current log to .1
        await fs.rename(this.logFile, `${this.logFile}.1`);

        // Create new log file
        await fs.writeFile(this.logFile, '', 'utf-8');
      }
    } catch (error) {
      // Ignore rotation errors
      console.warn('Error rotating log file:', error);
    }
  }

  /**
   * Save XML for debugging
   */
  public async saveXMLDebug(
    xmlContent: string,
    invoiceId: string,
    operation: string = 'xml-generation'
  ): Promise<string> {
    const timestamp = Date.now();
    const filename = `xml-hka-${invoiceId}-${operation}-${timestamp}.xml`;
    const filepath = join('/tmp', filename);

    try {
      await fs.writeFile(filepath, xmlContent, 'utf-8');
      await this.info(
        'XML_DEBUG_SAVED',
        `XML guardado para debugging: ${filepath}`,
        {
          invoiceId,
          data: { filepath, filename, operation, size: xmlContent.length },
        }
      );
      return filepath;
    } catch (error) {
      await this.error(
        'XML_DEBUG_SAVE_ERROR',
        `Error guardando XML para debugging: ${error instanceof Error ? error.message : 'Unknown'}`,
        {
          invoiceId,
          error: error instanceof Error ? error : new Error(String(error)),
        }
      );
      throw error;
    }
  }

  /**
   * Clean old log files and XML debug files
   */
  public async cleanOldLogs(daysOld: number = 7): Promise<void> {
    try {
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      // Clean log files
      for (let i = 1; i <= this.maxLogFiles + 1; i++) {
        const logFile = i === 1 ? this.logFile : `${this.logFile}.${i}`;
        try {
          const stats = await fs.stat(logFile);
          if (now - stats.mtimeMs > maxAge) {
            await fs.unlink(logFile);
            await this.info('LOG_CLEANUP', `Archivo de log eliminado: ${logFile}`);
          }
        } catch {
          // File doesn't exist, continue
        }
      }

      // Clean XML debug files
      try {
        const files = await fs.readdir('/tmp');
        const xmlFiles = files.filter(f => f.startsWith('xml-hka-') && f.endsWith('.xml'));
        
        for (const file of xmlFiles) {
          const filepath = join('/tmp', file);
          try {
            const stats = await fs.stat(filepath);
            if (now - stats.mtimeMs > maxAge) {
              await fs.unlink(filepath);
              await this.info('XML_CLEANUP', `Archivo XML debug eliminado: ${filepath}`);
            }
          } catch {
            // Continue
          }
        }
      } catch {
        // /tmp may not be accessible, continue
      }
    } catch (error) {
      await this.error(
        'CLEANUP_ERROR',
        `Error limpiando logs antiguos: ${error instanceof Error ? error.message : 'Unknown'}`,
        {
          error: error instanceof Error ? error : new Error(String(error)),
        }
      );
    }
  }

  // Public logging methods
  public async debug(
    operation: string,
    message: string,
    data?: {
      invoiceId?: string;
      organizationId?: string;
      data?: any;
    }
  ): Promise<void> {
    await this.log(LogLevel.DEBUG, operation, message, data);
  }

  public async info(
    operation: string,
    message: string,
    data?: {
      invoiceId?: string;
      organizationId?: string;
      data?: any;
    }
  ): Promise<void> {
    await this.log(LogLevel.INFO, operation, message, data);
  }

  public async warn(
    operation: string,
    message: string,
    data?: {
      invoiceId?: string;
      organizationId?: string;
      data?: any;
      error?: Error;
    }
  ): Promise<void> {
    await this.log(LogLevel.WARN, operation, message, data);
  }

  public async error(
    operation: string,
    message: string,
    data?: {
      invoiceId?: string;
      organizationId?: string;
      data?: any;
      error?: Error;
    }
  ): Promise<void> {
    await this.log(LogLevel.ERROR, operation, message, data);
  }
}

// Export singleton instance
export const hkaLogger = HKALogger.getInstance();

