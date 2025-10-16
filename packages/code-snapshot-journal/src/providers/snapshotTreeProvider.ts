import * as vscode from 'vscode';
import { SnapshotStorage, SnapshotMetadata } from '@snapshot/core';
import { LicenseKeyManager } from '@snapshot/core';
import { SnapshotIcons } from '@snapshot/icons';
import { BaseTreeDataProvider, TreeItemData } from '@snapshot/core';

export class SnapshotTreeProvider extends BaseTreeDataProvider {
  private storage: SnapshotStorage;
  private keyManager: LicenseKeyManager;

  constructor(storage: SnapshotStorage, keyManager: LicenseKeyManager) {
    super();
    this.storage = storage;
    this.keyManager = keyManager;
  }

  async getChildren(element?: TreeItemData): Promise<TreeItemData[]> {
    if (!element) {
      // Root level - show snapshots
      return await this.getSnapshots();
    }

    return [];
  }

  getTreeItem(element: TreeItemData): vscode.TreeItem {
    const item = super.createTreeItem(element);
    
    // Set context value for context menu
    item.contextValue = 'snapshotItem';
    
    return item;
  }

  private async getSnapshots(): Promise<TreeItemData[]> {
    try {
      const snapshots = await this.storage.listSnapshots();
      
      if (snapshots.length === 0) {
        return [{
          id: 'no-snapshots',
          label: 'No snapshots yet',
          description: 'Create your first snapshot with Ctrl+Shift+S',
          tooltip: 'Use Ctrl+Shift+S to create a snapshot of your current workspace',
          iconPath: SnapshotIcons.getThemeIcon('snapshot')
        }];
      }

      return snapshots.map((snapshot: SnapshotMetadata) => this.createSnapshotTreeItem(snapshot));
    } catch (error) {
      return [{
        id: 'error',
        label: 'Error loading snapshots',
        description: error instanceof Error ? error.message : 'Unknown error',
        tooltip: 'Failed to load snapshots',
        iconPath: SnapshotIcons.getIconPath('warning')
      }];
    }
  }

  private createSnapshotTreeItem(snapshot: SnapshotMetadata): TreeItemData {
    const date = new Date(snapshot.timestamp);
    const timeAgo = this.formatTimeAgo(snapshot.timestamp);
    const size = this.formatFileSize(snapshot.size);
    
    let label = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    let description = `${snapshot.fileCount} files • ${size}`;
    
    if (snapshot.message) {
      description = `${snapshot.message} • ${description}`;
    }

    return {
      id: snapshot.id,
      label,
      description,
      tooltip: this.createTooltip(snapshot),
      iconPath: SnapshotIcons.getIconPath('snapshot'),
      contextValue: 'snapshotItem'
    };
  }

  private createTooltip(snapshot: SnapshotMetadata): string {
    const date = new Date(snapshot.timestamp);
    const size = this.formatFileSize(snapshot.size);
    
    let tooltip = `Snapshot: ${snapshot.id}\n`;
    tooltip += `Created: ${date.toLocaleString()}\n`;
    tooltip += `Files: ${snapshot.fileCount}\n`;
    tooltip += `Size: ${size}\n`;
    tooltip += `Path: ${snapshot.workspacePath}`;
    
    if (snapshot.message) {
      tooltip += `\nMessage: ${snapshot.message}`;
    }
    
    return tooltip;
  }

  private formatTimeAgo(timestamp: number): string {
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

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
