/**
 * Minimal PDF writer.
 *
 * Produces a valid PDF 1.4 document from pages of text and rectangles, using
 * the built-in Helvetica font that every PDF viewer ships with. No
 * dependencies, no network, no fonts to embed: the whole document is a few
 * kilobytes and is generated entirely in the browser (or under Node for tests).
 *
 * The writer knows exactly enough PDF to print labels well:
 *   - one page tree, any number of pages of any size (points)
 *   - Helvetica text in WinAnsi encoding, positioned by baseline
 *   - stroked rectangles (used for alignment test outlines)
 *   - clipping rectangles so label text can never bleed into a neighbour
 *   - a byte-accurate cross-reference table so strict viewers do not complain
 *
 * All coordinates are in PDF points (1/72 inch) with the origin at the
 * bottom-left corner of the page, as in the PDF specification.
 */

export const POINTS_PER_INCH = 72;
export const POINTS_PER_MM = 72 / 25.4;

/**
 * Advance widths for the standard 14 font Helvetica, in 1/1000 of the font
 * size, indexed by character code 32..126. Taken from the Adobe AFM metrics.
 */
const HELVETICA_ASCII_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, // space .. /
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, // 0 .. ?
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, // @ .. O
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, // P .. _
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, // ` .. o
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584 // p .. ~
];

/**
 * Widths for the characters WinAnsi places in the 0x80..0xFF range that do
 * not decompose to an ASCII base letter. Everything else in that range is an
 * accented Latin letter and takes the width of its base letter, which is
 * exact for Helvetica.
 */
const HELVETICA_EXTRA_WIDTHS = {
  '€': 556, // Euro sign
  '‘': 222, '’': 222, '‚': 222, // single quotes
  '“': 333, '”': 333, '„': 333, // double quotes
  '•': 350, // bullet
  '–': 556, // en dash
  '—': 1000, // em dash
  '…': 1000, // ellipsis
  '™': 1000, // trade mark
  ' ': 278, '¡': 333, '¢': 556, '£': 556, '¤': 556, '¥': 556,
  '¦': 260, '§': 556, '¨': 333, '©': 737, 'ª': 370, '«': 556,
  '¬': 584, '®': 737, '¯': 333, '°': 400, '±': 584, '²': 333,
  '³': 333, '´': 333, 'µ': 556, '¶': 537, '·': 278, '¸': 333,
  '¹': 333, 'º': 365, '»': 556, '¼': 834, '½': 834, '¾': 834,
  '¿': 611, 'Æ': 1000, 'Ð': 722, '×': 584, 'Ø': 778, 'Þ': 667,
  'ß': 611, 'æ': 889, 'ð': 556, '÷': 584, 'ø': 611, 'þ': 556,
  'Œ': 1000, 'œ': 944, 'Š': 667, 'š': 500, 'Ž': 611, 'ž': 500,
  'Ÿ': 667, 'ƒ': 556
};

/**
 * Code points that WinAnsiEncoding places in 0x80..0x9F. Latin-1 characters
 * (U+00A0..U+00FF) map to their own code, so they are not listed here.
 */
const WINANSI_HIGH = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85,
  '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a,
  '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92,
  '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
  '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c,
  'ž': 0x9e, 'Ÿ': 0x9f
};

const REPLACEMENT_CODE = 0x3f; // '?'

/**
 * Latin letters with no WinAnsi glyph and no combining mark to strip, so NFD
 * cannot reduce them. Rendering the plain base letter beats a "?".
 */
const BASE_LETTER_FALLBACK = {
  'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'ħ': 'h', 'Ħ': 'H',
  'ı': 'i', 'İ': 'I', 'ĸ': 'k', 'ŋ': 'n', 'Ŋ': 'N', 'ŧ': 't', 'Ŧ': 'T',
  'ẝ': 's', 'ĳ': 'ij', 'Ĳ': 'IJ', 'ŉ': "'n", 'ſ': 's'
};

/**
 * Reduce a character with no WinAnsi glyph to the closest encodable text:
 * strip combining marks (é from e + acute), then try the fallback table.
 * Returns an empty string when nothing applies.
 * @param {string} char
 * @returns {string}
 */
function baseText(char) {
  const stripped = char.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (stripped && stripped !== char) return stripped;
  return BASE_LETTER_FALLBACK[char] || '';
}

/**
 * Map one character to its WinAnsi byte, or null when it has no encoding.
 * @param {string} char
 * @returns {number|null}
 */
function winAnsiCode(char) {
  const point = char.codePointAt(0);
  if (point >= 0x20 && point <= 0x7e) return point;
  if (point >= 0xa0 && point <= 0xff) return point;
  if (char in WINANSI_HIGH) return WINANSI_HIGH[char];
  return null;
}

/**
 * Encode a string as WinAnsi bytes.
 *
 * Characters outside the encoding are decomposed (NFD) so that, for example,
 * a Vietnamese or Polish letter falls back to its base Latin letter instead of
 * disappearing. Anything still unmapped becomes "?". Tabs and other control
 * characters become spaces.
 *
 * @param {string} text
 * @returns {number[]} byte values 0..255
 */
export function encodeWinAnsi(text) {
  const bytes = [];
  for (const char of String(text ?? '')) {
    const code = winAnsiCode(char);
    if (code !== null) {
      bytes.push(code);
      continue;
    }
    if (/\s/.test(char)) {
      bytes.push(0x20);
      continue;
    }
    const base = baseText(char);
    if (base) {
      for (const baseChar of base) {
        const baseCode = winAnsiCode(baseChar);
        bytes.push(baseCode !== null ? baseCode : REPLACEMENT_CODE);
      }
      continue;
    }
    bytes.push(REPLACEMENT_CODE);
  }
  return bytes;
}

/**
 * Width of one character in 1/1000 em, for Helvetica.
 * @param {string} char
 * @returns {number}
 */
function helveticaUnitWidth(char) {
  const point = char.codePointAt(0);
  if (point >= 0x20 && point <= 0x7e) return HELVETICA_ASCII_WIDTHS[point - 0x20];
  if (char in HELVETICA_EXTRA_WIDTHS) return HELVETICA_EXTRA_WIDTHS[char];
  const base = baseText(char);
  if (base) {
    let units = 0;
    for (const baseChar of base) units += helveticaUnitWidth(baseChar);
    return units;
  }
  // Unknown glyph renders as '?', so measure it as one.
  return HELVETICA_ASCII_WIDTHS[REPLACEMENT_CODE - 0x20];
}

/**
 * Measure a string set in Helvetica at the given size, in points.
 * @param {string} text
 * @param {number} fontSize
 * @returns {number}
 */
export function measureText(text, fontSize) {
  let units = 0;
  for (const char of String(text ?? '')) {
    units += helveticaUnitWidth(char);
  }
  return (units / 1000) * fontSize;
}

/**
 * Escape encoded bytes as a PDF literal string: (…) with backslash escapes.
 * Bytes outside printable ASCII are written as octal escapes so the file
 * stays 7-bit clean and viewers never second-guess the encoding.
 * @param {number[]} bytes
 * @returns {string}
 */
export function pdfLiteralString(bytes) {
  let out = '(';
  for (const byte of bytes) {
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) {
      out += '\\' + String.fromCharCode(byte);
    } else if (byte < 0x20 || byte > 0x7e) {
      out += '\\' + byte.toString(8).padStart(3, '0');
    } else {
      out += String.fromCharCode(byte);
    }
  }
  return out + ')';
}

/**
 * Format a number for a content stream: fixed precision, no trailing zeros,
 * never exponent notation.
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (!Number.isFinite(value)) return '0';
  const fixed = value.toFixed(3);
  return fixed.replace(/\.?0+$/, '') || '0';
}

/**
 * Format a Date as a PDF date string (D:YYYYMMDDHHmmSSZ).
 * @param {Date} date
 * @returns {string}
 */
export function pdfDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    'D:' +
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * A page under construction. Collects content stream operators.
 */
export class PdfPage {
  /**
   * @param {number} width - page width in points
   * @param {number} height - page height in points
   */
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.ops = [];
  }

  /**
   * Draw a line of text with its baseline starting at (x, y).
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {number} fontSize
   */
  text(text, x, y, fontSize) {
    const literal = pdfLiteralString(encodeWinAnsi(text));
    this.ops.push(
      `BT /F1 ${formatNumber(fontSize)} Tf ${formatNumber(x)} ${formatNumber(y)} Td ${literal} Tj ET`
    );
  }

  /**
   * Stroke a rectangle. `dash` draws a dashed outline (on/off length in points).
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {{ lineWidth?: number, dash?: number, gray?: number }} [style]
   */
  rect(x, y, width, height, style = {}) {
    const lineWidth = style.lineWidth ?? 0.5;
    const gray = style.gray ?? 0.6;
    const parts = ['q', `${formatNumber(lineWidth)} w`, `${formatNumber(gray)} G`];
    if (style.dash) {
      parts.push(`[${formatNumber(style.dash)} ${formatNumber(style.dash)}] 0 d`);
    }
    parts.push(
      `${formatNumber(x)} ${formatNumber(y)} ${formatNumber(width)} ${formatNumber(height)} re S`,
      'Q'
    );
    this.ops.push(parts.join(' '));
  }

  /**
   * Run `draw` with the drawing area clipped to a rectangle. Anything the
   * callback draws outside the box is invisible.
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {(page: PdfPage) => void} draw
   */
  clipped(x, y, width, height, draw) {
    this.ops.push(
      `q ${formatNumber(x)} ${formatNumber(y)} ${formatNumber(width)} ${formatNumber(height)} re W n`
    );
    draw(this);
    this.ops.push('Q');
  }

  /** @returns {string} the raw content stream */
  contentStream() {
    return this.ops.join('\n');
  }
}

/**
 * A PDF document: a list of pages plus metadata.
 */
export class PdfDocument {
  /**
   * @param {{ title?: string, producer?: string, creationDate?: Date }} [info]
   */
  constructor(info = {}) {
    this.info = info;
    this.pages = [];
  }

  /**
   * Start a new page.
   * @param {number} width - points
   * @param {number} height - points
   * @returns {PdfPage}
   */
  addPage(width, height) {
    const page = new PdfPage(width, height);
    this.pages.push(page);
    return page;
  }

  /**
   * Serialise the document.
   *
   * Object layout: 1 catalog, 2 page tree, 3 font, 4 info, then one page
   * object and one content stream per page. Offsets in the xref table are
   * byte offsets, so everything is encoded to bytes before measuring.
   *
   * @returns {Uint8Array}
   */
  toBytes() {
    if (this.pages.length === 0) {
      throw new Error('A PDF needs at least one page.');
    }

    const latin1 = (text) => {
      const out = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i += 1) {
        out[i] = text.charCodeAt(i) & 0xff;
      }
      return out;
    };

    const objects = [];
    const firstPageObject = 5;
    const pageObjectNumbers = this.pages.map((_, index) => firstPageObject + index * 2);
    const kids = pageObjectNumbers.map((n) => `${n} 0 R`).join(' ');

    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${this.pages.length} >>`);
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');

    const infoEntries = [];
    const infoString = (value) => pdfLiteralString(encodeWinAnsi(value));
    if (this.info.title) infoEntries.push(`/Title ${infoString(this.info.title)}`);
    infoEntries.push(`/Producer ${infoString(this.info.producer || 'LabelMerge')}`);
    infoEntries.push(`/CreationDate (${pdfDate(this.info.creationDate || new Date())})`);
    objects.push(`<< ${infoEntries.join(' ')} >>`);

    this.pages.forEach((page, index) => {
      const contentObject = pageObjectNumbers[index] + 1;
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${formatNumber(page.width)} ${formatNumber(page.height)}] ` +
          `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`
      );
      const stream = page.contentStream();
      objects.push(`<< /Length ${latin1(stream).length} >>\nstream\n${stream}\nendstream`);
    });

    const chunks = [];
    let offset = 0;
    const write = (text) => {
      const bytes = latin1(text);
      chunks.push(bytes);
      offset += bytes.length;
    };

    write('%PDF-1.4\n%âãÏÓ\n');

    const offsets = [];
    objects.forEach((body, index) => {
      offsets.push(offset);
      write(`${index + 1} 0 obj\n${body}\nendobj\n`);
    });

    const xrefOffset = offset;
    write(`xref\n0 ${objects.length + 1}\n`);
    write('0000000000 65535 f \n');
    offsets.forEach((objOffset) => {
      write(`${String(objOffset).padStart(10, '0')} 00000 n \n`);
    });
    write(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 4 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(total);
    let position = 0;
    for (const chunk of chunks) {
      out.set(chunk, position);
      position += chunk.length;
    }
    return out;
  }
}
