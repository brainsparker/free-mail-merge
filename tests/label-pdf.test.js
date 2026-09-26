import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LABEL_FORMATS } from '../src/constants/label-formats.js';
import {
  toPoints,
  computeLabelGrid,
  labelOrigin,
  truncateToWidth,
  fitLines,
  layoutLabels,
  generateLabelPDF,
  generateAlignmentTestPDF,
  PDF_TEXT_DEFAULTS
} from '../src/lib/label-pdf.js';
import { measureText } from '../src/lib/pdf-writer.js';

const latin1 = (bytes) => Array.from(bytes, (b) => String.fromCharCode(b)).join('');

const mapping = {
  name: 'Name',
  company: 'Company',
  addressLine1: 'Address',
  addressLine2: 'Address 2',
  city: 'City',
  state: 'State',
  zip: 'ZIP'
};

function row(name, extra = {}) {
  return {
    Name: name,
    Company: '',
    Address: '123 Main St',
    'Address 2': '',
    City: 'Springfield',
    State: 'IL',
    ZIP: '62701',
    ...extra
  };
}

const rows = (count) => Array.from({ length: count }, (_, i) => row(`Person ${i + 1}`));

test('toPoints converts inches, millimetres, centimetres, points and bare numbers', () => {
  assert.equal(toPoints('1in'), 72);
  assert.equal(toPoints('8.5in'), 612);
  assert.ok(Math.abs(toPoints('25.4mm') - 72) < 1e-9);
  assert.ok(Math.abs(toPoints('2.54cm') - 72) < 1e-9);
  assert.equal(toPoints('36pt'), 36);
  assert.equal(toPoints('0'), 0);
  assert.equal(toPoints(1), 72);
  assert.ok(Math.abs(toPoints(10, 'mm') - 28.3465) < 0.001);
  assert.equal(toPoints('garbage'), 0);
  assert.equal(toPoints(undefined), 0);
});

test('computeLabelGrid resolves the 5160 sheet in points', () => {
  const grid = computeLabelGrid(LABEL_FORMATS['5160']);
  assert.equal(grid.pageWidth, 612);
  assert.equal(grid.pageHeight, 792);
  assert.equal(grid.cols, 3);
  assert.equal(grid.rows, 10);
  assert.equal(grid.labelsPerSheet, 30);
  assert.equal(grid.labelWidth, 189);
  assert.equal(grid.labelHeight, 72);
  assert.equal(grid.marginTop, 36);
  assert.equal(grid.marginLeft, 13.5);
  assert.equal(grid.gapX, 9);
  assert.equal(grid.gapY, 0);
  assert.ok(Math.abs(grid.padding.left - 21.6) < 1e-9);
  assert.equal(grid.padding.top, 9);
  assert.equal(grid.padding.bottom, 0);
  // Columns span the sheet exactly: 3 * 189 + 2 * 9 + 2 * 13.5 = 612
  assert.equal(grid.cols * grid.labelWidth + (grid.cols - 1) * grid.gapX + 2 * grid.marginLeft, 612);
});

test('computeLabelGrid handles millimetre formats', () => {
  const a4 = {
    unit: 'mm',
    cols: 3,
    rows: 7,
    labelsPerSheet: 21,
    pageSize: { width: '210mm', height: '297mm' },
    pageMargin: { top: '15.1mm', right: '7.2mm', bottom: '15.1mm', left: '7.2mm' },
    labelSize: { width: '63.5mm', height: '38.1mm' },
    labelPadding: { top: '3mm', right: '4mm', bottom: '2mm', left: '4mm' },
    labelMargin: { right: '2.5mm', bottom: '0mm' }
  };
  const grid = computeLabelGrid(a4);
  assert.equal(grid.unit, 'mm');
  assert.ok(Math.abs(grid.pageWidth - 595.276) < 0.01);
  assert.ok(Math.abs(grid.pageHeight - 841.89) < 0.01);
  assert.ok(Math.abs(grid.labelWidth - 180) < 0.01);
});

test('labelOrigin walks left to right then top to bottom', () => {
  const grid = computeLabelGrid(LABEL_FORMATS['5160']);
  const first = labelOrigin(grid, 0);
  assert.deepEqual([first.col, first.row], [0, 0]);
  assert.equal(first.x, 13.5);
  assert.equal(first.y, 792 - 36 - 72); // top margin, then one label height down

  const third = labelOrigin(grid, 2);
  assert.deepEqual([third.col, third.row], [2, 0]);
  assert.equal(third.x, 13.5 + 2 * (189 + 9));

  const fourth = labelOrigin(grid, 3);
  assert.deepEqual([fourth.col, fourth.row], [0, 1]);
  assert.equal(fourth.y, first.y - 72);

  const last = labelOrigin(grid, 29);
  assert.deepEqual([last.col, last.row], [2, 9]);
  assert.equal(last.y, 792 - 36 - 10 * 72); // bottom of last row lands on the bottom margin
});

test('labelOrigin applies nudges: +X right, +Y down', () => {
  const grid = computeLabelGrid(LABEL_FORMATS['5160']);
  const base = labelOrigin(grid, 0);
  const nudged = labelOrigin(grid, 0, { offsetX: 7.2, offsetY: 3.6 });
  assert.equal(nudged.x, base.x + 7.2);
  assert.equal(nudged.y, base.y - 3.6);
});

test('truncateToWidth adds an ellipsis and respects the width', () => {
  const text = 'A very long company name that cannot fit';
  const out = truncateToWidth(text, 60, 10);
  assert.ok(out.endsWith('…'));
  assert.ok(out.length < text.length);
  assert.ok(measureText(out, 10) <= 60);
  assert.equal(truncateToWidth('short', 500, 10), 'short');
});

test('fitLines keeps the default size when everything fits', () => {
  const fit = fitLines(['John Smith', '123 Main St', 'Springfield, IL, 62701'], 145.8, 63);
  assert.equal(fit.fontSize, PDF_TEXT_DEFAULTS.fontSize);
  assert.equal(fit.lines.length, 3);
  assert.ok(Math.abs(fit.lineHeight - (12 + 3.6)) < 1e-9);
});

test('fitLines shrinks for wide lines and stops at the minimum size', () => {
  const wide = 'Constantinople Metropolitan Waterworks Authority';
  const fit = fitLines([wide], 145.8, 63);
  assert.ok(fit.fontSize < PDF_TEXT_DEFAULTS.fontSize);
  assert.ok(fit.fontSize >= PDF_TEXT_DEFAULTS.minFontSize);
  assert.ok(measureText(wide, fit.fontSize) <= 145.8);
  assert.equal(fit.lines[0], wide);

  const absurd = 'W'.repeat(80);
  const clipped = fitLines([absurd], 145.8, 63);
  assert.equal(clipped.fontSize, PDF_TEXT_DEFAULTS.minFontSize);
  assert.ok(clipped.lines[0].endsWith('…'));
  assert.ok(measureText(clipped.lines[0], clipped.fontSize) <= 145.8);
});

test('fitLines shrinks for too many lines and drops what cannot fit', () => {
  const many = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const fit = fitLines(many, 145.8, 63);
  assert.equal(fit.fontSize, PDF_TEXT_DEFAULTS.minFontSize);
  assert.ok(fit.lines.length < many.length);
  assert.ok(fit.lines.length * fit.lineHeight - PDF_TEXT_DEFAULTS.lineGap <= 63 + 1e-9);
});

test('layoutLabels paginates, skips empty rows and fills positions in order', () => {
  const data = [...rows(31), { Name: '', Company: '', Address: '', 'Address 2': '', City: '', State: '', ZIP: '' }];
  const layout = layoutLabels(data, mapping, '5160');
  assert.equal(layout.labelCount, 31);
  assert.equal(layout.pages.length, 2);
  assert.equal(layout.pages[0].labels.length, 30);
  assert.equal(layout.pages[1].labels.length, 1);
  assert.deepEqual(
    layout.pages[0].labels.map((l) => l.position),
    Array.from({ length: 30 }, (_, i) => i)
  );
  assert.deepEqual(layout.pages[0].labels[0].lines, ['Person 1', '123 Main St', 'Springfield, IL, 62701']);
  assert.equal(layout.pages[1].labels[0].position, 0);
});

test('layoutLabels honours startAt so a partly used sheet can be finished', () => {
  const layout = layoutLabels(rows(30), mapping, '5160', { startAt: 5 });
  assert.equal(layout.pages.length, 2);
  assert.equal(layout.pages[0].labels[0].position, 4);
  assert.equal(layout.pages[0].labels.length, 26);
  assert.equal(layout.pages[1].labels.length, 4);
  // startAt is clamped to the sheet
  assert.equal(layoutLabels(rows(1), mapping, '5160', { startAt: 99 }).pages[0].labels[0].position, 29);
  assert.equal(layoutLabels(rows(1), mapping, '5160', { startAt: -3 }).pages[0].labels[0].position, 0);
});

test('layoutLabels converts offsets from the format unit to points', () => {
  const base = layoutLabels(rows(1), mapping, '5160').pages[0].labels[0];
  const nudged = layoutLabels(rows(1), mapping, '5160', { offsetX: 0.1, offsetY: -0.05 }).pages[0].labels[0];
  assert.ok(Math.abs(nudged.x - (base.x + 7.2)) < 1e-9);
  assert.ok(Math.abs(nudged.y - (base.y + 3.6)) < 1e-9);
});

test('layoutLabels rejects unknown formats and always yields one page', () => {
  assert.throws(() => layoutLabels(rows(1), mapping, 'nope'), /Invalid format key/);
  const empty = layoutLabels([], mapping, '5160');
  assert.equal(empty.labelCount, 0);
  assert.equal(empty.pages.length, 1);
});

test('generateLabelPDF produces a PDF with one page per sheet and the addresses in it', () => {
  const bytes = generateLabelPDF(rows(31), mapping, '5163', { creationDate: new Date(Date.UTC(2026, 8, 26)) });
  const text = latin1(bytes);
  assert.ok(text.startsWith('%PDF-1.4'));
  assert.match(text, /\/Count 4/); // 31 labels on 10-up sheets
  assert.match(text, /\/Title \(Labels - Avery 5163\)/);
  assert.match(text, /\(Person 1\) Tj/);
  assert.match(text, /\(Person 31\) Tj/);
  assert.match(text, /\(Springfield, IL, 62701\) Tj/);
  assert.doesNotMatch(text, /re S/); // no outlines unless asked
  // Each label is clipped to its own box
  assert.equal((text.match(/re W n/g) || []).length, 31);
});

test('generateLabelPDF draws outlines when requested', () => {
  const text = latin1(generateLabelPDF(rows(1), mapping, '5160', { outlines: true }));
  assert.equal((text.match(/re S/g) || []).length, 30);
});

test('generateLabelPDF places the first 5160 label text inside the first label box', () => {
  const text = latin1(generateLabelPDF([row('Ada Lovelace')], mapping, '5160'));
  // label box: x 13.5, top 756, left padding 21.6, top padding 9, baseline 0.86 * 10 below
  const expectedX = 13.5 + 21.6;
  const expectedY = 756 - 9 - 8.6;
  assert.match(text, new RegExp(`BT /F1 10 Tf ${expectedX} ${expectedY} Td \\(Ada Lovelace\\) Tj ET`));
});

test('generateLabelPDF encodes non-ASCII names', () => {
  const text = latin1(generateLabelPDF([row('José Muñoz')], mapping, '5160'));
  assert.match(text, /\(Jos\\351 Mu\\361oz\) Tj/);
});

test('generateAlignmentTestPDF draws every position with its number', () => {
  const text = latin1(generateAlignmentTestPDF('5167'));
  assert.match(text, /\/Count 1/);
  assert.match(text, /\/Title \(Alignment test - Avery 5167\)/);
  assert.equal((text.match(/re S/g) || []).length, 80);
  assert.match(text, /\(Avery 5167 #1\) Tj/);
  assert.match(text, /\(Avery 5167 #80\) Tj/);
  assert.throws(() => generateAlignmentTestPDF('nope'), /Invalid format key/);
});
