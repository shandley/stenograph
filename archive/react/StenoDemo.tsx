/**
 * StenoDemo - Complete Demo Application
 *
 * Demonstrates the full steno-graph React integration:
 * - StenoInput component
 * - useStenoGraph hook
 * - ClarificationDialog
 * - Result display
 *
 * This can be used as a reference for bioview-web integration.
 */

import React, { useState, useCallback } from 'react';
import { StenoInput } from './StenoInput';
import { ClarificationDialog, ClarificationOption } from './ClarificationDialog';
import { useStenoGraph } from './useStenoGraph';

// Example primitives for demo
const DEMO_PRIMITIVES = [
  { name: 'diagnose', verb: 'dx', inputSlots: ['counts'], category: 'exploration' },
  { name: 'pca', verb: 'viz', target: 'pca', inputSlots: ['counts'], defaultParams: { n_components: 10 }, category: 'ordination' },
  { name: 'nmds', verb: 'viz', target: 'nmds', inputSlots: ['distance'], category: 'ordination' },
  { name: 'umap', verb: 'viz', target: 'umap', inputSlots: ['counts'], category: 'ordination' },
  { name: 'permanova', verb: 'stat', target: 'permanova', inputSlots: ['distance', 'metadata'], category: 'statistics' },
  { name: 'tmm', verb: 'ch', additions: ['normalize'], inputSlots: ['counts'], category: 'normalization' },
  { name: 'heatmap', verb: 'viz', target: 'heatmap', inputSlots: ['counts'], category: 'visualization' },
];

interface HistoryEntry {
  id: number;
  input: string;
  timestamp: Date;
  result: {
    type: 'direct' | 'claude' | 'clarify' | 'error';
    primitive?: string;
    reason?: string;
  };
}

export function StenoDemo() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [clarification, setClarification] = useState<{
    question: string;
    options: ClarificationOption[];
    originalInput: string;
  } | null>(null);

  // Initialize steno-graph
  const { parse, map, verbs, flags, isReady } = useStenoGraph({
    extensions: ['datascience'],
    primitives: DEMO_PRIMITIVES,
  });

  // Handle steno input submission
  const handleSubmit = useCallback((input: string, intent: any) => {
    if (!intent) {
      setHistory(prev => [{
        id: Date.now(),
        input,
        timestamp: new Date(),
        result: { type: 'error', reason: 'Parse failed' },
      }, ...prev]);
      return;
    }

    const mapping = map(intent);

    // Handle clarification
    if (mapping.type === 'clarify') {
      setClarification({
        question: mapping.question || 'Please clarify',
        options: mapping.options || [],
        originalInput: input,
      });
      return;
    }

    // Add to history
    setHistory(prev => [{
      id: Date.now(),
      input,
      timestamp: new Date(),
      result: {
        type: mapping.type,
        primitive: mapping.primitive,
        reason: mapping.reason,
      },
    }, ...prev]);
  }, [map]);

  // Handle clarification selection
  const handleClarificationSelect = useCallback((option: ClarificationOption) => {
    if (!clarification) return;

    setHistory(prev => [{
      id: Date.now(),
      input: `${clarification.originalInput} -> ${option.label}`,
      timestamp: new Date(),
      result: {
        type: 'direct',
        primitive: option.primitive,
      },
    }, ...prev]);

    setClarification(null);
  }, [clarification]);

  if (!isReady) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="steno-demo min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Steno-Graph Demo</h1>
          <p className="mt-1 text-sm text-gray-600">
            Stenographic input for AI-powered data analysis
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Input section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Command Input</h2>
          <StenoInput
            onSubmit={handleSubmit}
            parse={parse}
            verbs={verbs}
            flags={flags}
            placeholder="Try: dx:@counts.csv or viz:pca @data.csv .plot"
            showStatus={true}
            showAutocomplete={true}
          />

          {/* Quick examples */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'dx:@counts.csv',
                'viz:pca @data.csv',
                'viz:heatmap @counts.csv',
                'stat:permanova @dist.csv @meta.csv',
                'ch:@data.csv +normalize',
              ].map(example => (
                <button
                  key={example}
                  onClick={() => handleSubmit(example, parse(example).intent)}
                  className="px-2 py-1 text-xs font-mono bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grammar reference */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Grammar Reference</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Verbs</h3>
              <div className="font-mono text-xs space-y-1">
                <div><span className="text-blue-600">dx</span> - diagnose/explore</div>
                <div><span className="text-blue-600">viz</span> - visualize</div>
                <div><span className="text-blue-600">stat</span> - statistical test</div>
                <div><span className="text-blue-600">ch</span> - change/modify</div>
                <div><span className="text-blue-600">fit</span> - fit model</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Syntax</h3>
              <div className="font-mono text-xs space-y-1">
                <div><span className="text-green-600">@file.csv</span> - file reference</div>
                <div><span className="text-orange-600">+feature</span> - add feature</div>
                <div><span className="text-purple-600">.flag</span> - output flag</div>
                <div><span className="text-red-600">?</span> - clarify</div>
                <div><span className="text-yellow-600">~deep</span> - extended thinking</div>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Command History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">No commands yet. Try entering one above!</p>
          ) : (
            <ul className="space-y-3">
              {history.map(entry => (
                <li key={entry.id} className="border-l-4 pl-4 py-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono">{entry.input}</code>
                    <span className="text-xs text-gray-400">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-1">
                    {entry.result.type === 'direct' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Executed: {entry.result.primitive}
                      </span>
                    )}
                    {entry.result.type === 'claude' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Routed to Claude: {entry.result.reason}
                      </span>
                    )}
                    {entry.result.type === 'error' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Error: {entry.result.reason}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Clarification dialog */}
      {clarification && (
        <ClarificationDialog
          question={clarification.question}
          options={clarification.options}
          onSelect={handleClarificationSelect}
          onCancel={() => setClarification(null)}
        />
      )}
    </div>
  );
}

export default StenoDemo;
