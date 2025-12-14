/**
 * Avery Label Format Specifications
 * All measurements are in inches for print accuracy
 */

export const LABEL_FORMATS = {
  '5160': {
    name: 'Avery 5160',
    description: '1" × 2⅝" - Address Labels',
    labelsPerSheet: 30,
    rows: 10,
    cols: 3,
    pageSize: { width: '8.5in', height: '11in' },
    pageMargin: { top: '0.5in', right: '0.1875in', bottom: '0in', left: '0.1875in' },
    labelSize: { width: '2.625in', height: '1in' },
    labelPadding: { top: '0.125in', right: '0.3in', bottom: '0', left: '0.3in' },
    labelMargin: { right: '0.125in', bottom: '0in' }
  },
  '5163': {
    name: 'Avery 5163',
    description: '2" × 4" - Shipping Labels',
    labelsPerSheet: 10,
    rows: 5,
    cols: 2,
    pageSize: { width: '8.5in', height: '11in' },
    pageMargin: { top: '0.5in', right: '0.15625in', bottom: '0.5in', left: '0.15625in' },
    labelSize: { width: '4in', height: '2in' },
    labelPadding: { top: '0.15in', right: '0.15in', bottom: '0.15in', left: '0.15in' },
    labelMargin: { right: '0.15625in', bottom: '0in' }
  },
  '5164': {
    name: 'Avery 5164',
    description: '3⅓" × 4" - Shipping Labels',
    labelsPerSheet: 6,
    rows: 3,
    cols: 2,
    pageSize: { width: '8.5in', height: '11in' },
    pageMargin: { top: '0.5in', right: '0.15625in', bottom: '0.5in', left: '0.15625in' },
    labelSize: { width: '4in', height: '3.33in' },
    labelPadding: { top: '0.2in', right: '0.2in', bottom: '0.2in', left: '0.2in' },
    labelMargin: { right: '0.15625in', bottom: '0in' }
  },
  '5167': {
    name: 'Avery 5167',
    description: '½" × 1¾" - Return Address Labels',
    labelsPerSheet: 80,
    rows: 20,
    cols: 4,
    pageSize: { width: '8.5in', height: '11in' },
    pageMargin: { top: '0.5in', right: '0.28125in', bottom: '0.5in', left: '0.28125in' },
    labelSize: { width: '1.75in', height: '0.5in' },
    labelPadding: { top: '0.05in', right: '0.1in', bottom: '0.05in', left: '0.1in' },
    labelMargin: { right: '0.125in', bottom: '0in' }
  }
};

export const DEFAULT_FORMAT = '5160';
