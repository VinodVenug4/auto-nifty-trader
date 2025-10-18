// Production-safe logging
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (!isProduction) {
      console.log(message, ...args);
    }
  },
  
  error: (message: string, error?: any) => {
    if (!isProduction) {
      console.error(message, error);
    } else {
      // In production, log only generic messages
      console.error('An error occurred');
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (!isProduction) {
      console.warn(message, ...args);
    }
  }
};