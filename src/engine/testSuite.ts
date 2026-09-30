/**
 * FlowForge Engine Automated Test Suite
 * Provides comprehensive integration and unit tests for DAG execution, sandboxing,
 * rate limiting, branching, retries, and plugins.
 */

import { EngineTestResult, WorkflowDefinition } from '../types/workflow';
import { WorkflowEngine } from './workflowEngine';
import { executeInSafeSandbox, SandboxSecurityError, SandboxTimeoutError, createDefaultSandboxUtils } from './safeSandbox';
import { WorkflowRateLimiter } from './rateLimiter';
import { PluginManager } from './pluginManager';

export class FlowForgeTestSuite {
  public async runAllTests(): Promise<EngineTestResult[]> {
    const results: EngineTestResult[] = [];

    results.push(await this.testLinearDataFlow());
    results.push(await this.testConditionalBranching());
    results.push(await this.testJsonTemplateInterpolation());
    results.push(await this.testSandboxSecurityBlock());
    results.push(await this.testSandboxTimeoutEnforcement());
    results.push(await this.testRateLimiterRejection());
    results.push(await this.testRetryPolicyExecution());
    results.push(await this.testCustomPluginLifecycle());

    return results;
  }

  // 1. Linear Data Flow
  private async testLinearDataFlow(): Promise<EngineTestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    let assertions = 0;

    try {
      const engine = new WorkflowEngine();
      const workflow: WorkflowDefinition = {
        id: 'test_linear_flow',
        name: 'Linear Pipeline Test',
        description: 'Verifies sequential node output propagation',
        version: '1.0.0',
        enabled: true,
        rateLimit: { enabled: false, maxPerMinute: 60, burstLimit: 10 },
        variables: {},
        nodes: [
          {
            id: 'n_trig',
            type: 'trigger_manual',
            name: 'Start',
            category: 'trigger',
            position: { x: 0, y: 0 },
            data: {},
            inputs: [],
            outputs: [{ id: 'output', name: 'Out', type: 'output' }]
          },
          {
            id: 'n_calc',
            type: 'transform_js_sandbox',
            name: 'Compute',
            category: 'transform',
            position: { x: 200, y: 0 },
            data: { code: 'return { total: (input.price || 0) * 1.2 };' },
            inputs: [{ id: 'input', name: 'In', type: 'input' }],
            outputs: [{ id: 'output', name: 'Out', type: 'output' }]
          }
        ],
        edges: [
          { id: 'e1', fromNodeId: 'n_trig', fromPortId: 'output', toNodeId: 'n_calc', toPortId: 'input' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      logs.push('Executing workflow with price = 100...');
      const record = await engine.executeWorkflow(workflow, { price: 100 });
      assertions++;

      if (record.status !== 'completed') {
        throw new Error(`Expected completed status, got ${record.status}`);
      }
      assertions++;

      if (record.finalOutput?.total !== 120) {
        throw new Error(`Expected total 120, got ${record.finalOutput?.total}`);
      }
      assertions++;
      logs.push('Pipeline succeeded with expected calculation: total = 120');

      return {
        id: 'test_linear_flow',
        title: 'DAG Execution & Sequential Node Propagation',
        passed: true,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        logs
      };
    } catch (err: any) {
      return {
        id: 'test_linear_flow',
        title: 'DAG Execution & Sequential Node Propagation',
        passed: false,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        error: err?.message || String(err),
        logs
      };
    }
  }

  // 2. Conditional Branching
  private async testConditionalBranching(): Promise<EngineTestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    let assertions = 0;

    try {
      const engine = new WorkflowEngine();
      const workflow: WorkflowDefinition = {
        id: 'test_branch',
        name: 'Branching Test',
        description: 'Verifies correct True / False branch routing',
        version: '1.0.0',
        enabled: true,
        rateLimit: { enabled: false, maxPerMinute: 60, burstLimit: 10 },
        variables: {},
        nodes: [
          {
            id: 'n_start',
            type: 'trigger_manual',
            name: 'Start',
            category: 'trigger',
            position: { x: 0, y: 0 },
            data: {},
            inputs: [],
            outputs: [{ id: 'output', name: 'Out', type: 'output' }]
          },
          {
            id: 'n_cond',
            type: 'condition_branch',
            name: 'Is VIP?',
            category: 'condition',
            position: { x: 200, y: 0 },
            data: {
              logicalOperator: 'AND',
              rules: [{ field: 'tier', operator: 'equals', value: 'VIP' }]
            },
            inputs: [{ id: 'input', name: 'In', type: 'input' }],
            outputs: [
              { id: 'true', name: 'True', type: 'output' },
              { id: 'false', name: 'False', type: 'output' }
            ]
          },
          {
            id: 'n_true_action',
            type: 'action_log',
            name: 'VIP Node',
            category: 'action',
            position: { x: 400, y: -50 },
            data: { messageTemplate: 'VIP user processed' },
            inputs: [{ id: 'input', name: 'In', type: 'input' }],
            outputs: [{ id: 'output', name: 'Out', type: 'output' }]
          },
          {
            id: 'n_false_action',
            type: 'action_log',
            name: 'Standard Node',
            category: 'action',
            position: { x: 400, y: 50 },
            data: { messageTemplate: 'Standard user processed' },
            inputs: [{ id: 'input', name: 'In', type: 'input' }],
            outputs: [{ id: 'output', name: 'Out', type: 'output' }]
          }
        ],
        edges: [
          { id: 'e1', fromNodeId: 'n_start', fromPortId: 'output', toNodeId: 'n_cond', toPortId: 'input' },
          { id: 'e_true', fromNodeId: 'n_cond', fromPortId: 'true', toNodeId: 'n_true_action', toPortId: 'input' },
          { id: 'e_false', fromNodeId: 'n_cond', fromPortId: 'false', toNodeId: 'n_false_action', toPortId: 'input' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      logs.push('Testing True branch with tier = "VIP"...');
      const runTrue = await engine.executeWorkflow(workflow, { tier: 'VIP' });
      assertions++;
      const trueExecutedIds = runTrue.steps.map(s => s.nodeId);
      if (!trueExecutedIds.includes('n_true_action') || trueExecutedIds.includes('n_false_action')) {
        throw new Error('True path branching failed to activate n_true_action exclusively');
      }
      assertions++;
      logs.push('True branch correctly navigated to n_true_action');

      logs.push('Testing False branch with tier = "STANDARD"...');
      const runFalse = await engine.executeWorkflow(workflow, { tier: 'STANDARD' });
      assertions++;
      const falseExecutedIds = runFalse.steps.map(s => s.nodeId);
      if (!falseExecutedIds.includes('n_false_action') || falseExecutedIds.includes('n_true_action')) {
        throw new Error('False path branching failed to activate n_false_action exclusively');
      }
      assertions++;
      logs.push('False branch correctly navigated to n_false_action');

      return {
        id: 'test_branch',
        title: 'Conditional Branching & Multi-Socket Routing',
        passed: true,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        logs
      };
    } catch (err: any) {
      return {
        id: 'test_branch',
        title: 'Conditional Branching & Multi-Socket Routing',
        passed: false,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        error: err?.message || String(err),
        logs
      };
    }
  }

  // 3. JSON Template Interpolation
  private async testJsonTemplateInterpolation(): Promise<EngineTestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    let assertions = 0;

    try {
      const engine = new WorkflowEngine();
      const workflow: WorkflowDefinition = {
        id: 'test_interpolation',
        name: 'JSON Template Test',
        description: 'Checks template mapping and variable interpolation',
        version: '1.0.0',
        enabled: true,
        rateLimit: { enabled: false, maxPerMinute: 60, burstLimit: 10 },
        variables: {
          REGION: { key: 'REGION', value: 'us-west-2', isSecret: false }
        },
        nodes: [
          {
            id: 'n_trig',
            type: 'trigger_manual',
            name: 'Start',
            category: 'trigger',
            position: { x: 0, y: 0 },
            data: {},
            inputs: [],
            outputs: [{ id: 'output', name: 'Out', type: 'output' }]
          },
          {
            id: 'n_transform',
            type: 'transform_json',
            name: 'Transform',
            category: 'transform',
            position: { x: 200, y: 0 },
            data: {
              mappingTemplate: '{\n  "accountId": "{{input.user.id}}",\n  "region": "{{variables.REGION}}",\n  "active": true\n}'
            },
            inputs: [{ id: 'input', name: 'In', type: 'input' }],
            outputs: [{ id: 'output', name: 'Out', type: 'output' }]
          }
        ],
        edges: [
          { id: 'e1', fromNodeId: 'n_trig', fromPortId: 'output', toNodeId: 'n_transform', toPortId: 'input' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      logs.push('Interpolating template with user.id and variable REGION...');
      const record = await engine.executeWorkflow(workflow, { user: { id: 'usr_abc_77' } });
      assertions++;

      if (record.finalOutput?.accountId !== 'usr_abc_77') {
        throw new Error(`Expected accountId 'usr_abc_77', got ${record.finalOutput?.accountId}`);
      }
      assertions++;

      if (record.finalOutput?.region !== 'us-west-2') {
        throw new Error(`Expected region 'us-west-2', got ${record.finalOutput?.region}`);
      }
      assertions++;
      logs.push('Template mapping successfully generated valid JSON object');

      return {
        id: 'test_interpolation',
        title: 'JSON Transformation & Variable Interpolation',
        passed: true,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        logs
      };
    } catch (err: any) {
      return {
        id: 'test_interpolation',
        title: 'JSON Transformation & Variable Interpolation',
        passed: false,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        error: err?.message || String(err),
        logs
      };
    }
  }

  // 4. Safe Sandbox Security Block
  private async testSandboxSecurityBlock(): Promise<EngineTestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    let assertions = 0;

    try {
      const utils = createDefaultSandboxUtils();
      const dangerousSnippets = [
        'return window.location;',
        'return process.env;',
        'return eval("2 + 2");',
        'return document.cookie;'
      ];

      for (const snippet of dangerousSnippets) {
        logs.push(`Testing safety boundary against snippet: ${snippet}`);
        try {
          await executeInSafeSandbox(snippet, { input: {}, config: {}, variables: {}, utils });
          throw new Error(`Security sandbox failed to intercept: ${snippet}`);
        } catch (err: any) {
          if (err instanceof SandboxSecurityError) {
            assertions++;
            logs.push(`Successfully blocked prohibited token: ${err.message}`);
          } else {
            throw err;
          }
        }
      }

      return {
        id: 'test_sandbox_security',
        title: 'Safe Execution Sandbox Global Isolation',
        passed: true,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        logs
      };
    } catch (err: any) {
      return {
        id: 'test_sandbox_security',
        title: 'Safe Execution Sandbox Global Isolation',
        passed: false,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        error: err?.message || String(err),
        logs
      };
    }
  }

  // 5. Safe Sandbox Timeout Enforcement
  private async testSandboxTimeoutEnforcement(): Promise<EngineTestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    let assertions = 0;

    try {
      const utils = createDefaultSandboxUtils();
      const infiniteLoopCode = `
        // Simulated accidental infinite loop
        let count = 0;
        while(true) {
          count++;
          if (count < 0) break;
        }
        return count;
      `;

      logs.push('Executing deliberate infinite loop with 300ms timeout boundary...');
      try {
        await executeInSafeSandbox(
          infiniteLoopCode,
          { input: {}, config: {}, variables: {}, utils },
          300
        );
        throw new Error('Sandbox failed to abort infinite loop within deadline.');
      } catch (err: any) {
        assertions++;
        if (err instanceof SandboxTimeoutError || err.name === 'SandboxTimeoutError' || err.message?.includes('timed out')) {
          logs.push(`Interrupted safely: ${err.message}`);
          assertions++;
        } else {
          throw err;
        }
      }

      return {
        id: 'test_sandbox_timeout',
        title: 'Execution Timeout & Infinite Loop Protection',
        passed: true,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        logs
      };
    } catch (err: any) {
      return {
        id: 'test_sandbox_timeout',
        title: 'Execution Timeout & Infinite Loop Protection',
        passed: false,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        error: err?.message || String(err),
        logs
      };
    }
  }

  // 6. Rate Limiter Rejection
  private async testRateLimiterRejection(): Promise<EngineTestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    let assertions = 0;

    try {
      const limiter = new WorkflowRateLimiter();
      const testWfId = 'wf_rate_test_' + Date.now();

      logs.push('Configuring limiter with max 3 executions/min and burst limit 2...');
      
      // Request 1: OK
      const r1 = limiter.checkLimit(testWfId, 3, 2);
      assertions++;
      if (!r1.allowed) throw new Error('First execution was rejected unexpectedly');

      // Request 2: OK
      const r2 = limiter.checkLimit(testWfId, 3, 2);
      assertions++;
      if (!r2.allowed) throw new Error('Second execution was rejected unexpectedly');

      // Request 3: Burst limit 2 exceeded!
      const r3 = limiter.checkLimit(testWfId, 3, 2);
      assertions++;
      if (r3.allowed) throw new Error('Third burst request should have been rejected');
      logs.push(`Rate limiter successfully rejected burst: ${r3.reason}`);

      return {
        id: 'test_rate_limiter',
        title: 'Sliding-Window Rate Limiting & Burst Protection',
        passed: true,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        logs
      };
    } catch (err: any) {
      return {
        id: 'test_rate_limiter',
        title: 'Sliding-Window Rate Limiting & Burst Protection',
        passed: false,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        error: err?.message || String(err),
        logs
      };
    }
  }

  // 7. Retry Policy Execution
  private async testRetryPolicyExecution(): Promise<EngineTestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    let assertions = 0;

    try {
      const engine = new WorkflowEngine();
      // Workflow where step fails once then passes
      let runCounter = 0;
      const workflow: WorkflowDefinition = {
        id: 'test_retry_flow',
        name: 'Retry Policy Test',
        description: 'Verifies backoff retries on transient errors',
        version: '1.0.0',
        enabled: true,
        rateLimit: { enabled: false, maxPerMinute: 60, burstLimit: 10 },
        variables: {},
        nodes: [
          {
            id: 'n_trig',
            type: 'trigger_manual',
            name: 'Start',
            category: 'trigger',
            position: { x: 0, y: 0 },
            data: {},
            inputs: [],
            outputs: [{ id: 'output', name: 'Out', type: 'output' }]
          },
          {
            id: 'n_retry_node',
            type: 'transform_js_sandbox',
            name: 'Flaky Step',
            category: 'transform',
            position: { x: 200, y: 0 },
            data: {
              code: `
                // Simulating transient retry via input flag
                if (!input.retried) {
                  input.retried = true;
                  throw new Error("Temporary service hiccup 503");
                }
                return { success: true, attempts: 2 };
              `
            },
            inputs: [{ id: 'input', name: 'In', type: 'input' }],
            outputs: [{ id: 'output', name: 'Out', type: 'output' }],
            retryPolicy: {
              maxRetries: 2,
              backoffMs: 50,
              strategy: 'fixed'
            }
          }
        ],
        edges: [
          { id: 'e1', fromNodeId: 'n_trig', fromPortId: 'output', toNodeId: 'n_retry_node', toPortId: 'input' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      logs.push('Executing flaky node configured with maxRetries: 2...');
      const record = await engine.executeWorkflow(workflow, {});
      assertions++;

      const flakyStep = record.steps.find(s => s.nodeId === 'n_retry_node');
      if (!flakyStep) throw new Error('Flaky step was not executed');
      assertions++;

      if (flakyStep.status !== 'success' || flakyStep.retriesCount < 1) {
        throw new Error(`Expected successful retry, got status: ${flakyStep.status}, retries: ${flakyStep.retriesCount}`);
      }
      assertions++;
      logs.push(`Flaky step succeeded after ${flakyStep.retriesCount} retry attempt(s)`);

      return {
        id: 'test_retry_policy',
        title: 'Retry Policy with Backoff & Jitter',
        passed: true,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        logs
      };
    } catch (err: any) {
      return {
        id: 'test_retry_policy',
        title: 'Retry Policy with Backoff & Jitter',
        passed: false,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        error: err?.message || String(err),
        logs
      };
    }
  }

  // 8. Custom Plugin Lifecycle
  private async testCustomPluginLifecycle(): Promise<EngineTestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    let assertions = 0;

    try {
      const mgr = new PluginManager();
      const testPluginId = 'plugin_unit_test_' + Date.now().toString(36);

      logs.push('Registering new custom node plugin...');
      mgr.register({
        id: testPluginId,
        name: 'Celsius to Fahrenheit Converter',
        version: '1.0.0',
        author: 'Unit Tester',
        description: 'Converts temperature degrees',
        category: 'plugin',
        icon: 'Thermometer',
        inputs: [{ id: 'input', name: 'Input', type: 'input', dataType: 'json' }],
        outputs: [{ id: 'output', name: 'Output', type: 'output', dataType: 'json' }],
        configFields: [],
        handlerCode: `
          const c = input.celsius || 0;
          const f = (c * 9/5) + 32;
          return { celsius: c, fahrenheit: f };
        `,
        builtIn: false
      });
      assertions++;

      const retrieved = mgr.getById(testPluginId);
      if (!retrieved) throw new Error('Failed to retrieve registered plugin');
      assertions++;
      logs.push('Custom plugin successfully registered in registry');

      logs.push('Executing plugin handler with celsius: 100...');
      const output = await mgr.executePlugin(retrieved, { celsius: 100 }, {});
      assertions++;

      if (output?.fahrenheit !== 212) {
        throw new Error(`Expected fahrenheit 212, got ${output?.fahrenheit}`);
      }
      assertions++;
      logs.push('Plugin correctly computed 100°C = 212°F');

      // Clean up
      mgr.remove(testPluginId);
      assertions++;

      return {
        id: 'test_plugin_lifecycle',
        title: 'Custom Plugin Registration & Sandboxed Execution',
        passed: true,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        logs
      };
    } catch (err: any) {
      return {
        id: 'test_plugin_lifecycle',
        title: 'Custom Plugin Registration & Sandboxed Execution',
        passed: false,
        durationMs: Date.now() - startTime,
        assertionsCount: assertions,
        error: err?.message || String(err),
        logs
      };
    }
  }
}

export const flowForgeTestSuite = new FlowForgeTestSuite();
