# Code Snapshot Suite

A monorepo containing VS Code extensions for code snapshot management and productivity tools.

## Packages

- **@snapshot/core** - Shared utilities and core functionality
- **@snapshot/icons** - Icon assets and theme support
- **code-snapshot-journal** - Main VS Code extension for snapshot management

## Development

### Prerequisites
- Node.js 16.0.0 or higher
- pnpm 8.0.0 or higher
- VS Code 1.95.0 or higher

### Setup
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

### Package Extension
```bash
# Package the extension
pnpm package

# Publish to marketplace (requires vsce)
pnpm publish
```

## Architecture

The project uses a monorepo structure with shared packages:

- **Core Package**: Contains storage, key management, UI providers, telemetry, and utilities
- **Icons Package**: SVG icons and theme integration
- **Extension Package**: VS Code extension implementation

## Features

### Core Features (Free)
- Create snapshots with `Ctrl+Shift+S`
- Timeline sidebar view
- Restore snapshots with backup
- Compare with snapshots
- Cross-platform support

### Pro Features
- Timeline chart visualization
- Markdown changelog export
- Auto-clean old snapshots
- Advanced search
- Bulk operations

## Privacy

- 100% offline operation
- No external telemetry
- Local storage only
- Open source

## License

MIT License - see LICENSE files for details.
