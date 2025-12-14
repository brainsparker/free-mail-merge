import { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LABEL_FORMATS } from '../../constants/label-formats';
import { generatePrintableHTML, countLabels } from '../../lib/label-generator';
import { downloadFile, generateFilename } from '../../lib/file-download';
import Button from '../../components/ui/Button';

export default function OutputStep() {
  const { state } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const format = LABEL_FORMATS[state.selectedFormat];

  // Count total labels
  const labelCount = useMemo(() => {
    return countLabels(state.csvData.rows, state.columnMapping);
  }, [state.csvData.rows, state.columnMapping]);

  // Calculate number of sheets needed
  const sheetsNeeded = format ? Math.ceil(labelCount / format.labelsPerSheet) : 0;

  const handleDownload = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Small delay for UI feedback
      await new Promise((resolve) => setTimeout(resolve, 300));

      const html = generatePrintableHTML(
        state.csvData.rows,
        state.columnMapping,
        state.selectedFormat
      );

      const filename = generateFilename(state.selectedFormat);
      downloadFile(html, filename);

      setIsGenerating(false);
    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const handlePrintPreview = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const html = generatePrintableHTML(
        state.csvData.rows,
        state.columnMapping,
        state.selectedFormat
      );

      // Open in new window for print preview
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();

        // Trigger print dialog after page loads
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      setIsGenerating(false);
    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Download Your Labels</h2>
        <p className="text-gray-600">
          Your labels are ready to print
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-900">{labelCount}</div>
            <div className="text-sm text-blue-700 mt-1">Total Labels</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-900">{sheetsNeeded}</div>
            <div className="text-sm text-blue-700 mt-1">Sheets Needed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">{format.name}</div>
            <div className="text-sm text-blue-700 mt-1">Label Format</div>
          </div>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Button
          variant="primary"
          onClick={handleDownload}
          disabled={isGenerating}
          className="px-8 py-3 text-lg"
        >
          {isGenerating ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Generating...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 inline-block mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download HTML
            </>
          )}
        </Button>

        <Button
          variant="secondary"
          onClick={handlePrintPreview}
          disabled={isGenerating}
          className="px-8 py-3 text-lg"
        >
          <svg
            className="w-5 h-5 inline-block mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print Preview
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error generating labels</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Print Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">
          Printing Instructions
        </h3>
        <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
          <li>
            <strong>Load label sheets:</strong> Use {format.name} label sheets ({format.labelsPerSheet} labels per sheet)
          </li>
          <li>
            <strong>Open downloaded file:</strong> Open the HTML file in your web browser
          </li>
          <li>
            <strong>Print settings:</strong>
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
              <li>Set scale to "Actual Size" or "100%" (NOT "Fit to Page")</li>
              <li>Set margins to "None" or "Minimum"</li>
              <li>Orientation: Portrait</li>
              <li>Paper size: Letter (8.5" × 11")</li>
            </ul>
          </li>
          <li>
            <strong>Test first:</strong> Print page 1 only on plain paper to verify alignment
          </li>
          <li>
            <strong>Adjust if needed:</strong> If misaligned, adjust printer margins slightly
          </li>
        </ol>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>
          ✓ All processing done locally in your browser
          <br />
          ✓ No data uploaded to any server
          <br />
          ✓ Your privacy is protected
        </p>
      </div>
    </div>
  );
}
