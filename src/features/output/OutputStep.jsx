import { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LABEL_FORMATS } from '../../constants/label-formats';
import {
  generatePrintableHTML,
  generateAlignmentTestHTML,
  normalizePrintSettings,
  countLabels,
  countSheets,
  MAX_OFFSET
} from '../../lib/label-generator';
import { downloadFile, generateFilename } from '../../lib/file-download';
import Button from '../../components/ui/Button';

// Nudge granularity per unit: a fiftieth of an inch, or half a millimetre.
const OFFSET_STEP = { in: 0.02, mm: 0.5 };

function openForPrint(html) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Your browser blocked the print window. Allow pop-ups for this site or use Download instead.');
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

export default function OutputStep() {
  const { state, dispatch, actions } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const format = LABEL_FORMATS[state.selectedFormat];
  const unit = format.unit;
  const settings = useMemo(
    () => normalizePrintSettings(state.printSettings, format),
    [state.printSettings, format]
  );

  // Count total labels
  const labelCount = useMemo(() => {
    return countLabels(state.csvData.rows, state.columnMapping);
  }, [state.csvData.rows, state.columnMapping]);

  // Calculate number of sheets needed, including positions skipped on the first sheet
  const sheetsNeeded = format ? countSheets(labelCount, format.labelsPerSheet, settings.startAt) : 0;

  const updateSettings = (patch) => {
    dispatch({ type: actions.SET_PRINT_SETTINGS, payload: patch });
  };

  const handleOffsetChange = (axis) => (event) => {
    const raw = event.target.value;
    // Let the field be emptied while typing; normalize treats it as 0.
    updateSettings({ [axis]: raw === '' ? '' : parseFloat(raw) });
  };

  const runGenerator = async (produce) => {
    setIsGenerating(true);
    setError(null);
    try {
      // Small delay for UI feedback
      await new Promise((resolve) => setTimeout(resolve, 300));
      produce();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const buildLabelsHTML = () =>
    generatePrintableHTML(state.csvData.rows, state.columnMapping, state.selectedFormat, settings);

  const handleDownload = () =>
    runGenerator(() => {
      downloadFile(buildLabelsHTML(), generateFilename(state.selectedFormat));
    });

  const handlePrintPreview = () => runGenerator(() => openForPrint(buildLabelsHTML()));

  const handleAlignmentTest = () =>
    runGenerator(() => openForPrint(generateAlignmentTestHTML(state.selectedFormat, settings)));

  const handleAlignmentDownload = () =>
    runGenerator(() => {
      downloadFile(
        generateAlignmentTestHTML(state.selectedFormat, settings),
        `alignment-test-${state.selectedFormat}.html`
      );
    });

  const offsetInput = (axis, label, hint) => (
    <label className="flex flex-col text-sm text-gray-700">
      <span className="font-medium mb-1">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={OFFSET_STEP[unit]}
          min={-MAX_OFFSET[unit]}
          max={MAX_OFFSET[unit]}
          value={state.printSettings?.[axis] ?? 0}
          onChange={handleOffsetChange(axis)}
          className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <span className="text-gray-500">{unit}</span>
      </span>
      <span className="text-xs text-gray-500 mt-1">{hint}</span>
    </label>
  );

  return (
    <div>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Download Your Labels</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Your labels are ready to print
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-blue-900">{labelCount}</div>
            <div className="text-xs sm:text-sm text-blue-700 mt-1">Total Labels</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-blue-900">{sheetsNeeded}</div>
            <div className="text-xs sm:text-sm text-blue-700 mt-1">Sheets Needed</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-blue-900">{format.name}</div>
            <div className="text-xs sm:text-sm text-blue-700 mt-1">Label Format</div>
          </div>
        </div>
      </div>

      {/* Print Alignment */}
      <div className="border border-gray-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Print alignment</h3>
            <p className="text-sm text-gray-600">
              Finish a partly used sheet, and nudge the layout if your printer drifts.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-sm"
            onClick={() => updateSettings({ startAt: 1, offsetX: 0, offsetY: 0 })}
            disabled={settings.startAt === 1 && settings.offsetX === 0 && settings.offsetY === 0}
          >
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <label className="flex flex-col text-sm text-gray-700">
            <span className="font-medium mb-1">Start at label</span>
            <select
              value={settings.startAt}
              onChange={(event) => updateSettings({ startAt: parseInt(event.target.value, 10) })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: format.labelsPerSheet }, (_, i) => i + 1).map((position) => (
                <option key={position} value={position}>
                  {position}
                  {position === 1 ? ' (full sheet)' : ''}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500 mt-1">
              Positions count left to right, then top to bottom. Earlier positions are left blank on the first sheet.
            </span>
          </label>

          {offsetInput('offsetX', 'Horizontal nudge', 'Positive moves everything right, negative moves it left.')}
          {offsetInput('offsetY', 'Vertical nudge', 'Positive moves everything down, negative moves it up.')}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <Button variant="secondary" onClick={handleAlignmentTest} disabled={isGenerating} className="text-sm">
            Print alignment test page
          </Button>
          <Button variant="ghost" onClick={handleAlignmentDownload} disabled={isGenerating} className="text-sm">
            Download test page
          </Button>
          <p className="text-xs text-gray-500 sm:ml-2">
            Prints one sheet of dashed label outlines on plain paper. Hold it against a label sheet, then adjust the nudges until the outlines sit on the labels.
          </p>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8">
        <Button
          variant="primary"
          onClick={handleDownload}
          disabled={isGenerating}
          className="px-6 sm:px-8 py-3 text-base sm:text-lg w-full sm:w-auto"
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
          className="px-6 sm:px-8 py-3 text-base sm:text-lg w-full sm:w-auto"
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
            {format.aliases && format.aliases.length > 0 && <>, or the same layout sold as {format.aliases.join(', ')}</>}
          </li>
          <li>
            <strong>Open downloaded file:</strong> Open the HTML file in your web browser
          </li>
          <li>
            <strong>Print settings:</strong>
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
              <li>Set scale to "Actual Size" or "100%" (NOT "Fit to Page")</li>
              <li>Set margins to "None" or "Default" (the file sets its own)</li>
              <li>Orientation: Portrait</li>
              <li>Paper size: {format.paper} ({format.pageSize.width} × {format.pageSize.height})</li>
            </ul>
          </li>
          <li>
            <strong>Test first:</strong> Print the alignment test page on plain paper and hold it against a label sheet
          </li>
          <li>
            <strong>Adjust if needed:</strong> Use the horizontal and vertical nudges above, then print the test page again
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
