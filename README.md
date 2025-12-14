# LabelMerge

**Free, privacy-first CSV to label printing** — Generate printable mailing labels from your spreadsheet data, all processed locally in your browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **100% Privacy** - All processing happens in your browser. No data uploads, no tracking.
- ✅ **Free Forever** - No accounts, no subscriptions, no hidden costs.
- ✅ **Simple 4-Step Wizard** - Upload CSV → Map Columns → Select Format → Download
- ✅ **Auto-Detection** - Automatically matches common column names
- ✅ **Supports Avery Labels** - 5160, 5163, 5164, 5167 formats
- ✅ **Offline Capable** - Works without internet after first load
- ✅ **Mobile Responsive** - Use on desktop, tablet, or mobile

## Quick Start

### Option 1: Use Online (Recommended)

Visit **[https://briansparker.github.io/free-mail-merge](https://briansparker.github.io/free-mail-merge)**

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/briansparker/free-mail-merge.git
cd free-mail-merge

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## How to Use

### Step 1: Prepare Your CSV File

Create a CSV file with your mailing addresses. Required columns:
- Name
- Address (or Address Line 1)
- City
- State
- ZIP

Optional columns:
- Company
- Address Line 2 (Apartment, Suite, etc.)

**Example CSV:**
```csv
Name,Company,Address,City,State,ZIP
John Smith,Acme Corp,123 Main St,Springfield,IL,62701
Jane Doe,,456 Oak Ave,Chicago,IL,60601
```

See [`sample-addresses.csv`](./sample-addresses.csv) for a full example.

### Step 2: Upload Your CSV

- Drag and drop your CSV file, or click to browse
- Maximum 10,000 rows supported

### Step 3: Map Your Columns

- Review the auto-detected column mappings
- Adjust as needed using the dropdown selectors
- Required fields are marked with *

### Step 4: Choose Label Format

Select your Avery label format:
- **5160** - 1" × 2⅝" (30 labels per sheet) - Address Labels
- **5163** - 2" × 4" (10 labels per sheet) - Shipping Labels
- **5164** - 3⅓" × 4" (6 labels per sheet) - Shipping Labels
- **5167** - ½" × 1¾" (80 labels per sheet) - Return Address Labels

### Step 5: Download & Print

1. Click **"Download HTML"** to save the label file
2. Open the HTML file in your browser
3. Configure print settings:
   - Scale: **Actual Size** (NOT "Fit to Page")
   - Margins: **None** or **Minimum**
   - Orientation: **Portrait**
   - Paper: **Letter (8.5" × 11")**
4. Print a test page on plain paper first
5. Load your Avery label sheets and print

## Print Accuracy Tips

- ✅ Use genuine Avery label sheets that match your selected format
- ✅ Print a test page first to verify alignment
- ✅ Set printer to "Actual Size" (100% scale)
- ✅ Use minimum or no margins
- ⚠️ Browser differences: Chrome generally has the most accurate print rendering

## Supported Label Formats

| Format | Size | Labels/Sheet | Use Case |
|--------|------|--------------|----------|
| Avery 5160 | 1" × 2⅝" | 30 | Standard address labels |
| Avery 5163 | 2" × 4" | 10 | Shipping labels |
| Avery 5164 | 3⅓" × 4" | 6 | Large shipping labels |
| Avery 5167 | ½" × 1¾" | 80 | Return address labels |

More formats coming in future versions!

## Privacy & Security

LabelMerge is built with privacy as the top priority:

- **No Server Processing** - All CSV parsing and label generation happens in your browser
- **No Data Collection** - We don't collect, store, or transmit your data
- **No Tracking** - No analytics, no cookies, no third-party scripts
- **No Accounts** - No login required, no personal information needed
- **Open Source** - Full code transparency ([view source](https://github.com/briansparker/free-mail-merge))

Your mailing list data never leaves your device. Period.

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **PapaParse** - CSV parsing
- **Service Worker** - Offline support

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Roadmap

### v1.5 (Planned)
- [ ] PDF export (client-side)
- [ ] Custom label formats
- [ ] Font and formatting options
- [ ] Duplicate detection

### v2.0 (Future)
- [ ] Save/load mapping templates
- [ ] Google Sheets import
- [ ] QR codes on labels
- [ ] Internationalization

## Deployment

The app is automatically deployed to GitHub Pages on every push to `main`.

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development

```bash
# Install dependencies
npm install

# Run dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/briansparker/free-mail-merge/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/briansparker/free-mail-merge/discussions)
- ⭐ **Star on GitHub** if you find this useful!

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- CSV parsing by [PapaParse](https://www.papaparse.com/)
- Inspired by the need for a free, privacy-respecting alternative to commercial mail merge tools

---

**Made with ❤️ for the open source community**
