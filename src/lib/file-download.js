/**
 * Trigger browser download for a text or binary file
 * @param {string|Uint8Array|Blob} content - File content
 * @param {string} filename - Desired filename
 * @param {string} mimeType - MIME type (default: text/html)
 */
export function downloadFile(content, filename, mimeType = 'text/html') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Generate filename with timestamp
 * @param {string} formatKey - Label format key
 * @param {string} [extension='html'] - File extension without the dot
 * @param {string} [prefix='labels'] - Leading part of the name
 * @returns {string}
 */
export function generateFilename(formatKey, extension = 'html', prefix = 'labels') {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${formatKey}-${timestamp}.${extension}`;
}
