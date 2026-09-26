/**
 * PDF label output.
 *
 * Lays mapped addresses onto label sheets and renders them with the
 * zero-dependency writer in ./pdf-writer.js. A PDF fixes the page size and
 * every label position in absolute points, so the result prints identically
 * from any viewer as long as scaling is left at 100%. Unlike the HTML output
 * it is immune to browser print margins, injected headers and footers, and
 * per-browser differences in how CSS page boxes are handled.
 *
 * The layout is computed as plain data first (see layoutLabels) so it can be
 * tested without touching PDF bytes.
 */

import { LABEL_FORMATS } from '../constants/label-formats.js';
import { generateAddressLines } from './label-generator.js';
import { PdfDocument, measureText, POINTS_PER_INCH, POINTS_PER_MM } from './pdf-writer.js';

/** Text defaults, matching the HTML output (10pt Arial/Helvetica, 1.2 line height, 0.05in between lines). */
export const PDF_TEXT_DEFAULTS = {
  fontSize: 10,
  minFontSize: 6,
  lineHeightRatio: 1.2,
  lineGap: 0.05 * POINTS_PER_INCH
};

/**
 * Convert a CSS length used in a format spec ("2.625in", "38.1mm", "0") to points.
 * Bare numbers are treated as being in `defaultUnit`.
 * @param {string|number} length
 * @param {'in'|'mm'} [defaultUnit='in']
 * @returns {number}
 */
export function toPoints(length, defaultUnit = 'in') {
  if (typeof length === 'number') {
    return length * (defaultUnit === 'mm' ? POINTS_PER_MM : POINTS_PER_INCH);
  }
  const match = String(length ?? '').trim().match(/^(-?\d*\.?\d+)\s*(in|mm|cm|pt)?$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = (match[2] || defaultUnit).toLowerCase();
  switch (unit) {
    case 'mm':
      return value * POINTS_PER_MM;
    case 'cm':
      return value * 10 * POINTS_PER_MM;
    case 'pt':
      return value;
    default:
      return value * POINTS_PER_INCH;
  }
}

/**
 * Resolve a format spec into a grid measured entirely in points.
 * @param {Object} formatSpec - entry from LABEL_FORMATS
 * @returns {Object}
 */
export function computeLabelGrid(formatSpec) {
  const unit = formatSpec.unit === 'mm' ? 'mm' : 'in';
  const pt = (length) => toPoints(length, unit);

  return {
    unit,
    cols: formatSpec.cols,
    rows: formatSpec.rows,
    labelsPerSheet: formatSpec.labelsPerSheet,
    pageWidth: pt(formatSpec.pageSize.width),
    pageHeight: pt(formatSpec.pageSize.height),
    marginTop: pt(formatSpec.pageMargin.top),
    marginLeft: pt(formatSpec.pageMargin.left),
    labelWidth: pt(formatSpec.labelSize.width),
    labelHeight: pt(formatSpec.labelSize.height),
    gapX: pt(formatSpec.labelMargin.right),
    gapY: pt(formatSpec.labelMargin.bottom),
    padding: {
      top: pt(formatSpec.labelPadding.top),
      right: pt(formatSpec.labelPadding.right),
      bottom: pt(formatSpec.labelPadding.bottom),
      left: pt(formatSpec.labelPadding.left)
    }
  };
}

/**
 * Bottom-left corner of the label at a 0-based position on the sheet.
 * Positions run left to right, then top to bottom, like the HTML flow.
 * @param {Object} grid - from computeLabelGrid
 * @param {number} position - 0-based index on the sheet
 * @param {{ offsetX?: number, offsetY?: number }} [nudge] - in points; positive X moves right, positive Y moves down
 * @returns {{ x: number, y: number, col: number, row: number }}
 */
export function labelOrigin(grid, position, nudge = {}) {
  const col = position % grid.cols;
  const row = Math.floor(position / grid.cols);
  const x = grid.marginLeft + col * (grid.labelWidth + grid.gapX) + (nudge.offsetX || 0);
  const top = grid.pageHeight - grid.marginTop - row * (grid.labelHeight + grid.gapY) - (nudge.offsetY || 0);
  return { x, y: top - grid.labelHeight, col, row };
}

/**
 * Shorten a string with an ellipsis until it fits `maxWidth` at `fontSize`.
 * @param {string} text
 * @param {number} maxWidth
 * @param {number} fontSize
 * @returns {string}
 */
export function truncateToWidth(text, maxWidth, fontSize) {
  if (measureText(text, fontSize) <= maxWidth) return text;
  const ellipsis = '…';
  let chars = Array.from(text);
  while (chars.length > 0) {
    chars = chars.slice(0, -1);
    const candidate = chars.join('').trimEnd() + ellipsis;
    if (measureText(candidate, fontSize) <= maxWidth) return candidate;
  }
  return ellipsis;
}

/**
 * Choose the largest font size (down to `minFontSize`, in half-point steps)
 * at which every line fits the width and all lines fit the height. If even
 * the minimum size overflows, lines are truncated with an ellipsis and any
 * lines that cannot fit vertically are dropped, so a label never spills.
 *
 * @param {string[]} lines
 * @param {number} maxWidth - points
 * @param {number} maxHeight - points
 * @param {Partial<typeof PDF_TEXT_DEFAULTS>} [options]
 * @returns {{ fontSize: number, lineHeight: number, lines: string[] }}
 */
export function fitLines(lines, maxWidth, maxHeight, options = {}) {
  const opts = { ...PDF_TEXT_DEFAULTS, ...options };
  const lineHeightAt = (size) => size * opts.lineHeightRatio + opts.lineGap;
  const blockHeight = (size, count) => count * lineHeightAt(size) - opts.lineGap;

  for (let size = opts.fontSize; size >= opts.minFontSize; size -= 0.5) {
    const widthOk = lines.every((line) => measureText(line, size) <= maxWidth);
    const heightOk = blockHeight(size, lines.length) <= maxHeight;
    if (widthOk && heightOk) {
      return { fontSize: size, lineHeight: lineHeightAt(size), lines: [...lines] };
    }
  }

  const size = opts.minFontSize;
  const lineHeight = lineHeightAt(size);
  const maxLines = Math.max(1, Math.floor((maxHeight + opts.lineGap) / lineHeight));
  const kept = lines.slice(0, maxLines).map((line) => truncateToWidth(line, maxWidth, size));
  return { fontSize: size, lineHeight, lines: kept };
}

/**
 * Normalise layout options.
 * @param {Object|undefined} options
 * @param {Object} grid
 */
function normalizeOptions(options, grid) {
  const opts = options || {};
  const unitToPoints = grid.unit === 'mm' ? POINTS_PER_MM : POINTS_PER_INCH;
  const number = (value, fallback) => {
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const startAt = Math.min(grid.labelsPerSheet, Math.max(1, Math.round(number(opts.startAt, 1))));
  return {
    startAt,
    offsetX: number(opts.offsetX, 0) * unitToPoints,
    offsetY: number(opts.offsetY, 0) * unitToPoints,
    outlines: Boolean(opts.outlines),
    fontSize: number(opts.fontSize, PDF_TEXT_DEFAULTS.fontSize),
    minFontSize: number(opts.minFontSize, PDF_TEXT_DEFAULTS.minFontSize)
  };
}

/**
 * Compute where every label goes, as plain data.
 *
 * @param {Object[]} rows - CSV rows
 * @param {Object} columnMapping - column mapping
 * @param {string} formatKey - LABEL_FORMATS key
 * @param {Object} [options]
 * @param {number} [options.startAt=1] - 1-based position of the first label on the first sheet
 * @param {number} [options.offsetX=0] - horizontal nudge in the format's unit (positive = right)
 * @param {number} [options.offsetY=0] - vertical nudge in the format's unit (positive = down)
 * @param {boolean} [options.outlines=false] - draw a dashed outline around each label position
 * @param {number} [options.fontSize=10] - starting font size in points
 * @returns {{ grid: Object, options: Object, labelCount: number, pages: Array<{ labels: Array }> }}
 */
export function layoutLabels(rows, columnMapping, formatKey, options = {}) {
  const formatSpec = LABEL_FORMATS[formatKey];
  if (!formatSpec) {
    throw new Error(`Invalid format key: ${formatKey}`);
  }

  const grid = computeLabelGrid(formatSpec);
  const opts = normalizeOptions(options, grid);
  const nudge = { offsetX: opts.offsetX, offsetY: opts.offsetY };
  const textWidth = grid.labelWidth - grid.padding.left - grid.padding.right;
  const textHeight = grid.labelHeight - grid.padding.top - grid.padding.bottom;

  const entries = rows
    .map((row) => generateAddressLines(row, columnMapping))
    .filter((lines) => lines.length > 0);

  const pages = [];
  let position = opts.startAt - 1;
  let page = { labels: [] };
  pages.push(page);

  for (const lines of entries) {
    if (position >= grid.labelsPerSheet) {
      page = { labels: [] };
      pages.push(page);
      position = 0;
    }
    const origin = labelOrigin(grid, position, nudge);
    const fitted = fitLines(lines, textWidth, textHeight, {
      fontSize: opts.fontSize,
      minFontSize: opts.minFontSize
    });
    page.labels.push({
      position,
      x: origin.x,
      y: origin.y,
      width: grid.labelWidth,
      height: grid.labelHeight,
      fontSize: fitted.fontSize,
      lineHeight: fitted.lineHeight,
      lines: fitted.lines
    });
    position += 1;
  }

  return { formatKey, grid, options: opts, labelCount: entries.length, pages };
}

/**
 * Draw the outline of every label position on a page (alignment test).
 * @param {import('./pdf-writer.js').PdfPage} page
 * @param {Object} grid
 * @param {{ offsetX: number, offsetY: number }} nudge
 */
function drawOutlines(page, grid, nudge) {
  for (let position = 0; position < grid.labelsPerSheet; position += 1) {
    const origin = labelOrigin(grid, position, nudge);
    page.rect(origin.x, origin.y, grid.labelWidth, grid.labelHeight, { dash: 2, lineWidth: 0.5, gray: 0.6 });
  }
}

/**
 * Draw one laid-out label onto a page, clipped to its own box.
 * @param {import('./pdf-writer.js').PdfPage} page
 * @param {Object} label - entry from layoutLabels().pages[n].labels
 * @param {Object} grid
 */
function drawLabel(page, label, grid) {
  page.clipped(label.x, label.y, label.width, label.height, () => {
    const x = label.x + grid.padding.left;
    // Baseline of the first line: top padding, then the ascent of a 1.2 line box.
    let baseline = label.y + label.height - grid.padding.top - label.fontSize * 0.86;
    for (const line of label.lines) {
      page.text(line, x, baseline, label.fontSize);
      baseline -= label.lineHeight;
    }
  });
}

/**
 * Render a layout to PDF bytes.
 * @param {ReturnType<typeof layoutLabels>} layout
 * @param {{ title?: string, creationDate?: Date }} [meta]
 * @returns {Uint8Array}
 */
export function renderLayout(layout, meta = {}) {
  const formatSpec = LABEL_FORMATS[layout.formatKey];
  const doc = new PdfDocument({
    title: meta.title || `Labels - ${formatSpec.name}`,
    producer: 'LabelMerge',
    creationDate: meta.creationDate
  });
  const nudge = { offsetX: layout.options.offsetX, offsetY: layout.options.offsetY };

  for (const pageLayout of layout.pages) {
    const page = doc.addPage(layout.grid.pageWidth, layout.grid.pageHeight);
    if (layout.options.outlines) {
      drawOutlines(page, layout.grid, nudge);
    }
    for (const label of pageLayout.labels) {
      drawLabel(page, label, layout.grid);
    }
  }
  return doc.toBytes();
}

/**
 * Generate a print-ready PDF of labels.
 *
 * @param {Object[]} rows - CSV rows
 * @param {Object} columnMapping - column mapping
 * @param {string} formatKey - LABEL_FORMATS key (e.g. '5160')
 * @param {Object} [options] - see layoutLabels; also accepts `creationDate` for reproducible output
 * @returns {Uint8Array} PDF bytes
 */
export function generateLabelPDF(rows, columnMapping, formatKey, options = {}) {
  const layout = layoutLabels(rows, columnMapping, formatKey, options);
  return renderLayout(layout, { creationDate: options.creationDate });
}

/**
 * Generate a one-page alignment test: dashed outlines at every label position
 * with the position number in each box. Print it on plain paper, hold it
 * against a label sheet, and nudge with offsetX / offsetY if needed.
 *
 * @param {string} formatKey
 * @param {{ offsetX?: number, offsetY?: number, creationDate?: Date }} [options]
 * @returns {Uint8Array}
 */
export function generateAlignmentTestPDF(formatKey, options = {}) {
  const formatSpec = LABEL_FORMATS[formatKey];
  if (!formatSpec) {
    throw new Error(`Invalid format key: ${formatKey}`);
  }
  const grid = computeLabelGrid(formatSpec);
  const opts = normalizeOptions({ ...options, outlines: true }, grid);
  const nudge = { offsetX: opts.offsetX, offsetY: opts.offsetY };

  const doc = new PdfDocument({
    title: `Alignment test - ${formatSpec.name}`,
    producer: 'LabelMerge',
    creationDate: options.creationDate
  });
  const page = doc.addPage(grid.pageWidth, grid.pageHeight);
  drawOutlines(page, grid, nudge);

  const textWidth = grid.labelWidth - grid.padding.left - grid.padding.right;
  const textHeight = grid.labelHeight - grid.padding.top - grid.padding.bottom;
  for (let position = 0; position < grid.labelsPerSheet; position += 1) {
    const origin = labelOrigin(grid, position, nudge);
    const fitted = fitLines([`${formatSpec.name} #${position + 1}`], textWidth, textHeight, { fontSize: 8 });
    drawLabel(
      page,
      {
        x: origin.x,
        y: origin.y,
        width: grid.labelWidth,
        height: grid.labelHeight,
        fontSize: fitted.fontSize,
        lineHeight: fitted.lineHeight,
        lines: fitted.lines
      },
      grid
    );
  }
  return doc.toBytes();
}
