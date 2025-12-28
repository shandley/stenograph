#!/usr/bin/env npx ts-node
/**
 * Steno-Graph Vignette: Gene Expression Analysis
 *
 * This demonstrates an end-to-end workflow analyzing gene expression data.
 * Run with: npx ts-node examples/vignette/run-vignette.ts
 */

import {
  createParser,
  createMapper,
  registerExtension,
  serializeToYAML
} from '../../dist/index.js';
import type { DomainExtension } from '../../dist/config/types.js';
import type { PrimitiveConfig, DirectMappingResult, ClaudeMappingResult, ClarifyMappingResult } from '../../dist/mapper/types.js';

// ============================================
// STEP 1: Define our domain extension
// ============================================

const GENOMICS_EXTENSION: DomainExtension = {
  name: 'genomics',
  description: 'Gene expression analysis vocabulary',
  verbs: [
    { token: 'viz', description: 'Visualize data', category: 'genomics' },
    { token: 'stat', description: 'Statistical test', category: 'genomics' },
    { token: 'norm', description: 'Normalize data', category: 'genomics' },
    { token: 'filter', description: 'Filter data', category: 'genomics' },
    { token: 'cluster', description: 'Cluster analysis', category: 'genomics' },
  ],
  flags: [
    { token: 'plot', description: 'Generate plot', type: 'output' },
    { token: 'report', description: 'Generate report', type: 'output' },
    { token: 'log', description: 'Log transform', type: 'behavior' },
  ],
};

// Register the extension
registerExtension(GENOMICS_EXTENSION);

// ============================================
// STEP 2: Define primitives (analysis functions)
// ============================================

const GENOMICS_PRIMITIVES: PrimitiveConfig[] = [
  {
    name: 'diagnose',
    description: 'Explore and summarize dataset',
    verb: 'dx',
    inputSlots: ['data'],
    category: 'exploration',
  },
  {
    name: 'pca',
    description: 'Principal Component Analysis',
    verb: 'viz',
    target: 'pca',
    inputSlots: ['data'],
    defaultParams: { n_components: 3, scale: true },
    category: 'ordination',
  },
  {
    name: 'heatmap',
    description: 'Heatmap visualization',
    verb: 'viz',
    target: 'heatmap',
    inputSlots: ['data'],
    defaultParams: { cluster_rows: true, cluster_cols: true },
    category: 'visualization',
  },
  {
    name: 'boxplot',
    description: 'Box plot by group',
    verb: 'viz',
    target: 'boxplot',
    inputSlots: ['data', 'metadata'],
    category: 'visualization',
  },
  {
    name: 'ttest',
    description: 'T-test between groups',
    verb: 'stat',
    target: 'ttest',
    inputSlots: ['data', 'metadata'],
    defaultParams: { alpha: 0.05 },
    category: 'statistics',
  },
  {
    name: 'anova',
    description: 'ANOVA across groups',
    verb: 'stat',
    target: 'anova',
    inputSlots: ['data', 'metadata'],
    defaultParams: { alpha: 0.05 },
    category: 'statistics',
  },
  {
    name: 'normalize_quantile',
    description: 'Quantile normalization',
    verb: 'norm',
    target: 'quantile',
    inputSlots: ['data'],
    category: 'preprocessing',
  },
  {
    name: 'normalize_log',
    description: 'Log transformation',
    verb: 'ch',
    additions: ['log'],
    inputSlots: ['data'],
    defaultParams: { base: 2, pseudocount: 1 },
    category: 'preprocessing',
  },
  {
    name: 'filter_variance',
    description: 'Filter by variance',
    verb: 'filter',
    target: 'variance',
    inputSlots: ['data'],
    defaultParams: { top_n: 100 },
    category: 'preprocessing',
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

// ============================================
// STEP 3: Create parser and mapper
// ============================================

const parser = createParser({ extensions: ['genomics'] });
const mapper = createMapper({ primitives: GENOMICS_PRIMITIVES });

// ============================================
// STEP 4: Process steno commands
// ============================================

function processCommand(input: string): void {
  console.log('\n' + '='.repeat(60));
  console.log(`STENO INPUT: ${input}`);
  console.log('='.repeat(60));

  // Parse
  const parseResult = parser.parse(input);

  if (!parseResult.success) {
    console.log('\n❌ PARSE ERROR:');
    parseResult.errors.forEach(e => console.log(`   ${e.message}`));
    return;
  }

  console.log('\n📋 PARSED INTENT:');
  const intent = parseResult.intent!;
  console.log(`   Verb: ${intent.verb}`);
  console.log(`   Target: ${intent.target.raw} (${intent.target.type})`);
  if (intent.refs.length > 0) {
    console.log(`   References: ${intent.refs.map(r => r.value).join(', ')}`);
  }
  if (intent.additions.length > 0) {
    console.log(`   Additions: +${intent.additions.join(', +')}`);
  }
  if (intent.flags.length > 0) {
    console.log(`   Flags: ${intent.flags.map(f => `.${f.type}${f.qualifier ? ':' + f.qualifier : ''}`).join(' ')}`);
  }
  if (intent.mode) {
    console.log(`   Mode: ?${intent.mode}`);
  }
  if (intent.thinking !== 'normal') {
    console.log(`   Thinking: ~${intent.thinking}`);
  }

  // Map
  const mapping = mapper.map(intent);

  console.log('\n🎯 MAPPING RESULT:');
  console.log(`   Type: ${mapping.type.toUpperCase()}`);

  switch (mapping.type) {
    case 'direct': {
      const direct = mapping as DirectMappingResult;
      console.log(`   Primitive: ${direct.primitive}`);
      console.log(`   Inputs: ${JSON.stringify(direct.inputs)}`);
      console.log(`   Params: ${JSON.stringify(direct.params)}`);

      console.log('\n📄 YAML FOR DAEMON:');
      const yaml = mapper.toYAML(direct);
      console.log(serializeToYAML(yaml).split('\n').map(l => '   ' + l).join('\n'));
      break;
    }
    case 'claude': {
      const claude = mapping as ClaudeMappingResult;
      console.log(`   Reason: ${claude.reason}`);
      if (claude.thinking !== 'normal') {
        console.log(`   Thinking Mode: ${claude.thinking}`);
      }
      console.log(`   → Would route to Claude for interpretation`);
      break;
    }
    case 'clarify': {
      const clarify = mapping as ClarifyMappingResult;
      console.log(`   Question: ${clarify.question}`);
      console.log(`   Options:`);
      clarify.options.forEach((opt, i) => {
        console.log(`     ${i + 1}. ${opt.label} (${opt.primitive})`);
      });
      break;
    }
    case 'error':
      console.log(`   Error: ${mapping.message}`);
      break;
  }
}

// ============================================
// STEP 5: Run the vignette
// ============================================

console.log(`
╔════════════════════════════════════════════════════════════╗
║     Steno-Graph Vignette: Gene Expression Analysis         ║
╠════════════════════════════════════════════════════════════╣
║  Data: examples/vignette/samples.csv                       ║
║        examples/vignette/metadata.csv                      ║
║                                                            ║
║  This demonstrates how steno-graph parses compressed       ║
║  commands and routes them to execution strategies.         ║
╚════════════════════════════════════════════════════════════╝
`);

// Scenario: Analyzing gene expression data from a treatment study

console.log('\n📊 SCENARIO: Treatment vs Control Gene Expression Study');
console.log('   18 samples, 5 genes, 2 conditions, 3 timepoints\n');

// Step 1: Explore the data
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│ STEP 1: Explore the data                                │');
console.log('└─────────────────────────────────────────────────────────┘');

processCommand('dx:@samples.csv');

// Step 2: Normalize
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│ STEP 2: Log-transform the data                          │');
console.log('└─────────────────────────────────────────────────────────┘');

processCommand('ch:@samples.csv +log');

// Step 3: Visualize with PCA
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│ STEP 3: PCA visualization                               │');
console.log('└─────────────────────────────────────────────────────────┘');

processCommand('viz:pca @samples.csv .plot:png');

// Step 4: Heatmap
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│ STEP 4: Heatmap of expression patterns                  │');
console.log('└─────────────────────────────────────────────────────────┘');

processCommand('viz:heatmap @samples.csv');

// Step 5: Statistical test
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│ STEP 5: T-test between treatment and control            │');
console.log('└─────────────────────────────────────────────────────────┘');

processCommand('stat:ttest @samples.csv @metadata.csv');

// Step 6: Clustering
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│ STEP 6: K-means clustering                              │');
console.log('└─────────────────────────────────────────────────────────┘');

processCommand('cluster:kmeans @samples.csv');

// Now show Claude routing examples
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│ STEP 7: Complex request → Routes to Claude              │');
console.log('└─────────────────────────────────────────────────────────┘');

processCommand('?plan differential-expression @samples.csv +batch-correction');

// Extended thinking
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│ STEP 8: Deep analysis → Extended thinking               │');
console.log('└─────────────────────────────────────────────────────────┘');

processCommand('dx:@samples.csv ~deep');

// Clarification example
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│ STEP 9: Ambiguous request → User clarification          │');
console.log('└─────────────────────────────────────────────────────────┘');

processCommand('stat:test? @samples.csv @metadata.csv');

// Summary
console.log('\n' + '═'.repeat(60));
console.log('VIGNETTE COMPLETE');
console.log('═'.repeat(60));
console.log(`
Key takeaways:

1. DIRECT EXECUTION (fast path):
   dx:@file.csv           → diagnose primitive
   viz:pca @file.csv      → pca primitive
   stat:ttest @a.csv @b.csv → ttest primitive

2. CLAUDE ROUTING (complex/ambiguous):
   ?plan ...              → planning mode
   ~deep                  → extended thinking
   freeform text          → needs interpretation

3. USER CLARIFICATION (explicit uncertainty):
   stat:test?             → which test?
   fit:model?             → which model?

The consumer (your app) receives typed results and decides
how to execute: run primitive, call Claude, or prompt user.
`);
