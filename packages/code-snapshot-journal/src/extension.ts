import * as vscode from 'vscode';
import { SnapshotStorage, SnapshotMetadata } from '@snapshot/core';
import { LicenseKeyManager } from '@snapshot/core';
import { TelemetryManager } from '@snapshot/core';
import { SnapshotIcons } from '@snapshot/icons';
import { SnapshotTreeProvider } from './providers/snapshotTreeProvider';
import { ExtensionConfig } from './models/snapshot';

export class CodeSnapshotJournal {
  private storage: SnapshotStorage;
  private keyManager: LicenseKeyManager;
  private telemetry: TelemetryManager;
  private treeProvider: SnapshotTreeProvider;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    
    // Initialize core components
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      throw new Error('No workspace folder found');
    }

    this.storage = new SnapshotStorage(workspaceRoot, this.getConfig().snapshotsPath);
    this.keyManager = new LicenseKeyManager();
    this.telemetry = new TelemetryManager(workspaceRoot);
    
    // Initialize icons
    SnapshotIcons.initialize(context.extensionPath);
    
    // Initialize tree provider
    this.treeProvider = new SnapshotTreeProvider(this.storage, this.keyManager);
  }

  async activate(): Promise<void> {
    console.log('Code Snapshot Journal is now active!');

    // Track activation
    await this.telemetry.trackExtensionActivated();

    // Register commands
    this.registerCommands();

    // Register tree data provider
    vscode.window.registerTreeDataProvider('snapshotTimeline', this.treeProvider);

    // Show welcome message for first-time users
    await this.showWelcomeMessage();
  }

  async deactivate(): Promise<void> {
    await this.telemetry.trackExtensionDeactivated();
  }

  private registerCommands(): void {
    // Create snapshot command
    vscode.commands.registerCommand('codeSnapshotJournal.createSnapshot', async () => {
      await this.createSnapshot();
    });

    // Restore snapshot command
    vscode.commands.registerCommand('codeSnapshotJournal.restoreSnapshot', async (item) => {
      if (item) {
        await this.restoreSnapshot(item.id);
      }
    });

    // Delete snapshot command
    vscode.commands.registerCommand('codeSnapshotJournal.deleteSnapshot', async (item) => {
      if (item) {
        await this.deleteSnapshot(item.id);
      }
    });

    // Compare snapshot command
    vscode.commands.registerCommand('codeSnapshotJournal.compareSnapshot', async (item) => {
      if (item) {
        await this.compareSnapshot(item.id);
      }
    });

    // Refresh timeline command
    vscode.commands.registerCommand('codeSnapshotJournal.refreshTimeline', () => {
      this.treeProvider.refresh();
    });

    // Pro features commands
    vscode.commands.registerCommand('codeSnapshotJournal.enterProKey', async () => {
      await this.enterProKey();
    });

    vscode.commands.registerCommand('codeSnapshotJournal.showTimelineChart', async () => {
      await this.showTimelineChart();
    });

    vscode.commands.registerCommand('codeSnapshotJournal.exportChangelog', async () => {
      await this.exportChangelog();
    });

    vscode.commands.registerCommand('codeSnapshotJournal.autoClean', async () => {
      await this.autoClean();
    });
  }

  private async createSnapshot(): Promise<void> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }

      // Get snapshot message
      const message = await vscode.window.showInputBox({
        prompt: 'Enter a message for this snapshot (optional)',
        placeHolder: 'e.g., "Added new feature"'
      });

      if (message === undefined) {
        return; // User cancelled
      }

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Creating snapshot...',
          cancellable: false
        },
        async (progress) => {
          progress.report({ message: 'Scanning files...' });

          const config = this.getConfig();
          const metadata = await this.storage.saveSnapshot(workspaceRoot, {
            message: message || undefined,
            includePatterns: config.includePatterns.length > 0 ? config.includePatterns : undefined,
            excludePatterns: config.excludePatterns
          });

          progress.report({ message: 'Snapshot created successfully!' });

          // Track telemetry
          await this.telemetry.trackSnapshotCreated(metadata.size, metadata.fileCount, message);

          // Refresh tree
          this.treeProvider.refresh();

          // Show success message
          vscode.window.showInformationMessage(
            `Snapshot created: ${metadata.fileCount} files, ${this.formatFileSize(metadata.size)}`
          );
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create snapshot: ${error}`);
    }
  }

  private async restoreSnapshot(snapshotId: string): Promise<void> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }

      // Confirm restore
      const confirmed = await vscode.window.showWarningMessage(
        'This will restore the snapshot and may overwrite current files. Continue?',
        { detail: 'A backup of current state will be created automatically.' },
        'Yes',
        'No'
      );

      if (confirmed !== 'Yes') {
        return;
      }

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Restoring snapshot...',
          cancellable: false
        },
        async (progress) => {
          progress.report({ message: 'Extracting snapshot...' });

          await this.storage.restoreSnapshot(snapshotId, workspaceRoot, true);

          progress.report({ message: 'Snapshot restored successfully!' });

          // Track telemetry
          await this.telemetry.trackSnapshotRestored(snapshotId, true);

          // Refresh tree
          this.treeProvider.refresh();

          vscode.window.showInformationMessage('Snapshot restored successfully!');
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to restore snapshot: ${error}`);
    }
  }

  private async deleteSnapshot(snapshotId: string): Promise<void> {
    try {
      // Confirm deletion
      const confirmed = await vscode.window.showWarningMessage(
        'Are you sure you want to delete this snapshot?',
        { detail: 'This action cannot be undone.' },
        'Yes',
        'No'
      );

      if (confirmed !== 'Yes') {
        return;
      }

      await this.storage.deleteSnapshot(snapshotId);

      // Track telemetry
      await this.telemetry.trackSnapshotDeleted(snapshotId);

      // Refresh tree
      this.treeProvider.refresh();

      vscode.window.showInformationMessage('Snapshot deleted successfully!');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to delete snapshot: ${error}`);
    }
  }

  private async compareSnapshot(snapshotId: string): Promise<void> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }

      // Get snapshot metadata
      const metadata = await this.storage.getSnapshotMetadata(snapshotId);
      if (!metadata) {
        vscode.window.showErrorMessage('Snapshot not found');
        return;
      }

      // For now, show a simple comparison message
      // In a full implementation, this would open a diff view
      vscode.window.showInformationMessage(
        `Comparing with snapshot from ${new Date(metadata.timestamp).toLocaleString()}`
      );

      // Track telemetry
      await this.telemetry.trackProFeatureUsed('compare');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to compare snapshot: ${error}`);
    }
  }

  private async enterProKey(): Promise<void> {
    const key = await vscode.window.showInputBox({
      prompt: 'Enter your Pro license key',
      placeHolder: 'SNAP-XXXX-XXXX-XXXX-XXXX',
      validateInput: (value) => {
        if (!value) {
          return 'License key is required';
        }
        if (!this.keyManager.validateKeyFormat(value)) {
          return 'Invalid license key format';
        }
        return null;
      }
    });

    if (key) {
      const validation = this.keyManager.validateKey(key);
      if (validation.isValid) {
        // Store encrypted key in global state
        await this.context.globalState.update('proLicenseKey', validation.encrypted);
        
        // Track telemetry
        await this.telemetry.trackProFeatureUsed('license_activated');

        vscode.window.showInformationMessage('Pro license activated successfully!');
        this.treeProvider.refresh();
      } else {
        vscode.window.showErrorMessage('Invalid license key');
      }
    }
  }

  private async showTimelineChart(): Promise<void> {
    const storedKey = this.context.globalState.get<string>('proLicenseKey');
    if (!this.keyManager.isProEnabled(storedKey || '')) {
      vscode.window.showWarningMessage('Timeline chart is a Pro feature. Please enter your license key.');
      return;
    }

    // Create webview panel for timeline chart
    const panel = vscode.window.createWebviewPanel(
      'timelineChart',
      'Snapshot Timeline Chart',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // Get telemetry stats
    const stats = await this.telemetry.getStats();
    
    // Generate HTML for chart
    panel.webview.html = this.generateTimelineChartHTML(stats);

    // Track telemetry
    await this.telemetry.trackProFeatureUsed('timeline_chart');
  }

  private async exportChangelog(): Promise<void> {
    const storedKey = this.context.globalState.get<string>('proLicenseKey');
    if (!this.keyManager.isProEnabled(storedKey || '')) {
      vscode.window.showWarningMessage('Changelog export is a Pro feature. Please enter your license key.');
      return;
    }

    try {
      const snapshots = await this.storage.listSnapshots();
      
      // Generate markdown changelog
      const changelog = this.generateChangelogMarkdown(snapshots);
      
      // Save to file
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('snapshot-changelog.md'),
        filters: {
          'Markdown': ['md']
        }
      });

      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(changelog));
        vscode.window.showInformationMessage('Changelog exported successfully!');
      }

      // Track telemetry
      await this.telemetry.trackProFeatureUsed('markdown_export');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to export changelog: ${error}`);
    }
  }

  private async autoClean(): Promise<void> {
    const storedKey = this.context.globalState.get<string>('proLicenseKey');
    if (!this.keyManager.isProEnabled(storedKey || '')) {
      vscode.window.showWarningMessage('Auto clean is a Pro feature. Please enter your license key.');
      return;
    }

    try {
      const config = this.getConfig();
      const snapshots = await this.storage.listSnapshots();
      const cutoffTime = Date.now() - (config.autoCleanDays * 24 * 60 * 60 * 1000);
      
      const oldSnapshots = snapshots.filter((s: SnapshotMetadata) => s.timestamp < cutoffTime);
      
      if (oldSnapshots.length === 0) {
        vscode.window.showInformationMessage('No old snapshots to clean.');
        return;
      }

      const confirmed = await vscode.window.showWarningMessage(
        `Found ${oldSnapshots.length} snapshots older than ${config.autoCleanDays} days. Delete them?`,
        'Yes',
        'No'
      );

      if (confirmed === 'Yes') {
        for (const snapshot of oldSnapshots) {
          await this.storage.deleteSnapshot(snapshot.id);
        }
        
        this.treeProvider.refresh();
        vscode.window.showInformationMessage(`Cleaned ${oldSnapshots.length} old snapshots.`);
      }

      // Track telemetry
      await this.telemetry.trackProFeatureUsed('auto_clean');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to auto clean: ${error}`);
    }
  }

  private async showWelcomeMessage(): Promise<void> {
    const hasShownWelcome = this.context.globalState.get<boolean>('hasShownWelcome');
    if (!hasShownWelcome) {
      await this.context.globalState.update('hasShownWelcome', true);
      
      vscode.window.showInformationMessage(
        'Code Snapshot Journal is ready! Use Ctrl+Shift+S to create your first snapshot.',
        'Create Snapshot'
      ).then(selection => {
        if (selection === 'Create Snapshot') {
          vscode.commands.executeCommand('codeSnapshotJournal.createSnapshot');
        }
      });
    }
  }

  private getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('codeSnapshotJournal');
    return {
      snapshotsPath: config.get('snapshotsPath', '.snapshots'),
      maxSnapshotSize: config.get('maxSnapshotSize', 100),
      autoCleanDays: config.get('autoCleanDays', 30),
      includePatterns: config.get('includePatterns', []),
      excludePatterns: config.get('excludePatterns', [
        'node_modules',
        '.git',
        '.vscode',
        'out',
        'dist',
        '*.log'
      ])
    };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private generateTimelineChartHTML(stats: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body { font-family: var(--vscode-font-family); margin: 20px; }
          .chart-container { width: 100%; height: 400px; }
        </style>
      </head>
      <body>
        <h2>Snapshot Timeline</h2>
        <div class="chart-container">
          <canvas id="timelineChart"></canvas>
        </div>
        <script>
          const ctx = document.getElementById('timelineChart').getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: Object.keys(${JSON.stringify(stats.eventsByDay)}),
              datasets: [{
                label: 'Snapshots Created',
                data: Object.values(${JSON.stringify(stats.eventsByDay)}),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        </script>
      </body>
      </html>
    `;
  }

  private generateChangelogMarkdown(snapshots: SnapshotMetadata[]): string {
    let changelog = '# Snapshot Changelog\n\n';
    changelog += `Generated on ${new Date().toLocaleString()}\n\n`;
    changelog += `Total snapshots: ${snapshots.length}\n\n`;

    changelog += '## Snapshots\n\n';
    
    for (const snapshot of snapshots) {
      const date = new Date(snapshot.timestamp).toLocaleString();
      changelog += `### ${date}\n`;
      changelog += `- **Files:** ${snapshot.fileCount}\n`;
      changelog += `- **Size:** ${this.formatFileSize(snapshot.size)}\n`;
      if (snapshot.message) {
        changelog += `- **Message:** ${snapshot.message}\n`;
      }
      changelog += '\n';
    }

    return changelog;
  }
}
