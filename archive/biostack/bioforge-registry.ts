/**
 * BioForge Primitive Registry
 *
 * Maps steno-graph to bioforge's 46 statistical primitives.
 * This would typically be auto-generated from bioforge's primitive definitions.
 */

import type { PrimitiveConfig } from '../../src/mapper/types';
import type { DomainExtension } from '../../src/config/types';

/**
 * BioStack domain extension
 * Defines the verbs and flags used by bioforge primitives
 */
export const BIOSTACK_EXTENSION: DomainExtension = {
  name: 'biostack',
  description: 'BioStack microbiome analysis vocabulary',
  verbs: [
    { token: 'viz', description: 'Visualize data', category: 'biostack' },
    { token: 'stat', description: 'Statistical test', category: 'biostack' },
    { token: 'fit', description: 'Fit a model', category: 'biostack' },
    { token: 'normalize', description: 'Normalize data', category: 'biostack' },
    { token: 'transform', description: 'Transform data', category: 'biostack' },
    { token: 'filter', description: 'Filter data', category: 'biostack' },
    { token: 'cluster', description: 'Cluster analysis', category: 'biostack' },
  ],
  flags: [
    { token: 'plot', description: 'Generate plot output', type: 'output' },
    { token: 'report', description: 'Generate HTML report', type: 'output' },
    { token: 'notebook', description: 'Generate Jupyter notebook', type: 'output' },
  ],
};

/**
 * BioForge primitive configurations
 * Organized by category matching bioforge's structure
 */
export const BIOFORGE_PRIMITIVES: PrimitiveConfig[] = [
  // ============================================
  // EXPLORATION & DIAGNOSTICS
  // ============================================
  {
    name: 'diagnose',
    description: 'Comprehensive data quality assessment and summary statistics',
    verb: 'dx',
    inputSlots: ['counts'],
    defaultParams: {
      include_zeros: true,
      compute_correlations: false,
    },
    category: 'exploration',
  },
  {
    name: 'summarize',
    description: 'Generate summary statistics for count data',
    verb: 'dx',
    target: 'summary',
    inputSlots: ['counts'],
    category: 'exploration',
  },

  // ============================================
  // NORMALIZATION
  // ============================================
  {
    name: 'tmm',
    description: 'TMM (Trimmed Mean of M-values) normalization',
    verb: 'normalize',
    target: 'tmm',
    inputSlots: ['counts'],
    defaultParams: {
      log_transform: false,
      prior_count: 2,
    },
    category: 'normalization',
  },
  {
    name: 'tmm_from_addition',
    description: 'TMM normalization via +normalize addition',
    verb: 'ch',
    additions: ['normalize'],
    inputSlots: ['counts'],
    defaultParams: {
      method: 'tmm',
    },
    category: 'normalization',
  },
  {
    name: 'rle',
    description: 'RLE (Relative Log Expression) normalization',
    verb: 'normalize',
    target: 'rle',
    inputSlots: ['counts'],
    category: 'normalization',
  },
  {
    name: 'clr',
    description: 'Centered Log-Ratio transformation',
    verb: 'transform',
    target: 'clr',
    inputSlots: ['counts'],
    defaultParams: {
      pseudocount: 0.5,
    },
    category: 'normalization',
  },
  {
    name: 'css',
    description: 'Cumulative Sum Scaling normalization',
    verb: 'normalize',
    target: 'css',
    inputSlots: ['counts'],
    category: 'normalization',
  },
  {
    name: 'tss',
    description: 'Total Sum Scaling (relative abundance)',
    verb: 'normalize',
    target: 'tss',
    inputSlots: ['counts'],
    category: 'normalization',
  },

  // ============================================
  // FILTERING
  // ============================================
  {
    name: 'filter_prevalence',
    description: 'Filter features by prevalence across samples',
    verb: 'filter',
    target: 'prevalence',
    inputSlots: ['counts'],
    defaultParams: {
      min_prevalence: 0.1,
      min_abundance: 0,
    },
    category: 'filtering',
  },
  {
    name: 'filter_abundance',
    description: 'Filter features by abundance threshold',
    verb: 'filter',
    target: 'abundance',
    inputSlots: ['counts'],
    defaultParams: {
      min_count: 10,
      min_samples: 2,
    },
    category: 'filtering',
  },
  {
    name: 'filter_variance',
    description: 'Filter features by variance',
    verb: 'filter',
    target: 'variance',
    inputSlots: ['counts'],
    defaultParams: {
      top_n: 1000,
    },
    category: 'filtering',
  },

  // ============================================
  // ORDINATION
  // ============================================
  {
    name: 'pca',
    description: 'Principal Component Analysis',
    verb: 'viz',
    target: 'pca',
    inputSlots: ['counts'],
    defaultParams: {
      n_components: 10,
      scale: true,
      center: true,
    },
    category: 'ordination',
  },
  {
    name: 'pcoa',
    description: 'Principal Coordinates Analysis',
    verb: 'viz',
    target: 'pcoa',
    inputSlots: ['distance'],
    defaultParams: {
      correction: 'none',
    },
    category: 'ordination',
  },
  {
    name: 'nmds',
    description: 'Non-metric Multidimensional Scaling',
    verb: 'viz',
    target: 'nmds',
    inputSlots: ['distance'],
    defaultParams: {
      k: 2,
      maxit: 200,
      trymax: 20,
    },
    category: 'ordination',
  },
  {
    name: 'umap',
    description: 'UMAP dimensionality reduction',
    verb: 'viz',
    target: 'umap',
    inputSlots: ['counts'],
    defaultParams: {
      n_neighbors: 15,
      min_dist: 0.1,
      metric: 'euclidean',
    },
    category: 'ordination',
  },
  {
    name: 'tsne',
    description: 't-SNE dimensionality reduction',
    verb: 'viz',
    target: 'tsne',
    inputSlots: ['counts'],
    defaultParams: {
      perplexity: 30,
      max_iter: 1000,
    },
    category: 'ordination',
  },

  // ============================================
  // DISTANCE MATRICES
  // ============================================
  {
    name: 'bray_curtis',
    description: 'Bray-Curtis dissimilarity matrix',
    verb: 'stat',
    target: 'bray',
    inputSlots: ['counts'],
    category: 'distance',
  },
  {
    name: 'jaccard',
    description: 'Jaccard distance matrix',
    verb: 'stat',
    target: 'jaccard',
    inputSlots: ['counts'],
    category: 'distance',
  },
  {
    name: 'unifrac',
    description: 'UniFrac distance (weighted or unweighted)',
    verb: 'stat',
    target: 'unifrac',
    inputSlots: ['counts', 'tree'],
    defaultParams: {
      weighted: true,
    },
    category: 'distance',
  },
  {
    name: 'aitchison',
    description: 'Aitchison distance (Euclidean on CLR)',
    verb: 'stat',
    target: 'aitchison',
    inputSlots: ['counts'],
    category: 'distance',
  },

  // ============================================
  // DIVERSITY
  // ============================================
  {
    name: 'alpha_diversity',
    description: 'Calculate alpha diversity metrics',
    verb: 'stat',
    target: 'alpha',
    inputSlots: ['counts'],
    defaultParams: {
      metrics: ['shannon', 'simpson', 'chao1', 'observed'],
    },
    category: 'diversity',
  },
  {
    name: 'beta_diversity',
    description: 'Calculate beta diversity',
    verb: 'stat',
    target: 'beta',
    inputSlots: ['counts'],
    defaultParams: {
      method: 'bray',
    },
    category: 'diversity',
  },

  // ============================================
  // STATISTICAL TESTS
  // ============================================
  {
    name: 'permanova',
    description: 'PERMANOVA test for group differences',
    verb: 'stat',
    target: 'permanova',
    inputSlots: ['distance', 'metadata'],
    defaultParams: {
      permutations: 999,
      method: 'bray',
    },
    category: 'statistics',
  },
  {
    name: 'anosim',
    description: 'Analysis of Similarities',
    verb: 'stat',
    target: 'anosim',
    inputSlots: ['distance', 'metadata'],
    defaultParams: {
      permutations: 999,
    },
    category: 'statistics',
  },
  {
    name: 'adonis2',
    description: 'ADONIS2 (vegan implementation)',
    verb: 'stat',
    target: 'adonis',
    inputSlots: ['distance', 'metadata'],
    defaultParams: {
      permutations: 999,
      by: 'margin',
    },
    category: 'statistics',
  },
  {
    name: 'betadisper',
    description: 'Beta dispersion test',
    verb: 'stat',
    target: 'betadisper',
    inputSlots: ['distance', 'metadata'],
    category: 'statistics',
  },

  // ============================================
  // DIFFERENTIAL ABUNDANCE
  // ============================================
  {
    name: 'deseq2',
    description: 'DESeq2 differential abundance analysis',
    verb: 'stat',
    target: 'deseq2',
    inputSlots: ['counts', 'metadata'],
    defaultParams: {
      alpha: 0.05,
      lfc_threshold: 0,
    },
    category: 'differential',
  },
  {
    name: 'edger',
    description: 'edgeR differential abundance analysis',
    verb: 'stat',
    target: 'edger',
    inputSlots: ['counts', 'metadata'],
    defaultParams: {
      fdr: 0.05,
    },
    category: 'differential',
  },
  {
    name: 'aldex2',
    description: 'ALDEx2 compositional differential abundance',
    verb: 'stat',
    target: 'aldex2',
    inputSlots: ['counts', 'metadata'],
    defaultParams: {
      mc_samples: 128,
      test: 'welch',
    },
    category: 'differential',
  },
  {
    name: 'ancombc',
    description: 'ANCOM-BC differential abundance',
    verb: 'stat',
    target: 'ancombc',
    inputSlots: ['counts', 'metadata'],
    defaultParams: {
      alpha: 0.05,
    },
    category: 'differential',
  },
  {
    name: 'maaslin2',
    description: 'MaAsLin2 multivariate association',
    verb: 'stat',
    target: 'maaslin2',
    inputSlots: ['counts', 'metadata'],
    defaultParams: {
      normalization: 'TSS',
      transform: 'LOG',
    },
    category: 'differential',
  },

  // ============================================
  // VISUALIZATION
  // ============================================
  {
    name: 'heatmap',
    description: 'Heatmap visualization',
    verb: 'viz',
    target: 'heatmap',
    inputSlots: ['counts'],
    defaultParams: {
      cluster_rows: true,
      cluster_cols: true,
      scale: 'row',
    },
    category: 'visualization',
  },
  {
    name: 'barplot',
    description: 'Stacked bar plot of composition',
    verb: 'viz',
    target: 'barplot',
    inputSlots: ['counts', 'metadata'],
    defaultParams: {
      top_n: 20,
      group_by: null,
    },
    category: 'visualization',
  },
  {
    name: 'boxplot',
    description: 'Box plot visualization',
    verb: 'viz',
    target: 'boxplot',
    inputSlots: ['data', 'metadata'],
    category: 'visualization',
  },
  {
    name: 'volcano',
    description: 'Volcano plot for differential abundance',
    verb: 'viz',
    target: 'volcano',
    inputSlots: ['results'],
    defaultParams: {
      pvalue_threshold: 0.05,
      lfc_threshold: 1,
    },
    category: 'visualization',
  },

  // ============================================
  // CLUSTERING
  // ============================================
  {
    name: 'hclust',
    description: 'Hierarchical clustering',
    verb: 'cluster',
    target: 'hierarchical',
    inputSlots: ['distance'],
    defaultParams: {
      method: 'complete',
    },
    category: 'clustering',
  },
  {
    name: 'kmeans',
    description: 'K-means clustering',
    verb: 'cluster',
    target: 'kmeans',
    inputSlots: ['counts'],
    defaultParams: {
      k: 3,
      nstart: 25,
    },
    category: 'clustering',
  },
  {
    name: 'pam',
    description: 'Partitioning Around Medoids',
    verb: 'cluster',
    target: 'pam',
    inputSlots: ['distance'],
    defaultParams: {
      k: 3,
    },
    category: 'clustering',
  },

  // ============================================
  // CORRELATION
  // ============================================
  {
    name: 'correlation',
    description: 'Feature correlation analysis',
    verb: 'stat',
    target: 'correlation',
    inputSlots: ['counts'],
    defaultParams: {
      method: 'spearman',
    },
    category: 'correlation',
  },
  {
    name: 'sparcc',
    description: 'SparCC correlation for compositional data',
    verb: 'stat',
    target: 'sparcc',
    inputSlots: ['counts'],
    defaultParams: {
      iterations: 20,
    },
    category: 'correlation',
  },

  // ============================================
  // MACHINE LEARNING
  // ============================================
  {
    name: 'random_forest',
    description: 'Random Forest classification/regression',
    verb: 'fit',
    target: 'rf',
    inputSlots: ['counts', 'metadata'],
    defaultParams: {
      ntree: 500,
      importance: true,
    },
    category: 'ml',
  },
  {
    name: 'cross_validate',
    description: 'Cross-validation for model evaluation',
    verb: 'fit',
    target: 'cv',
    inputSlots: ['counts', 'metadata'],
    defaultParams: {
      folds: 5,
      repeats: 10,
    },
    category: 'ml',
  },
];

/**
 * Get primitives by category
 */
export function getBioforgeByCategory(category: string): PrimitiveConfig[] {
  return BIOFORGE_PRIMITIVES.filter(p => p.category === category);
}

/**
 * List all bioforge categories
 */
export function getBioforgeCategories(): string[] {
  const cats = new Set(BIOFORGE_PRIMITIVES.map(p => p.category).filter(Boolean));
  return Array.from(cats) as string[];
}
