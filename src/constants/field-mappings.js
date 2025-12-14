/**
 * Common column name patterns for auto-detection
 * Patterns are case-insensitive and use substring matching
 */

export const FIELD_PATTERNS = {
  name: ['name', 'full name', 'fullname', 'recipient', 'to', 'contact name', 'customer name'],
  company: ['company', 'organization', 'org', 'business', 'business name'],
  addressLine1: [
    'address',
    'address1',
    'address 1',
    'street',
    'street address',
    'address line 1',
    'addr1',
    'addr',
    'street1'
  ],
  addressLine2: [
    'address2',
    'address 2',
    'apt',
    'suite',
    'unit',
    'address line 2',
    'addr2',
    'street2',
    'apartment',
    'floor'
  ],
  city: ['city', 'town', 'municipality'],
  state: ['state', 'province', 'st', 'region', 'state/province', 'prov'],
  zip: ['zip', 'zipcode', 'postal', 'postcode', 'postal code', 'zip code', 'postalcode']
};

/**
 * Required fields for a valid label
 */
export const REQUIRED_FIELDS = ['name', 'addressLine1', 'city', 'state', 'zip'];

/**
 * Optional fields that can be skipped
 */
export const OPTIONAL_FIELDS = ['company', 'addressLine2'];

/**
 * All supported label fields in display order
 */
export const LABEL_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'company', label: 'Company', required: false },
  { key: 'addressLine1', label: 'Address Line 1', required: true },
  { key: 'addressLine2', label: 'Address Line 2', required: false },
  { key: 'city', label: 'City', required: true },
  { key: 'state', label: 'State/Province', required: true },
  { key: 'zip', label: 'ZIP/Postal Code', required: true }
];
