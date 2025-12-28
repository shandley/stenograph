/**
 * Sample Analysis Primitives
 *
 * Example primitives for data science workflows.
 * These demonstrate how to define primitives for the steno-graph mapper.
 *
 * Usage:
 * ```typescript
 * import { createMapper } from 'steno-graph';
 * import { ANALYSIS_PRIMITIVES } from './examples/primitives/analysis';
 *
 * const mapper = createMapper({ primitives: ANALYSIS_PRIMITIVES });
 * ```
 */

import type { PrimitiveConfig } from '../../src/mapper/types';

/**
 * Exploration and diagnostics primitives
 */
export const EXPLORATION_PRIMITIVES: PrimitiveConfig[] = [
  {
    name: 'diagnose',
    description: 'Exploratory data analysis and quality assessment',
    verb: 'dx',
    inputSlots: ['data'],
    category: 'exploration',
  },
  {
    name: 'summarize',
    description: 'Generate summary statistics',
    verb: 'dx',
    target: 'summary',
    inputSlots: ['data'],
    category: 'exploration',
  },
];

/**
 * Ordination/dimensionality reduction primitives
 */
export const ORDINATION_PRIMITIVES: PrimitiveConfig[] = [
  {
    name: 'pca',
    description: 'Principal Component Analysis',
    verb: 'viz',
    target: 'pca',
    inputSlots: ['data'],
    defaultParams: { n_components: 10, scale: true },
    category: 'ordination',
  },
  {
    name: 'umap',
    description: 'UMAP dimensionality reduction',
    verb: 'viz',
    target: 'umap',
    inputSlots: ['data'],
    defaultParams: { n_neighbors: 15, min_dist: 0.1 },
    category: 'ordination',
  },
  {
    name: 'tsne',
    description: 't-SNE dimensionality reduction',
    verb: 'viz',
    target: 'tsne',
    inputSlots: ['data'],
    defaultParams: { perplexity: 30 },
    category: 'ordination',
  },
];

/**
 * Statistical test primitives
 */
export const STATISTICS_PRIMITIVES: PrimitiveConfig[] = [
  {
    name: 'ttest',
    description: 'Student\'s t-test',
    verb: 'stat',
    target: 'ttest',
    inputSlots: ['data', 'groups'],
    category: 'statistics',
  },
  {
    name: 'anova',
    description: 'Analysis of variance',
    verb: 'stat',
    target: 'anova',
    inputSlots: ['data', 'groups'],
    category: 'statistics',
  },
  {
    name: 'correlation',
    description: 'Correlation analysis',
    verb: 'stat',
    target: 'correlation',
    inputSlots: ['data'],
    defaultParams: { method: 'pearson' },
    category: 'statistics',
  },
];

/**
 * Visualization primitives
 */
export const VISUALIZATION_PRIMITIVES: PrimitiveConfig[] = [
  {
    name: 'scatter',
    description: 'Scatter plot',
    verb: 'viz',
    target: 'scatter',
    inputSlots: ['data'],
    category: 'visualization',
  },
  {
    name: 'heatmap',
    description: 'Heatmap visualization',
    verb: 'viz',
    target: 'heatmap',
    inputSlots: ['data'],
    defaultParams: { cluster: true },
    category: 'visualization',
  },
  {
    name: 'boxplot',
    description: 'Box plot',
    verb: 'viz',
    target: 'boxplot',
    inputSlots: ['data', 'groups'],
    category: 'visualization',
  },
  {
    name: 'histogram',
    description: 'Histogram',
    verb: 'viz',
    target: 'histogram',
    inputSlots: ['data'],
    defaultParams: { bins: 30 },
    category: 'visualization',
  },
];

/**
 * Model fitting primitives
 */
export const MODEL_PRIMITIVES: PrimitiveConfig[] = [
  {
    name: 'linear_regression',
    description: 'Linear regression model',
    verb: 'fit',
    target: 'linear',
    inputSlots: ['data', 'target'],
    category: 'modeling',
  },
  {
    name: 'logistic_regression',
    description: 'Logistic regression model',
    verb: 'fit',
    target: 'logistic',
    inputSlots: ['data', 'target'],
    category: 'modeling',
  },
  {
    name: 'kmeans',
    description: 'K-means clustering',
    verb: 'cluster',
    target: 'kmeans',
    inputSlots: ['data'],
    defaultParams: { k: 3 },
    category: 'clustering',
  },
];

/**
 * Data transformation primitives
 */
export const TRANSFORM_PRIMITIVES: PrimitiveConfig[] = [
  {
    name: 'normalize',
    description: 'Normalize data',
    verb: 'transform',
    target: 'normalize',
    inputSlots: ['data'],
    category: 'preprocessing',
  },
  {
    name: 'standardize',
    description: 'Standardize data (z-score)',
    verb: 'transform',
    target: 'standardize',
    inputSlots: ['data'],
    category: 'preprocessing',
  },
  {
    name: 'filter_missing',
    description: 'Filter rows with missing values',
    verb: 'filter',
    inputSlots: ['data'],
    defaultParams: { threshold: 0.5 },
    category: 'preprocessing',
  },
];

/**
 * All analysis primitives combined
 */
export const ANALYSIS_PRIMITIVES: PrimitiveConfig[] = [
  ...EXPLORATION_PRIMITIVES,
  ...ORDINATION_PRIMITIVES,
  ...STATISTICS_PRIMITIVES,
  ...VISUALIZATION_PRIMITIVES,
  ...MODEL_PRIMITIVES,
  ...TRANSFORM_PRIMITIVES,
];
