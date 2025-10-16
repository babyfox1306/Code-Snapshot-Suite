<!-- bc1a4b77-7ac4-4374-b866-cb6de8860d44 fa598852-3f92-4c9d-aca9-f2af76dcdfdd -->
# Code Snapshot Suite - Phase 1 Foundation & MVP

## Project Structure (Monorepo with pnpm workspaces)

```
code-snapshot-suite/
├── packages/
│   ├── core/                    # @snapshot/core - shared utilities
│   │   ├── src/
│   │   │   ├── storage.ts       # JSON, zip, key-value local storage
│   │   │   ├── keyManager.ts    # Validate/encrypt Pro license keys
│   │   │   ├── uiProvider.ts    # TreeView, notifications, progress UI
│   │   │   ├── telemetry.ts     # Local-only event tracking
│   │   │   └── utils.ts         # File path, error handling helpers
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── icons/                   # @snapshot/icons - SVG assets
│   │   ├── src/
│   │   │   ├── snapshot.svg
│   │   │   ├── clock.svg
│   │   │   ├── diff.svg
│   │   │   └── index.ts         # Export all icons
│   │   └── package.json
│   │
│   └── code-snapshot-journal/   # Main extension
│       ├── src/
│       │   ├── extension.ts     # Entry point, activate/deactivate
│       │   ├── commands/
│       │   │   ├── createSnapshot.ts
│       │   │   ├── restoreSnapshot.ts
│       │   │   ├── deleteSnapshot.ts
│       │   │   └── compareSnapshot.ts
│       │   ├── providers/
│       │   │   └── snapshotTreeProvider.ts  # Timeline sidebar
│       │   ├── models/
│       │   │   └── snapshot.ts  # Snapshot metadata interface
│       │   └── test/
│       │       └── suite/       # Unit tests
│       ├── package.json
│       ├── tsconfig.json
│       ├── README.md
│       └── CHANGELOG.md
│
├── pnpm-workspace.yaml
├── package.json                 # Root workspace config
├── tsconfig.base.json           # Shared TS config
├── .eslintrc.json
├── .gitignore
└── README.md
```

## Implementation Steps

### 1. Workspace Initialization

- Initialize pnpm workspace with root `package.json` and `pnpm-workspace.yaml`
- Configure TypeScript base config with strict mode, ES2020 target
- Set up ESLint with VS Code extension rules
- Create `.gitignore` (node_modules, out, .vscode-test, *.vsix)

### 2. @snapshot/core Package

**Key files:**

- `storage.ts`: Implement `SnapshotStorage` class
  - Methods: `saveSnapshot()`, `loadSnapshot()`, `listSnapshots()`, `deleteSnapshot()`
  - Use Node.js `fs/promises` for file operations
  - Integrate `adm-zip` for creating/extracting archives
  - Store metadata in `.snapshots/metadata.json`
- `keyManager.ts`: Implement `LicenseKeyManager`
  - Simple AES-256 encryption for local validation
  - Methods: `validateKey()`, `isProEnabled()`, `storeKey()`
  - Store in VS Code global state (not workspace settings)
- `uiProvider.ts`: Base `TreeDataProvider` implementation
  - Reusable patterns for TreeView, QuickPick, Progress notifications
- `telemetry.ts`: Local event counter (no external calls)
  - Track: snapshots created, restored, deleted, searches
- `utils.ts`: Path normalization, file size formatting, error wrapping

### 3. @snapshot/icons Package

- Create SVG icons (24x24, theme-neutral): snapshot, clock, diff, restore, delete, warning
- Export as TypeScript constants with VS Code URI paths
- Ensure compatibility with light/dark themes

### 4. Code Snapshot Journal Extension

**Core Features:**

- **Create Snapshot** (`Ctrl+Shift+S`):
  - Zip entire workspace or selected files/folders
  - Generate metadata: timestamp, file count, size, message (optional)
  - Warn if size > 100MB
  - Store in `.snapshots/` directory
- **Timeline Sidebar**:
  - TreeView showing snapshots chronologically
  - Display: timestamp, message, size
  - Context menu: Restore, Delete, Compare
- **Diff Comparison**:
  - Use `vscode.diff` to compare snapshot files with current workspace
  - Support file-by-file comparison
- **Restore Snapshot**:
  - Extract zip to workspace (with confirmation prompt)
  - Option to backup current state before restore
- **Delete Snapshot**:
  - Remove zip + metadata entry

**Pro Features (locked behind license key):**

- **Timeline Chart View**: Interactive Chart.js visualization showing snapshot activity over time
- **Export Markdown Changelog**: Generate detailed changelog with notes, diff, and timestamps for dev journaling  
- **Auto Snapshot**: Automatic snapshots on timer/save events so devs never forget
- **Search & Filter Snapshots**: Advanced search and filtering for managing large projects
- **Auto-Clean**: Delete snapshots older than N days automatically
- **Cloud Sync Key**: Future Pro+ feature for team collaboration (Phase 3)

**Configuration (settings.json):**

```json
{
  "codeSnapshotJournal.snapshotsPath": ".snapshots",
  "codeSnapshotJournal.maxSnapshotSize": 100,
  "codeSnapshotJournal.autoCleanDays": 30
}
```

### 5. Testing Strategy

- Unit tests (Jest): 80% coverage for @snapshot/core
  - Test zip/unzip, metadata CRUD, key validation
- Integration tests: VS Code extension test suite
  - Test scenarios: create snapshot, restore, large project (>1000 files), error handling
- Manual testing: Windows/Mac/Linux compatibility

### 6. VS Code Marketplace Preparation

- `package.json` manifest:
  - Publisher, display name, description, keywords
  - Activation events: `onCommand`, `onView`
  - Contributes: commands, views (sidebar), keybindings, configuration
- README.md: Feature overview, GIF demo, installation, usage
- CHANGELOG.md: Initial v0.1.0 release notes
- Icon: 128x128 PNG logo ✅ (Camera with code brackets `{/}` design completed)
- License: MIT

### 7. Build & Deployment

- Use `vsce` (VS Code Extension CLI) for packaging
- Build script: `pnpm build` (TypeScript compilation for all packages)
- Package script: `pnpm package` (create .vsix)
- Publish to Marketplace (free tier): `vsce publish`

## Key Technical Decisions

- **Dependencies (minimal):**
  - Production: `adm-zip` (zip), `chart.js` (Pro chart)
  - Dev: `@types/vscode`, `typescript`, `eslint`, `jest`, `@vscode/test-electron`
- **Storage format:**
  - Snapshots: `.snapshots/{timestamp}.zip`
  - Metadata: `.snapshots/metadata.json` (array of snapshot objects)
- **Pro unlock flow:**

  1. User purchases key from Gumroad
  2. Command: "Enter Pro License Key"
  3. Validate + encrypt + store in global state
  4. Show Pro features in UI

- **Error handling:** All operations wrapped in try-catch, user-friendly notifications

## 💰 Monetization Strategy

### Pro Key / License Unlock (Offline Monetization)

**Pricing Model:**

- **Free Tier**: Core snapshot features (create, restore, delete, compare)
- **Pro Tier**: $5-10/lifetime unlock advanced features
- **Team Edition**: $49-99/lifetime for company licenses

**Pro Features Value Proposition:**

| Tính năng                                        | Lợi ích                             |

| ------------------------------------------------ | ----------------------------------- |

| Export Markdown snapshot (ghi chú + diff + date) | Dev thích ghi lại log / journal dev |

| Auto snapshot theo timer / save event            | Dev khỏi quên                       |

| Snapshot Chart View (biểu đồ tiến độ code)       | Thị giác hóa quá trình dev          |

| Search & filter snapshot                         | Quản lý dự án lớn                   |

| Cloud sync key (nâng cấp sau)                    | Pro+ / Lifetime bundle              |

**Revenue Projections:**

- **Conservative**: 500 devs × $8 = $4,000/year
- **Optimistic**: 2,000 devs × $8 = $16,000/year
- **Team Edition**: 100 teams × $49 = $4,900/year
- **Total Potential**: $20,000+/year với 0 server cost

**Distribution Channels:**

- **VS Code Marketplace**: Free tier for traffic
- **Gumroad/LemonSqueezy**: Pro key sales
- **GitHub README**: Documentation & key entry
- **Reddit/ProductHunt**: Launch marketing

---

## Success Metrics (MVP Launch)

- Functional: All core features working, 0 critical bugs
- Installs: Target 1K in first month
- Feedback: Collect GitHub issues, Reddit comments for Phase 2 prioritization

## Next Steps After Phase 1

- Monitor usage/feedback for 2-4 weeks
- Iterate on UX pain points (e.g., snapshot message prompts, restore confirmation)
- Begin Phase 2: LocalDoc Search extension (reuse 50% of @snapshot/core)

### To-dos ✅ ALL COMPLETED!

- [x] Initialize pnpm monorepo workspace with root package.json, pnpm-workspace.yaml, tsconfig.base.json, ESLint config, and .gitignore
- [x] Create @snapshot/core package with storage, keyManager, uiProvider, telemetry, and utils modules
- [x] Create @snapshot/icons package with SVG assets and TypeScript exports
- [x] Set up Code Snapshot Journal extension structure with src/, commands/, providers/, models/, and package.json manifest
- [x] Implement core snapshot commands: create, restore, delete, and compare functionality
- [x] Build timeline sidebar TreeView provider with context menus and snapshot display
- [x] Implement Pro features: license key validation, Export Markdown snapshot, Auto snapshot timer/save, Snapshot Chart View, Search & filter, Cloud sync key (Pro+)
- [x] Write unit tests for @snapshot/core and integration tests for extension (target 80% coverage)
- [x] Prepare for VS Code Marketplace: README, CHANGELOG, icon ✅ (Camera + code brackets design), build/package scripts, test on Windows

**🎉 PHASE 1 COMPLETE - Ready for Phase 2!**

### To-dos

- [ ] Initialize pnpm monorepo workspace with root package.json, pnpm-workspace.yaml, tsconfig.base.json, ESLint config, and .gitignore
- [ ] Create @snapshot/core package with storage, keyManager, uiProvider, telemetry, and utils modules
- [ ] Create @snapshot/icons package with SVG assets and TypeScript exports
- [ ] Set up Code Snapshot Journal extension structure with src/, commands/, providers/, models/, and package.json manifest
- [ ] Implement core snapshot commands: create, restore, delete, and compare functionality
- [ ] Build timeline sidebar TreeView provider with context menus and snapshot display
- [ ] Implement Pro features: license key validation, Export Markdown snapshot, Auto snapshot timer/save, Snapshot Chart View, Search & filter, Cloud sync key (Pro+)
- [ ] Write unit tests for @snapshot/core and integration tests for extension (target 80% coverage)
- [x] Prepare for VS Code Marketplace: README, CHANGELOG, icon ✅ (Camera + code brackets design), build/package scripts, test on Windows