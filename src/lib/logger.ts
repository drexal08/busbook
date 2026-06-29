/**
 * Structured Logging System
 * 
 * Provides consistent, structured logging throughout the application
 * with different log levels and optional context/metadata
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private userId?: string;
  private sessionId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  private formatLog(entry: LogEntry): string {
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? ` [${entry.error.name}: ${entry.error.message}]` : '';
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`;
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        userId: this.userId,
        sessionId: this.sessionId,
        ...context,
      },
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      } : undefined,
    };
  }

  private log(entry: LogEntry) {
    const formattedLog = this.formatLog(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedLog, entry);
        }
        break;
      case LogLevel.INFO:
        console.info(formattedLog, entry);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog, entry);
        break;
      case LogLevel.ERROR:
        console.error(formattedLog, entry);
        break;
    }

    // In production, you might want to send logs to a service
    // this.sendToLogService(entry);
  }

  debug(message: string, context?: LogContext) {
    this.log(this.createLogEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext) {
    this.log(this.createLogEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext) {
    this.log(this.createLogEntry(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log(this.createLogEntry(LogLevel.ERROR, message, context, error));
  }

  // Convenience methods for common actions
  logAuthAction(action: string, context?: LogContext) {
    this.info(`Auth action: ${action}`, { component: 'auth', action, ...context });
  }

  logVerificationEvent(event: string, context?: LogContext) {
    this.info(`Verification event: ${event}`, { component: 'verification', action: event, ...context });
  }

  logSystemEvent(event: string, context?: LogContext) {
    this.info(`System event: ${event}`, { component: 'system', action: event, ...context });
  }

  logApiCall(method: string, endpoint: string, context?: LogContext) {
    this.debug(`API call: ${method} ${endpoint}`, { component: 'api', method, endpoint, ...context });
  }

  logUserAction(action: string, context?: LogContext) {
    this.info(`User action: ${action}`, { component: 'user', action, ...context });
  }
}

// Singleton instance
export const logger = new Logger();

/**
 * React hook for using the logger in components
 */
export function useLogger() {
  return {
    logger,
    setUserId: (userId: string) => logger.setUserId(userId),
  };
}
