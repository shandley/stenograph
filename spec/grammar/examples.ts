/**
 * Steno-Graph Parser Examples
 *
 * Run with: npx ts-node src/parser/examples.ts
 */

import { parse, formatIntent, tokenize, formatTokens } from './index';

interface Example {
  input: string;
  description: string;
}

const examples: Example[] = [
  // Basic operations
  { input: 'mk:ttt', description: 'Minimal: make tic-tac-toe' },
  { input: 'mk:ttt py', description: 'With language hint' },
  { input: 'mk:api +auth +cache', description: 'With additions' },
  { input: 'mk:api +auth -logging', description: 'Addition and exclusion' },

  // Flags
  { input: 'mk:api .ts', description: 'With tests flag' },
  { input: 'mk:api .ts .doc', description: 'Multiple flags' },
  { input: 'mk:api .ts:edge', description: 'Flag with qualifier' },
  { input: 'mk:api .ts:edge .doc:api', description: 'Multiple qualified flags' },

  // Precision markers
  { input: 'mk:auth?', description: 'Clarify precision (trailing ?)' },
  { input: 'fnd:getUserById!', description: 'Literal precision (trailing !)' },
  { input: 'mk:api ~', description: 'Explicit flexible precision' },

  // Thinking depth
  { input: 'mk:api ~deep', description: 'Deep thinking' },
  { input: '?plan saas/grants ~deep .web', description: 'Planning with deep thinking and web search' },

  // Modes
  { input: '?plan api/v2', description: 'Plan mode' },
  { input: '?sketch auth-flow', description: 'Sketch mode' },
  { input: '?challenge this-approach', description: 'Challenge mode' },
  { input: '~explore caching-options', description: 'Explore mode' },
  { input: '~execute the-plan', description: 'Execute mode' },

  // References
  { input: 'ch:^ +validation', description: 'Reference previous output' },
  { input: 'ch:^^ +logging', description: 'Reference output before last' },
  { input: 'ch:login ^signup', description: 'Reference by name' },
  { input: 'ch:login ^2', description: 'Reference by index' },

  // Node and file references
  { input: 'ch:@api-v1 +caching', description: 'Node reference' },
  { input: 'ch:@auth.ts +logging', description: 'File reference' },
  { input: 'dx:@auth.ts #handleLogin', description: 'File and symbol reference' },
  { input: 'mk:dashboard <-@api.AuthService', description: 'Explicit dependency' },

  // Complex examples
  { input: 'ch:login +rate-limit .ts:edge ^signup', description: 'Medium complexity' },
  { input: '?plan saas/grants-mgmt +billing +auth ~deep .web', description: 'High complexity' },
  { input: 'fork:@api-v1 ch:schema +versioning', description: 'Fork and modify' },
  { input: 'merge:@feature-branch @main', description: 'Merge branches' },

  // Hybrid: structured + natural language
  { input: 'ch:api and also add proper error handling', description: 'Hybrid with freeform' },
  { input: 'mk:api "REST API with pagination"', description: 'Quoted description' },

  // Edge cases
  { input: 'build a todo app', description: 'Pure natural language (no verb prefix)' },
  { input: 'mk:rest-api-v2', description: 'Hyphenated target' },
  { input: 'mk:api/auth/jwt', description: 'Path-style target' },
  { input: '.ts +auth mk:api', description: 'Reordered tokens' },
];

function runExamples() {
  console.log('='.repeat(80));
  console.log('STENO-GRAPH PARSER EXAMPLES');
  console.log('='.repeat(80));
  console.log();

  for (const { input, description } of examples) {
    console.log(`\x1b[36m${description}\x1b[0m`);
    console.log(`Input:  \x1b[33m${input}\x1b[0m`);

    // Show tokens
    const tokens = tokenize(input);
    console.log(`Tokens: ${formatTokens(tokens)}`);

    // Show parsed intent
    const result = parse(input);

    if (result.success && result.intent) {
      console.log(`Intent: ${formatIntent(result.intent)}`);

      // Show JSON for complex examples
      if (input.includes('+') || input.includes('^') || input.includes('@')) {
        console.log(`JSON:   ${JSON.stringify(result.intent, null, 2).split('\n').join('\n        ')}`);
      }
    } else {
      console.log(`\x1b[31mErrors: ${result.errors.map(e => e.message).join(', ')}\x1b[0m`);
    }

    if (result.warnings.length) {
      console.log(`\x1b[33mWarnings: ${result.warnings.join(', ')}\x1b[0m`);
    }

    console.log();
    console.log('-'.repeat(80));
    console.log();
  }
}

// Run if executed directly
runExamples();
