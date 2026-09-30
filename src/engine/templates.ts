/**
 * FlowForge Workflow Templates Library
 * Production-ready templates showcasing branching, webhooks, retries, and transformations.
 */

import { WorkflowDefinition } from '../types/workflow';

export const WORKFLOW_TEMPLATES: WorkflowDefinition[] = [
  {
    id: 'tpl_stripe_payment_failed',
    name: 'Stripe Failed Payment & Dunning Router',
    description: 'Handles incoming payment failure webhooks, evaluates invoice severity, initiates exponential retry outreach, and alerts customer success.',
    version: '1.0.0',
    enabled: true,
    webhookId: 'stripe-dunning-pipeline',
    rateLimit: {
      enabled: true,
      maxPerMinute: 60,
      burstLimit: 15
    },
    variables: {
      SLACK_WEBHOOK_URL: {
        key: 'SLACK_WEBHOOK_URL',
        value: 'https://hooks.slack.com/services/T00/B00/XXXX',
        isSecret: true,
        description: 'Target Slack channel for payment failure alerts'
      },
      CRM_API_KEY: {
        key: 'CRM_API_KEY',
        value: 'crm_live_93817401',
        isSecret: true,
        description: 'API key for customer CRM update'
      }
    },
    nodes: [
      {
        id: 'node_trigger',
        type: 'trigger_webhook',
        name: 'Stripe Webhook',
        category: 'trigger',
        position: { x: 80, y: 220 },
        data: {
          webhookPath: 'stripe/charge-failed',
          httpMethod: 'POST',
          authSecret: 'whsec_stripe_test',
          initialPayload: '{\n  "event": "charge.failed",\n  "customerId": "cus_N83a71b",\n  "customerEmail": "sarah.chen@enterprise.io",\n  "amount": 1250.00,\n  "currency": "usd",\n  "failureCode": "insufficient_funds"\n}'
        },
        inputs: [],
        outputs: [
          { id: 'output', name: 'Request', type: 'output', dataType: 'json', label: 'Out' }
        ],
        icon: 'Webhook'
      },
      {
        id: 'node_transform_invoice',
        type: 'transform_json',
        name: 'Format Invoice Details',
        category: 'transform',
        position: { x: 380, y: 220 },
        data: {
          mappingTemplate: '{\n  "accountId": "{{input.customerId}}",\n  "email": "{{input.customerEmail}}",\n  "chargeAmount": {{input.amount}},\n  "reason": "{{input.failureCode}}",\n  "isHighValue": {{input.amount > 500}},\n  "reportedAt": "{{utils.formatDate(Date.now(), \'iso\')}}"\n}'
        },
        inputs: [
          { id: 'input', name: 'Input JSON', type: 'input', dataType: 'json', label: 'In' }
        ],
        outputs: [
          { id: 'output', name: 'Transformed JSON', type: 'output', dataType: 'json', label: 'Out' }
        ],
        icon: 'FileJson'
      },
      {
        id: 'node_check_severity',
        type: 'condition_branch',
        name: 'High Value Account (> $500)?',
        category: 'condition',
        position: { x: 680, y: 220 },
        data: {
          logicalOperator: 'AND',
          rules: [
            { field: 'chargeAmount', operator: 'greater_than', value: '500' }
          ]
        },
        inputs: [
          { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
        ],
        outputs: [
          { id: 'true', name: 'True Path', type: 'output', dataType: 'any', label: 'True' },
          { id: 'false', name: 'False Path', type: 'output', dataType: 'any', label: 'False' }
        ],
        icon: 'GitFork'
      },
      {
        id: 'node_alert_vip',
        type: 'action_webhook_send',
        name: 'Urgent VIP Slack Alert',
        category: 'action',
        position: { x: 990, y: 130 },
        data: {
          destination: 'Slack',
          messageTitle: '🚨 High-Value Payment Failed: ${{input.chargeAmount}} USD',
          messageContent: 'Customer account {{input.accountId}} ({{input.email}}) failed payment: {{input.reason}}. Direct CSM outreach assigned.'
        },
        inputs: [
          { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
        ],
        outputs: [
          { id: 'output', name: 'Result', type: 'output', dataType: 'json', label: 'Out' }
        ],
        retryPolicy: {
          maxRetries: 3,
          backoffMs: 800,
          strategy: 'exponential'
        },
        errorHandling: 'continue_on_error',
        icon: 'Send'
      },
      {
        id: 'node_standard_dunning',
        type: 'action_log',
        name: 'Schedule Standard Dunning',
        category: 'action',
        position: { x: 990, y: 320 },
        data: {
          logLevel: 'INFO',
          messageTemplate: 'Standard dunning email queued for account {{input.accountId}} (Amount: ${{input.chargeAmount}})'
        },
        inputs: [
          { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
        ],
        outputs: [
          { id: 'output', name: 'Output', type: 'output', dataType: 'any', label: 'Out' }
        ],
        icon: 'Terminal'
      }
    ],
    edges: [
      {
        id: 'edge_1',
        fromNodeId: 'node_trigger',
        fromPortId: 'output',
        toNodeId: 'node_transform_invoice',
        toPortId: 'input'
      },
      {
        id: 'edge_2',
        fromNodeId: 'node_transform_invoice',
        fromPortId: 'output',
        toNodeId: 'node_check_severity',
        toPortId: 'input'
      },
      {
        id: 'edge_3',
        fromNodeId: 'node_check_severity',
        fromPortId: 'true',
        toNodeId: 'node_alert_vip',
        toPortId: 'input',
        label: 'true'
      },
      {
        id: 'edge_4',
        fromNodeId: 'node_check_severity',
        fromPortId: 'false',
        toNodeId: 'node_standard_dunning',
        toPortId: 'input',
        label: 'false'
      }
    ],
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z'
  },
  {
    id: 'tpl_github_pr_scanner',
    name: 'GitHub Webhook & Code Review Notifier',
    description: 'Intercepts GitHub pull request webhooks, runs a custom JS compliance check, and routes alerts to developer channels.',
    version: '1.1.0',
    enabled: true,
    webhookId: 'github-pr-validator',
    rateLimit: {
      enabled: true,
      maxPerMinute: 120,
      burstLimit: 30
    },
    variables: {
      GITHUB_TOKEN: {
        key: 'GITHUB_TOKEN',
        value: 'ghp_live_secret_token_1938',
        isSecret: true,
        description: 'GitHub Personal Access Token'
      }
    },
    nodes: [
      {
        id: 'node_pr_trigger',
        type: 'trigger_webhook',
        name: 'GitHub PR Event',
        category: 'trigger',
        position: { x: 80, y: 220 },
        data: {
          webhookPath: 'github/pull-request',
          httpMethod: 'POST',
          initialPayload: '{\n  "action": "opened",\n  "number": 142,\n  "pull_request": {\n    "title": "feat: Implement sliding-window rate limiter",\n    "user": "alex-dev",\n    "changed_files": 4,\n    "additions": 180,\n    "deletions": 20,\n    "labels": ["backend", "engine"]\n  }\n}'
        },
        inputs: [],
        outputs: [
          { id: 'output', name: 'Request', type: 'output', dataType: 'json', label: 'Out' }
        ],
        icon: 'Webhook'
      },
      {
        id: 'node_pr_analysis',
        type: 'transform_js_sandbox',
        name: 'PR Risk Scoring Script',
        category: 'transform',
        position: { x: 380, y: 220 },
        data: {
          code: `
const pr = (input && input.pull_request) || {};
const diffSize = (pr.additions || 0) + (pr.deletions || 0);
let riskLevel = "LOW";

if (diffSize > 500) {
  riskLevel = "HIGH";
} else if (diffSize > 150) {
  riskLevel = "MEDIUM";
}

return {
  prNumber: input.number,
  title: pr.title,
  author: pr.user,
  diffSize: diffSize,
  riskLevel: riskLevel,
  needsSeniorReview: riskLevel === "HIGH"
};
`
        },
        inputs: [
          { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
        ],
        outputs: [
          { id: 'output', name: 'Result', type: 'output', dataType: 'any', label: 'Out' }
        ],
        icon: 'Code2'
      },
      {
        id: 'node_check_risk',
        type: 'condition_branch',
        name: 'Is High Risk PR?',
        category: 'condition',
        position: { x: 680, y: 220 },
        data: {
          logicalOperator: 'AND',
          rules: [
            { field: 'riskLevel', operator: 'equals', value: 'HIGH' }
          ]
        },
        inputs: [
          { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
        ],
        outputs: [
          { id: 'true', name: 'True Path', type: 'output', dataType: 'any', label: 'True' },
          { id: 'false', name: 'False Path', type: 'output', dataType: 'any', label: 'False' }
        ],
        icon: 'GitFork'
      },
      {
        id: 'node_notify_team',
        type: 'action_webhook_send',
        name: 'Alert Senior Reviewers',
        category: 'action',
        position: { x: 990, y: 130 },
        data: {
          destination: 'Discord',
          messageTitle: '⚠️ High-Risk PR #{{input.prNumber}} Opened by @{{input.author}}',
          messageContent: 'Title: {{input.title}}\nDiff Size: +{{input.diffSize}} lines. Requires 2 senior approvals.'
        },
        inputs: [
          { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
        ],
        outputs: [
          { id: 'output', name: 'Result', type: 'output', dataType: 'json', label: 'Out' }
        ],
        icon: 'Send'
      },
      {
        id: 'node_log_pass',
        type: 'action_log',
        name: 'Log Routine Review',
        category: 'action',
        position: { x: 990, y: 320 },
        data: {
          logLevel: 'INFO',
          messageTemplate: 'PR #{{input.prNumber}} risk level {{input.riskLevel}} - routed to standard review pool.'
        },
        inputs: [
          { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
        ],
        outputs: [
          { id: 'output', name: 'Output', type: 'output', dataType: 'any', label: 'Out' }
        ],
        icon: 'Terminal'
      }
    ],
    edges: [
      {
        id: 'edge_pr_1',
        fromNodeId: 'node_pr_trigger',
        fromPortId: 'output',
        toNodeId: 'node_pr_analysis',
        toPortId: 'input'
      },
      {
        id: 'edge_pr_2',
        fromNodeId: 'node_pr_analysis',
        fromPortId: 'output',
        toNodeId: 'node_check_risk',
        toPortId: 'input'
      },
      {
        id: 'edge_pr_3',
        fromNodeId: 'node_check_risk',
        fromPortId: 'true',
        toNodeId: 'node_notify_team',
        toPortId: 'input',
        label: 'true'
      },
      {
        id: 'edge_pr_4',
        fromNodeId: 'node_check_risk',
        fromPortId: 'false',
        toNodeId: 'node_log_pass',
        toPortId: 'input',
        label: 'false'
      }
    ],
    createdAt: '2026-03-12T14:30:00.000Z',
    updatedAt: '2026-03-12T14:30:00.000Z'
  },
  {
    id: 'tpl_scheduled_health_check',
    name: 'Scheduled Service Health & SLA Monitor',
    description: 'Pings a production API endpoint every 15 minutes, retries up to 3 times on network failure with linear backoff, and alerts on degradation.',
    version: '1.0.2',
    enabled: true,
    rateLimit: {
      enabled: true,
      maxPerMinute: 30,
      burstLimit: 10
    },
    variables: {
      TARGET_ENDPOINT: {
        key: 'TARGET_ENDPOINT',
        value: 'https://httpbin.org/status/200',
        isSecret: false,
        description: 'Health check probe URL'
      }
    },
    nodes: [
      {
        id: 'node_cron_health',
        type: 'trigger_schedule',
        name: 'Probe Schedule',
        category: 'trigger',
        position: { x: 80, y: 220 },
        data: {
          cronExpression: '*/15 * * * *',
          intervalName: 'Every 15 minutes',
          timezone: 'UTC'
        },
        inputs: [],
        outputs: [
          { id: 'output', name: 'Timestamp', type: 'output', dataType: 'json', label: 'Out' }
        ],
        icon: 'Clock'
      },
      {
        id: 'node_http_probe',
        type: 'action_http',
        name: 'Probe HTTP Health API',
        category: 'action',
        position: { x: 380, y: 220 },
        data: {
          method: 'GET',
          url: 'https://httpbin.org/status/200',
          timeoutMs: 4000
        },
        inputs: [
          { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
        ],
        outputs: [
          { id: 'output', name: 'Response', type: 'output', dataType: 'json', label: 'Response' }
        ],
        retryPolicy: {
          maxRetries: 3,
          backoffMs: 1000,
          strategy: 'fixed'
        },
        errorHandling: 'continue_on_error',
        icon: 'Globe'
      },
      {
        id: 'node_eval_status',
        type: 'condition_branch',
        name: 'HTTP 200 OK?',
        category: 'condition',
        position: { x: 680, y: 220 },
        data: {
          logicalOperator: 'AND',
          rules: [
            { field: 'status', operator: 'equals', value: '200' }
          ]
        },
        inputs: [
          { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
        ],
        outputs: [
          { id: 'true', name: 'True Path', type: 'output', dataType: 'any', label: 'True' },
          { id: 'false', name: 'False Path', type: 'output', dataType: 'any', label: 'False' }
        ],
        icon: 'GitFork'
      },
      {
        id: 'node_log_healthy',
        type: 'action_log',
        name: 'Record Nominal SLA',
        category: 'action',
        position: { x: 990, y: 130 },
        data: {
          logLevel: 'INFO',
          messageTemplate: 'Service probe successful at {{input.timestamp || "now"}}. Status 200.'
        },
        inputs: [
          { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
        ],
        outputs: [
          { id: 'output', name: 'Output', type: 'output', dataType: 'any', label: 'Out' }
        ],
        icon: 'Terminal'
      },
      {
        id: 'node_pagerduty_alert',
        type: 'action_webhook_send',
        name: 'Incident Escalation Webhook',
        category: 'action',
        position: { x: 990, y: 320 },
        data: {
          destination: 'Slack',
          messageTitle: '🔥 Service Outage Detected: Health Probe Failed',
          messageContent: 'Endpoint probe returned non-200 status or timeout after 3 retries.'
        },
        inputs: [
          { id: 'input', name: 'Input', type: 'input', dataType: 'any', label: 'In' }
        ],
        outputs: [
          { id: 'output', name: 'Result', type: 'output', dataType: 'json', label: 'Out' }
        ],
        icon: 'Send'
      }
    ],
    edges: [
      {
        id: 'edge_health_1',
        fromNodeId: 'node_cron_health',
        fromPortId: 'output',
        toNodeId: 'node_http_probe',
        toPortId: 'input'
      },
      {
        id: 'edge_health_2',
        fromNodeId: 'node_http_probe',
        fromPortId: 'output',
        toNodeId: 'node_eval_status',
        toPortId: 'input'
      },
      {
        id: 'edge_health_3',
        fromNodeId: 'node_eval_status',
        fromPortId: 'true',
        toNodeId: 'node_log_healthy',
        toPortId: 'input',
        label: 'true'
      },
      {
        id: 'edge_health_4',
        fromNodeId: 'node_eval_status',
        fromPortId: 'false',
        toNodeId: 'node_pagerduty_alert',
        toPortId: 'input',
        label: 'false'
      }
    ],
    createdAt: '2026-03-14T09:15:00.000Z',
    updatedAt: '2026-03-14T09:15:00.000Z'
  }
];
