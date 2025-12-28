/**
 * Data Science Domain Extension
 *
 * Example extension for data analysis, statistical computing, and visualization.
 * This demonstrates how to create domain-specific vocabulary for steno-graph.
 *
 * Usage:
 * ```typescript
 * import { createParser, registerExtension } from 'steno-graph';
 * import { DATASCIENCE_EXTENSION } from './examples/extensions/datascience';
 *
 * // Register the extension
 * registerExtension(DATASCIENCE_EXTENSION);
 *
 * // Create parser with the extension
 * const parser = createParser({ extensions: ['datascience'] });
 * ```
 */

import type { VerbConfig, FlagConfig, DomainExtension } from '../../src/config/types';

/**
 * Data science verbs
 */
export const DATASCIENCE_VERBS: VerbConfig[] = [
  {
    token: 'viz',
    description: 'Visualize data',
    category: 'datascience',
  },
  {
    token: 'fit',
    description: 'Fit a model',
    category: 'datascience',
  },
  {
    token: 'stat',
    description: 'Statistical test',
    category: 'datascience',
  },
  {
    token: 'eda',
    description: 'Exploratory data analysis',
    category: 'datascience',
    aliasOf: 'dx',
  },
  {
    token: 'normalize',
    description: 'Normalize data',
    category: 'datascience',
  },
  {
    token: 'filter',
    description: 'Filter data',
    category: 'datascience',
  },
  {
    token: 'transform',
    description: 'Transform data',
    category: 'datascience',
  },
  {
    token: 'cluster',
    description: 'Cluster analysis',
    category: 'datascience',
  },
  {
    token: 'ordinate',
    description: 'Ordination analysis',
    category: 'datascience',
  },
];

/**
 * Data science flags
 */
export const DATASCIENCE_FLAGS: FlagConfig[] = [
  {
    token: 'plot',
    description: 'Generate plot output',
    type: 'output',
    validQualifiers: ['png', 'svg', 'pdf', 'html'],
  },
  {
    token: 'notebook',
    description: 'Generate Jupyter notebook',
    type: 'output',
    defaultQualifier: 'ipynb',
  },
  {
    token: 'report',
    description: 'Generate HTML report',
    type: 'output',
    defaultQualifier: 'html',
  },
  {
    token: 'scale',
    description: 'Apply scaling',
    type: 'behavior',
  },
  {
    token: 'log',
    description: 'Apply log transformation',
    type: 'behavior',
  },
  {
    token: 'center',
    description: 'Center the data',
    type: 'behavior',
  },
];

/**
 * The data science extension
 */
export const DATASCIENCE_EXTENSION: DomainExtension = {
  name: 'datascience',
  description: 'Data science and statistical analysis vocabulary',
  verbs: DATASCIENCE_VERBS,
  flags: DATASCIENCE_FLAGS,
};
