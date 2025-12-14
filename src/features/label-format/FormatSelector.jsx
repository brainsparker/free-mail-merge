import { LABEL_FORMATS } from '../../constants/label-formats';

export default function FormatSelector({ selectedFormat, onSelectFormat }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(LABEL_FORMATS).map(([key, format]) => {
        const isSelected = selectedFormat === key;

        return (
          <button
            key={key}
            onClick={() => onSelectFormat(key)}
            className={`
              text-left p-6 rounded-lg border-2 transition-all
              ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {format.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{format.description}</p>

                <div className="space-y-1 text-sm text-gray-700">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Labels per sheet:</span>
                    <span>{format.labelsPerSheet}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Size:</span>
                    <span>
                      {format.labelSize.width} × {format.labelSize.height}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Layout:</span>
                    <span>
                      {format.rows} rows × {format.cols} columns
                    </span>
                  </div>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="ml-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Visual Mockup */}
            <div className="mt-4 bg-white border border-gray-300 rounded p-3">
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${format.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${Math.min(format.rows, 3)}, 1fr)`
                }}
              >
                {Array.from({ length: Math.min(format.labelsPerSheet, format.cols * 3) }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded"
                    style={{
                      aspectRatio: `${parseFloat(format.labelSize.width)} / ${parseFloat(format.labelSize.height)}`
                    }}
                  />
                ))}
              </div>
              {format.labelsPerSheet > format.cols * 3 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  ...and {format.labelsPerSheet - format.cols * 3} more
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
