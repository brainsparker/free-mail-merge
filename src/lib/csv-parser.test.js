import test from 'node:test';
import assert from 'node:assert/strict';
import { __csvParserInternals } from './csv-parser.js';

const {
  normalizeHeader,
  normalizeCellValue,
  sanitizeRow,
  hasMeaningfulData
} = __csvParserInternals;

test('normalizeHeader trims and strips UTF-8 BOM', () => {
  assert.equal(normalizeHeader('\uFEFF Name '), 'Name');
  assert.equal(normalizeHeader('  City  '), 'City');
  assert.equal(normalizeHeader(null), '');
});

test('normalizeCellValue safely handles non-string values', () => {
  assert.equal(normalizeCellValue('  90210  '), '90210');
  assert.equal(normalizeCellValue(12345), '12345');
  assert.equal(normalizeCellValue(false), 'false');
  assert.equal(normalizeCellValue(['bad']), '');
  assert.equal(normalizeCellValue(undefined), '');
});

test('sanitizeRow keeps only mapped headers and normalized string values', () => {
  const headers = ['Name', 'ZIP'];
  const row = {
    Name: '  Brian  ',
    ZIP: 94107,
    __parsed_extra: ['extra'],
    Ignored: 'value'
  };

  assert.deepEqual(sanitizeRow(row, headers), {
    Name: 'Brian',
    ZIP: '94107'
  });
});

test('hasMeaningfulData checks only mapped headers', () => {
  const headers = ['Name', 'Address'];
  assert.equal(hasMeaningfulData({ Name: 'Mouse', Address: '' }, headers), true);
  assert.equal(hasMeaningfulData({ Name: '   ', Address: null }, headers), false);
});
