/**
 * List cleanup utilities: duplicate detection and USPS-style address formatting.
 *
 * Everything here is pure and synchronous so it can run in the browser on
 * up to 10,000 rows without blocking, and be unit tested in Node with no DOM.
 *
 * USPS conventions follow Publication 28 (Postal Addressing Standards) and the
 * current Quick Service Guide 602: uppercase, no punctuation, two-letter state
 * codes, one space between city and state, two spaces before the ZIP Code,
 * ZIP+4 written with a hyphen.
 */

/**
 * Full US state, district, territory and military "state" names mapped to
 * their two-letter USPS abbreviations.
 */
export const US_STATE_ABBREVIATIONS = {
  ALABAMA: 'AL',
  ALASKA: 'AK',
  ARIZONA: 'AZ',
  ARKANSAS: 'AR',
  CALIFORNIA: 'CA',
  COLORADO: 'CO',
  CONNECTICUT: 'CT',
  DELAWARE: 'DE',
  'DISTRICT OF COLUMBIA': 'DC',
  'WASHINGTON DC': 'DC',
  'WASHINGTON D C': 'DC',
  FLORIDA: 'FL',
  GEORGIA: 'GA',
  HAWAII: 'HI',
  IDAHO: 'ID',
  ILLINOIS: 'IL',
  INDIANA: 'IN',
  IOWA: 'IA',
  KANSAS: 'KS',
  KENTUCKY: 'KY',
  LOUISIANA: 'LA',
  MAINE: 'ME',
  MARYLAND: 'MD',
  MASSACHUSETTS: 'MA',
  MICHIGAN: 'MI',
  MINNESOTA: 'MN',
  MISSISSIPPI: 'MS',
  MISSOURI: 'MO',
  MONTANA: 'MT',
  NEBRASKA: 'NE',
  NEVADA: 'NV',
  'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM',
  'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND',
  OHIO: 'OH',
  OKLAHOMA: 'OK',
  OREGON: 'OR',
  PENNSYLVANIA: 'PA',
  'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD',
  TENNESSEE: 'TN',
  TEXAS: 'TX',
  UTAH: 'UT',
  VERMONT: 'VT',
  VIRGINIA: 'VA',
  WASHINGTON: 'WA',
  'WEST VIRGINIA': 'WV',
  WISCONSIN: 'WI',
  WYOMING: 'WY',
  'AMERICAN SAMOA': 'AS',
  GUAM: 'GU',
  'NORTHERN MARIANA ISLANDS': 'MP',
  'PUERTO RICO': 'PR',
  'VIRGIN ISLANDS': 'VI',
  'US VIRGIN ISLANDS': 'VI',
  'U S VIRGIN ISLANDS': 'VI',
  'ARMED FORCES AMERICAS': 'AA',
  'ARMED FORCES EUROPE': 'AE',
  'ARMED FORCES PACIFIC': 'AP'
};

const STATE_CODES = new Set(Object.values(US_STATE_ABBREVIATIONS));

/**
 * Common street suffix and unit designator variants, used only when building
 * duplicate-detection keys so that "123 Main Street" and "123 Main St." match.
 * Values are the USPS standard abbreviations from Publication 28 Appendix C.
 */
const STREET_WORD_ALIASES = {
  STREET: 'ST',
  STR: 'ST',
  AVENUE: 'AVE',
  AV: 'AVE',
  AVEN: 'AVE',
  BOULEVARD: 'BLVD',
  BOUL: 'BLVD',
  BLV: 'BLVD',
  ROAD: 'RD',
  DRIVE: 'DR',
  DRV: 'DR',
  LANE: 'LN',
  COURT: 'CT',
  CRT: 'CT',
  CIRCLE: 'CIR',
  CRCL: 'CIR',
  PLACE: 'PL',
  TERRACE: 'TER',
  TERR: 'TER',
  TRAIL: 'TRL',
  TRL: 'TRL',
  PARKWAY: 'PKWY',
  PKY: 'PKWY',
  HIGHWAY: 'HWY',
  WAY: 'WAY',
  SQUARE: 'SQ',
  LOOP: 'LOOP',
  EXPRESSWAY: 'EXPY',
  TURNPIKE: 'TPKE',
  NORTH: 'N',
  SOUTH: 'S',
  EAST: 'E',
  WEST: 'W',
  NORTHEAST: 'NE',
  NORTHWEST: 'NW',
  SOUTHEAST: 'SE',
  SOUTHWEST: 'SW',
  APARTMENT: 'APT',
  SUITE: 'STE',
  BUILDING: 'BLDG',
  FLOOR: 'FL',
  UNIT: 'UNIT',
  ROOM: 'RM',
  DEPARTMENT: 'DEPT',
  'P O BOX': 'PO BOX',
  'POST OFFICE BOX': 'PO BOX',
  POB: 'PO BOX'
};

/**
 * Uppercase, strip punctuation, collapse whitespace.
 * @param {*} value
 * @returns {string}
 */
export function normalizeText(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[.,;:'"`#()\[\]{}]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize a state value to a two-letter USPS code when it is recognizably
 * a US state. Unknown values (Canadian provinces, UK counties) are returned
 * trimmed and uppercased but otherwise untouched.
 * @param {*} value
 * @returns {string}
 */
export function normalizeState(value) {
  const cleaned = normalizeText(value);
  if (!cleaned) return '';
  if (cleaned.length === 2 && STATE_CODES.has(cleaned)) return cleaned;
  return US_STATE_ABBREVIATIONS[cleaned] || cleaned;
}

/**
 * Normalize a ZIP Code. Five digits stay five digits, nine digits become
 * ZIP+4 with a hyphen, anything else (international postal codes) is only
 * trimmed and uppercased.
 * @param {*} value
 * @returns {string}
 */
export function normalizeZip(value) {
  const raw = String(value ?? '').trim().toUpperCase();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 5 && /^[\d\s-]+$/.test(raw)) return digits;
  if (digits.length === 9 && /^[\d\s-]+$/.test(raw)) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return raw.replace(/\s+/g, ' ');
}

/**
 * True when the value is a 5-digit or 9-digit US ZIP Code in any common
 * punctuation (12345, 12345-6789, 12345 6789, 123456789).
 * @param {*} value
 * @returns {boolean}
 */
export function isUSZip(value) {
  const raw = String(value ?? '').trim();
  return /^\d{5}(?:[-\s]?\d{4})?$/.test(raw);
}

/**
 * Apply standard street-word abbreviations to a normalized address string.
 * Used for duplicate keys so spelling variants collapse together.
 * @param {string} normalized - Output of normalizeText
 * @returns {string}
 */
export function canonicalizeStreetWords(normalized) {
  let text = normalized;
  // Multi-word aliases first so "P O BOX" is handled before single tokens.
  Object.entries(STREET_WORD_ALIASES)
    .filter(([alias]) => alias.includes(' '))
    .forEach(([alias, standard]) => {
      text = text.replace(new RegExp(`\\b${alias}\\b`, 'g'), standard);
    });
  return text
    .split(' ')
    .map((word) => STREET_WORD_ALIASES[word] || word)
    .join(' ');
}

/**
 * Pull the mapped label fields out of a CSV row.
 * @param {Object} row - CSV row keyed by header
 * @param {Object} columnMapping - Field key to header name (or null)
 * @returns {{name: string, company: string, addressLine1: string, addressLine2: string, city: string, state: string, zip: string}}
 */
export function extractFields(row, columnMapping) {
  const read = (key) => {
    const column = columnMapping[key];
    if (!column) return '';
    const value = row[column];
    return value === undefined || value === null ? '' : String(value);
  };
  return {
    name: read('name'),
    company: read('company'),
    addressLine1: read('addressLine1'),
    addressLine2: read('addressLine2'),
    city: read('city'),
    state: read('state'),
    zip: read('zip')
  };
}

/**
 * Build a key that identifies a delivery point (street, unit, city, state,
 * 5-digit ZIP). Two rows with the same address key share a mailbox.
 * @param {ReturnType<typeof extractFields>} fields
 * @returns {string}
 */
export function addressKey(fields) {
  const line1 = canonicalizeStreetWords(normalizeText(fields.addressLine1));
  const line2 = canonicalizeStreetWords(normalizeText(fields.addressLine2));
  const city = normalizeText(fields.city);
  const state = normalizeState(fields.state);
  const zip = normalizeZip(fields.zip).slice(0, 5);
  return [line1, line2, city, state, zip].join('|');
}

/**
 * Build a key that identifies a recipient at a delivery point. Two rows with
 * the same recipient key would print identical labels (ignoring case,
 * punctuation and street abbreviations), so the second one is a duplicate.
 * @param {ReturnType<typeof extractFields>} fields
 * @returns {string}
 */
export function recipientKey(fields) {
  return `${normalizeText(fields.name)}|${normalizeText(fields.company)}|${addressKey(fields)}`;
}

/**
 * Find duplicate rows. The first occurrence of each recipient is kept, later
 * occurrences are reported as duplicates. Rows that share an address but
 * have different names (two people in one household) are counted separately
 * and are never treated as duplicates.
 *
 * @param {Object[]} rows - CSV rows
 * @param {Object} columnMapping - Field key to header name
 * @returns {{
 *   duplicateIndexes: number[],
 *   groups: Array<{ keepIndex: number, duplicateIndexes: number[], label: string }>,
 *   sharedAddressCount: number
 * }}
 */
export function findDuplicates(rows, columnMapping) {
  const firstSeen = new Map();
  const groupsByKey = new Map();
  const addressOwners = new Map();
  let sharedAddressCount = 0;

  rows.forEach((row, index) => {
    const fields = extractFields(row, columnMapping);
    const hasAddress = normalizeText(fields.addressLine1) !== '';
    if (!hasAddress && normalizeText(fields.name) === '') {
      return;
    }

    const key = recipientKey(fields);
    if (firstSeen.has(key)) {
      const keepIndex = firstSeen.get(key);
      let group = groupsByKey.get(key);
      if (!group) {
        const keptFields = extractFields(rows[keepIndex], columnMapping);
        group = {
          keepIndex,
          duplicateIndexes: [],
          label: [keptFields.name, keptFields.addressLine1].filter(Boolean).join(', ')
        };
        groupsByKey.set(key, group);
      }
      group.duplicateIndexes.push(index);
      return;
    }
    firstSeen.set(key, index);

    if (hasAddress) {
      const address = addressKey(fields);
      if (addressOwners.has(address)) {
        sharedAddressCount += 1;
      } else {
        addressOwners.set(address, index);
      }
    }
  });

  const groups = Array.from(groupsByKey.values());
  const duplicateIndexes = groups
    .flatMap((group) => group.duplicateIndexes)
    .sort((a, b) => a - b);

  return { duplicateIndexes, groups, sharedAddressCount };
}

/**
 * Count rows whose mapped ZIP is present but not a US ZIP Code. These are
 * fine for international mail, so callers should treat this as information,
 * not an error.
 * @param {Object[]} rows
 * @param {Object} columnMapping
 * @returns {number}
 */
export function countNonUSZips(rows, columnMapping) {
  if (!columnMapping.zip) return 0;
  return rows.reduce((count, row) => {
    const zip = String(row[columnMapping.zip] ?? '').trim();
    if (zip && !isUSZip(zip)) return count + 1;
    return count;
  }, 0);
}

/**
 * Remove the rows at the given indexes.
 * @param {Object[]} rows
 * @param {number[]|Set<number>} excludedIndexes
 * @returns {Object[]}
 */
export function getActiveRows(rows, excludedIndexes) {
  if (!excludedIndexes) return rows;
  const excluded = excludedIndexes instanceof Set ? excludedIndexes : new Set(excludedIndexes);
  if (excluded.size === 0) return rows;
  return rows.filter((_, index) => !excluded.has(index));
}

/**
 * Format one line for USPS automation: uppercase, punctuation removed,
 * whitespace collapsed. Hyphens inside ranges and ZIP+4 are kept.
 * @param {*} value
 * @returns {string}
 */
export function formatUSPSLine(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[.,;:'"`()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compose the last line of a US address the way USPS wants it:
 * CITY ST  12345-6789 (one space before the state, two before the ZIP).
 * Non-US rows fall back to "City, Region, Postal Code" with commas.
 * @param {{city: string, state: string, zip: string}} fields
 * @param {{ usps?: boolean }} [options]
 * @returns {string}
 */
export function formatCityStateZipLine(fields, options = {}) {
  if (!options.usps) {
    return [fields.city, fields.state, fields.zip].filter(Boolean).join(', ');
  }
  const city = formatUSPSLine(fields.city);
  const state = normalizeState(fields.state);
  const zip = normalizeZip(fields.zip);
  const isDomestic = STATE_CODES.has(state) && (zip === '' || isUSZip(zip));
  if (!isDomestic) {
    return [city, state, zip].filter(Boolean).join(', ');
  }
  const cityState = [city, state].filter(Boolean).join(' ');
  return [cityState, zip].filter(Boolean).join('  ');
}

/**
 * Apply USPS formatting to every mapped field of a row.
 * @param {ReturnType<typeof extractFields>} fields
 * @returns {ReturnType<typeof extractFields>}
 */
export function formatFieldsUSPS(fields) {
  return {
    name: formatUSPSLine(fields.name),
    company: formatUSPSLine(fields.company),
    addressLine1: formatUSPSLine(fields.addressLine1),
    addressLine2: formatUSPSLine(fields.addressLine2),
    city: formatUSPSLine(fields.city),
    state: normalizeState(fields.state),
    zip: normalizeZip(fields.zip)
  };
}

/**
 * Produce the printed lines for one label.
 * @param {Object} row - CSV row
 * @param {Object} columnMapping - Field key to header name
 * @param {{ usps?: boolean }} [options]
 * @returns {string[]}
 */
export function buildAddressLines(row, columnMapping, options = {}) {
  const raw = extractFields(row, columnMapping);
  const fields = options.usps ? formatFieldsUSPS(raw) : raw;
  const lines = [
    fields.name,
    fields.company,
    fields.addressLine1,
    fields.addressLine2,
    formatCityStateZipLine(fields, options)
  ];
  return lines.map((line) => String(line ?? '').trim()).filter(Boolean);
}
