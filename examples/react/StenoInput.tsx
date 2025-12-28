/**
 * StenoInput Component
 *
 * A React component for stenographic input with:
 * - Real-time parsing feedback
 * - Autocomplete suggestions
 * - Visual indication of parse status
 * - Integration with steno-graph parser
 *
 * Usage:
 * ```tsx
 * <StenoInput
 *   onSubmit={handleSubmit}
 *   onIntentChange={handleIntentChange}
 *   placeholder="dx:@data.csv"
 * />
 * ```
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

// Types from steno-graph (would be imported in real usage)
interface Intent {
  verb: string;
  target: { raw: string; type: string };
  additions: string[];
  exclusions: string[];
  flags: Array<{ type: string; qualifier?: string }>;
  precision: string;
  thinking: string;
  mode?: string;
  refs: Array<{ type: string; value: string; selector?: string }>;
  freeform: string[];
  raw: string;
}

interface ParseResult {
  success: boolean;
  intent?: Intent;
  errors: Array<{ message: string }>;
  warnings: string[];
}

// Props interface
export interface StenoInputProps {
  /** Called when user submits input (Enter key) */
  onSubmit: (input: string, intent: Intent | null) => void;

  /** Called when parsed intent changes (real-time feedback) */
  onIntentChange?: (intent: Intent | null, parseResult: ParseResult) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Initial value */
  defaultValue?: string;

  /** Whether input is disabled */
  disabled?: boolean;

  /** Custom class name */
  className?: string;

  /** Show visual parse status indicator */
  showStatus?: boolean;

  /** Show autocomplete suggestions */
  showAutocomplete?: boolean;

  /** Parser function (injected dependency) */
  parse: (input: string) => ParseResult;

  /** Available verbs for autocomplete */
  verbs?: string[];

  /** Available flags for autocomplete */
  flags?: string[];
}

/**
 * StenoInput Component
 */
export function StenoInput({
  onSubmit,
  onIntentChange,
  placeholder = 'Enter steno command...',
  defaultValue = '',
  disabled = false,
  className = '',
  showStatus = true,
  showAutocomplete = true,
  parse,
  verbs = ['mk', 'ch', 'rm', 'dx', 'fnd', 'viz', 'fit', 'stat'],
  flags = ['ts', 'doc', 'plot', 'notebook'],
}: StenoInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse input on change
  useEffect(() => {
    if (value.trim()) {
      const result = parse(value);
      setParseResult(result);
      onIntentChange?.(result.intent || null, result);
    } else {
      setParseResult(null);
      onIntentChange?.(null, { success: false, errors: [], warnings: [] });
    }
  }, [value, parse, onIntentChange]);

  // Generate suggestions based on current input
  useEffect(() => {
    if (!showAutocomplete || !value) {
      setSuggestions([]);
      return;
    }

    const newSuggestions: string[] = [];
    const trimmed = value.trim();

    // Suggest verbs if at start
    if (!trimmed.includes(':')) {
      verbs
        .filter(v => v.startsWith(trimmed))
        .forEach(v => newSuggestions.push(`${v}:`));
    }

    // Suggest flags if after a space and starting with .
    if (trimmed.endsWith('.') || /\.\w*$/.test(trimmed)) {
      const prefix = trimmed.match(/\.(\w*)$/)?.[1] || '';
      flags
        .filter(f => f.startsWith(prefix))
        .forEach(f => newSuggestions.push(`.${f}`));
    }

    setSuggestions(newSuggestions.slice(0, 5));
    setSelectedSuggestion(-1);
  }, [value, showAutocomplete, verbs, flags]);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setShowSuggestions(true);
  }, []);

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle autocomplete navigation
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev > 0 ? prev - 1 : -1));
        return;
      }
      if (e.key === 'Tab' && selectedSuggestion >= 0) {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestion]);
        return;
      }
    }

    // Handle submit
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }

    // Escape closes suggestions
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [showSuggestions, suggestions, selectedSuggestion]);

  // Apply a suggestion
  const applySuggestion = useCallback((suggestion: string) => {
    // Replace the partial token with the suggestion
    if (suggestion.startsWith('.')) {
      // Flag suggestion - replace partial flag
      setValue(prev => prev.replace(/\.\w*$/, suggestion));
    } else if (suggestion.endsWith(':')) {
      // Verb suggestion - replace entire input
      setValue(suggestion);
    }
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled) return;

    const result = parse(value);
    onSubmit(value, result.intent || null);

    // Optionally clear input after submit
    // setValue('');
  }, [value, disabled, parse, onSubmit]);

  // Get status indicator color
  const getStatusColor = () => {
    if (!parseResult) return 'bg-gray-300';
    if (!parseResult.success) return 'bg-red-500';
    if (parseResult.warnings.length > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get status tooltip
  const getStatusTooltip = () => {
    if (!parseResult) return 'No input';
    if (!parseResult.success) return parseResult.errors.map(e => e.message).join(', ');
    if (parseResult.warnings.length > 0) return parseResult.warnings.join(', ');
    return `Parsed: ${parseResult.intent?.verb}:${parseResult.intent?.target.raw}`;
  };

  return (
    <div className={`steno-input-container relative ${className}`}>
      <div className="flex items-center gap-2">
        {/* Status indicator */}
        {showStatus && (
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor()} transition-colors`}
            title={getStatusTooltip()}
          />
        )}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2
            font-mono text-sm
            border rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${!parseResult?.success && value ? 'border-red-300' : 'border-gray-300'}
          `}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className={`
            px-4 py-2 rounded-md
            font-medium text-sm
            transition-colors
            ${disabled || !value.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
            }
          `}
        >
          Run
        </button>
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-10">
          <ul className="bg-white border border-gray-300 rounded-md shadow-lg">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                className={`
                  px-3 py-2 cursor-pointer font-mono text-sm
                  ${index === selectedSuggestion ? 'bg-blue-100' : 'hover:bg-gray-100'}
                `}
                onClick={() => applySuggestion(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Parse preview (optional) */}
      {parseResult?.success && parseResult.intent && (
        <div className="mt-2 text-xs text-gray-500 font-mono">
          <span className="text-blue-600">{parseResult.intent.verb}</span>
          <span className="text-gray-400">:</span>
          <span className="text-green-600">{parseResult.intent.target.raw}</span>
          {parseResult.intent.additions.map(a => (
            <span key={a} className="text-orange-500 ml-1">+{a}</span>
          ))}
          {parseResult.intent.flags.map(f => (
            <span key={f.type} className="text-purple-500 ml-1">.{f.type}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default StenoInput;
