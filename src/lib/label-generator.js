import { LABEL_FORMATS } from '../constants/label-formats.js';

/**
 * Escape HTML entities to prevent XSS.
 * Pure string replacement so this module also runs outside a browser
 * (tests execute it under Node).
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Split a CSS length such as "2.625in" or "38.1mm" into its parts.
 * @param {string} length
 * @returns {{ value: number, unit: string }}
 */
export function parseLength(length) {
  const match = String(length ?? '').trim().match(/^(-?\d*\.?\d+)\s*([a-z%]*)$/i);
  if (!match) return { value: 0, unit: '' };
  return { value: parseFloat(match[1]), unit: match[2] || '' };
}

/**
 * Default print alignment settings.
 *
 * startAt  - 1-based position of the first label to print on the first sheet,
 *            so a partly used sheet can be finished instead of thrown away.
 * offsetX  - horizontal nudge for the whole sheet, in the format's unit.
 *            Positive moves content right, negative moves it left.
 * offsetY  - vertical nudge, positive moves content down.
 * outlines - draw a dashed border around every label position (for the
 *            alignment test page printed on plain paper).
 */
export const DEFAULT_PRINT_SETTINGS = {
  startAt: 1,
  offsetX: 0,
  offsetY: 0,
  outlines: false
};

/** Largest offset nudge accepted, per unit. Anything bigger is a layout problem, not a printer drift. */
export const MAX_OFFSET = { in: 0.5, mm: 12 };

/**
 * Clamp and sanitise print settings against a format.
 * @param {Partial<typeof DEFAULT_PRINT_SETTINGS>|undefined} settings
 * @param {Object} formatSpec
 * @returns {typeof DEFAULT_PRINT_SETTINGS}
 */
export function normalizePrintSettings(settings, formatSpec) {
  const merged = { ...DEFAULT_PRINT_SETTINGS, ...(settings || {}) };
  const unit = formatSpec?.unit === 'mm' ? 'mm' : 'in';
  const maxOffset = MAX_OFFSET[unit];
  const perSheet = formatSpec?.labelsPerSheet ?? 1;

  const toNumber = (value, fallback) => {
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const startAt = clamp(Math.round(toNumber(merged.startAt, 1)), 1, perSheet);
  const offsetX = clamp(toNumber(merged.offsetX, 0), -maxOffset, maxOffset);
  const offsetY = clamp(toNumber(merged.offsetY, 0), -maxOffset, maxOffset);

  return { startAt, offsetX, offsetY, outlines: Boolean(merged.outlines) };
}

/**
 * Generate address lines from mapped data
 * @param {Object} row - CSV row data
 * @param {Object} columnMapping - Column mapping configuration
 * @returns {string[]}
 */
export function generateAddressLines(row, columnMapping) {
  const lines = [];

  // Name
  if (columnMapping.name && row[columnMapping.name]) {
    lines.push(row[columnMapping.name]);
  }

  // Company
  if (columnMapping.company && row[columnMapping.company]) {
    lines.push(row[columnMapping.company]);
  }

  // Address Line 1
  if (columnMapping.addressLine1 && row[columnMapping.addressLine1]) {
    lines.push(row[columnMapping.addressLine1]);
  }

  // Address Line 2
  if (columnMapping.addressLine2 && row[columnMapping.addressLine2]) {
    lines.push(row[columnMapping.addressLine2]);
  }

  // City, State ZIP
  const cityStateLine = [
    row[columnMapping.city],
    row[columnMapping.state],
    row[columnMapping.zip]
  ]
    .filter(Boolean)
    .join(', ');

  if (cityStateLine) {
    lines.push(cityStateLine);
  }

  return lines.filter(Boolean);
}

/**
 * Arrange labels onto sheets.
 *
 * Returns one array per physical sheet. Each sheet holds exactly
 * `labelsPerSheet` slots; `null` marks an empty slot (skipped positions at the
 * start of the first sheet, or unused positions at the end of the last one).
 *
 * @param {T[]} items
 * @param {number} labelsPerSheet
 * @param {number} startAt - 1-based position of the first printed label
 * @returns {(T|null)[][]}
 * @template T
 */
export function paginateLabels(items, labelsPerSheet, startAt = 1) {
  const perSheet = Math.max(1, Math.floor(labelsPerSheet));
  const skip = Math.min(Math.max(Math.round(startAt) - 1, 0), perSheet - 1);

  if (items.length === 0) return [];

  const slots = [...Array(skip).fill(null), ...items];
  const sheets = [];
  for (let i = 0; i < slots.length; i += perSheet) {
    const sheet = slots.slice(i, i + perSheet);
    while (sheet.length < perSheet) sheet.push(null);
    sheets.push(sheet);
  }
  return sheets;
}

/**
 * Number of sheets required for a label count, given a starting position.
 * @param {number} labelCount
 * @param {number} labelsPerSheet
 * @param {number} startAt
 * @returns {number}
 */
export function countSheets(labelCount, labelsPerSheet, startAt = 1) {
  if (labelCount <= 0) return 0;
  return paginateLabels(Array(labelCount).fill(true), labelsPerSheet, startAt).length;
}

/**
 * Generate CSS for print-optimized labels.
 *
 * Every sheet is an explicit CSS grid with one page break after it, so a
 * sheet's geometry never depends on how the browser decides to wrap flex
 * items across page boundaries. The offset is applied to the sheet as a
 * relative position so a small negative nudge is possible even when the page
 * margin is already at zero.
 *
 * @param {Object} formatSpec - Label format specification
 * @param {typeof DEFAULT_PRINT_SETTINGS} settings
 * @returns {string}
 */
export function generateCSS(formatSpec, settings = DEFAULT_PRINT_SETTINGS) {
  const unit = formatSpec.unit || parseLength(formatSpec.labelSize.width).unit || 'in';
  const offsetX = `${settings.offsetX || 0}${unit}`;
  const offsetY = `${settings.offsetY || 0}${unit}`;
  const rowGap = formatSpec.labelMargin.bottom || '0';
  const colGap = formatSpec.labelMargin.right || '0';

  const outlineCSS = settings.outlines
    ? `
    .label {
      outline: 1px dashed #777;
      outline-offset: -1px;
    }

    .label-index {
      font-size: 7pt;
      color: #999;
    }`
    : `
    .label-index {
      display: none;
    }`;

  return `
    @page {
      size: ${formatSpec.pageSize.width} ${formatSpec.pageSize.height};
      margin: ${formatSpec.pageMargin.top} ${formatSpec.pageMargin.right} ${formatSpec.pageMargin.bottom} ${formatSpec.pageMargin.left};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.2;
    }

    .sheet {
      display: grid;
      grid-template-columns: repeat(${formatSpec.cols}, ${formatSpec.labelSize.width});
      grid-auto-rows: ${formatSpec.labelSize.height};
      column-gap: ${colGap};
      row-gap: ${rowGap};
      position: relative;
      left: ${offsetX};
      top: ${offsetY};
      page-break-after: always;
      break-after: page;
    }

    .sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .label {
      width: ${formatSpec.labelSize.width};
      height: ${formatSpec.labelSize.height};
      padding: ${formatSpec.labelPadding.top} ${formatSpec.labelPadding.right} ${formatSpec.labelPadding.bottom} ${formatSpec.labelPadding.left};
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
      box-sizing: border-box;
    }

    .label-line {
      margin-bottom: 0.05in;
    }
${outlineCSS}

    @media print {
      body {
        margin: 0;
      }
      .label {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  `.trim();
}

function renderDocument(title, css, sheetsHTML) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    ${css}
  </style>
</head>
<body>
${sheetsHTML}
</body>
</html>`;
}

function renderSheets(sheets, renderSlot) {
  return sheets
    .map((sheet, sheetIndex) => {
      const cells = sheet
        .map((slot, slotIndex) => {
          const position = slotIndex + 1;
          const inner = renderSlot(slot, position, sheetIndex);
          return `<div class="label${slot === null ? ' label-empty' : ''}" data-position="${position}">${inner}</div>`;
        })
        .join('\n    ');
      return `  <div class="sheet" data-sheet="${sheetIndex + 1}">\n    ${cells}\n  </div>`;
    })
    .join('\n');
}

/**
 * Generate printable HTML document with labels
 * @param {Object[]} rows - CSV data rows
 * @param {Object} columnMapping - Column mapping configuration
 * @param {string} formatKey - Selected format key (e.g., '5160')
 * @param {Partial<typeof DEFAULT_PRINT_SETTINGS>} [printSettings]
 * @returns {string} - Complete HTML document
 */
export function generatePrintableHTML(rows, columnMapping, formatKey, printSettings) {
  const formatSpec = LABEL_FORMATS[formatKey];

  if (!formatSpec) {
    throw new Error(`Invalid format key: ${formatKey}`);
  }

  const settings = normalizePrintSettings(printSettings, formatSpec);

  const labels = rows
    .map((row) => generateAddressLines(row, columnMapping))
    .filter((lines) => lines.length > 0);

  const sheets = paginateLabels(labels, formatSpec.labelsPerSheet, settings.startAt);

  const sheetsHTML = renderSheets(sheets, (lines, position) => {
    const index = `<span class="label-index">${position}</span>`;
    if (lines === null) return index;
    const linesHTML = lines
      .map((line) => `<div class="label-line">${escapeHtml(line)}</div>`)
      .join('');
    return index + linesHTML;
  });

  const css = generateCSS(formatSpec, settings);

  return renderDocument(`Labels - ${formatSpec.name}`, css, sheetsHTML);
}

/**
 * Generate a one-sheet alignment test page.
 *
 * Every label position is drawn as a dashed outline with its number, using
 * exactly the same geometry and offsets as the real print. Print it on plain
 * paper, hold it against a label sheet, and adjust the offsets until the
 * outlines sit on the labels.
 *
 * @param {string} formatKey
 * @param {Partial<typeof DEFAULT_PRINT_SETTINGS>} [printSettings]
 * @returns {string}
 */
export function generateAlignmentTestHTML(formatKey, printSettings) {
  const formatSpec = LABEL_FORMATS[formatKey];

  if (!formatSpec) {
    throw new Error(`Invalid format key: ${formatKey}`);
  }

  const settings = {
    ...normalizePrintSettings({ ...printSettings, startAt: 1 }, formatSpec),
    outlines: true
  };

  const sheets = paginateLabels(Array(formatSpec.labelsPerSheet).fill(true), formatSpec.labelsPerSheet, 1);

  const sheetsHTML = renderSheets(sheets, (_slot, position) => {
    const index = `<span class="label-index">${position}</span>`;
    if (position !== 1) return index;
    const nudge = [
      `x ${settings.offsetX >= 0 ? '+' : ''}${settings.offsetX}${formatSpec.unit}`,
      `y ${settings.offsetY >= 0 ? '+' : ''}${settings.offsetY}${formatSpec.unit}`
    ].join(', ');
    return `${index}<div class="label-line">${escapeHtml(formatSpec.name)} alignment test</div><div class="label-line">${escapeHtml(nudge)}</div>`;
  });

  const css = generateCSS(formatSpec, settings);

  return renderDocument(`Alignment test - ${formatSpec.name}`, css, sheetsHTML);
}

/**
 * Count total labels that will be generated
 * @param {Object[]} rows - CSV data rows
 * @param {Object} columnMapping - Column mapping configuration
 * @returns {number}
 */
export function countLabels(rows, columnMapping) {
  return rows.filter((row) => {
    const addressLines = generateAddressLines(row, columnMapping);
    return addressLines.length > 0;
  }).length;
}
