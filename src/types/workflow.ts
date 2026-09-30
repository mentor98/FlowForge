/**
 * FlowForge Workflow Engine - Core Type Definitions
 * Open-Source Visual Workflow Automation Engine
 */

export type NodeCategory = 'trigger' | 'condition' | 'transform' | 'action' | 'plugin';

export type NodeExecutionStatus = 
  | 'idle' 
  | 'pending' 
  | 'running' 
  | 'success' 
  | 'failed' 
  | 'retrying' 
  | 'skipped';

export interface PortDefinition {
  id: string;
  name: string;
  type: 'input' | 'output';
  dataType?: 'any' | 'json' | 'string' | 'boolean' | 'number';
  label?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  strategy: 'fixed' | 'exponential';
}

export type ErrorHandlingStrategy = 'fail_workflow' | 'continue_on_error' | 'fallback_node';

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  category: NodeCategory;
  position: { x: number; y: number };
  data: Record<string, any>;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  retryPolicy?: RetryPolicy;
  errorHandling?: ErrorHandlingStrategy;
  fallbackNodeId?: string;
  description?: string;
  icon?: string;
}

export interface WorkflowEdge {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  label?: string; // e.g. "true", "false", "default"
}

export interface WorkflowVariable {
  key: string;
  value: string;
  isSecret: boolean;
  description?: string;
}

export interface RateLimitConfig {
  enabled: boolean;
  maxPerMinute: number;
  burstLimit: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, WorkflowVariable>;
  rateLimit: RateLimitConfig;
  webhookId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StepExecutionLog {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  category: NodeCategory;
  status: NodeExecutionStatus;
  inputPayload: any;
  outputPayload: any;
  error?: string;
  durationMs: number;
  retriesCount: number;
  timestamp: string;
}

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerType: string;
  triggerPayload?: any;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  steps: StepExecutionLog[];
  finalOutput?: any;
  error?: string;
}

export interface CustomPluginDefinition {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: NodeCategory;
  icon: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  configFields: {
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'json' | 'code' | 'select';
    defaultValue?: any;
    options?: { label: string; value: any }[];
    placeholder?: string;
    description?: string;
  }[];
  handlerCode: string; // JavaScript function body: (input, config, context) => Promise<output>
  builtIn?: boolean;
}

export interface EngineTestResult {
  id: string;
  title: string;
  passed: boolean;
  durationMs: number;
  assertionsCount: number;
  error?: string;
  logs: string[];
}
