import { useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LABEL_FIELDS } from '../../constants/field-mappings';
import { detectColumns } from '../../lib/column-detector';
import ColumnMapper from './ColumnMapper';
import LabelPreview from '../../components/LabelPreview/LabelPreview';

export default function ColumnMappingStep() {
  const { state, dispatch, actions } = useAppContext();
  const { csvData, columnMapping, autoDetectionConfidence } = state;

  // Auto-detect columns on mount if not already done
  useEffect(() => {
    if (csvData.headers.length > 0 && !autoDetectionConfidence.name) {
      const { mapping, confidence } = detectColumns(csvData.headers);
      dispatch({
        type: actions.SET_AUTO_DETECTION,
        payload: { mapping, confidence }
      });
    }
  }, [csvData.headers, autoDetectionConfidence.name, dispatch, actions]);

  // Handle column mapping change
  const handleMappingChange = (fieldKey, value) => {
    dispatch({
      type: actions.SET_COLUMN_MAPPING,
      payload: { [fieldKey]: value || null }
    });
  };

  // Generate preview data from first row
  const previewData = useMemo(() => {
    if (csvData.rows.length === 0) return null;

    const firstRow = csvData.rows[0];
    const data = {};

    LABEL_FIELDS.forEach(({ key }) => {
      const mappedColumn = columnMapping[key];
      data[key] = mappedColumn ? firstRow[mappedColumn] : '';
    });

    return data;
  }, [csvData.rows, columnMapping]);

  return (
    <div>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Map Your Columns</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Match your CSV columns to label fields
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column Mapping Form */}
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Auto-detected:</strong> We've automatically matched your columns.
              Review and adjust as needed.
            </p>
          </div>

          <div className="space-y-4">
            {LABEL_FIELDS.map((field) => (
              <ColumnMapper
                key={field.key}
                fieldKey={field.key}
                fieldLabel={field.label}
                required={field.required}
                value={columnMapping[field.key]}
                confidence={autoDetectionConfidence[field.key]}
                options={csvData.headers}
                onChange={(value) => handleMappingChange(field.key, value)}
              />
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <LabelPreview data={previewData} />

          {csvData.rows.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Previewing row 1 of {csvData.rowCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
