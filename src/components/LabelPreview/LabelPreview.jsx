import { formatFieldsUSPS, formatCityStateZipLine } from '../../lib/list-cleaner';

export default function LabelPreview({ data, formatKey = '5160', usps = false }) {
  if (!data) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500">Preview will appear here</p>
      </div>
    );
  }

  const fields = usps ? formatFieldsUSPS(data) : data;
  const addressLines = [
    fields.name,
    fields.company,
    fields.addressLine1,
    fields.addressLine2,
    formatCityStateZipLine(fields, { usps })
  ].filter(Boolean);

  return (
    <div className="border-2 border-gray-300 rounded-lg bg-white">
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
          Label Preview (First Record)
        </h3>
        <div className="border border-gray-200 rounded p-4 bg-gray-50 font-mono text-sm">
          {addressLines.length > 0 ? (
            addressLines.map((line, index) => (
              <div key={index} className="mb-1">
                {line || <span className="text-gray-400 italic">empty</span>}
              </div>
            ))
          ) : (
            <div className="text-gray-400 italic">No data mapped yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
