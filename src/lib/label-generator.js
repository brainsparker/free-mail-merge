import { LABEL_FORMATS } from '../constants/label-formats';
import { buildAddressLines } from './list-cleaner';

/**
 * Escape HTML entities to prevent XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate address lines from mapped data
 * @param {Object} row - CSV row data
 * @param {Object} columnMapping - Column mapping configuration
 * @param {{ usps?: boolean }} [options] - Rendering options (USPS formatting)
 * @returns {string[]}
 */
function generateAddressLines(row, columnMapping, options = {}) {
  return buildAddressLines(row, columnMapping, options);
}

/**
 * Generate CSS for print-optimized labels
 * @param {Object} formatSpec - Label format specification
 * @returns {string}
 */
function generateCSS(formatSpec) {
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

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.2;
      width: ${formatSpec.pageSize.width};
      margin: 0;
      padding: 0;
    }

    .label-sheet {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
    }

    .label {
      width: ${formatSpec.labelSize.width};
      height: ${formatSpec.labelSize.height};
      padding: ${formatSpec.labelPadding.top} ${formatSpec.labelPadding.right} ${formatSpec.labelPadding.bottom} ${formatSpec.labelPadding.left};
      margin-right: ${formatSpec.labelMargin.right};
      margin-bottom: ${formatSpec.labelMargin.bottom};
      overflow: hidden;
      page-break-inside: avoid;
      box-sizing: border-box;
    }

    .label:nth-child(${formatSpec.cols}n) {
      margin-right: 0;
    }

    .label-line {
      margin-bottom: 0.05in;
    }

    @media print {
      body {
        margin: 0;
      }
      .label {
        page-break-inside: avoid;
      }
    }
  `.trim();
}

/**
 * Generate printable HTML document with labels
 * @param {Object[]} rows - CSV data rows
 * @param {Object} columnMapping - Column mapping configuration
 * @param {string} formatKey - Selected format key (e.g., '5160')
 * @param {{ usps?: boolean }} [options] - Rendering options (USPS formatting)
 * @returns {string} - Complete HTML document
 */
export function generatePrintableHTML(rows, columnMapping, formatKey, options = {}) {
  const formatSpec = LABEL_FORMATS[formatKey];

  if (!formatSpec) {
    throw new Error(`Invalid format key: ${formatKey}`);
  }

  // Generate labels HTML
  const labelsHTML = rows
    .map((row) => {
      const addressLines = generateAddressLines(row, columnMapping, options);

      // Skip if no address lines
      if (addressLines.length === 0) {
        return '';
      }

      const linesHTML = addressLines
        .map((line) => `<div class="label-line">${escapeHtml(line)}</div>`)
        .join('');

      return `<div class="label">${linesHTML}</div>`;
    })
    .filter(Boolean)
    .join('\n        ');

  const css = generateCSS(formatSpec);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Labels - ${formatSpec.name}</title>
  <style>
    ${css}
  </style>
</head>
<body>
  <div class="label-sheet">
        ${labelsHTML}
  </div>
</body>
</html>`;
}

/**
 * Count total labels that will be generated
 * @param {Object[]} rows - CSV data rows
 * @param {Object} columnMapping - Column mapping configuration
 * @param {{ usps?: boolean }} [options] - Rendering options (USPS formatting)
 * @returns {number}
 */
export function countLabels(rows, columnMapping, options = {}) {
  return rows.filter((row) => {
    const addressLines = generateAddressLines(row, columnMapping, options);
    return addressLines.length > 0;
  }).length;
}
