# Code Snapshot Journal

> Offline, lightweight, pragmatic snapshot tool for developers.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=snapshot-suite.code-snapshot-journal)
[![Downloads](https://img.shields.io/badge/downloads-0-green.svg)](https://marketplace.visualstudio.com/items?itemName=snapshot-suite.code-snapshot-journal)
[![Rating](https://img.shields.io/badge/rating-0.0-yellow.svg)](https://marketplace.visualstudio.com/items?itemName=snapshot-suite.code-snapshot-journal)

## 🎯 Features

### Core Features (Free)
- **📸 Create Snapshots**: `Ctrl+Shift+S` to capture workspace state
- **⏰ Timeline View**: Visual timeline of all snapshots
- **🔄 Restore Snapshots**: Restore any previous state with backup
- **🔍 Compare Snapshots**: File-by-file diff comparison
- **🗑️ Delete Snapshots**: Clean up old snapshots
- **💾 Offline Storage**: All data stored locally, no cloud dependency

### Pro Features (Coming Soon)
- **📊 Timeline Charts**: Interactive visualization of development progress
- **📝 Markdown Export**: Generate detailed changelogs
- **⏱️ Auto Snapshot**: Automatic snapshots on save/timer
- **🔎 Advanced Search**: Filter and search snapshots
- **🧹 Auto Clean**: Remove old snapshots automatically

## 🚀 Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Code Snapshot Journal"
4. Click Install

## 📖 Usage

### Creating Snapshots
- **Keyboard**: `Ctrl+Shift+S`
- **Command Palette**: `Ctrl+Shift+P` → "Create Snapshot"
- **Sidebar**: Click the camera icon in the timeline view

### Managing Snapshots
- **View Timeline**: Open the "Snapshot Timeline" sidebar
- **Restore**: Right-click snapshot → "Restore"
- **Compare**: Right-click snapshot → "Compare"
- **Delete**: Right-click snapshot → "Delete"

### Configuration
```json
{
  "codeSnapshotJournal.snapshotsPath": ".snapshots",
  "codeSnapshotJournal.maxSnapshotSize": 100
}
```

## 🛠️ Development

### Prerequisites
- Node.js 16+
- npm 8+
- VS Code 1.95+

### Setup
```bash
git clone https://github.com/yourusername/code-snapshot-journal.git
cd code-snapshot-journal
npm install
npm run build
```

### Testing
```bash
npm test
```

### Building
```bash
npm run build
npm run package
```

## 📁 Project Structure

```
code-snapshot-journal/
├── src/
│   ├── extension.ts          # Main extension entry
│   ├── models/
│   │   └── snapshot.ts       # Snapshot metadata
│   └── providers/
│       └── snapshotTreeProvider.ts  # Timeline UI
├── package.json             # Extension manifest
├── README.md               # This file
└── CHANGELOG.md            # Release notes
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [VS Code Extension API](https://code.visualstudio.com/api)
- Uses [adm-zip](https://github.com/cthackers/adm-zip) for compression
- Icons by [VS Code Icon Theme](https://code.visualstudio.com/api/extension-guides/icon-theme)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/code-snapshot-journal/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/code-snapshot-journal/discussions)
- **Email**: support@snapshotsuite.com

---

**Made with ❤️ for developers who value their code history**