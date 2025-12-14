/**
 * Trigger browser download for a text file
 * @param {string} content - File content
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
 * @returns {string}
 */
export function generateFilename(formatKey) {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `labels-${formatKey}-${timestamp}.html`;
}
