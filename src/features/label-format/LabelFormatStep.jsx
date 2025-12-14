import { useAppContext } from '../../context/AppContext';
import FormatSelector from './FormatSelector';

export default function LabelFormatStep() {
  const { state, dispatch, actions } = useAppContext();

  const handleFormatSelect = (formatKey) => {
    dispatch({
      type: actions.SET_SELECTED_FORMAT,
      payload: formatKey
    });
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Label Format</h2>
        <p className="text-gray-600">
          Select the Avery label format that matches your label sheets
        </p>
      </div>

      <FormatSelector
        selectedFormat={state.selectedFormat}
        onSelectFormat={handleFormatSelect}
      />

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">
          Print Accuracy Tips:
        </h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>Use the exact Avery label sheets specified above</li>
          <li>Print a test page first to verify alignment</li>
          <li>Set your printer to "Actual Size" (not "Fit to Page")</li>
          <li>Set page margins to "None" or "Minimum"</li>
        </ul>
      </div>
    </div>
  );
}
