/**
 * Steno-Graph Configuration Tests
 */

import {
  resolveVocabulary,
  registerExtension,
  unregisterExtension,
  getExtension,
  listExtensions,
  isKnownVerb,
  isKnownFlag,
  isKnownMode,
  resolveVerbAlias,
  getVerbTokens,
  getFlagTokens,
  CORE_EXTENSION,
} from './index';
import { createParser } from '../parser/factory';
import type { DomainExtension } from './types';

// Test extension (simulates what a user would create)
const TEST_EXTENSION: DomainExtension = {
  name: 'test',
  description: 'Test extension',
  verbs: [
    { token: 'analyze', description: 'Analyze data', category: 'test' },
    { token: 'eda', description: 'EDA alias', category: 'test', aliasOf: 'dx' },
  ],
  flags: [
    { token: 'plot', description: 'Generate plot', type: 'output' },
    { token: 'verbose', description: 'Verbose output', type: 'behavior' },
  ],
};

describe('Vocabulary Resolver', () => {
  beforeEach(() => {
    // Clean up any registered extensions
    unregisterExtension('test');
  });

  test('resolves core vocabulary by default', () => {
    const vocab = resolveVocabulary();

    expect(isKnownVerb(vocab, 'mk')).toBe(true);
    expect(isKnownVerb(vocab, 'ch')).toBe(true);
    expect(isKnownVerb(vocab, 'dx')).toBe(true);
    expect(isKnownFlag(vocab, 'ts')).toBe(true);
    expect(isKnownMode(vocab, 'plan')).toBe(true);
  });

  test('includes registered extension when requested', () => {
    registerExtension(TEST_EXTENSION);
    const vocab = resolveVocabulary({ extensions: ['test'] });

    expect(isKnownVerb(vocab, 'analyze')).toBe(true);
    expect(isKnownFlag(vocab, 'plot')).toBe(true);
    expect(isKnownFlag(vocab, 'verbose')).toBe(true);
  });

  test('resolves verb aliases', () => {
    registerExtension(TEST_EXTENSION);
    const vocab = resolveVocabulary({ extensions: ['test'] });

    // 'eda' is an alias for 'dx'
    expect(resolveVerbAlias(vocab, 'eda')).toBe('dx');
    expect(resolveVerbAlias(vocab, 'dx')).toBe('dx');
  });

  test('adds custom verbs', () => {
    const vocab = resolveVocabulary({
      customVerbs: [
        { token: 'custom', description: 'Custom verb', category: 'custom' },
      ],
    });

    expect(isKnownVerb(vocab, 'custom')).toBe(true);
  });

  test('adds custom flags', () => {
    const vocab = resolveVocabulary({
      customFlags: [
        { token: 'json', description: 'JSON output', type: 'output' },
      ],
    });

    expect(isKnownFlag(vocab, 'json')).toBe(true);
  });

  test('can exclude core vocabulary', () => {
    const vocab = resolveVocabulary({
      includeCore: false,
      customVerbs: [
        { token: 'only', description: 'The only verb', category: 'custom' },
      ],
    });

    expect(isKnownVerb(vocab, 'mk')).toBe(false);
    expect(isKnownVerb(vocab, 'only')).toBe(true);
  });

  test('lists all verb tokens', () => {
    const vocab = resolveVocabulary();
    const verbs = getVerbTokens(vocab);

    expect(verbs).toContain('mk');
    expect(verbs).toContain('ch');
    expect(verbs).toContain('dx');
  });

  test('lists all flag tokens', () => {
    const vocab = resolveVocabulary();
    const flags = getFlagTokens(vocab);

    expect(flags).toContain('ts');
    expect(flags).toContain('doc');
  });
});

describe('Extension Registry', () => {
  beforeEach(() => {
    unregisterExtension('test');
  });

  test('starts with only core extension', () => {
    const extensions = listExtensions();

    expect(extensions).toContain('core');
    expect(extensions.length).toBe(1);
  });

  test('registers and retrieves extensions', () => {
    registerExtension(TEST_EXTENSION);

    const extensions = listExtensions();
    expect(extensions).toContain('core');
    expect(extensions).toContain('test');

    const retrieved = getExtension('test');
    expect(retrieved?.name).toBe('test');
  });

  test('unregisters extensions', () => {
    registerExtension(TEST_EXTENSION);
    expect(listExtensions()).toContain('test');

    const result = unregisterExtension('test');
    expect(result).toBe(true);
    expect(listExtensions()).not.toContain('test');
  });

  test('cannot unregister core', () => {
    const result = unregisterExtension('core');
    expect(result).toBe(false);
    expect(listExtensions()).toContain('core');
  });

  test('returns undefined for unknown extension', () => {
    const unknown = getExtension('unknown');
    expect(unknown).toBeUndefined();
  });
});

describe('createParser with Extensions', () => {
  beforeEach(() => {
    unregisterExtension('test');
  });

  test('creates parser with default config', () => {
    const parser = createParser();

    const result = parser.parse('mk:api +auth');
    expect(result.success).toBe(true);
    expect(result.intent?.verb).toBe('mk');
  });

  test('creates parser with registered extension', () => {
    registerExtension(TEST_EXTENSION);
    const parser = createParser({ extensions: ['test'] });

    // Should recognize extension verbs
    const result = parser.parse('analyze:data .plot');
    expect(result.success).toBe(true);
    expect(result.intent?.verb).toBe('analyze');
    expect(result.intent?.flags).toHaveLength(1);
    expect(result.intent?.flags[0].type).toBe('plot');
  });

  test('resolves verb aliases', () => {
    registerExtension(TEST_EXTENSION);
    const parser = createParser({ extensions: ['test'] });

    // 'eda' should resolve to 'dx'
    const result = parser.parse('eda:@data.csv');
    expect(result.success).toBe(true);
    expect(result.intent?.verb).toBe('dx');
  });

  test('exposes vocabulary check methods', () => {
    registerExtension(TEST_EXTENSION);
    const parser = createParser({ extensions: ['test'] });

    expect(parser.isVerb('mk')).toBe(true);
    expect(parser.isVerb('analyze')).toBe(true);
    expect(parser.isVerb('unknown')).toBe(false);

    expect(parser.isFlag('ts')).toBe(true);
    expect(parser.isFlag('plot')).toBe(true);
    expect(parser.isFlag('unknown')).toBe(false);
  });
});

describe('Core Extension', () => {
  test('core extension has expected verbs', () => {
    expect(CORE_EXTENSION.verbs.map(v => v.token)).toEqual(
      expect.arrayContaining(['mk', 'ch', 'rm', 'dx', 'fnd', 'ts', 'doc'])
    );
  });

  test('core extension has expected flags', () => {
    expect(CORE_EXTENSION.flags.map(f => f.token)).toEqual(
      expect.arrayContaining(['ts', 'doc', 'dry', 'web'])
    );
  });

  test('core extension has expected modes', () => {
    expect(CORE_EXTENSION.modes?.map(m => m.token)).toEqual(
      expect.arrayContaining(['plan', 'sketch', 'challenge', 'explore', 'execute'])
    );
  });
});
