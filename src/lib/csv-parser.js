import Papa from 'papaparse';

const MAX_ROWS = 10000;

/**
 * Parse a CSV file using PapaParse
 * @param {File} file - The CSV file to parse
 * @returns {Promise<{headers: string[], rows: object[], fileName: string, rowCount: number}>}
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep all as strings to preserve ZIP codes with leading 0
      preview: MAX_ROWS,
      complete: (results) => {
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(
            (err) => err.type === 'Delimiter' || err.type === 'FieldMismatch'
          );

          if (criticalErrors.length > 0) {
            reject(
              new Error(
                `CSV parsing errors: ${criticalErrors
                  .map((e) => e.message)
                  .join(', ')}`
              )
            );
            return;
          }
        }

        const headers = results.meta.fields || [];
        const rows = results.data.filter((row) => {
          // Filter out completely empty rows
          return Object.values(row).some((val) => val && val.trim() !== '');
        });

        if (headers.length === 0) {
          reject(new Error('No columns found in CSV file'));
          return;
        }

        if (rows.length === 0) {
          reject(new Error('No data rows found in CSV file'));
          return;
        }

        resolve({
          headers,
          rows,
          fileName: file.name,
          rowCount: rows.length
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

/**
 * Validate if a file is a CSV
 * @param {File} file
 * @returns {boolean}
 */
export function isValidCSVFile(file) {
  const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  const validExtensions = ['.csv', '.txt'];

  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  return hasValidType || hasValidExtension;
}

/**
 * Format file size for display
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
