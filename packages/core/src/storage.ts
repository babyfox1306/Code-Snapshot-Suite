import * as fs from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';

export interface SnapshotMetadata {
  id: string;
  timestamp: number;
  message?: string;
  fileCount: number;
  size: number;
  workspacePath: string;
}

export interface SnapshotOptions {
  message?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export class SnapshotStorage {
  private snapshotsDir: string;

  constructor(workspaceRoot: string, snapshotsPath: string = '.snapshots') {
    this.snapshotsDir = path.join(workspaceRoot, snapshotsPath);
  }

  async ensureSnapshotsDir(): Promise<void> {
    try {
      await fs.access(this.snapshotsDir);
    } catch {
      await fs.mkdir(this.snapshotsDir, { recursive: true });
    }
  }

  async saveSnapshot(
    workspaceRoot: string,
    options: SnapshotOptions = {}
  ): Promise<SnapshotMetadata> {
    await this.ensureSnapshotsDir();

    const timestamp = Date.now();
    const snapshotId = `snapshot_${timestamp}`;
    const zipPath = path.join(this.snapshotsDir, `${snapshotId}.zip`);
    const metadataPath = path.join(this.snapshotsDir, 'metadata.json');

    // Create zip archive
    const zip = new AdmZip();
    
    // Add files to zip
    const fileCount = await this.addFilesToZip(zip, workspaceRoot, options);
    
    // Write zip file
    await fs.writeFile(zipPath, zip.toBuffer());

    // Get file size
    const stats = await fs.stat(zipPath);
    const size = stats.size;

    // Create metadata
    const metadata: SnapshotMetadata = {
      id: snapshotId,
      timestamp,
      message: options.message,
      fileCount,
      size,
      workspacePath: workspaceRoot
    };

    // Update metadata file
    await this.updateMetadata(metadata);

    return metadata;
  }

  async loadSnapshot(snapshotId: string): Promise<Buffer> {
    const zipPath = path.join(this.snapshotsDir, `${snapshotId}.zip`);
    return await fs.readFile(zipPath);
  }

  async restoreSnapshot(
    snapshotId: string,
    targetPath: string,
    createBackup: boolean = true
  ): Promise<void> {
    const zipPath = path.join(this.snapshotsDir, `${snapshotId}.zip`);
    
    if (createBackup) {
      const backupId = `backup_${Date.now()}`;
      const backupZipPath = path.join(this.snapshotsDir, `${backupId}.zip`);
      
      // Create backup of current state
      const backupZip = new AdmZip();
      await this.addFilesToZip(backupZip, targetPath);
      await fs.writeFile(backupZipPath, backupZip.toBuffer());
    }

    // Extract snapshot
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(targetPath, true);
  }

  async listSnapshots(): Promise<SnapshotMetadata[]> {
    const metadataPath = path.join(this.snapshotsDir, 'metadata.json');
    
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    const zipPath = path.join(this.snapshotsDir, `${snapshotId}.zip`);
    
    // Remove zip file
    try {
      await fs.unlink(zipPath);
    } catch (error) {
      // File might not exist, continue
    }

    // Remove from metadata
    const snapshots = await this.listSnapshots();
    const updatedSnapshots = snapshots.filter(s => s.id !== snapshotId);
    await this.saveMetadata(updatedSnapshots);
  }

  async getSnapshotMetadata(snapshotId: string): Promise<SnapshotMetadata | null> {
    const snapshots = await this.listSnapshots();
    return snapshots.find(s => s.id === snapshotId) || null;
  }

  private async addFilesToZip(
    zip: AdmZip,
    rootPath: string,
    options: SnapshotOptions = {}
  ): Promise<number> {
    let fileCount = 0;

    const addDirectory = async (dirPath: string, relativePath: string = ''): Promise<void> => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name);

        // Skip snapshots directory
        if (entry.name === '.snapshots') {
          continue;
        }

        // Apply include/exclude patterns
        if (this.shouldIncludeFile(relativeFilePath, options)) {
          if (entry.isDirectory()) {
            await addDirectory(fullPath, relativeFilePath);
          } else {
            try {
              const content = await fs.readFile(fullPath);
              zip.addFile(relativeFilePath, content);
              fileCount++;
            } catch (error) {
              // Skip files that can't be read
              console.warn(`Skipping file ${fullPath}: ${error}`);
            }
          }
        }
      }
    };

    await addDirectory(rootPath);
    return fileCount;
  }

  private shouldIncludeFile(filePath: string, options: SnapshotOptions): boolean {
    // Default exclude patterns
    const defaultExcludes = [
      'node_modules',
      '.git',
      '.vscode',
      'out',
      'dist',
      '*.log'
    ];

    const excludePatterns = [
      ...defaultExcludes,
      ...(options.excludePatterns || [])
    ];

    // Check exclude patterns
    for (const pattern of excludePatterns) {
      if (this.matchesPattern(filePath, pattern)) {
        return false;
      }
    }

    // Check include patterns
    if (options.includePatterns && options.includePatterns.length > 0) {
      return options.includePatterns.some(pattern => 
        this.matchesPattern(filePath, pattern)
      );
    }

    return true;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regex = new RegExp(
      pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
    );
    return regex.test(filePath);
  }

  private async updateMetadata(newMetadata: SnapshotMetadata): Promise<void> {
    const snapshots = await this.listSnapshots();
    snapshots.push(newMetadata);
    snapshots.sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
    await this.saveMetadata(snapshots);
  }

  private async saveMetadata(snapshots: SnapshotMetadata[]): Promise<void> {
    const metadataPath = path.join(this.snapshotsDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(snapshots, null, 2));
  }
}
