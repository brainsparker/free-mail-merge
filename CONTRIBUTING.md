# Contributing to LabelMerge

Thank you for considering contributing to LabelMerge! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- **Clear title** describing the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (browser, OS, version)
- **Screenshots or error messages** if applicable

**Example:**
```
Title: CSV parsing fails with special characters

Steps to reproduce:
1. Upload CSV file with accented characters (é, ñ, etc.)
2. Click Next

Expected: CSV parses successfully
Actual: Error message "Failed to parse CSV"

Environment: Chrome 120, macOS 14
```

### Suggesting Features

Feature requests are welcome! Please open an issue with:
- **Clear description** of the feature
- **Use case** - why is this useful?
- **Proposed solution** (optional)
- **Alternative solutions** considered (optional)

### Pull Requests

We love pull requests! Here's the process:

#### 1. Fork and Clone

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/free-mail-merge.git
cd free-mail-merge

# Add upstream remote
git remote add upstream https://github.com/briansparker/free-mail-merge.git
```

#### 2. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# Or for bug fixes:
git checkout -b fix/bug-description
```

#### 3. Make Changes

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Make your changes...
```

#### 4. Test Your Changes

- ✅ Test all wizard steps manually
- ✅ Test with various CSV files
- ✅ Verify print output works
- ✅ Check browser console for errors
- ✅ Test on mobile/tablet (responsive)

#### 5. Commit Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "Add support for custom label dimensions"
```

**Good commit messages:**
- `Add PDF export functionality`
- `Fix: CSV parsing error with quoted fields`
- `Update: Improve column auto-detection accuracy`
- `Docs: Add troubleshooting guide for printing`

**Avoid:**
- `Update`
- `Fix bug`
- `Changes`

#### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub with:
- **Clear title** describing the change
- **Description** of what changed and why
- **Related issue** number (if applicable)
- **Screenshots** for UI changes
- **Testing notes** - how you tested it

**PR Template:**
```markdown
## Description
Brief description of changes

## Related Issue
Fixes #123

## Changes Made
- Added X feature
- Updated Y component
- Fixed Z bug

## Testing
- [ ] Tested CSV import
- [ ] Tested column mapping
- [ ] Tested label generation
- [ ] Verified print output

## Screenshots
(if applicable)
```

#### 7. Code Review

- Be open to feedback and suggestions
- Make requested changes promptly
- Keep discussions respectful and constructive

## Development Guidelines

### Code Style

- **Use existing patterns** - Follow the codebase conventions
- **Keep components simple** - Single responsibility principle
- **Extract utilities** - Reusable logic goes in `lib/`
- **Name clearly** - Descriptive variable and function names
- **Comment complex logic** - Explain the "why", not the "what"

### File Organization

```
src/
├── components/        # Reusable UI components
│   └── ui/           # Base components (Button, Card, etc.)
├── features/         # Feature-specific components
│   └── [feature]/    # One folder per wizard step
├── lib/              # Utilities and helpers
├── constants/        # Configuration and constants
├── context/          # State management
└── hooks/            # Custom React hooks
```

### Component Guidelines

**Good component:**
```jsx
// ✅ Single responsibility, clear props, reusable
export default function LabelPreview({ data, formatKey }) {
  if (!data) return <EmptyState />;

  return (
    <div className="border rounded-lg p-4">
      {/* Preview content */}
    </div>
  );
}
```

**Avoid:**
```jsx
// ❌ Too many responsibilities, unclear props
export default function Thing({ stuff, data, format, config, options }) {
  // 200 lines of mixed logic...
}
```

### State Management

- Use `AppContext` for global state (CSV data, mapping, format)
- Use local `useState` for component-specific state
- Persist important state to localStorage

### Performance

- Use `React.memo` for expensive components
- Avoid inline function definitions in render
- Lazy load large dependencies if possible

## Areas for Contribution

### Easy (Good First Issues)

- Add more Avery label formats
- Improve error messages
- Add loading states
- Enhance mobile UI
- Fix typos in documentation

### Medium

- Add duplicate detection
- Implement undo/redo for column mapping
- Add CSV export of mapped data
- Improve print preview
- Add keyboard shortcuts

### Advanced

- Implement PDF generation (jsPDF)
- Add Service Worker for offline mode
- Create template system (save/load mappings)
- Build custom label format builder
- Add QR code generation

## Project Structure

### Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main wizard orchestration |
| `src/context/AppContext.jsx` | Global state management |
| `src/lib/csv-parser.js` | CSV parsing logic |
| `src/lib/column-detector.js` | Auto-detection algorithm |
| `src/lib/label-generator.js` | HTML generation for printing |
| `src/constants/label-formats.js` | Avery label specifications |

### Adding a New Label Format

1. Add format spec to `src/constants/label-formats.js`:
   ```javascript
   '5161': {
     name: 'Avery 5161',
     description: '1" × 4" - Address Labels',
     labelsPerSheet: 20,
     rows: 10,
     cols: 2,
     pageSize: { width: '8.5in', height: '11in' },
     pageMargin: { top: '0.5in', right: '0.15625in', ... },
     labelSize: { width: '4in', height: '1in' },
     labelPadding: { top: '0.1in', right: '0.2in', ... },
     labelMargin: { right: '0.15625in', bottom: '0in' }
   }
   ```

2. Test with physical label sheets

3. Update documentation

### Adding a New Feature

1. Create issue first to discuss approach
2. Create feature branch
3. Add components in `src/features/[feature]/`
4. Add utilities in `src/lib/` if needed
5. Update `AppContext` if state needed
6. Test thoroughly
7. Update documentation
8. Submit PR

## Testing

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] **CSV Import**
  - [ ] Standard CSV (comma-delimited)
  - [ ] CSV with quoted fields
  - [ ] CSV with special characters
  - [ ] Large files (1000+ rows)
  - [ ] Invalid files (error handling)

- [ ] **Column Mapping**
  - [ ] Auto-detection works
  - [ ] Manual override works
  - [ ] Required fields validated
  - [ ] Preview updates correctly

- [ ] **Label Formats**
  - [ ] All formats selectable
  - [ ] Preview shows correct layout
  - [ ] Format info displayed

- [ ] **Output**
  - [ ] HTML downloads correctly
  - [ ] Print preview opens
  - [ ] Labels print accurately (if possible)
  - [ ] All data included

- [ ] **Persistence**
  - [ ] State saves to localStorage
  - [ ] State restores on reload
  - [ ] Start Over clears state

- [ ] **Browsers**
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

## Documentation

When adding features, update:

- `README.md` - User-facing features
- `DEPLOYMENT.md` - Deployment changes
- Inline code comments - Complex logic
- This file - Contribution guidelines

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit: `git commit -m "Release v1.x.x"`
4. Tag: `git tag v1.x.x`
5. Push: `git push && git push --tags`
6. GitHub Actions deploys automatically

## Questions?

- 💬 **General questions:** [GitHub Discussions](https://github.com/briansparker/free-mail-merge/discussions)
- 🐛 **Bug reports:** [GitHub Issues](https://github.com/briansparker/free-mail-merge/issues)
- 📧 **Private inquiries:** Open an issue first

## Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Mentioned in release notes
- Credited in relevant code files

Thank you for contributing to LabelMerge! 🎉
