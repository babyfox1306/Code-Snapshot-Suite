import * as fs from 'fs/promises';
import * as path from 'path';

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  event: string;
  properties?: Record<string, any>;
}

export interface TelemetryStats {
  totalSnapshots: number;
  totalRestores: number;
  totalDeletes: number;
  totalSearches: number;
  averageSnapshotSize: number;
  lastActivity: number;
  eventsByDay: Record<string, number>;
}

export class TelemetryManager {
  private telemetryFile: string;
  private events: TelemetryEvent[] = [];
  private maxEvents = 1000; // Keep only last 1000 events

  constructor(workspaceRoot: string) {
    this.telemetryFile = path.join(workspaceRoot, '.snapshots', 'telemetry.json');
  }

  /**
   * Track an event
   */
  async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    const telemetryEvent: TelemetryEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      event,
      properties
    };

    this.events.push(telemetryEvent);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Save to file asynchronously
    this.saveTelemetry().catch(error => {
      console.warn('Failed to save telemetry:', error);
    });
  }

  /**
   * Track snapshot creation
   */
  async trackSnapshotCreated(size: number, fileCount: number, message?: string): Promise<void> {
    await this.trackEvent('snapshot_created', {
      size,
      fileCount,
      hasMessage: !!message
    });
  }

  /**
   * Track snapshot restore
   */
  async trackSnapshotRestored(snapshotId: string, createBackup: boolean): Promise<void> {
    await this.trackEvent('snapshot_restored', {
      snapshotId,
      createBackup
    });
  }

  /**
   * Track snapshot deletion
   */
  async trackSnapshotDeleted(snapshotId: string): Promise<void> {
    await this.trackEvent('snapshot_deleted', {
      snapshotId
    });
  }

  /**
   * Track search performed
   */
  async trackSearch(query: string, resultCount: number): Promise<void> {
    await this.trackEvent('search_performed', {
      queryLength: query.length,
      resultCount
    });
  }

  /**
   * Track Pro feature usage
   */
  async trackProFeatureUsed(feature: string): Promise<void> {
    await this.trackEvent('pro_feature_used', {
      feature
    });
  }

  /**
   * Track extension activation
   */
  async trackExtensionActivated(): Promise<void> {
    await this.trackEvent('extension_activated');
  }

  /**
   * Track extension deactivation
   */
  async trackExtensionDeactivated(): Promise<void> {
    await this.trackEvent('extension_deactivated');
  }

  /**
   * Get telemetry statistics
   */
  async getStats(): Promise<TelemetryStats> {
    await this.loadTelemetry();

    const snapshotEvents = this.events.filter(e => e.event === 'snapshot_created');
    const restoreEvents = this.events.filter(e => e.event === 'snapshot_restored');
    const deleteEvents = this.events.filter(e => e.event === 'snapshot_deleted');
    const searchEvents = this.events.filter(e => e.event === 'search_performed');

    const totalSnapshotSize = snapshotEvents.reduce((sum, event) => {
      return sum + (event.properties?.size || 0);
    }, 0);

    const averageSnapshotSize = snapshotEvents.length > 0 
      ? totalSnapshotSize / snapshotEvents.length 
      : 0;

    // Group events by day
    const eventsByDay: Record<string, number> = {};
    this.events.forEach(event => {
      const day = new Date(event.timestamp).toISOString().split('T')[0];
      eventsByDay[day] = (eventsByDay[day] || 0) + 1;
    });

    const lastActivity = this.events.length > 0 
      ? Math.max(...this.events.map(e => e.timestamp))
      : 0;

    return {
      totalSnapshots: snapshotEvents.length,
      totalRestores: restoreEvents.length,
      totalDeletes: deleteEvents.length,
      totalSearches: searchEvents.length,
      averageSnapshotSize,
      lastActivity,
      eventsByDay
    };
  }

  /**
   * Get events for a specific time range
   */
  async getEvents(
    startTime?: number,
    endTime?: number,
    eventType?: string
  ): Promise<TelemetryEvent[]> {
    await this.loadTelemetry();

    let filteredEvents = this.events;

    if (eventType) {
      filteredEvents = filteredEvents.filter(e => e.event === eventType);
    }

    if (startTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= startTime);
    }

    if (endTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= endTime);
    }

    return filteredEvents.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear all telemetry data
   */
  async clearTelemetry(): Promise<void> {
    this.events = [];
    await this.saveTelemetry();
  }

  /**
   * Export telemetry data
   */
  async exportTelemetry(): Promise<string> {
    await this.loadTelemetry();
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      events: this.events
    }, null, 2);
  }

  /**
   * Load telemetry from file
   */
  private async loadTelemetry(): Promise<void> {
    try {
      const data = await fs.readFile(this.telemetryFile, 'utf-8');
      const parsed = JSON.parse(data);
      this.events = parsed.events || [];
    } catch (error) {
      // File doesn't exist or is invalid, start with empty array
      this.events = [];
    }
  }

  /**
   * Save telemetry to file
   */
  private async saveTelemetry(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.telemetryFile);
      await fs.mkdir(dir, { recursive: true });

      const data = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        events: this.events
      };

      await fs.writeFile(this.telemetryFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('Failed to save telemetry:', error);
    }
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
