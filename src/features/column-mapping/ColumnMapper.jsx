import Select from '../../components/ui/Select';
import { getConfidenceLevel } from '../../lib/column-detector';

export default function ColumnMapper({
  fieldKey,
  fieldLabel,
  required,
  value,
  confidence,
  options,
  onChange
}) {
  const confidenceLevel = confidence ? getConfidenceLevel(confidence) : null;

  const selectOptions = [
    ...options.map((header) => ({
      value: header,
      label: header
    }))
  ];

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          {fieldLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {confidenceLevel && confidence > 0 && (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              confidenceLevel.color === 'green'
                ? 'bg-green-100 text-green-800'
                : confidenceLevel.color === 'yellow'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            {confidenceLevel.label} confidence
          </span>
        )}
      </div>

      <Select
        value={value}
        onChange={onChange}
        options={selectOptions}
        placeholder={required ? 'Select a column...' : 'Skip (optional)'}
        required={required}
      />
    </div>
  );
}
