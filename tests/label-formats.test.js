import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LABEL_FORMATS, DEFAULT_FORMAT, findFormatByCode } from '../src/constants/label-formats.js';
import { parseLength } from '../src/lib/label-generator.js';

// Printers are forgiving to roughly a hundredth of an inch; anything past that
// is visible on the sheet. A4 formats are specified in millimetres.
const TOLERANCE = { in: 0.02, mm: 0.5 };

function num(length) {
  return parseLength(length).value;
}

test('default format exists', () => {
  assert.ok(LABEL_FORMATS[DEFAULT_FORMAT]);
});

for (const [key, format] of Object.entries(LABEL_FORMATS)) {
  test(`${key}: grid count matches labelsPerSheet`, () => {
    assert.equal(format.rows * format.cols, format.labelsPerSheet);
  });

  test(`${key}: every length uses the declared unit`, () => {
    const lengths = [
      format.pageSize.width,
      format.pageSize.height,
      ...Object.values(format.pageMargin),
      ...Object.values(format.labelSize),
      ...Object.values(format.labelMargin)
    ];
    for (const length of lengths) {
      const { value, unit } = parseLength(length);
      if (value === 0) continue; // "0" and "0in" are both fine for a zero length
      assert.equal(unit, format.unit, `${length} should be in ${format.unit}`);
    }
  });

  test(`${key}: columns span the page width exactly`, () => {
    const width =
      format.cols * num(format.labelSize.width) +
      (format.cols - 1) * num(format.labelMargin.right) +
      num(format.pageMargin.left) +
      num(format.pageMargin.right);
    const diff = Math.abs(width - num(format.pageSize.width));
    assert.ok(diff <= TOLERANCE[format.unit], `${key} spans ${width}${format.unit}, page is ${format.pageSize.width}`);
  });

  test(`${key}: rows fit inside the page height`, () => {
    const height =
      format.rows * num(format.labelSize.height) +
      (format.rows - 1) * num(format.labelMargin.bottom) +
      num(format.pageMargin.top) +
      num(format.pageMargin.bottom);
    assert.ok(
      height <= num(format.pageSize.height) + TOLERANCE[format.unit],
      `${key} needs ${height}${format.unit}, page is ${format.pageSize.height}`
    );
  });

  test(`${key}: aliases do not collide with other formats`, () => {
    for (const alias of format.aliases || []) {
      assert.ok(!LABEL_FORMATS[alias], `${alias} is both an alias of ${key} and a format key`);
      assert.equal(findFormatByCode(alias), key);
    }
  });
}

test('findFormatByCode resolves keys, aliases, and messy input', () => {
  assert.equal(findFormatByCode('5160'), '5160');
  assert.equal(findFormatByCode(' 8160 '), '5160');
  assert.equal(findFormatByCode('l7160'), 'L7160');
  assert.equal(findFormatByCode('j8163'), 'L7163');
  assert.equal(findFormatByCode('9999'), null);
  assert.equal(findFormatByCode(''), null);
  assert.equal(findFormatByCode(undefined), null);
});
