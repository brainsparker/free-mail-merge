import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PdfDocument,
  encodeWinAnsi,
  measureText,
  pdfLiteralString,
  formatNumber,
  pdfDate,
  POINTS_PER_INCH,
  POINTS_PER_MM
} from '../src/lib/pdf-writer.js';

const latin1 = (bytes) => Array.from(bytes, (b) => String.fromCharCode(b)).join('');

test('unit constants', () => {
  assert.equal(POINTS_PER_INCH, 72);
  assert.ok(Math.abs(POINTS_PER_MM - 2.8346) < 0.001);
});

test('encodeWinAnsi maps ASCII and Latin-1 directly', () => {
  assert.deepEqual(encodeWinAnsi('Ab 1'), [0x41, 0x62, 0x20, 0x31]);
  assert.deepEqual(encodeWinAnsi('é'), [0xe9]);
  assert.deepEqual(encodeWinAnsi('ñ'), [0xf1]);
});

test('encodeWinAnsi maps the 0x80-0x9F specials', () => {
  assert.deepEqual(encodeWinAnsi('€'), [0x80]);
  assert.deepEqual(encodeWinAnsi('…'), [0x85]);
  assert.deepEqual(encodeWinAnsi('’'), [0x92]);
  assert.deepEqual(encodeWinAnsi('–'), [0x96]);
});

test('encodeWinAnsi falls back to base letters, then to "?"', () => {
  // Polish and Vietnamese letters decompose to Latin base letters
  assert.deepEqual(encodeWinAnsi('ą'), [0x61]); // a + ogonek -> a
  assert.deepEqual(encodeWinAnsi('ệ'), [0x65]); // e + circumflex + dot below -> e
  // Letters with no combining mark use the fallback table
  assert.deepEqual(encodeWinAnsi('Łukasik'), encodeWinAnsi('Lukasik'));
  assert.deepEqual(encodeWinAnsi('Đ'), [0x44]);
  assert.deepEqual(encodeWinAnsi('ĳ'), [0x69, 0x6a]);
  // Anything else becomes "?"
  assert.deepEqual(encodeWinAnsi('漢'), [0x3f]);
  assert.equal(measureText('ł', 10), measureText('l', 10));
  assert.equal(measureText('漢', 10), measureText('?', 10));
  assert.deepEqual(encodeWinAnsi('a\tb'), [0x61, 0x20, 0x62]);
  assert.deepEqual(encodeWinAnsi(null), []);
});

test('measureText uses Helvetica metrics', () => {
  // "iii" is narrow (222 each), "WWW" is wide (944 each)
  assert.ok(Math.abs(measureText('iii', 10) - 6.66) < 0.001);
  assert.ok(Math.abs(measureText('WWW', 10) - 28.32) < 0.001);
  // space is 278
  assert.ok(Math.abs(measureText(' ', 1000) - 278) < 0.001);
  // accented letters take the base letter width
  assert.equal(measureText('é', 10), measureText('e', 10));
  // scales linearly with size
  assert.ok(Math.abs(measureText('Main St', 20) - 2 * measureText('Main St', 10)) < 1e-9);
  assert.equal(measureText('', 10), 0);
});

test('pdfLiteralString escapes delimiters and non-ASCII bytes', () => {
  assert.equal(pdfLiteralString(encodeWinAnsi('a(b)c\\d')), '(a\\(b\\)c\\\\d)');
  assert.equal(pdfLiteralString(encodeWinAnsi('é')), '(\\351)');
  assert.equal(pdfLiteralString([]), '()');
});

test('formatNumber is compact and never exponent notation', () => {
  assert.equal(formatNumber(72), '72');
  assert.equal(formatNumber(2.625 * 72), '189');
  assert.equal(formatNumber(0.1 + 0.2), '0.3');
  assert.equal(formatNumber(-13.5), '-13.5');
  assert.equal(formatNumber(1e-7), '0');
  assert.equal(formatNumber(NaN), '0');
});

test('pdfDate formats as D:YYYYMMDDHHmmSSZ', () => {
  assert.equal(pdfDate(new Date(Date.UTC(2026, 8, 26, 13, 4, 5))), 'D:20260926130405Z');
});

test('PdfDocument refuses to serialise with no pages', () => {
  assert.throws(() => new PdfDocument().toBytes(), /at least one page/);
});

test('PdfDocument writes a well-formed file with a byte-accurate xref', () => {
  const doc = new PdfDocument({ title: 'Test (1)', creationDate: new Date(Date.UTC(2026, 0, 1)) });
  const page = doc.addPage(612, 792);
  page.text('Hello, wörld', 72, 700, 10);
  page.rect(10, 10, 100, 50, { dash: 2 });
  const page2 = doc.addPage(595.28, 841.89);
  page2.clipped(0, 0, 100, 100, (p) => p.text('clipped', 5, 5, 8));

  const bytes = doc.toBytes();
  assert.ok(bytes instanceof Uint8Array);
  const text = latin1(bytes);

  assert.ok(text.startsWith('%PDF-1.4\n'));
  assert.ok(text.endsWith('%%EOF\n'));
  assert.match(text, /\/Type \/Catalog \/Pages 2 0 R/);
  assert.match(text, /\/Type \/Pages \/Kids \[5 0 R 7 0 R\] \/Count 2/);
  assert.match(text, /\/BaseFont \/Helvetica \/Encoding \/WinAnsiEncoding/);
  assert.match(text, /\/Title \(Test \\\(1\\\)\)/);
  assert.match(text, /\/CreationDate \(D:20260101000000Z\)/);
  assert.match(text, /\/MediaBox \[0 0 612 792\]/);
  assert.match(text, /\/MediaBox \[0 0 595.28 841.89\]/);
  assert.match(text, /BT \/F1 10 Tf 72 700 Td \(Hello, w\\366rld\) Tj ET/);
  assert.match(text, /\[2 2\] 0 d 10 10 100 50 re S/);
  assert.match(text, /q 0 0 100 100 re W n\nBT[^\n]*\(clipped\) Tj ET\nQ/);

  // Every xref entry must point at "N 0 obj"
  const startxref = Number(text.match(/startxref\n(\d+)\n%%EOF/)[1]);
  assert.equal(text.slice(startxref, startxref + 4), 'xref');
  const size = Number(text.match(/\/Size (\d+)/)[1]);
  assert.equal(size, 9); // 4 fixed objects + 2 pages x (page + content)
  const entries = text.slice(startxref).match(/^\d{10} \d{5} n $/gm);
  assert.equal(entries.length, size - 1);
  entries.forEach((entry, index) => {
    const offset = Number(entry.slice(0, 10));
    assert.ok(text.slice(offset).startsWith(`${index + 1} 0 obj\n`), `object ${index + 1} offset`);
  });

  // Stream lengths must match the bytes between "stream" and "endstream"
  const streamPattern = /<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g;
  let match;
  let streams = 0;
  while ((match = streamPattern.exec(text)) !== null) {
    assert.equal(Number(match[1]), match[2].length);
    streams += 1;
  }
  assert.equal(streams, 2);
});

test('PdfDocument output is deterministic for a fixed creation date', () => {
  const build = () => {
    const doc = new PdfDocument({ creationDate: new Date(Date.UTC(2026, 5, 1)) });
    doc.addPage(612, 792).text('same', 10, 10, 10);
    return latin1(doc.toBytes());
  };
  assert.equal(build(), build());
});
