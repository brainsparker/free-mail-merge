import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { REQUIRED_FIELDS } from '../../constants/field-mappings';
import { validateMapping } from '../../lib/column-detector';
import { findDuplicates, countNonUSZips } from '../../lib/list-cleaner';
import Button from '../../components/ui/Button';

const MAX_EXAMPLES = 5;

/**
 * Review panel shown under the column mapper once the required fields are
 * mapped. Finds duplicate recipients, offers to drop them (reversibly), and
 * toggles USPS-style formatting for the printed labels.
 */
export default function ListCleanupPanel() {
  const { state, dispatch, actions } = useAppContext();
  const { csvData, columnMapping, listCleanup } = state;

  const isMapped = validateMapping(columnMapping, REQUIRED_FIELDS);

  const duplicates = useMemo(() => {
    if (!isMapped) return null;
    return findDuplicates(csvData.rows, columnMapping);
  }, [csvData.rows, columnMapping, isMapped]);

  const nonUSZipCount = useMemo(() => {
    if (!isMapped) return 0;
    return countNonUSZips(csvData.rows, columnMapping);
  }, [csvData.rows, columnMapping, isMapped]);

  if (!isMapped || !duplicates) {
    return null;
  }

  const removedCount = listCleanup.excludedRowIndexes.length;
  const foundCount = duplicates.duplicateIndexes.length;
  const pendingCount = duplicates.duplicateIndexes.filter(
    (index) => !listCleanup.excludedRowIndexes.includes(index)
  ).length;

  const handleRemoveDuplicates = () => {
    dispatch({
      type: actions.SET_EXCLUDED_ROWS,
      payload: duplicates.duplicateIndexes
    });
  };

  const handleRestore = () => {
    dispatch({ type: actions.SET_EXCLUDED_ROWS, payload: [] });
  };

  const handleUspsToggle = (event) => {
    dispatch({
      type: actions.SET_USPS_FORMAT,
      payload: event.target.checked
    });
  };

  const examples = duplicates.groups.slice(0, MAX_EXAMPLES);

  return (
    <div className="mt-8 border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="text-base font-semibold text-gray-900">Clean up your list</h3>
        <p className="text-sm text-gray-600">
          Checked in your browser. Nothing is uploaded.
        </p>
      </div>

      <div className="p-4 space-y-5">
        {/* Duplicates */}
        <div>
          {foundCount === 0 ? (
            <p className="text-sm text-gray-700">
              <span className="font-medium text-green-700">No duplicates found.</span>{' '}
              Every row prints a different name and address.
            </p>
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">
                      {foundCount} duplicate row{foundCount !== 1 ? 's' : ''}
                    </span>{' '}
                    {removedCount > 0 && pendingCount === 0
                      ? 'removed from the print run.'
                      : 'would print the same label twice (same name and address, ignoring case, punctuation and St/Street spelling).'}
                  </p>
                  {examples.length > 0 && pendingCount > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-0.5">
                      {examples.map((group) => (
                        <li key={group.keepIndex}>
                          {group.label}{' '}
                          <span className="text-gray-400">
                            (row {group.keepIndex + 1} kept, {group.duplicateIndexes.length} cop{group.duplicateIndexes.length !== 1 ? 'ies' : 'y'} skipped)
                          </span>
                        </li>
                      ))}
                      {duplicates.groups.length > MAX_EXAMPLES && (
                        <li className="list-none text-gray-400">
                          and {duplicates.groups.length - MAX_EXAMPLES} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {pendingCount > 0 ? (
                    <Button variant="primary" onClick={handleRemoveDuplicates} className="text-sm w-full sm:w-auto">
                      Remove {pendingCount} duplicate{pendingCount !== 1 ? 's' : ''}
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={handleRestore} className="text-sm w-full sm:w-auto">
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {duplicates.sharedAddressCount > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              {duplicates.sharedAddressCount} row{duplicates.sharedAddressCount !== 1 ? 's share' : ' shares'} an
              address with a different name (for example, two people in one household). Those are kept.
            </p>
          )}
        </div>

        {/* USPS formatting */}
        <div className="border-t border-gray-100 pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={listCleanup.uspsFormat}
              onChange={handleUspsToggle}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900">
                Format addresses for USPS automation
              </span>
              <span className="block text-sm text-gray-600">
                Uppercase, no punctuation, two-letter state codes, ZIP+4 with a hyphen, and
                &quot;CITY ST&nbsp;&nbsp;ZIP&quot; on the last line. Non-US addresses are left as written.
              </span>
            </span>
          </label>
          {nonUSZipCount > 0 && (
            <p className="mt-2 ml-7 text-xs text-gray-500">
              {nonUSZipCount} row{nonUSZipCount !== 1 ? 's have' : ' has'} a postal code that is not a 5 or
              9 digit US ZIP. Fine for international mail; worth a second look otherwise.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
