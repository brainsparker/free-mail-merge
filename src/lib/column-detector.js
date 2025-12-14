import { FIELD_PATTERNS } from '../constants/field-mappings';

/**
 * Auto-detect column mappings based on header names
 * @param {string[]} headers - CSV column headers
 * @returns {{mapping: Object, confidence: Object}}
 */
export function detectColumns(headers) {
  const mapping = {};
  const confidence = {};

  headers.forEach((header) => {
    const normalized = header.toLowerCase().trim();

    Object.entries(FIELD_PATTERNS).forEach(([field, patterns]) => {
      patterns.forEach((pattern) => {
        const score = calculateConfidence(normalized, pattern);

        if (score > 0 && (!confidence[field] || score > confidence[field])) {
          mapping[field] = header;
          confidence[field] = score;
        }
      });
    });
  });

  return { mapping, confidence };
}

/**
 * Calculate confidence score for a match
 * @param {string} header - Normalized header name
 * @param {string} pattern - Pattern to match against
 * @returns {number} - Confidence score (0-1)
 */
function calculateConfidence(header, pattern) {
  // Exact match = highest confidence
  if (header === pattern) {
    return 1.0;
  }

  // Starts with pattern = high confidence
  if (header.startsWith(pattern)) {
    return 0.9;
  }

  // Contains pattern = medium confidence
  if (header.includes(pattern)) {
    return 0.7;
  }

  // Pattern at word boundary
  const words = header.split(/[\s_-]+/);
  if (words.some((word) => word === pattern)) {
    return 0.85;
  }

  return 0;
}

/**
 * Get confidence level label
 * @param {number} score - Confidence score (0-1)
 * @returns {{label: string, color: string}}
 */
export function getConfidenceLevel(score) {
  if (score >= 0.9) {
    return { label: 'High', color: 'green' };
  } else if (score >= 0.7) {
    return { label: 'Medium', color: 'yellow' };
  } else if (score > 0) {
    return { label: 'Low', color: 'orange' };
  }
  return { label: 'None', color: 'gray' };
}

/**
 * Validate if all required fields are mapped
 * @param {Object} mapping - Current column mapping
 * @param {string[]} requiredFields - List of required field keys
 * @returns {boolean}
 */
export function validateMapping(mapping, requiredFields) {
  return requiredFields.every((field) => mapping[field] !== null && mapping[field] !== undefined);
}

/**
 * Get missing required fields
 * @param {Object} mapping - Current column mapping
 * @param {string[]} requiredFields - List of required field keys
 * @returns {string[]}
 */
export function getMissingFields(mapping, requiredFields) {
  return requiredFields.filter((field) => !mapping[field]);
}
