import * as vscode from 'vscode';
import * as path from 'path';

export interface IconPaths {
  snapshot: vscode.Uri;
  clock: vscode.Uri;
  diff: vscode.Uri;
  restore: vscode.Uri;
  delete: vscode.Uri;
  warning: vscode.Uri;
}

export class SnapshotIcons {
  private static extensionPath: string;

  static initialize(extensionPath: string): void {
    this.extensionPath = extensionPath;
  }

  static getIconPath(iconName: keyof IconPaths): vscode.Uri {
    if (!this.extensionPath) {
      throw new Error('SnapshotIcons not initialized. Call initialize() first.');
    }

    const iconPath = path.join(this.extensionPath, 'packages', 'icons', 'src', `${iconName}.svg`);
    return vscode.Uri.file(iconPath);
  }

  static getAllIcons(): IconPaths {
    return {
      snapshot: this.getIconPath('snapshot'),
      clock: this.getIconPath('clock'),
      diff: this.getIconPath('diff'),
      restore: this.getIconPath('restore'),
      delete: this.getIconPath('delete'),
      warning: this.getIconPath('warning')
    };
  }

  static getThemeIcon(iconName: string): vscode.ThemeIcon {
    const iconMap: Record<string, string> = {
      snapshot: 'star',
      clock: 'clock',
      diff: 'diff',
      restore: 'refresh',
      delete: 'trash',
      warning: 'warning'
    };

    return new vscode.ThemeIcon(iconMap[iconName] || 'file');
  }

  static getIconForSnapshot(status: 'created' | 'restored' | 'deleted' | 'error'): vscode.Uri | vscode.ThemeIcon {
    switch (status) {
      case 'created':
        return this.getIconPath('snapshot');
      case 'restored':
        return this.getIconPath('restore');
      case 'deleted':
        return this.getIconPath('delete');
      case 'error':
        return this.getIconPath('warning');
      default:
        return this.getThemeIcon('snapshot');
    }
  }

  static getIconForAction(action: 'create' | 'restore' | 'delete' | 'compare' | 'export'): vscode.Uri | vscode.ThemeIcon {
    switch (action) {
      case 'create':
        return this.getIconPath('snapshot');
      case 'restore':
        return this.getIconPath('restore');
      case 'delete':
        return this.getIconPath('delete');
      case 'compare':
        return this.getIconPath('diff');
      case 'export':
        return this.getThemeIcon('export');
      default:
        return this.getThemeIcon('file');
    }
  }
}

// Export individual icon paths for convenience
export const SNAPSHOT_ICON = 'snapshot';
export const CLOCK_ICON = 'clock';
export const DIFF_ICON = 'diff';
export const RESTORE_ICON = 'restore';
export const DELETE_ICON = 'delete';
export const WARNING_ICON = 'warning';
