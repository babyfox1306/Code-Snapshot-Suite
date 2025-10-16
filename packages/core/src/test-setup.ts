// Test setup file
import * as fs from 'fs/promises';
import * as path from 'path';

// Global test utilities
(global as any).testUtils = {
  createTempDir: async (): Promise<string> => {
    const tempDir = path.join(__dirname, 'temp', `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  },
  
  cleanupTempDir: async (dir: string): Promise<void> => {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
};

// Extend Jest matchers if needed
(expect as any).extend({
  toBeValidSnapshotId(received: string) {
    const pass = typeof received === 'string' && received.startsWith('snapshot_');
    return {
      message: () => `expected ${received} to be a valid snapshot ID`,
      pass,
    };
  },
});
