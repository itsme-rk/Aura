// ─── Logger ───────────────────────────────────────────────
//
// Lightweight logger for Aura. Wraps console methods with
// feature-prefixed output for easier debugging.
//

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const IS_DEV = __DEV__ ?? false;

interface LoggerOptions {
  prefix: string;
}

class Logger {
  private prefix: string;

  constructor(options: LoggerOptions) {
    this.prefix = options.prefix;
  }

  info(message: string, ...args: unknown[]): void {
    if (IS_DEV) {
      console.log(`[${this.prefix}] ℹ️ ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[${this.prefix}] ⚠️ ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[${this.prefix}] ❌ ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (IS_DEV) {
      console.debug(`[${this.prefix}] 🔍 ${message}`, ...args);
    }
  }
}

/** Create a prefixed logger instance. */
export function createLogger(prefix: string): Logger {
  return new Logger({ prefix });
}

// Pre-built loggers for core features
export const syncLogger = createLogger('Sync');
export const queueLogger = createLogger('Queue');
export const reminderLogger = createLogger('Reminder');
export const authLogger = createLogger('Auth');