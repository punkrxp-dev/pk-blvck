/**
 * Structured logging utility for NEØ standards compliance
 * Replaces console.log/warn/error with structured logging
 */

export function log(message: string, source = 'app', level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const _logEntry = {
    timestamp,
    level,
    source,
    message,
    ...(level === 'error' && { stack: new Error().stack }),
  };

  const formattedMessage = `[${timestamp}] ${level.toUpperCase()} [${source}] ${message}`;

  if (level === 'error') {
    console.error(formattedMessage);
  } else if (level === 'warn') {
    console.warn(formattedMessage);
  } else {
    console.log(formattedMessage);
  }

  // In production, you would send this to a logging service
  // logToExternalService(_logEntry);
}
