/**
 * ClarificationDialog Component
 *
 * Displays options when steno-graph needs user clarification.
 * Used when the mapper returns type: 'clarify'.
 *
 * Usage:
 * ```tsx
 * <ClarificationDialog
 *   question="Which model do you want to fit?"
 *   options={[
 *     { label: 'PCA', primitive: 'pca', description: 'Principal Component Analysis' },
 *     { label: 'NMDS', primitive: 'nmds', description: 'Non-metric MDS' },
 *   ]}
 *   onSelect={handleSelect}
 *   onCancel={handleCancel}
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';

export interface ClarificationOption {
  label: string;
  primitive: string;
  description?: string;
}

export interface ClarificationDialogProps {
  /** Question to display */
  question: string;

  /** Available options */
  options: ClarificationOption[];

  /** Called when user selects an option */
  onSelect: (option: ClarificationOption) => void;

  /** Called when user cancels */
  onCancel: () => void;

  /** Whether to allow custom input */
  allowCustom?: boolean;

  /** Called when user submits custom input */
  onCustom?: (input: string) => void;
}

export function ClarificationDialog({
  question,
  options,
  onSelect,
  onCancel,
  allowCustom = true,
  onCustom,
}: ClarificationDialogProps) {
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleSelect = useCallback((option: ClarificationOption) => {
    onSelect(option);
  }, [onSelect]);

  const handleCustomSubmit = useCallback(() => {
    if (customInput.trim() && onCustom) {
      onCustom(customInput.trim());
    }
  }, [customInput, onCustom]);

  return (
    <div className="clarification-dialog fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Clarification Needed
          </h3>
          <p className="mt-1 text-sm text-gray-600">{question}</p>
        </div>

        {/* Options */}
        <div className="px-6 py-4">
          <ul className="space-y-2">
            {options.map((option, index) => (
              <li key={option.primitive}>
                <button
                  onClick={() => handleSelect(option)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <span className="text-xs text-gray-500 font-mono">{option.primitive}</span>
                  </div>
                  {option.description && (
                    <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Custom input option */}
          {allowCustom && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {!showCustom ? (
                <button
                  onClick={() => setShowCustom(true)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Or specify something else...
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                    placeholder="Enter custom value..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customInput.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Use Custom
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClarificationDialog;
