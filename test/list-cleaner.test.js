import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeText,
  normalizeState,
  normalizeZip,
  isUSZip,
  canonicalizeStreetWords,
  addressKey,
  recipientKey,
  findDuplicates,
  countNonUSZips,
  getActiveRows,
  formatCityStateZipLine,
  formatFieldsUSPS,
  buildAddressLines
} from '../src/lib/list-cleaner.js';

const mapping = {
  name: 'Name',
  company: 'Company',
  addressLine1: 'Address',
  addressLine2: 'Address 2',
  city: 'City',
  state: 'State',
  zip: 'ZIP'
};

function row(overrides) {
  return {
    Name: 'John Smith',
    Company: '',
    Address: '123 Main Street',
    'Address 2': '',
    City: 'Springfield',
    State: 'IL',
    ZIP: '62701',
    ...overrides
  };
}

test('normalizeText uppercases, strips punctuation and collapses whitespace', () => {
  assert.equal(normalizeText('  123  Main St.,  Apt #4 '), '123 MAIN ST APT 4');
  assert.equal(normalizeText(null), '');
  assert.equal(normalizeText(undefined), '');
});

test('normalizeState maps full names and keeps valid codes', () => {
  assert.equal(normalizeState('Illinois'), 'IL');
  assert.equal(normalizeState('new york'), 'NY');
  assert.equal(normalizeState('il'), 'IL');
  assert.equal(normalizeState('Washington, D.C.'), 'DC');
  assert.equal(normalizeState('Puerto Rico'), 'PR');
});

test('normalizeState leaves non-US regions alone apart from case', () => {
  assert.equal(normalizeState('Ontario'), 'ONTARIO');
  assert.equal(normalizeState('ON'), 'ON');
});

test('normalizeZip handles 5 and 9 digit forms and leaves international codes', () => {
  assert.equal(normalizeZip('62701'), '62701');
  assert.equal(normalizeZip('627016789'), '62701-6789');
  assert.equal(normalizeZip('62701 6789'), '62701-6789');
  assert.equal(normalizeZip('62701-6789'), '62701-6789');
  assert.equal(normalizeZip('02134'), '02134');
  assert.equal(normalizeZip('SW1A 1AA'), 'SW1A 1AA');
  assert.equal(normalizeZip('m5v 3l9'), 'M5V 3L9');
  assert.equal(normalizeZip(''), '');
});

test('isUSZip recognizes US ZIP forms only', () => {
  assert.equal(isUSZip('62701'), true);
  assert.equal(isUSZip('62701-6789'), true);
  assert.equal(isUSZip('627016789'), true);
  assert.equal(isUSZip('6270'), false);
  assert.equal(isUSZip('SW1A 1AA'), false);
  assert.equal(isUSZip(''), false);
});

test('canonicalizeStreetWords collapses common suffix and directional variants', () => {
  assert.equal(canonicalizeStreetWords('123 MAIN STREET'), '123 MAIN ST');
  assert.equal(canonicalizeStreetWords('456 OAK AVENUE SUITE 100'), '456 OAK AVE STE 100');
  assert.equal(canonicalizeStreetWords('P O BOX 12'), 'PO BOX 12');
  assert.equal(canonicalizeStreetWords('9 NORTH ELM BOULEVARD'), '9 N ELM BLVD');
});

test('addressKey ignores case, punctuation, suffix spelling and ZIP+4', () => {
  const a = addressKey({
    addressLine1: '123 Main Street',
    addressLine2: 'Apt. 4',
    city: 'Springfield',
    state: 'Illinois',
    zip: '62701-1234'
  });
  const b = addressKey({
    addressLine1: '123 MAIN ST',
    addressLine2: 'apt 4',
    city: 'springfield',
    state: 'IL',
    zip: '62701'
  });
  assert.equal(a, b);
});

test('recipientKey distinguishes different names at the same address', () => {
  const base = { addressLine1: '123 Main St', addressLine2: '', city: 'Springfield', state: 'IL', zip: '62701' };
  const john = recipientKey({ ...base, name: 'John Smith', company: '' });
  const jane = recipientKey({ ...base, name: 'Jane Smith', company: '' });
  assert.notEqual(john, jane);
});

test('findDuplicates keeps the first row and reports later copies', () => {
  const rows = [
    row(),
    row({ Name: 'Jane Doe', Address: '456 Oak Avenue', City: 'Chicago', ZIP: '60601' }),
    row({ Name: 'JOHN SMITH', Address: '123 Main St.' }),
    row({ Name: 'john smith', Address: '123 main street', State: 'Illinois', ZIP: '62701-4321' }),
    row({ Name: 'Jane Doe', Address: '456 Oak Ave', City: 'Chicago', ZIP: '60601' })
  ];

  const result = findDuplicates(rows, mapping);

  assert.deepEqual(result.duplicateIndexes, [2, 3, 4]);
  assert.equal(result.groups.length, 2);
  const john = result.groups.find((g) => g.keepIndex === 0);
  assert.deepEqual(john.duplicateIndexes, [2, 3]);
  assert.equal(john.label, 'John Smith, 123 Main Street');
  const jane = result.groups.find((g) => g.keepIndex === 1);
  assert.deepEqual(jane.duplicateIndexes, [4]);
});

test('findDuplicates does not treat household members as duplicates', () => {
  const rows = [row(), row({ Name: 'Mary Smith' })];
  const result = findDuplicates(rows, mapping);
  assert.deepEqual(result.duplicateIndexes, []);
  assert.equal(result.sharedAddressCount, 1);
});

test('findDuplicates treats different companies at one address as distinct', () => {
  const rows = [row({ Company: 'Acme Corp' }), row({ Company: 'Globex' })];
  const result = findDuplicates(rows, mapping);
  assert.deepEqual(result.duplicateIndexes, []);
});

test('findDuplicates ignores rows with neither a name nor an address', () => {
  const rows = [row({ Name: '', Address: '' }), row({ Name: '', Address: '' }), row()];
  const result = findDuplicates(rows, mapping);
  assert.deepEqual(result.duplicateIndexes, []);
});

test('findDuplicates works when optional columns are unmapped', () => {
  const partial = { ...mapping, company: null, addressLine2: null };
  const rows = [row({ Company: 'Acme' }), row({ Company: 'Globex' })];
  const result = findDuplicates(rows, partial);
  assert.deepEqual(result.duplicateIndexes, [1]);
});

test('countNonUSZips counts present ZIPs that are not US ZIPs', () => {
  const rows = [row(), row({ ZIP: 'SW1A 1AA' }), row({ ZIP: '' }), row({ ZIP: '1234' })];
  assert.equal(countNonUSZips(rows, mapping), 2);
  assert.equal(countNonUSZips(rows, { ...mapping, zip: null }), 0);
});

test('getActiveRows drops excluded indexes and returns the same array when nothing is excluded', () => {
  const rows = [row({ Name: 'A' }), row({ Name: 'B' }), row({ Name: 'C' })];
  assert.equal(getActiveRows(rows, []), rows);
  assert.equal(getActiveRows(rows, null), rows);
  assert.deepEqual(getActiveRows(rows, [1]).map((r) => r.Name), ['A', 'C']);
  assert.deepEqual(getActiveRows(rows, new Set([0, 2])).map((r) => r.Name), ['B']);
});

test('formatCityStateZipLine follows USPS spacing for domestic addresses', () => {
  const line = formatCityStateZipLine({ city: 'Springfield', state: 'Illinois', zip: '627011234' }, { usps: true });
  assert.equal(line, 'SPRINGFIELD IL  62701-1234');
});

test('formatCityStateZipLine keeps commas when USPS formatting is off', () => {
  const line = formatCityStateZipLine({ city: 'Springfield', state: 'IL', zip: '62701' });
  assert.equal(line, 'Springfield, IL, 62701');
});

test('formatCityStateZipLine falls back to comma form for non-US rows even in USPS mode', () => {
  const line = formatCityStateZipLine({ city: 'Toronto', state: 'Ontario', zip: 'M5V 3L9' }, { usps: true });
  assert.equal(line, 'TORONTO, ONTARIO, M5V 3L9');
});

test('formatFieldsUSPS uppercases and strips punctuation but keeps hyphens', () => {
  const out = formatFieldsUSPS({
    name: 'Dr. Mary O\'Brien',
    company: 'Acme, Inc.',
    addressLine1: '123-A Main St.',
    addressLine2: 'Apt. #4',
    city: 'St. Louis',
    state: 'Missouri',
    zip: '63101 1234'
  });
  assert.deepEqual(out, {
    name: 'DR MARY OBRIEN',
    company: 'ACME INC',
    addressLine1: '123-A MAIN ST',
    addressLine2: 'APT #4',
    city: 'ST LOUIS',
    state: 'MO',
    zip: '63101-1234'
  });
});

test('buildAddressLines renders the label lines in order and skips blanks', () => {
  const plain = buildAddressLines(row({ Company: 'Acme Corp', 'Address 2': 'Suite 100' }), mapping);
  assert.deepEqual(plain, ['John Smith', 'Acme Corp', '123 Main Street', 'Suite 100', 'Springfield, IL, 62701']);

  const usps = buildAddressLines(row({ Company: 'Acme Corp', 'Address 2': 'Suite 100' }), mapping, { usps: true });
  assert.deepEqual(usps, ['JOHN SMITH', 'ACME CORP', '123 MAIN STREET', 'SUITE 100', 'SPRINGFIELD IL  62701']);
});

test('buildAddressLines returns an empty array when nothing is mapped', () => {
  assert.deepEqual(buildAddressLines({ Name: 'x' }, { name: null, addressLine1: null, city: null, state: null, zip: null }), []);
});
