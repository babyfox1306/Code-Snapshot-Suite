export interface Snapshot {
  id: string;
  timestamp: number;
  message?: string;
  fileCount: number;
  size: number;
  workspacePath: string;
}

export interface SnapshotCreateOptions {
  message?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface SnapshotRestoreOptions {
  createBackup?: boolean;
  overwriteExisting?: boolean;
}

export interface SnapshotCompareResult {
  added: string[];
  modified: string[];
  deleted: string[];
  unchanged: string[];
}

export interface SnapshotStats {
  totalSnapshots: number;
  totalSize: number;
  averageSize: number;
  oldestSnapshot?: Snapshot;
  newestSnapshot?: Snapshot;
}

export interface ProFeatures {
  timelineChart: boolean;
  markdownExport: boolean;
  autoClean: boolean;
  advancedSearch: boolean;
  bulkOperations: boolean;
}

export interface ExtensionConfig {
  snapshotsPath: string;
  maxSnapshotSize: number;
  autoCleanDays: number;
  includePatterns: string[];
  excludePatterns: string[];
}

export interface SnapshotTreeItem {
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  timestamp: number;
  size: number;
  message?: string;
  isProFeature?: boolean;
}
