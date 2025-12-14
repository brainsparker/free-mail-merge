export default function CSVDataTable({ headers, rows, maxRows = 10 }) {
  const displayRows = rows.slice(0, maxRows);

  return (
    <div className="mt-6">
      <div className="mb-3 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Preview (First {displayRows.length} rows)</h3>
        <span className="text-sm text-gray-600">
          Total: {rows.length} row{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                  {rowIndex + 1}
                </td>
                {headers.map((header, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate"
                    title={row[header]}
                  >
                    {row[header] || <span className="text-gray-400 italic">empty</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > maxRows && (
        <p className="mt-2 text-sm text-gray-500 text-center">
          ...and {rows.length - maxRows} more row{rows.length - maxRows !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
