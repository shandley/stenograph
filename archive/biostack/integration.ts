/**
 * BioStack Integration Example
 *
 * Demonstrates how steno-graph integrates with the biostack ecosystem:
 * - bioforge primitives
 * - bioengine daemon (via YAML commands)
 * - bioview-web companion panel
 *
 * This is a complete working example that can be adapted for bioview-web.
 */

import { createParser, createMapper, registerExtension, serializeToYAML } from '../../src/index';
import { BIOFORGE_PRIMITIVES, BIOSTACK_EXTENSION } from './bioforge-registry';
import type {
  MappingResult,
  DirectMappingResult,
  ClaudeMappingResult,
  ClarifyMappingResult,
} from '../../src/mapper/types';

// ============================================
// SETUP: Configure parser and mapper
// ============================================

// Register the biostack extension
registerExtension(BIOSTACK_EXTENSION);

/**
 * Create the steno-graph parser with biostack extension
 */
const parser = createParser({
  extensions: ['biostack'],
  // Add any custom verbs/flags specific to your biostack instance
  customVerbs: [
    { token: 'ingest', description: 'Ingest data from external source', category: 'custom' },
  ],
  customFlags: [
    { token: 'cache', description: 'Cache results', type: 'behavior' },
  ],
});

/**
 * Create the mapper with bioforge primitives
 */
const mapper = createMapper({
  primitives: BIOFORGE_PRIMITIVES,
  defaultInputSlot: 'counts',
});

// ============================================
// INTEGRATION: Handle steno input
// ============================================

/**
 * Result of processing steno input
 */
export interface StenoResult {
  type: 'execute' | 'claude' | 'clarify' | 'error';
  data: unknown;
}

/**
 * Process steno input and route appropriately
 *
 * This is the main entry point for bioview-web's StenoInput component.
 */
export async function handleStenoInput(input: string): Promise<StenoResult> {
  // Step 1: Parse the input
  const parseResult = parser.parse(input);

  if (!parseResult.success) {
    return {
      type: 'error',
      data: {
        message: 'Parse error',
        errors: parseResult.errors,
        warnings: parseResult.warnings,
      },
    };
  }

  // Step 2: Map to execution strategy
  const mapping = mapper.map(parseResult.intent!);

  // Step 3: Route based on mapping type
  switch (mapping.type) {
    case 'direct':
      return handleDirectExecution(mapping);

    case 'claude':
      return handleClaudeRouting(mapping);

    case 'clarify':
      return handleClarification(mapping);

    case 'error':
      return {
        type: 'error',
        data: { message: mapping.message },
      };
  }
}

// ============================================
// EXECUTION HANDLERS
// ============================================

/**
 * Handle direct primitive execution
 *
 * Writes YAML command file to .biostack/commands/ for bioengine to pick up.
 */
async function handleDirectExecution(mapping: DirectMappingResult): Promise<StenoResult> {
  const yaml = mapper.toYAML(mapping);
  const yamlString = serializeToYAML(yaml);

  // In production, this would write to the filesystem
  // await writeCommandFile(yamlString);

  console.log('=== DIRECT EXECUTION ===');
  console.log(`Primitive: ${mapping.primitive}`);
  console.log(`Inputs: ${JSON.stringify(mapping.inputs)}`);
  console.log(`Params: ${JSON.stringify(mapping.params)}`);
  console.log('\nYAML for bioengine:');
  console.log(yamlString);

  return {
    type: 'execute',
    data: {
      primitive: mapping.primitive,
      yaml: yamlString,
      inputs: mapping.inputs,
      params: mapping.params,
    },
  };
}

/**
 * Handle Claude routing
 *
 * Sends the intent to Claude terminal for interpretation.
 */
async function handleClaudeRouting(mapping: ClaudeMappingResult): Promise<StenoResult> {
  // Build prompt for Claude
  const prompt = buildClaudePrompt(mapping);

  console.log('=== CLAUDE ROUTING ===');
  console.log(`Reason: ${mapping.reason}`);
  console.log(`Thinking: ${mapping.thinking}`);
  console.log('\nPrompt for Claude:');
  console.log(prompt);

  return {
    type: 'claude',
    data: {
      reason: mapping.reason,
      prompt,
      thinking: mapping.thinking,
      intent: mapping.intent,
    },
  };
}

/**
 * Handle user clarification
 *
 * Returns options for the user to choose from.
 */
async function handleClarification(mapping: ClarifyMappingResult): Promise<StenoResult> {
  console.log('=== CLARIFICATION NEEDED ===');
  console.log(`Question: ${mapping.question}`);
  console.log('\nOptions:');
  mapping.options.forEach((opt, i) => {
    console.log(`  ${i + 1}. ${opt.label}: ${opt.description || ''}`);
  });

  return {
    type: 'clarify',
    data: {
      question: mapping.question,
      options: mapping.options,
      intent: mapping.intent,
    },
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build a prompt for Claude based on the intent
 */
function buildClaudePrompt(mapping: ClaudeMappingResult): string {
  const parts: string[] = [];
  const intent = mapping.intent;

  parts.push(`I need help with the following operation:`);
  parts.push('');
  parts.push(`**Command:** \`${intent.raw}\``);
  parts.push('');

  if (mapping.context) {
    parts.push('**Context:**');
    parts.push(mapping.context);
    parts.push('');
  }

  parts.push('**Available bioforge primitives:**');
  parts.push('- Exploration: diagnose, summarize');
  parts.push('- Normalization: tmm, rle, clr, css, tss');
  parts.push('- Ordination: pca, pcoa, nmds, umap, tsne');
  parts.push('- Statistics: permanova, anosim, deseq2, aldex2, ancombc');
  parts.push('- Visualization: heatmap, barplot, boxplot, volcano');
  parts.push('');

  if (intent.mode === 'plan') {
    parts.push('Please create a step-by-step analysis plan using the available primitives.');
  } else if (intent.freeform.length > 0) {
    parts.push('Please interpret this request and suggest the appropriate primitives to use.');
  } else {
    parts.push('Please help me determine how to accomplish this task.');
  }

  return parts.join('\n');
}

/**
 * Write a command file for bioengine
 * (Placeholder - in production, this writes to .biostack/commands/)
 */
async function writeCommandFile(yaml: string): Promise<string> {
  const timestamp = Date.now();
  const filename = `cmd_${timestamp}.yaml`;
  const filepath = `.biostack/commands/${filename}`;

  // In production:
  // await fs.writeFile(filepath, yaml);

  console.log(`Would write to: ${filepath}`);
  return filepath;
}

// ============================================
// DEMO: Run example commands
// ============================================

async function demo() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         BioStack + Steno-Graph Integration Demo            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const examples = [
    // Direct execution examples
    'dx:@counts.csv',
    'viz:pca @counts.csv .plot:png',
    'normalize:tmm @counts.csv',
    'stat:permanova @distance.csv @metadata.csv',
    'viz:heatmap @counts.csv +cluster',
    'ch:@data.csv +normalize',

    // Claude routing examples
    '?plan differential-abundance +batch-correction',
    'dx:@counts.csv ~deep',
    'ch:@data.csv fix the outliers and remove batch effects',

    // Clarification examples
    'fit:model? @counts.csv',
    'stat:test? @groups.csv',
  ];

  for (const input of examples) {
    console.log('────────────────────────────────────────────────────────────');
    console.log(`Input: ${input}`);
    console.log('');

    const result = await handleStenoInput(input);
    console.log(`\nResult type: ${result.type}`);
    console.log('');
  }
}

// Run demo if executed directly
demo().catch(console.error);
