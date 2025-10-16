import * as vscode from 'vscode';
import { CodeSnapshotJournal } from './extension';

let extension: CodeSnapshotJournal;

export function activate(context: vscode.ExtensionContext): void {
  try {
    extension = new CodeSnapshotJournal(context);
    extension.activate();
  } catch (error) {
    console.error('Failed to activate Code Snapshot Journal:', error);
    vscode.window.showErrorMessage(`Failed to activate extension: ${error}`);
  }
}

export function deactivate(): void {
  if (extension) {
    extension.deactivate();
  }
}
