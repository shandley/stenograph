/**
 * Generic Daemon Integration Example
 *
 * Shows how to integrate steno-graph with any command-based daemon.
 * This pattern works for:
 * - File-watching daemons (like bioengine)
 * - Message queue consumers
 * - WebSocket servers
 * - REST API backends
 */

import { createParser, createMapper, registerExtension, serializeToYAML } from '../../src/index';
import type { PrimitiveConfig, MappingResult, DirectMappingResult } from '../../src/mapper/types';
import type { DomainExtension } from '../../src/config/types';
import type { Intent } from '../../src/parser/types';

// ============================================
// DAEMON INTERFACE TYPES
// ============================================

/**
 * Command to be executed by the daemon
 */
export interface DaemonCommand {
  id: string;
  timestamp: number;
  primitive: string;
  inputs: Record<string, string>;
  params: Record<string, unknown>;
  metadata?: {
    source: 'steno' | 'api' | 'ui';
    rawInput?: string;
  };
}

/**
 * Daemon configuration
 */
export interface DaemonConfig {
  /** Directory to watch for command files */
  commandDir?: string;

  /** How to send commands to daemon */
  transport: 'file' | 'websocket' | 'http' | 'memory';

  /** WebSocket URL (if transport is 'websocket') */
  wsUrl?: string;

  /** HTTP endpoint (if transport is 'http') */
  httpUrl?: string;
}

/**
 * Daemon client interface
 */
export interface DaemonClient {
  /** Send a command to the daemon */
  send(command: DaemonCommand): Promise<void>;

  /** Check if daemon is available */
  isConnected(): boolean;
}

// ============================================
// STENO-DAEMON BRIDGE
// ============================================

/**
 * Bridge between steno-graph and a daemon
 */
export class StenoDaemonBridge {
  private parser;
  private mapper;
  private client: DaemonClient;
  private commandIdCounter = 0;

  constructor(
    primitives: PrimitiveConfig[],
    client: DaemonClient,
    parserExtensions: string[] = []
  ) {
    this.parser = createParser({
      extensions: parserExtensions,
    });

    this.mapper = createMapper({
      primitives,
    });

    this.client = client;
  }

  /**
   * Process steno input and send to daemon if direct execution
   */
  async process(input: string): Promise<ProcessResult> {
    // Parse
    const parseResult = this.parser.parse(input);
    if (!parseResult.success) {
      return {
        success: false,
        type: 'parse_error',
        errors: parseResult.errors,
      };
    }

    // Map
    const mapping = this.mapper.map(parseResult.intent!);

    // Handle based on type
    switch (mapping.type) {
      case 'direct':
        return this.handleDirect(mapping, input);

      case 'claude':
        return {
          success: true,
          type: 'claude',
          reason: mapping.reason,
          context: mapping.context,
          thinking: mapping.thinking,
          intent: mapping.intent,
        };

      case 'clarify':
        return {
          success: true,
          type: 'clarify',
          question: mapping.question,
          options: mapping.options,
          intent: mapping.intent,
        };

      case 'error':
        return {
          success: false,
          type: 'mapping_error',
          message: mapping.message,
        };
    }
  }

  /**
   * Handle direct execution - send to daemon
   */
  private async handleDirect(mapping: DirectMappingResult, rawInput: string): Promise<ProcessResult> {
    const command: DaemonCommand = {
      id: this.generateCommandId(),
      timestamp: Date.now(),
      primitive: mapping.primitive,
      inputs: mapping.inputs,
      params: mapping.params,
      metadata: {
        source: 'steno',
        rawInput,
      },
    };

    try {
      await this.client.send(command);
      return {
        success: true,
        type: 'executed',
        commandId: command.id,
        primitive: mapping.primitive,
        inputs: mapping.inputs,
        params: mapping.params,
      };
    } catch (error) {
      return {
        success: false,
        type: 'execution_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${++this.commandIdCounter}`;
  }
}

/**
 * Result of processing steno input
 */
export type ProcessResult =
  | { success: true; type: 'executed'; commandId: string; primitive: string; inputs: Record<string, string>; params: Record<string, unknown> }
  | { success: true; type: 'claude'; reason: string; context?: string; thinking: string; intent: Intent }
  | { success: true; type: 'clarify'; question: string; options: Array<{ label: string; primitive: string; description?: string }>; intent: Intent }
  | { success: false; type: 'parse_error'; errors: Array<{ message: string }> }
  | { success: false; type: 'mapping_error'; message: string }
  | { success: false; type: 'execution_error'; message: string };

// ============================================
// EXAMPLE DAEMON CLIENTS
// ============================================

/**
 * File-based daemon client (like bioengine)
 */
export class FileDaemonClient implements DaemonClient {
  private commandDir: string;

  constructor(commandDir: string) {
    this.commandDir = commandDir;
  }

  async send(command: DaemonCommand): Promise<void> {
    const yaml = this.commandToYAML(command);
    const filepath = `${this.commandDir}/${command.id}.yaml`;

    // In production: await fs.writeFile(filepath, yaml);
    console.log(`[FileDaemon] Would write to ${filepath}:`);
    console.log(yaml);
  }

  isConnected(): boolean {
    // In production: check if directory exists and is writable
    return true;
  }

  private commandToYAML(command: DaemonCommand): string {
    const lines: string[] = [];
    lines.push(`# Command ID: ${command.id}`);
    lines.push(`# Timestamp: ${new Date(command.timestamp).toISOString()}`);
    lines.push(`primitive: ${command.primitive}`);

    lines.push('inputs:');
    for (const [slot, value] of Object.entries(command.inputs)) {
      lines.push(`  ${slot}: ${value}`);
    }

    lines.push('params:');
    for (const [key, value] of Object.entries(command.params)) {
      if (typeof value === 'object') {
        lines.push(`  ${key}: ${JSON.stringify(value)}`);
      } else {
        lines.push(`  ${key}: ${value}`);
      }
    }

    return lines.join('\n');
  }
}

/**
 * WebSocket daemon client
 */
export class WebSocketDaemonClient implements DaemonClient {
  private ws: WebSocket | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    // In browser environment:
    // this.ws = new WebSocket(this.url);
    // await new Promise((resolve, reject) => {
    //   this.ws!.onopen = resolve;
    //   this.ws!.onerror = reject;
    // });
    console.log(`[WebSocketDaemon] Would connect to ${this.url}`);
  }

  async send(command: DaemonCommand): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to daemon');
    }
    // this.ws!.send(JSON.stringify(command));
    console.log(`[WebSocketDaemon] Would send:`, JSON.stringify(command, null, 2));
  }

  isConnected(): boolean {
    // return this.ws?.readyState === WebSocket.OPEN;
    return true; // Placeholder
  }
}

/**
 * HTTP daemon client
 */
export class HttpDaemonClient implements DaemonClient {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async send(command: DaemonCommand): Promise<void> {
    // In production:
    // await fetch(this.url, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(command),
    // });
    console.log(`[HttpDaemon] Would POST to ${this.url}:`, JSON.stringify(command, null, 2));
  }

  isConnected(): boolean {
    return true; // Could implement health check
  }
}

/**
 * In-memory daemon client (for testing)
 */
export class MemoryDaemonClient implements DaemonClient {
  public commands: DaemonCommand[] = [];

  async send(command: DaemonCommand): Promise<void> {
    this.commands.push(command);
    console.log(`[MemoryDaemon] Stored command:`, command.id);
  }

  isConnected(): boolean {
    return true;
  }

  getCommands(): DaemonCommand[] {
    return this.commands;
  }

  clear(): void {
    this.commands = [];
  }
}

// ============================================
// DEMO
// ============================================

async function demo() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Generic Daemon Integration Demo                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Example extension for demo primitives
  const DEMO_EXTENSION: DomainExtension = {
    name: 'demo',
    description: 'Demo extension for daemon integration',
    verbs: [
      { token: 'viz', description: 'Visualize data', category: 'demo' },
      { token: 'cluster', description: 'Cluster analysis', category: 'demo' },
    ],
    flags: [],
  };

  // Register the extension
  registerExtension(DEMO_EXTENSION);

  // Example primitives (simplified)
  const primitives: PrimitiveConfig[] = [
    { name: 'diagnose', verb: 'dx', inputSlots: ['data'], category: 'exploration' },
    { name: 'transform', verb: 'ch', additions: ['normalize'], inputSlots: ['data'], category: 'preprocessing' },
    { name: 'pca', verb: 'viz', target: 'pca', inputSlots: ['data'], defaultParams: { n_components: 10 }, category: 'ordination' },
    { name: 'kmeans', verb: 'cluster', target: 'kmeans', inputSlots: ['data'], defaultParams: { k: 3 }, category: 'clustering' },
  ];

  // Create in-memory client for demo
  const client = new MemoryDaemonClient();
  const bridge = new StenoDaemonBridge(primitives, client, ['demo']);

  const examples = [
    'dx:@data.csv',
    'viz:pca @counts.csv',
    'ch:@data.csv +normalize',
    'cluster:kmeans @data.csv',
    '?plan analysis workflow',
    'fit:model? @data.csv',
  ];

  for (const input of examples) {
    console.log('────────────────────────────────────────────────────────────');
    console.log(`Input: ${input}`);
    console.log('');

    const result = await bridge.process(input);
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('');
  }

  console.log('────────────────────────────────────────────────────────────');
  console.log('Commands sent to daemon:', client.getCommands().length);
  client.getCommands().forEach(cmd => {
    console.log(`  - ${cmd.id}: ${cmd.primitive}`);
  });
}

demo().catch(console.error);
