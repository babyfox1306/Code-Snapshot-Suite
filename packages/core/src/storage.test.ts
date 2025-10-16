import { SnapshotStorage } from '../src/storage';
import { LicenseKeyManager } from '../src/keyManager';
import { TelemetryManager } from '../src/telemetry';
import { Utils } from '../src/utils';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('SnapshotStorage', () => {
  let storage: SnapshotStorage;
  const testDir = path.join(__dirname, 'test-workspace');

  beforeEach(async () => {
    // Create test workspace
    await fs.mkdir(testDir, { recursive: true });
    storage = new SnapshotStorage(testDir);
  });

  afterEach(async () => {
    // Clean up test workspace
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('should create snapshot directory', async () => {
    await storage.ensureSnapshotsDir();
    const snapshotsDir = path.join(testDir, '.snapshots');
    const exists = await fs.access(snapshotsDir).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  test('should save and list snapshots', async () => {
    // Create a test file
    const testFile = path.join(testDir, 'test.txt');
    await fs.writeFile(testFile, 'Hello World');

    const metadata = await storage.saveSnapshot(testDir, { message: 'Test snapshot' });
    
    expect(metadata.id).toBeDefined();
    expect(metadata.message).toBe('Test snapshot');
    expect(metadata.fileCount).toBeGreaterThan(0);
    expect(metadata.size).toBeGreaterThan(0);

    const snapshots = await storage.listSnapshots();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].id).toBe(metadata.id);
  });

  test('should delete snapshot', async () => {
    // Create a test file and snapshot
    const testFile = path.join(testDir, 'test.txt');
    await fs.writeFile(testFile, 'Hello World');
    
    const metadata = await storage.saveSnapshot(testDir);
    expect(await storage.listSnapshots()).toHaveLength(1);

    await storage.deleteSnapshot(metadata.id);
    expect(await storage.listSnapshots()).toHaveLength(0);
  });
});

describe('LicenseKeyManager', () => {
  let keyManager: LicenseKeyManager;

  beforeEach(() => {
    keyManager = new LicenseKeyManager();
  });

  test('should validate key format', () => {
    expect(keyManager.validateKeyFormat('SNAP-1234-5678-9ABC-DEF0')).toBe(true);
    expect(keyManager.validateKeyFormat('INVALID-KEY')).toBe(false);
    expect(keyManager.validateKeyFormat('')).toBe(false);
  });

  test('should generate demo key', () => {
    const demoKey = keyManager.generateDemoKey();
    expect(keyManager.validateKeyFormat(demoKey)).toBe(true);
    expect(demoKey).toMatch(/^SNAP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  test('should validate license key', () => {
    const validKey = 'SNAP-1234-5678-9ABC-DEF0';
    const validation = keyManager.validateKey(validKey);
    
    expect(validation.isValid).toBe(true);
    expect(validation.features).toContain('timeline-chart');
    expect(validation.features).toContain('markdown-export');
    expect(validation.features).toContain('auto-clean');
  });

  test('should check Pro features', () => {
    const validKey = 'SNAP-1234-5678-9ABC-DEF0';
    const validation = keyManager.validateKey(validKey);
    
    // For MVP, we'll just check that the encrypted key is not empty
    expect(validation.encrypted).toBeTruthy();
    expect(keyManager.hasFeature(validation.encrypted, 'timeline-chart')).toBe(true);
    expect(keyManager.hasFeature(validation.encrypted, 'invalid-feature')).toBe(false);
  });
});

describe('TelemetryManager', () => {
  let telemetry: TelemetryManager;
  const testDir = path.join(__dirname, 'test-telemetry');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    telemetry = new TelemetryManager(testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('should track events', async () => {
    await telemetry.trackEvent('test_event', { test: 'data' });
    
    const stats = await telemetry.getStats();
    expect(stats.totalSnapshots).toBe(0); // No snapshot events yet
    
    const events = await telemetry.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('test_event');
    expect(events[0].properties?.test).toBe('data');
  });

  test('should track snapshot events', async () => {
    await telemetry.trackSnapshotCreated(1024, 10, 'Test message');
    
    // Wait for async save to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const stats = await telemetry.getStats();
    expect(stats.totalSnapshots).toBe(1);
    expect(stats.averageSnapshotSize).toBe(1024);
  });

  test('should export telemetry', async () => {
    await telemetry.trackEvent('test_event');
    
    // Wait a bit for the async save to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const exported = await telemetry.exportTelemetry();
    const parsed = JSON.parse(exported);
    
    expect(parsed.events).toHaveLength(1);
    expect(parsed.exportedAt).toBeDefined();
  });
});

describe('Utils', () => {
  test('should format file size', () => {
    expect(Utils.formatFileSize(0)).toBe('0 B');
    expect(Utils.formatFileSize(1024)).toBe('1 KB');
    expect(Utils.formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(Utils.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  test('should format timestamp', () => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    expect(Utils.formatTimestamp(now, 'relative')).toBe('Just now');
    expect(Utils.formatTimestamp(oneHourAgo, 'relative')).toContain('hour');
  });

  test('should generate unique ID', () => {
    const id1 = Utils.generateId('test');
    const id2 = Utils.generateId('test');
    
    expect(id1).toMatch(/^test_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^test_\d+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  test('should sanitize filename', () => {
    expect(Utils.sanitizeFilename('test<>:"/\\|?*.txt')).toBe('test_________.txt');
    expect(Utils.sanitizeFilename('file with spaces.txt')).toBe('file_with_spaces.txt');
  });

  test('should parse JSON safely', () => {
    expect(Utils.parseJSON('{"test": "value"}', {})).toEqual({ test: 'value' });
    expect(Utils.parseJSON('invalid json', {})).toEqual({});
  });

  test('should debounce function calls', (done) => {
    let callCount = 0;
    const debouncedFn = Utils.debounce(() => {
      callCount++;
    }, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    setTimeout(() => {
      expect(callCount).toBe(1);
      done();
    }, 200);
  });
});
