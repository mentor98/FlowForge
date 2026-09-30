/**
 * FlowForge Plugin Architecture
 * Allows developers to define, install, and execute custom nodes with schemas and handlers.
 */

import { CustomPluginDefinition, WorkflowNode } from '../types/workflow';
import { executeInSafeSandbox, createDefaultSandboxUtils } from './safeSandbox';

export const INITIAL_PLUGINS: CustomPluginDefinition[] = [
  {
    id: 'plugin_jwt_generator',
    name: 'JWT Token Generator',
    version: '1.2.0',
    author: 'FlowForge Core Community',
    description: 'Generates signed or base64-encoded mock JWT payloads for authorization headers.',
    category: 'plugin',
    icon: 'KeyRound',
    inputs: [
      { id: 'input', name: 'Claims / User Data', type: 'input', dataType: 'json', label: 'Claims' }
    ],
    outputs: [
      { id: 'output', name: 'JWT Auth Object', type: 'output', dataType: 'json', label: 'Token' }
    ],
    configFields: [
      {
        name: 'issuer',
        label: 'Token Issuer (iss)',
        type: 'string',
        defaultValue: 'flowforge.engine.local'
      },
      {
        name: 'expiresInMinutes',
        label: 'TTL (Minutes)',
        type: 'number',
        defaultValue: 60
      },
      {
        name: 'secretKey',
        label: 'Secret Signing Key',
        type: 'string',
        defaultValue: 'jwt_secret_flowforge_dev_key'
      }
    ],
    handlerCode: `
// Custom Node Plugin: JWT Token Generator
const claims = input || {};
const header = { alg: "HS256", typ: "JWT" };
const exp = Math.floor(Date.now() / 1000) + ((config.expiresInMinutes || 60) * 60);

const payload = {
  ...claims,
  iss: config.issuer || "flowforge",
  exp: exp,
  iat: Math.floor(Date.now() / 1000)
};

const b64Header = utils.b64Encode(JSON.stringify(header)).replace(/=/g, "");
const b64Payload = utils.b64Encode(JSON.stringify(payload)).replace(/=/g, "");
const signature = utils.hashString(b64Header + "." + b64Payload + (config.secretKey || ""));

const token = b64Header + "." + b64Payload + "." + signature;

return {
  token: token,
  tokenType: "Bearer",
  expiresAt: exp,
  issuedAt: payload.iat,
  claims: payload
};
`,
    builtIn: true
  },
  {
    id: 'plugin_markdown_slack',
    name: 'Markdown to Slack BlockKit',
    version: '1.0.4',
    author: 'DevOps Automations Lab',
    description: 'Transforms markdown text and alert payloads into Slack Block Kit JSON schemas.',
    category: 'plugin',
    icon: 'Boxes',
    inputs: [
      { id: 'input', name: 'Alert Data', type: 'input', dataType: 'json', label: 'In' }
    ],
    outputs: [
      { id: 'output', name: 'Block Kit Schema', type: 'output', dataType: 'json', label: 'Blocks' }
    ],
    configFields: [
      {
        name: 'channel',
        label: 'Slack Channel Override',
        type: 'string',
        defaultValue: '#engineering-alerts'
      },
      {
        name: 'accentColor',
        label: 'Card Accent Color',
        type: 'string',
        defaultValue: '#3b82f6'
      }
    ],
    handlerCode: `
// Custom Node Plugin: Markdown to Slack BlockKit
const payload = input || {};
const title = payload.title || payload.subject || "Workflow Pipeline Alert";
const bodyText = payload.message || payload.error || JSON.stringify(payload, null, 2);

const blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: title.substring(0, 150),
      emoji: true
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*Timestamp:* " + utils.formatDate(Date.now(), "iso") + "\\n" +
            "*Payload Summary:*\\n\`\`\`" + bodyText.substring(0, 800) + "\`\`\`"
    }
  },
  {
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "⚡ Sent via FlowForge Visual Engine | Channel: " + (config.channel || "#alerts")
      }
    ]
  }
];

return {
  channel: config.channel || "#alerts",
  blocks: blocks,
  text: title + " - " + bodyText.substring(0, 80)
};
`,
    builtIn: true
  },
  {
    id: 'plugin_batch_chunker',
    name: 'Array Batch Chunker',
    version: '1.1.0',
    author: 'Data Operations Team',
    description: 'Splits large input arrays into smaller batches for throttled batch API processing.',
    category: 'plugin',
    icon: 'Layers',
    inputs: [
      { id: 'input', name: 'List / Array', type: 'input', dataType: 'json', label: 'Items' }
    ],
    outputs: [
      { id: 'output', name: 'Batches', type: 'output', dataType: 'json', label: 'Batches' }
    ],
    configFields: [
      {
        name: 'chunkSize',
        label: 'Items per Batch',
        type: 'number',
        defaultValue: 10
      }
    ],
    handlerCode: `
// Custom Node Plugin: Array Batch Chunker
let items = [];
if (Array.isArray(input)) {
  items = input;
} else if (input && Array.isArray(input.items)) {
  items = input.items;
} else if (input && Array.isArray(input.data)) {
  items = input.data;
} else {
  items = [input];
}

const chunkSize = Math.max(1, parseInt(config.chunkSize) || 10);
const batches = [];

for (let i = 0; i < items.length; i += chunkSize) {
  batches.push(items.slice(i, i + chunkSize));
}

return {
  totalItems: items.length,
  batchCount: batches.length,
  chunkSize: chunkSize,
  batches: batches
};
`,
    builtIn: true
  }
];

export class PluginManager {
  private plugins: Map<string, CustomPluginDefinition> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    // Seed initial built-in plugins
    INITIAL_PLUGINS.forEach(p => this.plugins.set(p.id, p));

    // Load any user plugins from local storage if in browser
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('flowforge_custom_plugins');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: CustomPluginDefinition) => this.plugins.set(p.id, p));
          }
        }
      } catch (e) {
        console.error('Failed to load custom plugins from storage', e);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const customOnly = Array.from(this.plugins.values()).filter(p => !p.builtIn);
        localStorage.setItem('flowforge_custom_plugins', JSON.stringify(customOnly));
      } catch (e) {
        console.error('Failed to save custom plugins to storage', e);
      }
    }
  }

  public getAll(): CustomPluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  public getById(id: string): CustomPluginDefinition | undefined {
    return this.plugins.get(id);
  }

  public register(plugin: CustomPluginDefinition): void {
    this.plugins.set(plugin.id, plugin);
    this.saveToStorage();
  }

  public remove(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    if (plugin.builtIn) {
      throw new Error('Cannot delete core built-in plugin.');
    }
    this.plugins.delete(id);
    this.saveToStorage();
    return true;
  }

  public createNodeFromPlugin(pluginId: string, position: { x: number; y: number }): WorkflowNode {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    const defaultData: Record<string, any> = {
      pluginId: plugin.id
    };
    plugin.configFields.forEach(f => {
      defaultData[f.name] = f.defaultValue ?? '';
    });

    const nodeId = `plugin_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    return {
      id: nodeId,
      type: `plugin_${plugin.id}`,
      name: plugin.name,
      category: 'plugin',
      position,
      data: defaultData,
      inputs: JSON.parse(JSON.stringify(plugin.inputs)),
      outputs: JSON.parse(JSON.stringify(plugin.outputs)),
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 500,
        strategy: 'fixed'
      },
      errorHandling: 'fail_workflow',
      description: plugin.description,
      icon: plugin.icon
    };
  }

  public async executePlugin(
    plugin: CustomPluginDefinition,
    input: any,
    config: Record<string, any>,
    variables: Record<string, string> = {}
  ): Promise<any> {
    const utils = createDefaultSandboxUtils();
    return executeInSafeSandbox(
      plugin.handlerCode,
      {
        input,
        config,
        variables,
        utils
      },
      2500 // 2.5 second max execution time boundary
    );
  }
}

export const pluginManager = new PluginManager();
