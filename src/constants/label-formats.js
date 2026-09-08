/**
 * Label sheet specifications.
 *
 * Every measurement is a CSS length string in the sheet's native unit:
 * inches for US Letter sheets, millimetres for A4 sheets. Keeping the
 * vendor's published unit avoids rounding drift when the numbers are
 * written into the print stylesheet.
 *
 * Geometry contract (checked by tests/label-formats.test.js):
 *   cols * label width  + (cols - 1) * column gap + left + right margin == page width
 *   rows * label height + (rows - 1) * row gap    + top  + bottom      <= page height
 *
 * `aliases` lists other product codes that share the exact same layout
 * (Avery's inkjet 8xxx line, the 5260 series, and so on) so people can find
 * their sheet by the number printed on the box.
 */

export const LABEL_FORMATS = {
  '5160': {
    name: 'Avery 5160',
    description: '1" × 2⅝" - Address Labels',
    aliases: ['8160', '5260', '5960', '18160', '8460'],
    paper: 'Letter',
    unit: 'in',
    labelsPerSheet: 30,
    rows: 10,
    cols: 3,
    pageSize: { width: '8.5in', height: '11in' },
    pageMargin: { top: '0.5in', right: '0.1875in', bottom: '0.5in', left: '0.1875in' },
    labelSize: { width: '2.625in', height: '1in' },
    labelPadding: { top: '0.125in', right: '0.3in', bottom: '0', left: '0.3in' },
    labelMargin: { right: '0.125in', bottom: '0in' }
  },
  '5161': {
    name: 'Avery 5161',
    description: '1" × 4" - Address Labels',
    aliases: ['8161', '5261', '5961', '18161'],
    paper: 'Letter',
    unit: 'in',
    labelsPerSheet: 20,
    rows: 10,
    cols: 2,
    pageSize: { width: '8.5in', height: '11in' },
    pageMargin: { top: '0.5in', right: '0.15625in', bottom: '0.5in', left: '0.15625in' },
    labelSize: { width: '4in', height: '1in' },
    labelPadding: { top: '0.125in', right: '0.3in', bottom: '0', left: '0.3in' },
    labelMargin: { right: '0.1875in', bottom: '0in' }
  },
  '5162': {
    name: 'Avery 5162',
    description: '1⅓" × 4" - Address Labels',
    aliases: ['8162', '5262', '5962', '18162'],
    paper: 'Letter',
    unit: 'in',
    labelsPerSheet: 14,
    rows: 7,
    cols: 2,
    pageSize: { width: '8.5in', height: '11in' },
    pageMargin: { top: '0.83333in', right: '0.15625in', bottom: '0.83333in', left: '0.15625in' },
    labelSize: { width: '4in', height: '1.33333in' },
    labelPadding: { top: '0.15in', right: '0.3in', bottom: '0.1in', left: '0.3in' },
    labelMargin: { right: '0.1875in', bottom: '0in' }
  },
  '5163': {
    name: 'Avery 5163',
    description: '2" × 4" - Shipping Labels',
    aliases: ['8163', '5263', '5963', '18163'],
    paper: 'Letter',
    unit: 'in',
    labelsPerSheet: 10,
    rows: 5,
    cols: 2,
    pageSize: { width: '8.5in', height: '11in' },
    pageMargin: { top: '0.5in', right: '0.15625in', bottom: '0.5in', left: '0.15625in' },
    labelSize: { width: '4in', height: '2in' },
    labelPadding: { top: '0.15in', right: '0.15in', bottom: '0.15in', left: '0.15in' },
    labelMargin: { right: '0.1875in', bottom: '0in' }
  },
  '5164': {
    name: 'Avery 5164',
    description: '3⅓" × 4" - Shipping Labels',
    aliases: ['8164', '5264', '5964'],
    paper: 'Letter',
    unit: 'in',
    labelsPerSheet: 6,
    rows: 3,
    cols: 2,
    pageSize: { width: '8.5in', height: '11in' },
    pageMargin: { top: '0.5in', right: '0.15625in', bottom: '0.5in', left: '0.15625in' },
    labelSize: { width: '4in', height: '3.33333in' },
    labelPadding: { top: '0.2in', right: '0.2in', bottom: '0.2in', left: '0.2in' },
    labelMargin: { right: '0.1875in', bottom: '0in' }
  },
  '5167': {
    name: 'Avery 5167',
    description: '½" × 1¾" - Return Address Labels',
    aliases: ['8167', '5267', '5967', '18167'],
    paper: 'Letter',
    unit: 'in',
    labelsPerSheet: 80,
    rows: 20,
    cols: 4,
    pageSize: { width: '8.5in', height: '11in' },
    pageMargin: { top: '0.5in', right: '0.28125in', bottom: '0.5in', left: '0.28125in' },
    labelSize: { width: '1.75in', height: '0.5in' },
    labelPadding: { top: '0.05in', right: '0.1in', bottom: '0.05in', left: '0.1in' },
    labelMargin: { right: '0.3125in', bottom: '0in' }
  },
  '5195': {
    name: 'Avery 5195',
    description: '⅔" × 1¾" - Return Address Labels',
    aliases: ['8195', '5155', '18195'],
    paper: 'Letter',
    unit: 'in',
    labelsPerSheet: 60,
    rows: 15,
    cols: 4,
    pageSize: { width: '8.5in', height: '11in' },
    pageMargin: { top: '0.5in', right: '0.28125in', bottom: '0.5in', left: '0.28125in' },
    labelSize: { width: '1.75in', height: '0.66667in' },
    labelPadding: { top: '0.06in', right: '0.1in', bottom: '0.05in', left: '0.1in' },
    labelMargin: { right: '0.3125in', bottom: '0in' }
  },
  'L7160': {
    name: 'Avery L7160',
    description: '63.5 × 38.1 mm - Address Labels (A4)',
    aliases: ['J8160', 'L7560', 'L7660', 'L7960'],
    paper: 'A4',
    unit: 'mm',
    labelsPerSheet: 21,
    rows: 7,
    cols: 3,
    pageSize: { width: '210mm', height: '297mm' },
    pageMargin: { top: '15.15mm', right: '7.25mm', bottom: '15.15mm', left: '7.25mm' },
    labelSize: { width: '63.5mm', height: '38.1mm' },
    labelPadding: { top: '3mm', right: '6mm', bottom: '2mm', left: '6mm' },
    labelMargin: { right: '2.5mm', bottom: '0mm' }
  },
  'L7163': {
    name: 'Avery L7163',
    description: '99.1 × 38.1 mm - Address Labels (A4)',
    aliases: ['J8163', 'L7563', 'L7663', 'L7963'],
    paper: 'A4',
    unit: 'mm',
    labelsPerSheet: 14,
    rows: 7,
    cols: 2,
    pageSize: { width: '210mm', height: '297mm' },
    pageMargin: { top: '15.15mm', right: '4.65mm', bottom: '15.15mm', left: '4.65mm' },
    labelSize: { width: '99.1mm', height: '38.1mm' },
    labelPadding: { top: '3mm', right: '6mm', bottom: '2mm', left: '6mm' },
    labelMargin: { right: '2.5mm', bottom: '0mm' }
  }
};

export const DEFAULT_FORMAT = '5160';

/**
 * Resolve a product code (including aliases such as 8160) to a format key.
 * Matching is case-insensitive and ignores surrounding whitespace.
 * @param {string} code
 * @returns {string|null}
 */
export function findFormatByCode(code) {
  if (!code) return null;
  const needle = String(code).trim().toUpperCase();
  if (!needle) return null;

  for (const [key, format] of Object.entries(LABEL_FORMATS)) {
    if (key.toUpperCase() === needle) return key;
    if ((format.aliases || []).some((alias) => alias.toUpperCase() === needle)) return key;
  }
  return null;
}
