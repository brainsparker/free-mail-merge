import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import FileUpload from '../../components/FileUpload/FileUpload';
import CSVDataTable from './CSVDataTable';
import { parseCSV, isValidCSVFile, formatFileSize } from '../../lib/csv-parser';

export default function CSVImportStep() {
  const { state, dispatch, actions } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (file) => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate file type
      if (!isValidCSVFile(file)) {
        throw new Error('Please select a valid CSV file');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Parse CSV
      const result = await parseCSV(file);

      // Store in context
      dispatch({
        type: actions.SET_CSV_DATA,
        payload: result
      });

      // Show success message briefly
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleClearFile = () => {
    dispatch({
      type: actions.SET_CSV_DATA,
      payload: {
        headers: [],
        rows: [],
        fileName: '',
        rowCount: 0
      }
    });
    setError(null);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your CSV File</h2>
        <p className="text-gray-600">
          Upload a CSV file containing your mailing addresses
        </p>
      </div>

      {state.csvData.rowCount === 0 ? (
        <>
          <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />

          {isLoading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Parsing CSV file...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
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
                  <h3 className="text-sm font-medium text-red-800">Error parsing CSV</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">CSV Format Requirements:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>First row should contain column headers</li>
              <li>Include columns for: Name, Address, City, State, ZIP</li>
              <li>Maximum 10,000 rows</li>
              <li>Save your spreadsheet as CSV format before uploading</li>
            </ul>
          </div>
        </>
      ) : (
        <div>
          {/* File Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-600 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-green-900">
                    {state.csvData.fileName}
                  </h3>
                  <p className="text-sm text-green-700">
                    {state.csvData.rowCount} rows, {state.csvData.headers.length} columns
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearFile}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Data Preview */}
          <CSVDataTable headers={state.csvData.headers} rows={state.csvData.rows} />
        </div>
      )}
    </div>
  );
}
