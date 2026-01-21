
// Logging utility functions
export function logInfo(message: string, data?: any) {
  console.log(`[INFO] ${message}`, data || '');
}

export function logError(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error || '');
}

export function logWarning(message: string, data?: any) {
  console.warn(`[WARNING] ${message}`, data || '');
}

export default {
  logInfo,
  logError,
  logWarning,
};
