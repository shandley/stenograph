/**
 * Steno-Graph Parser Tests
 *
 * Run with: npx vitest src/parser/parser.test.ts
 *        or: npx jest src/parser/parser.test.ts
 */

import { parse } from './parser';
import { tokenize } from './tokenizer';

describe('Tokenizer', () => {
  test('tokenizes verb:target', () => {
    const tokens = tokenize('mk:api');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('VERB_TARGET');
    expect(tokens[0].value).toBe('mk');
    expect(tokens[0].qualifier).toBe('api');
  });

  test('tokenizes additions', () => {
    const tokens = tokenize('mk:api +auth +cache');
    expect(tokens).toHaveLength(3);
    expect(tokens[1].type).toBe('ADDITION');
    expect(tokens[1].value).toBe('auth');
    expect(tokens[2].type).toBe('ADDITION');
    expect(tokens[2].value).toBe('cache');
  });

  test('tokenizes flags with qualifiers', () => {
    const tokens = tokenize('mk:api .ts:edge');
    expect(tokens).toHaveLength(2);
    expect(tokens[1].type).toBe('FLAG');
    expect(tokens[1].value).toBe('ts');
    expect(tokens[1].qualifier).toBe('edge');
  });

  test('tokenizes previous references', () => {
    const tokens = tokenize('ch:login ^signup');
    expect(tokens).toHaveLength(2);
    expect(tokens[1].type).toBe('PREV_REF');
    expect(tokens[1].value).toBe('^');
    expect(tokens[1].qualifier).toBe('signup');
  });

  test('tokenizes file references', () => {
    // When @file is the target, it's part of VERB_TARGET
    const tokens = tokenize('ch:@auth.ts');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('VERB_TARGET');
    expect(tokens[0].qualifier).toBe('@auth.ts');

    // When @file is a separate reference
    const tokens2 = tokenize('dx:api @auth.ts');
    expect(tokens2).toHaveLength(2);
    expect(tokens2[1].type).toBe('FILE_REF');
    expect(tokens2[1].value).toBe('auth.ts');
  });

  test('tokenizes modes', () => {
    const tokens = tokenize('?plan api');
    expect(tokens).toHaveLength(2);
    expect(tokens[0].type).toBe('MODE');
    expect(tokens[0].value).toBe('plan');
  });

  test('captures freeform tokens', () => {
    const tokens = tokenize('mk:ttt python simple');
    expect(tokens).toHaveLength(3);
    expect(tokens[1].type).toBe('FREEFORM');
    expect(tokens[1].value).toBe('python');
    expect(tokens[2].type).toBe('FREEFORM');
    expect(tokens[2].value).toBe('simple');
  });

  test('treats unknown .modifier as addition', () => {
    const tokens = tokenize('mk:api .stack');
    expect(tokens).toHaveLength(2);
    expect(tokens[1].type).toBe('ADDITION');
    expect(tokens[1].value).toBe('stack');
  });
});

describe('Parser', () => {
  test('parses minimal input', () => {
    const result = parse('mk:ttt');
    expect(result.success).toBe(true);
    expect(result.intent?.verb).toBe('mk');
    expect(result.intent?.target.raw).toBe('ttt');
  });

  test('parses additions', () => {
    const result = parse('mk:api +auth +cache');
    expect(result.success).toBe(true);
    expect(result.intent?.additions).toEqual(['auth', 'cache']);
  });

  test('parses exclusions', () => {
    const result = parse('mk:api -logging -debug');
    expect(result.success).toBe(true);
    expect(result.intent?.exclusions).toEqual(['logging', 'debug']);
  });

  test('parses flags', () => {
    const result = parse('mk:api .ts .doc');
    expect(result.success).toBe(true);
    expect(result.intent?.flags).toHaveLength(2);
    expect(result.intent?.flags[0].type).toBe('ts');
    expect(result.intent?.flags[1].type).toBe('doc');
  });

  test('parses flag qualifiers', () => {
    const result = parse('mk:api .ts:edge');
    expect(result.success).toBe(true);
    expect(result.intent?.flags[0].qualifier).toBe('edge');
  });

  test('parses clarify precision from trailing ?', () => {
    const result = parse('mk:auth?');
    expect(result.success).toBe(true);
    expect(result.intent?.target.raw).toBe('auth');
    expect(result.intent?.precision).toBe('clarify');
  });

  test('parses literal precision from trailing !', () => {
    const result = parse('fnd:getUserById!');
    expect(result.success).toBe(true);
    expect(result.intent?.target.raw).toBe('getUserById');
    expect(result.intent?.precision).toBe('literal');
  });

  test('parses deep thinking', () => {
    const result = parse('mk:api ~deep');
    expect(result.success).toBe(true);
    expect(result.intent?.thinking).toBe('deep');
  });

  test('parses mode', () => {
    const result = parse('?plan api/v2');
    expect(result.success).toBe(true);
    expect(result.intent?.mode).toBe('plan');
  });

  test('parses previous references', () => {
    const result = parse('ch:login ^signup');
    expect(result.success).toBe(true);
    expect(result.intent?.refs).toHaveLength(1);
    expect(result.intent?.refs[0].type).toBe('previous');
    expect(result.intent?.refs[0].selector).toBe('signup');
  });

  test('parses node references as target', () => {
    // @node directly after verb: is the target
    const result = parse('ch:@api-v1 +caching');
    expect(result.success).toBe(true);
    expect(result.intent?.target.raw).toBe('@api-v1');
    expect(result.intent?.target.type).toBe('node');
    expect(result.intent?.additions).toContain('caching');
  });

  test('parses node references as context', () => {
    // @node as separate token is a reference
    const result = parse('ch:login @api-v1');
    expect(result.success).toBe(true);
    expect(result.intent?.target.raw).toBe('login');
    expect(result.intent?.refs).toHaveLength(1);
    expect(result.intent?.refs[0].type).toBe('node');
    expect(result.intent?.refs[0].value).toBe('api-v1');
  });

  test('parses file references as target', () => {
    // @file.ext directly after verb: is the target
    const result = parse('ch:@auth.ts +logging');
    expect(result.success).toBe(true);
    expect(result.intent?.target.raw).toBe('@auth.ts');
    expect(result.intent?.target.type).toBe('file');
    expect(result.intent?.additions).toContain('logging');
  });

  test('parses file references as context', () => {
    // @file.ext as separate token is a reference
    const result = parse('dx:api @auth.ts');
    expect(result.success).toBe(true);
    expect(result.intent?.target.raw).toBe('api');
    expect(result.intent?.refs).toHaveLength(1);
    expect(result.intent?.refs[0].type).toBe('file');
    expect(result.intent?.refs[0].value).toBe('auth.ts');
  });

  test('parses symbol references', () => {
    const result = parse('dx:api #handleRequest');
    expect(result.success).toBe(true);
    expect(result.intent?.refs).toHaveLength(1);
    expect(result.intent?.refs[0].type).toBe('symbol');
    expect(result.intent?.refs[0].value).toBe('handleRequest');
  });

  test('captures freeform content', () => {
    const result = parse('mk:api python rest');
    expect(result.success).toBe(true);
    expect(result.intent?.freeform).toContain('python');
    expect(result.intent?.freeform).toContain('rest');
  });

  test('parses complex input', () => {
    const result = parse('ch:login +rate-limit .ts:edge ^signup');
    expect(result.success).toBe(true);
    expect(result.intent?.verb).toBe('ch');
    expect(result.intent?.target.raw).toBe('login');
    expect(result.intent?.additions).toEqual(['rate-limit']);
    expect(result.intent?.flags[0].type).toBe('ts');
    expect(result.intent?.flags[0].qualifier).toBe('edge');
    expect(result.intent?.refs[0].selector).toBe('signup');
  });

  test('handles reordered tokens', () => {
    const result = parse('.ts +auth mk:api');
    expect(result.success).toBe(true);
    expect(result.intent?.verb).toBe('mk');
    expect(result.intent?.target.raw).toBe('api');
    expect(result.intent?.additions).toContain('auth');
    expect(result.intent?.flags[0].type).toBe('ts');
  });

  test('defaults to mk verb when no verb specified', () => {
    const result = parse('todo-app');
    expect(result.success).toBe(true);
    expect(result.intent?.verb).toBe('mk');
    expect(result.intent?.target.raw).toBe('todo-app');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('defaulting to');
  });

  test('fails on empty input', () => {
    const result = parse('');
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toBe('Empty input');
  });

  test('preserves raw input', () => {
    const input = 'mk:api +auth .ts';
    const result = parse(input);
    expect(result.intent?.raw).toBe(input);
  });
});

describe('Complex Examples', () => {
  test('medium complexity example from docs', () => {
    const result = parse('ch:login +rate-limit .ts:edge ^signup');
    expect(result.success).toBe(true);
    expect(result.intent).toMatchObject({
      verb: 'ch',
      target: { raw: 'login' },
      additions: ['rate-limit'],
      flags: [{ type: 'ts', qualifier: 'edge' }],
    });
  });

  test('high complexity example from docs', () => {
    const result = parse('?plan saas/grants-mgmt +billing +auth ~deep .web');
    expect(result.success).toBe(true);
    expect(result.intent).toMatchObject({
      verb: 'mk',
      mode: 'plan',
      additions: ['billing', 'auth'],
      thinking: 'deep',
      flags: [{ type: 'web' }],
    });
  });

  test('hybrid input with natural language', () => {
    const result = parse('ch:api and also add proper error handling');
    expect(result.success).toBe(true);
    expect(result.intent?.verb).toBe('ch');
    expect(result.intent?.target.raw).toBe('api');
    expect(result.intent?.freeform.join(' ')).toContain('error handling');
  });
});
