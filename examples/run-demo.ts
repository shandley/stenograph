/**
 * Demo Runner
 *
 * Run this after building: npm run build && npx ts-node examples/run-demo.ts
 */

// Use compiled output
import { createParser, createMapper, registerExtension, serializeToYAML } from '../dist/index.js';
// Import domain-specific extensions from examples
import { DATASCIENCE_EXTENSION } from './extensions/datascience.js';
import { ANALYSIS_PRIMITIVES } from './primitives/analysis.js';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║              Steno-Graph Demo                               ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Register the datascience extension
registerExtension(DATASCIENCE_EXTENSION);

// Create parser and mapper
const parser = createParser({ extensions: ['datascience'] });
const mapper = createMapper({ primitives: ANALYSIS_PRIMITIVES });

// Demo inputs
const examples = [
  // Direct execution
  'dx:@counts.csv',
  'viz:pca @counts.csv .plot:png',
  'stat:permanova @distance.csv @metadata.csv',
  'ch:@data.csv +normalize',

  // Claude routing
  '?plan differential-abundance +batch-correction',
  'dx:@data.csv ~deep',
  'ch:@data.csv fix the outliers',

  // Clarification
  'fit:model? @counts.csv',
];

for (const input of examples) {
  console.log('────────────────────────────────────────────────────────────');
  console.log(`Input: ${input}`);

  const parseResult = parser.parse(input);
  if (!parseResult.success) {
    console.log(`  Parse Error: ${parseResult.errors[0]?.message}`);
    continue;
  }

  const mapping = mapper.map(parseResult.intent!);

  switch (mapping.type) {
    case 'direct':
      console.log(`  → DIRECT: ${mapping.primitive}`);
      console.log(`    Inputs: ${JSON.stringify(mapping.inputs)}`);
      console.log(`    Params: ${JSON.stringify(mapping.params)}`);
      break;

    case 'claude':
      console.log(`  → CLAUDE: ${mapping.reason}`);
      console.log(`    Thinking: ${mapping.thinking}`);
      break;

    case 'clarify':
      console.log(`  → CLARIFY: ${mapping.question}`);
      console.log(`    Options: ${mapping.options.map(o => o.label).join(', ')}`);
      break;

    case 'error':
      console.log(`  → ERROR: ${mapping.message}`);
      break;
  }
  console.log('');
}

console.log('════════════════════════════════════════════════════════════');
console.log('Demo complete! All phases implemented:');
console.log('  ✓ Phase 1: Parser');
console.log('  ✓ Phase 2: Configuration');
console.log('  ✓ Phase 3: Mapper');
console.log('  ✓ Phase 4: Integration Examples');
