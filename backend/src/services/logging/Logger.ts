import winston from 'winston';
import config from '../../config/environment';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which files to write to
const transports = [
  // Allow console logging only in development
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  // Write all logs error (and below) to error.log
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  // Write all logs info (and below) to combined.log
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
];

// Create the logger
const Logger = winston.createLogger({
  level: config.server.nodeEnv === 'development' ? 'debug' : 'warn',
  levels,
  format,
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Create a stream object for morgan HTTP logging
(Logger as any).stream = {
  write: (message: string) => {
    Logger.http(message.trim());
  },
};

export default Logger;

// Enhanced logging functions with context
export class AppLogger {
  static logRequest(req: any, userId?: string) {
    Logger.info(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      userId: userId || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  static logError(error: Error, context?: any) {
    Logger.error(`Error: ${error.message}`, {
      error: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  static logAuthEvent(event: string, userId: string, success: boolean, details?: any) {
    const level = success ? 'info' : 'warn';
    Logger[level](`Auth ${event}: ${success ? 'SUCCESS' : 'FAILED'}`, {
      event,
      userId,
      success,
      details,
      timestamp: new Date().toISOString()
    });
  }

  static logTripEvent(event: string, tripId: string, userId: string, details?: any) {
    Logger.info(`Trip ${event}`, {
      event,
      tripId,
      userId,
      details,
      timestamp: new Date().toISOString()
    });
  }

  static logLLMUsage(provider: string, tokensUsed: number, cost: number, userId: string) {
    Logger.info('LLM Usage', {
      provider,
      tokensUsed,
      cost,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  static logAPICall(service: string, endpoint: string, success: boolean, responseTime: number, userId?: string) {
    const level = success ? 'info' : 'error';
    Logger[level](`API Call: ${service}`, {
      service,
      endpoint,
      success,
      responseTime,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  static logPerformance(operation: string, duration: number, details?: any) {
    const level = duration > 5000 ? 'warn' : 'info'; // Warn if operation takes more than 5 seconds
    Logger[level](`Performance: ${operation}`, {
      operation,
      duration,
      details,
      timestamp: new Date().toISOString()
    });
  }

  static logSecurity(event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    Logger[level](`Security Event: ${event}`, {
      event,
      severity,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

/*
 * NOTE: This is a P0 logging implementation using Winston.
 * 
 * For P1 enhancements:
 * - Integrate with external logging services (DataDog, New Relic)
 * - Add structured logging with correlation IDs
 * - Implement log rotation and archival
 * - Add real-time log streaming
 * - Implement log aggregation and analysis
 * - Add alerting based on log patterns
 * - Implement audit logging for compliance
 * - Add performance monitoring integration
 */