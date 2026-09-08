# LabelMerge

**Free, privacy-first CSV to label printing** — Generate printable mailing labels from your spreadsheet data, all processed locally in your browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **100% Privacy** - All processing happens in your browser. No data uploads, no tracking.
- ✅ **Free Forever** - No accounts, no subscriptions, no hidden costs.
- ✅ **Simple 4-Step Wizard** - Upload CSV → Map Columns → Select Format → Download
- ✅ **Auto-Detection** - Automatically matches common column names
- ✅ **Supports Avery Labels** - 5160, 5161, 5162, 5163, 5164, 5167, 5195 (US Letter) and L7160, L7163 (A4), plus their 8xxx/5x6x/J8xxx twins
- ✅ **Print Alignment Tools** - Start on any label of a partly used sheet, nudge the layout to match your printer, and print a plain-paper alignment test page
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

# Run the tests (no extra dependencies, uses the Node test runner)
npm test

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

Select the label format that matches your sheets. Each card lists the other product codes that share the same layout (for example 8160 and 5260 use the 5160 grid), so pick by the number printed on your box.

### Step 5: Align, Download & Print

1. Under **Print alignment**, pick **Start at label** if your first sheet is partly used. Positions count left to right, then top to bottom; earlier positions are left blank.
2. Click **"Print alignment test page"** and print it on plain paper. It draws a dashed outline for every label position using the exact geometry of your labels.
3. Hold the test page against a label sheet. If the outlines sit off the labels, adjust the **horizontal** and **vertical nudge** (in inches for Letter formats, millimetres for A4) and print the test page again. Positive values move everything right or down.
4. Click **"Download HTML"** to save the label file, or **"Print Preview"** to print straight from the browser.
5. Configure print settings:
   - Scale: **Actual Size** or **100%** (NOT "Fit to Page")
   - Margins: **None** or **Default** (the file sets its own page margins)
   - Orientation: **Portrait**
   - Paper: **Letter (8.5" × 11")** or **A4** to match the format
6. Load your label sheets and print

Nudge values are saved in your browser, so once a printer is dialled in you do not have to repeat the test.

## Print Accuracy Tips

- ✅ Use genuine Avery label sheets that match your selected format
- ✅ Print the alignment test page on plain paper first and hold it against a label sheet
- ✅ Set printer to "Actual Size" (100% scale)
- ✅ Use the nudge controls to correct a consistent shift instead of fighting printer margins
- ⚠️ Browser differences: Chrome generally has the most accurate print rendering

## Supported Label Formats

| Format | Also fits | Paper | Size | Labels/Sheet | Use Case |
|--------|-----------|-------|------|--------------|----------|
| Avery 5160 | 8160, 5260, 5960, 18160, 8460 | Letter | 1" × 2⅝" | 30 | Standard address labels |
| Avery 5161 | 8161, 5261, 5961, 18161 | Letter | 1" × 4" | 20 | Wide address labels |
| Avery 5162 | 8162, 5262, 5962, 18162 | Letter | 1⅓" × 4" | 14 | Address labels |
| Avery 5163 | 8163, 5263, 5963, 18163 | Letter | 2" × 4" | 10 | Shipping labels |
| Avery 5164 | 8164, 5264, 5964 | Letter | 3⅓" × 4" | 6 | Large shipping labels |
| Avery 5167 | 8167, 5267, 5967, 18167 | Letter | ½" × 1¾" | 80 | Return address labels |
| Avery 5195 | 8195, 5155, 18195 | Letter | ⅔" × 1¾" | 60 | Return address labels |
| Avery L7160 | J8160, L7560, L7660, L7960 | A4 | 63.5 × 38.1 mm | 21 | Address labels (UK/EU) |
| Avery L7163 | J8163, L7563, L7663, L7963 | A4 | 99.1 × 38.1 mm | 14 | Address labels (UK/EU) |

Every format's geometry is checked by the test suite: columns must span the page width exactly and rows must fit the page height. To add a format, copy an entry in `src/constants/label-formats.js`, fill in the vendor's published margins and pitch, and run `npm test`.

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

# Run the tests (no extra dependencies, uses the Node test runner)
npm test

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
