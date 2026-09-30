/**
 * FlowForge Built-in Node Registry
 * Complete specification of node types, ports, default configs, and icons.
 */

import { WorkflowNode, PortDefinition, NodeCategory } from '../types/workflow';

export interface NodeTypeDefinition {
  type: string;
  name: string;
  category: NodeCategory;
  description: string;
  icon: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  defaultData: Record<string, any>;
  configFields: {
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'textarea' | 'code' | 'select' | 'json' | 'headers' | 'rules';
    defaultValue?: any;
    options?: { label: string; value: any }[];
    placeholder?: string;
    description?: string;
  }[];
}

export const BUILT_IN_NODES: NodeTypeDefinition[] = [
  // =================== TRIGGERS ===================
  {
    type: 'trigger_manual',
    name: 'Manual Trigger',
    category: 'trigger',
    description: 'Triggers the workflow manually via the dashboard or API test payload.',
    icon: 'Play',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Payload', type: 'output', dataType: 'json', label: 'Out' }
    ],
    defaultData: {
      initialPayload: '{\n  "source": "manual_test",\n  "userId": "usr_9421",\n  "amount": 129.50,\n  "currency": "USD"\n}'
    },
    configFields: [
      {
        name: 'initialPayload',
        label: 'Default Test Payload (JSON)',
        type: 'json',
        placeholder: '{"userId": "123"}',
        description: 'Mock JSON payload passed down the pipeline when initiated manually.'
      }
    ]
  },
  {
    type: 'trigger_webhook',
    name: 'Webhook Trigger',
    category: 'trigger',
    description: 'Listens for incoming HTTP POST/GET requests to a unique webhook endpoint.',
    icon: 'Webhook',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Request', type: 'output', dataType: 'json', label: 'Out' }
    ],
    defaultData: {
      webhookPath: 'events/orders',
      httpMethod: 'POST',
      authSecret: 'whsec_flowforge_live_99',
      respondImmediately: true,
      statusCode: 200
    },
    configFields: [
      {
        name: 'webhookPath',
        label: 'Webhook Path Slug',
        type: 'string',
        placeholder: 'events/orders',
        description: 'Endpoint slug: /api/webhooks/:slug'
      },
      {
        name: 'httpMethod',
        label: 'Accepted HTTP Method',
        type: 'select',
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'GET', value: 'GET' },
          { label: 'PUT', value: 'PUT' },
          { label: 'ANY', value: 'ANY' }
        ]
      },
      {
        name: 'authSecret',
        label: 'Authorization Token / Secret (Optional)',
        type: 'string',
        placeholder: 'Bearer token or X-Webhook-Secret header'
      }
    ]
  },
  {
    type: 'trigger_schedule',
    name: 'Schedule (Cron)',
    category: 'trigger',
    description: 'Triggers workflow automatically on a recurring cron schedule or interval.',
    icon: 'Clock',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Timestamp', type: 'output', dataType: 'json', label: 'Out' }
    ],
    defaultData: {
      cronExpression: '*/15 * * * *',
      intervalName: 'Every 15 minutes',
      timezone: 'UTC'
    },
    configFields: [
      {
        name: 'cronExpression',
        label: 'Cron Expression (5-part)',
        type: 'string',
        placeholder: '*/15 * * * *',
        description: 'Standard 5-part cron: minute hour day-of-month month day-of-week'
      },
      {
        name: 'intervalName',
        label: 'Schedule Preset',
        type: 'select',
        options: [
          { label: 'Every 5 Minutes (*/5 * * * *)', value: '*/5 * * * *' },
          { label: 'Every 15 Minutes (*/15 * * * *)', value: '*/15 * * * *' },
          { label: 'Hourly (0 * * * *)', value: '0 * * * *' },
          { label: 'Daily at Midnight (0 0 * * *)', value: '0 0 * * *' },
          { label: 'Custom Cron', value: 'custom' }
        ]
      },
      {
        name: 'timezone',
        label: 'Timezone',
        type: 'string',
        defaultValue: 'UTC'
      }
    ]
  },

  // =================== CONDITIONS ===================
  {
    type: 'condition_branch',
    name: 'Conditional Branch (If/Else)',
    category: 'condition',
    description: 'Evaluates logical rules and branches data down True or False output paths.',
    icon: 'GitFork',
    inputs: [
      { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
    ],
    outputs: [
      { id: 'true', name: 'True Path', type: 'output', dataType: 'any', label: 'True' },
      { id: 'false', name: 'False Path', type: 'output', dataType: 'any', label: 'False' }
    ],
    defaultData: {
      logicalOperator: 'AND',
      rules: [
        { field: 'amount', operator: 'greater_than', value: '100' }
      ]
    },
    configFields: [
      {
        name: 'logicalOperator',
        label: 'Combine Rules With',
        type: 'select',
        options: [
          { label: 'AND (All rules must match)', value: 'AND' },
          { label: 'OR (At least one rule must match)', value: 'OR' }
        ]
      },
      {
        name: 'rules',
        label: 'Condition Rules',
        type: 'rules',
        description: 'Evaluate fields from input payload.'
      }
    ]
  },
  {
    type: 'condition_filter',
    name: 'Array Filter',
    category: 'condition',
    description: 'Filters elements in an array matching specific property criteria.',
    icon: 'Filter',
    inputs: [
      { id: 'input', name: 'Array Input', type: 'input', dataType: 'any', label: 'In' }
    ],
    outputs: [
      { id: 'output', name: 'Filtered Items', type: 'output', dataType: 'any', label: 'Out' }
    ],
    defaultData: {
      arrayPath: 'items',
      filterProperty: 'status',
      filterOperator: 'equals',
      filterValue: 'active'
    },
    configFields: [
      {
        name: 'arrayPath',
        label: 'Array Path in Payload',
        type: 'string',
        placeholder: 'items or leave empty if root is array'
      },
      {
        name: 'filterProperty',
        label: 'Item Property to Check',
        type: 'string',
        placeholder: 'status'
      },
      {
        name: 'filterOperator',
        label: 'Operator',
        type: 'select',
        options: [
          { label: 'Equals (==)', value: 'equals' },
          { label: 'Not Equals (!=)', value: 'not_equals' },
          { label: 'Contains', value: 'contains' },
          { label: 'Greater Than (>)', value: 'greater_than' },
          { label: 'Less Than (<)', value: 'less_than' }
        ]
      },
      {
        name: 'filterValue',
        label: 'Comparison Value',
        type: 'string',
        placeholder: 'active'
      }
    ]
  },

  // =================== TRANSFORMATIONS ===================
  {
    type: 'transform_json',
    name: 'JSON Transformation',
    category: 'transform',
    description: 'Restructure, extract, and reshape JSON payloads using template mappings.',
    icon: 'FileJson',
    inputs: [
      { id: 'input', name: 'Input JSON', type: 'input', dataType: 'json', label: 'In' }
    ],
    outputs: [
      { id: 'output', name: 'Transformed JSON', type: 'output', dataType: 'json', label: 'Out' }
    ],
    defaultData: {
      mappingTemplate: '{\n  "referenceId": "{{input.userId}}",\n  "totalCharged": {{input.amount}},\n  "processedAt": "{{utils.formatDate(Date.now(), \'iso\')}}",\n  "status": "PROCESSED"\n}'
    },
    configFields: [
      {
        name: 'mappingTemplate',
        label: 'Output Template (JSON with {{tags}})',
        type: 'code',
        description: 'Use {{input.field}} or {{variables.KEY}} to interpolate data.'
      }
    ]
  },
  {
    type: 'transform_js_sandbox',
    name: 'JS Code Sandbox',
    category: 'transform',
    description: 'Execute isolated JavaScript code safely with strict timeout boundaries.',
    icon: 'Code2',
    inputs: [
      { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'output', dataType: 'any', label: 'Out' }
    ],
    defaultData: {
      code: '// Available: input, config, variables, utils\nconst data = input || {};\nconst taxRate = 0.08;\nconst subtotal = data.amount || 0;\n\nreturn {\n  ...data,\n  subtotal: subtotal,\n  tax: Number((subtotal * taxRate).toFixed(2)),\n  total: Number((subtotal * 1.08).toFixed(2)),\n  timestamp: utils.formatDate(Date.now(), "iso")\n};'
    },
    configFields: [
      {
        name: 'code',
        label: 'JavaScript Script',
        type: 'code',
        description: 'Runs in secure sandbox without access to window, process, or filesystem.'
      }
    ]
  },
  {
    type: 'transform_path_extract',
    name: 'Path Extractor',
    category: 'transform',
    description: 'Extracts a specific nested property or array slice from the payload.',
    icon: 'Maximize2',
    inputs: [
      { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
    ],
    outputs: [
      { id: 'output', name: 'Extracted Value', type: 'output', dataType: 'any', label: 'Out' }
    ],
    defaultData: {
      path: 'data.user.email',
      fallbackValue: ''
    },
    configFields: [
      {
        name: 'path',
        label: 'Object Path (e.g. data.items[0].id)',
        type: 'string',
        placeholder: 'response.data.items[0]'
      },
      {
        name: 'fallbackValue',
        label: 'Fallback If Not Found',
        type: 'string'
      }
    ]
  },

  // =================== ACTIONS ===================
  {
    type: 'action_http',
    name: 'HTTP Request',
    category: 'action',
    description: 'Make an external HTTP/REST API call with custom headers, body, and retries.',
    icon: 'Globe',
    inputs: [
      { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
    ],
    outputs: [
      { id: 'output', name: 'Response', type: 'output', dataType: 'json', label: 'Response' }
    ],
    defaultData: {
      method: 'POST',
      url: 'https://httpbin.org/post',
      headers: '{\n  "Content-Type": "application/json"\n}',
      body: '{\n  "event": "workflow_execution",\n  "payload": {{input}}\n}',
      timeoutMs: 5000,
      authType: 'none',
      authToken: ''
    },
    configFields: [
      {
        name: 'method',
        label: 'HTTP Method',
        type: 'select',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      },
      {
        name: 'url',
        label: 'URL Endpoint',
        type: 'string',
        placeholder: 'https://api.example.com/v1/resource'
      },
      {
        name: 'headers',
        label: 'Headers (JSON)',
        type: 'code',
        defaultValue: '{\n  "Content-Type": "application/json"\n}'
      },
      {
        name: 'body',
        label: 'Request Body (JSON or text)',
        type: 'code',
        description: 'Supports {{input.fieldName}} interpolation.'
      },
      {
        name: 'timeoutMs',
        label: 'Timeout (ms)',
        type: 'number',
        defaultValue: 5000
      }
    ]
  },
  {
    type: 'action_webhook_send',
    name: 'Send Notification / Alert',
    category: 'action',
    description: 'Post structured notification payload to Slack, Discord, or Teams webhook.',
    icon: 'Send',
    inputs: [
      { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'output', dataType: 'json', label: 'Out' }
    ],
    defaultData: {
      destination: 'Slack',
      webhookUrl: 'https://hooks.slack.com/services/mock/alert/notify',
      messageTitle: 'Workflow Notification: Event Processed',
      messageContent: 'FlowForge automated pipeline completed with payload: {{input.totalCharged || input.amount}} USD'
    },
    configFields: [
      {
        name: 'destination',
        label: 'Channel Type',
        type: 'select',
        options: [
          { label: 'Slack Webhook', value: 'Slack' },
          { label: 'Discord Webhook', value: 'Discord' },
          { label: 'Custom HTTP Webhook', value: 'Custom' }
        ]
      },
      {
        name: 'webhookUrl',
        label: 'Destination Webhook URL',
        type: 'string',
        placeholder: 'https://hooks.slack.com/services/...'
      },
      {
        name: 'messageTitle',
        label: 'Notification Title',
        type: 'string'
      },
      {
        name: 'messageContent',
        label: 'Message Body',
        type: 'textarea'
      }
    ]
  },
  {
    type: 'action_delay',
    name: 'Delay Timer',
    category: 'action',
    description: 'Pauses workflow execution for a set duration before continuing.',
    icon: 'Hourglass',
    inputs: [
      { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
    ],
    outputs: [
      { id: 'output', name: 'Output', type: 'output', dataType: 'any', label: 'Out' }
    ],
    defaultData: {
      delayMs: 1000
    },
    configFields: [
      {
        name: 'delayMs',
        label: 'Delay Duration (ms)',
        type: 'number',
        defaultValue: 1000,
        description: 'Duration in milliseconds to pause before next step (max 10000ms).'
      }
    ]
  },
  {
    type: 'action_log',
    name: 'Log Message',
    category: 'action',
    description: 'Outputs a debug log message into execution records for audit and debugging.',
    icon: 'Terminal',
    inputs: [
      { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
    ],
    outputs: [
      { id: 'output', name: 'Output', type: 'output', dataType: 'any', label: 'Out' }
    ],
    defaultData: {
      logLevel: 'INFO',
      messageTemplate: 'Pipeline checkpoint: processed user {{input.userId || input.referenceId}}'
    },
    configFields: [
      {
        name: 'logLevel',
        label: 'Log Level',
        type: 'select',
        options: [
          { label: 'INFO', value: 'INFO' },
          { label: 'WARN', value: 'WARN' },
          { label: 'ERROR', value: 'ERROR' },
          { label: 'DEBUG', value: 'DEBUG' }
        ]
      },
      {
        name: 'messageTemplate',
        label: 'Log Template',
        type: 'string',
        placeholder: 'Processed value: {{input.value}}'
      }
    ]
  }
];

export function createNodeInstance(
  type: string,
  position: { x: number; y: number },
  nameOverride?: string
): WorkflowNode {
  const definition = BUILT_IN_NODES.find(n => n.type === type);
  if (!definition) {
    throw new Error(`Unknown node type: ${type}`);
  }

  const id = `node_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    id,
    type: definition.type,
    name: nameOverride || definition.name,
    category: definition.category,
    position,
    data: JSON.parse(JSON.stringify(definition.defaultData)),
    inputs: JSON.parse(JSON.stringify(definition.inputs)),
    outputs: JSON.parse(JSON.stringify(definition.outputs)),
    retryPolicy: {
      maxRetries: 2,
      backoffMs: 500,
      strategy: 'exponential'
    },
    errorHandling: 'fail_workflow',
    description: definition.description,
    icon: definition.icon
  };
}
