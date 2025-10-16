import * as path from 'path';
import * as fs from 'fs/promises';

export class Utils {
  /**
   * Normalize file path for cross-platform compatibility
   */
  static normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * Get relative path from workspace root
   */
  static getRelativePath(filePath: string, workspaceRoot: string): string {
    return path.relative(workspaceRoot, filePath);
  }

  /**
   * Check if path is within workspace
   */
  static isWithinWorkspace(filePath: string, workspaceRoot: string): boolean {
    const relativePath = this.getRelativePath(filePath, workspaceRoot);
    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  }

  /**
   * Format file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: number, format: 'short' | 'long' | 'relative' = 'relative'): string {
    const date = new Date(timestamp);

    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'long':
        return date.toLocaleString();
      case 'relative':
      default:
        return this.formatRelativeTime(timestamp);
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  static formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Generate a unique ID
   */
  static generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if directory exists
   */
  static async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Ensure directory exists
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Get file extension
   */
  static getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  /**
   * Get file name without extension
   */
  static getFileNameWithoutExtension(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Check if file is binary
   */
  static async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath, { encoding: null });
      const chunk = buffer.slice(0, 512);
      
      // Check for null bytes (common in binary files)
      for (let i = 0; i < chunk.length; i++) {
        if (chunk[i] === 0) {
          return true;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  static async getFileStats(filePath: string): Promise<{
    size: number;
    mtime: number;
    isDirectory: boolean;
  }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime.getTime(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      throw new Error(`Failed to get file stats for ${filePath}: ${error}`);
    }
  }

  /**
   * Deep clone an object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    return obj;
  }

  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Retry a function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize filename for safe storage
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255);
  }

  /**
   * Parse JSON safely
   */
  static parseJSON<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Stringify JSON safely
   */
  static stringifyJSON(obj: any, defaultValue: string = '{}'): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return defaultValue;
    }
  }
}
