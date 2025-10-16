import * as vscode from 'vscode';

export interface TreeItemData {
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  iconPath?: vscode.Uri | vscode.ThemeIcon;
  contextValue?: string;
  children?: TreeItemData[];
}

export abstract class BaseTreeDataProvider implements vscode.TreeDataProvider<TreeItemData> {
  protected _onDidChangeTreeData: vscode.EventEmitter<TreeItemData | undefined | null | void> = new vscode.EventEmitter<TreeItemData | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItemData | undefined | null | void> = this._onDidChangeTreeData.event;

  abstract getTreeItem(element: TreeItemData): vscode.TreeItem;
  abstract getChildren(element?: TreeItemData): Promise<TreeItemData[]>;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  protected createTreeItem(data: TreeItemData): vscode.TreeItem {
    const item = new vscode.TreeItem(data.label);
    
    if (data.description) {
      item.description = data.description;
    }
    
    if (data.tooltip) {
      item.tooltip = data.tooltip;
    }
    
    if (data.iconPath) {
      item.iconPath = data.iconPath;
    }
    
    if (data.contextValue) {
      item.contextValue = data.contextValue;
    }

    if (data.children && data.children.length > 0) {
      item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    } else {
      item.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    return item;
  }
}

export class UIProvider {
  /**
   * Show a progress notification
   */
  static async showProgress(
    title: string,
    task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<void>
  ): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: false
      },
      task
    );
  }

  /**
   * Show an information message
   */
  static showInfo(message: string): void {
    vscode.window.showInformationMessage(message);
  }

  /**
   * Show a warning message
   */
  static showWarning(message: string): void {
    vscode.window.showWarningMessage(message);
  }

  /**
   * Show an error message
   */
  static showError(message: string): void {
    vscode.window.showErrorMessage(message);
  }

  /**
   * Show a confirmation dialog
   */
  static async showConfirmation(
    message: string,
    detail?: string
  ): Promise<boolean> {
    const result = await vscode.window.showWarningMessage(
      message,
      { detail },
      'Yes',
      'No'
    );
    return result === 'Yes';
  }

  /**
   * Show a quick pick with custom items
   */
  static async showQuickPick<T>(
    items: vscode.QuickPickItem[],
    options?: vscode.QuickPickOptions
  ): Promise<vscode.QuickPickItem | undefined> {
    return await vscode.window.showQuickPick(items, options);
  }

  /**
   * Show an input box
   */
  static async showInputBox(
    options?: vscode.InputBoxOptions
  ): Promise<string | undefined> {
    return await vscode.window.showInputBox(options);
  }

  /**
   * Show a file picker
   */
  static async showOpenDialog(
    options?: vscode.OpenDialogOptions
  ): Promise<vscode.Uri[] | undefined> {
    return await vscode.window.showOpenDialog(options);
  }

  /**
   * Show a save dialog
   */
  static async showSaveDialog(
    options?: vscode.SaveDialogOptions
  ): Promise<vscode.Uri | undefined> {
    return await vscode.window.showSaveDialog(options);
  }

  /**
   * Create a status bar item
   */
  static createStatusBarItem(
    text: string,
    command: string,
    priority: number = 0
  ): vscode.StatusBarItem {
    const item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      priority
    );
    item.text = text;
    item.command = command;
    item.show();
    return item;
  }

  /**
   * Show a webview panel
   */
  static createWebviewPanel(
    viewType: string,
    title: string,
    viewColumn: vscode.ViewColumn,
    options?: vscode.WebviewPanelOptions & vscode.WebviewOptions
  ): vscode.WebviewPanel {
    return vscode.window.createWebviewPanel(viewType, title, viewColumn, options);
  }

  /**
   * Register a command
   */
  static registerCommand(
    command: string,
    callback: (...args: any[]) => any,
    thisArg?: any
  ): vscode.Disposable {
    return vscode.commands.registerCommand(command, callback, thisArg);
  }

  /**
   * Register a tree data provider
   */
  static registerTreeDataProvider<T>(
    viewId: string,
    treeDataProvider: vscode.TreeDataProvider<T>
  ): vscode.Disposable {
    return vscode.window.registerTreeDataProvider(viewId, treeDataProvider);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today ${date.toLocaleTimeString()}`;
    } else if (diffDays === 1) {
      return `Yesterday ${date.toLocaleTimeString()}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Create a notification with actions
   */
  static async showNotificationWithActions(
    message: string,
    actions: string[]
  ): Promise<string | undefined> {
    return await vscode.window.showInformationMessage(message, ...actions);
  }
}
