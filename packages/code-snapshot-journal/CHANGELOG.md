# Change Log

All notable changes to the "Code Snapshot Journal" extension will be documented in this file.

## [0.1.0] - 2025-10-16

### Added
- Initial release of Code Snapshot Journal
- Core snapshot creation functionality with `Ctrl+Shift+S` shortcut
- Timeline sidebar view showing all snapshots chronologically
- Snapshot restore with automatic backup creation
- Basic snapshot comparison functionality
- Snapshot deletion with confirmation
- Pro license key validation system
- Timeline chart visualization (Pro feature)
- Markdown changelog export (Pro feature)
- Auto-clean old snapshots (Pro feature)
- Cross-platform support (Windows, macOS, Linux)
- Comprehensive configuration options
- Local telemetry tracking (no external data transmission)
- Smart file filtering with include/exclude patterns
- Efficient zip-based storage system
- Context menus for snapshot management
- Progress indicators for long-running operations
- Error handling with user-friendly messages
- Welcome message for first-time users

### Features
- **Snapshot Creation**: Capture entire workspace or selected files
- **Timeline View**: Visual timeline in VS Code sidebar
- **Restore Functionality**: Restore any snapshot with backup option
- **Compare Changes**: Compare current workspace with snapshots
- **Pro Features**: Timeline chart, Markdown export, auto-clean
- **Privacy-First**: 100% offline operation, no external data transmission
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Configurable**: Customizable storage paths and file patterns

### Technical Details
- Built with TypeScript and VS Code Extension API
- Uses `adm-zip` for efficient snapshot storage
- Implements AES-256 encryption for Pro license keys
- Local SQLite-based metadata storage
- Comprehensive error handling and user feedback
- Modular architecture with shared core library
- Unit tests with 80%+ coverage target

### Known Issues
- Large projects (>1000 files) may take longer to snapshot
- Snapshot comparison is currently basic (file-by-file)
- Pro features require manual license key entry

### Future Plans
- Enhanced diff visualization
- Git integration
- Cloud backup options
- Team collaboration features
- Advanced search capabilities
- Performance optimizations for large projects
