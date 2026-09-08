import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LABEL_FORMATS } from '../src/constants/label-formats.js';
import {
  escapeHtml,
  parseLength,
  normalizePrintSettings,
  paginateLabels,
  countSheets,
  countLabels,
  generateCSS,
  generatePrintableHTML,
  generateAlignmentTestHTML,
  DEFAULT_PRINT_SETTINGS
} from '../src/lib/label-generator.js';

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
    Address: '1 Main St',
    'Address 2': '',
    City: 'Springfield',
    State: 'IL',
    ZIP: '62701',
    ...extra
  };
}

function rows(count) {
  return Array.from({ length: count }, (_, i) => row(`Person ${i + 1}`));
}

function countMatches(html, pattern) {
  return (html.match(pattern) || []).length;
}

test('escapeHtml neutralises markup and quotes without a DOM', () => {
  assert.equal(escapeHtml('<b>"O\'Brien" & Sons</b>'), '&lt;b&gt;&quot;O&#39;Brien&quot; &amp; Sons&lt;/b&gt;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(42), '42');
});

test('parseLength splits value and unit', () => {
  assert.deepEqual(parseLength('2.625in'), { value: 2.625, unit: 'in' });
  assert.deepEqual(parseLength('38.1mm'), { value: 38.1, unit: 'mm' });
  assert.deepEqual(parseLength('-0.1in'), { value: -0.1, unit: 'in' });
  assert.deepEqual(parseLength('0'), { value: 0, unit: '' });
  assert.deepEqual(parseLength(undefined), { value: 0, unit: '' });
});

test('normalizePrintSettings fills defaults and clamps to the format', () => {
  const format = LABEL_FORMATS['5160'];
  assert.deepEqual(normalizePrintSettings(undefined, format), DEFAULT_PRINT_SETTINGS);

  const clamped = normalizePrintSettings({ startAt: 99, offsetX: 3, offsetY: -3 }, format);
  assert.equal(clamped.startAt, 30);
  assert.equal(clamped.offsetX, 0.5);
  assert.equal(clamped.offsetY, -0.5);

  const low = normalizePrintSettings({ startAt: 0 }, format);
  assert.equal(low.startAt, 1);

  const strings = normalizePrintSettings({ startAt: '7', offsetX: '0.04', offsetY: 'abc' }, format);
  assert.equal(strings.startAt, 7);
  assert.equal(strings.offsetX, 0.04);
  assert.equal(strings.offsetY, 0);

  const a4 = normalizePrintSettings({ offsetX: 20 }, LABEL_FORMATS['L7160']);
  assert.equal(a4.offsetX, 12);
});

test('paginateLabels fills sheets and pads the tail with empty slots', () => {
  const sheets = paginateLabels(['a', 'b', 'c', 'd', 'e'], 3);
  assert.deepEqual(sheets, [
    ['a', 'b', 'c'],
    ['d', 'e', null]
  ]);
});

test('paginateLabels skips used positions on the first sheet only', () => {
  const sheets = paginateLabels(['a', 'b', 'c', 'd'], 3, 3);
  assert.deepEqual(sheets, [
    [null, null, 'a'],
    ['b', 'c', 'd']
  ]);
});

test('paginateLabels clamps startAt into range and handles empty input', () => {
  assert.deepEqual(paginateLabels(['a'], 3, 50), [[null, null, 'a']]);
  assert.deepEqual(paginateLabels(['a'], 3, -4), [['a', null, null]]);
  assert.deepEqual(paginateLabels([], 3, 2), []);
});

test('countSheets accounts for the starting position', () => {
  assert.equal(countSheets(30, 30), 1);
  assert.equal(countSheets(30, 30, 2), 2);
  assert.equal(countSheets(31, 30), 2);
  assert.equal(countSheets(0, 30, 5), 0);
});

test('countLabels ignores rows with no printable lines', () => {
  const data = [row('A'), { Name: '', Address: '', City: '', State: '', ZIP: '' }, row('B')];
  assert.equal(countLabels(data, mapping), 2);
});

test('generateCSS uses a grid per sheet and applies offsets in the format unit', () => {
  const css = generateCSS(LABEL_FORMATS['5163'], { ...DEFAULT_PRINT_SETTINGS, offsetX: 0.06, offsetY: -0.04 });
  assert.match(css, /grid-template-columns: repeat\(2, 4in\)/);
  assert.match(css, /grid-auto-rows: 2in/);
  assert.match(css, /column-gap: 0\.1875in/);
  assert.match(css, /left: 0\.06in/);
  assert.match(css, /top: -0\.04in/);
  assert.match(css, /@page \{\s*size: 8\.5in 11in;/);
  assert.match(css, /\.label-index \{\s*display: none;/);

  const a4 = generateCSS(LABEL_FORMATS['L7160'], { ...DEFAULT_PRINT_SETTINGS, offsetX: 1.5 });
  assert.match(a4, /left: 1\.5mm/);
  assert.match(a4, /size: 210mm 297mm/);
});

test('generatePrintableHTML renders one sheet div per physical sheet', () => {
  const html = generatePrintableHTML(rows(31), mapping, '5160');
  assert.equal(countMatches(html, /class="sheet"/g), 2);
  assert.equal(countMatches(html, /class="label"/g), 31);
  assert.equal(countMatches(html, /class="label label-empty"/g), 29);
  assert.match(html, /Person 1</);
  assert.match(html, /Springfield, IL, 62701/);
});

test('generatePrintableHTML honours startAt by leaving leading positions blank', () => {
  const html = generatePrintableHTML(rows(2), mapping, '5160', { startAt: 5 });
  const sheet = html.slice(html.indexOf('class="sheet"'));
  const firstFilled = sheet.indexOf('class="label" data-position="5"');
  assert.ok(firstFilled > -1, 'label 5 should be the first printed label');
  for (let position = 1; position <= 4; position++) {
    assert.ok(sheet.includes(`class="label label-empty" data-position="${position}"`), `position ${position} should be empty`);
  }
});

test('generatePrintableHTML escapes CSV content', () => {
  const html = generatePrintableHTML([row('<script>alert(1)</script>')], mapping, '5160');
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('generatePrintableHTML rejects unknown formats', () => {
  assert.throws(() => generatePrintableHTML(rows(1), mapping, 'nope'), /Invalid format key/);
});

test('generatePrintableHTML skips rows with no address lines', () => {
  const data = [row('A'), { Name: '', Address: '', City: '', State: '', ZIP: '' }, row('B')];
  const html = generatePrintableHTML(data, mapping, '5163');
  assert.equal(countMatches(html, /class="label" data-position/g), 2);
});

test('generateAlignmentTestHTML draws every position with an outline and the offset in use', () => {
  const format = LABEL_FORMATS['5167'];
  const html = generateAlignmentTestHTML('5167', { offsetX: -0.02, offsetY: 0.1, startAt: 40 });
  assert.equal(countMatches(html, /class="sheet"/g), 1);
  assert.equal(countMatches(html, /data-position="/g), format.labelsPerSheet);
  assert.equal(countMatches(html, /label-empty/g), 0, 'startAt must not blank positions on the test page');
  assert.match(html, /outline: 1px dashed/);
  assert.match(html, /Avery 5167 alignment test/);
  assert.match(html, /x -0\.02in, y \+0\.1in/);
  assert.match(html, /left: -0\.02in/);
});

test('every format renders a full sheet with the right number of cells', () => {
  for (const [key, format] of Object.entries(LABEL_FORMATS)) {
    const html = generatePrintableHTML(rows(format.labelsPerSheet), mapping, key);
    assert.equal(countMatches(html, /class="sheet"/g), 1, key);
    assert.equal(countMatches(html, /data-position="/g), format.labelsPerSheet, key);
    assert.equal(countMatches(html, /label-empty/g), 0, key);
  }
});
