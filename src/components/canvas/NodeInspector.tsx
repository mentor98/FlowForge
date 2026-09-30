/**
 * FlowForge Node Inspector & Configuration Drawer
 * Dynamic schema form editor, retry policy settings, and single-node test bench.
 */

import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Play, 
  RotateCw, 
  AlertCircle, 
  CheckCircle2, 
  Code2, 
  Sliders, 
  ShieldAlert, 
  Info,
  Plus,
  Minus
} from 'lucide-react';
import { WorkflowNode, RetryPolicy, ErrorHandlingStrategy } from '../../types/workflow';
import { BUILT_IN_NODES } from '../../engine/builtInNodes';
import { pluginManager } from '../../engine/pluginManager';
import { WorkflowEngine } from '../../engine/workflowEngine';

interface NodeInspectorProps {
  node: WorkflowNode | null;
  onUpdateNode: (updated: WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
  allNodes: WorkflowNode[];
  variables: Record<string, any>;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  onUpdateNode,
  onDeleteNode,
  onClose,
  allNodes,
  variables
}) => {
  if (!node) return null;

  const [activeTab, setActiveTab] = useState<'config' | 'retry' | 'test'>('config');
  const [testInput, setTestInput] = useState('{\n  "userId": "usr_9912",\n  "amount": 250.00,\n  "status": "pending"\n}');
  const [testOutput, setTestOutput] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Look up node definition
  const builtInDef = BUILT_IN_NODES.find(n => n.type === node.type);
  const pluginDef = node.category === 'plugin' || node.type.startsWith('plugin_')
    ? pluginManager.getById(node.data?.pluginId || node.type.replace(/^plugin_/, ''))
    : undefined;

  const configFields = builtInDef?.configFields || pluginDef?.configFields || [];

  const handleDataChange = (field: string, value: any) => {
    onUpdateNode({
      ...node,
      data: {
        ...node.data,
        [field]: value
      }
    });
  };

  const handleNameChange = (name: string) => {
    onUpdateNode({
      ...node,
      name
    });
  };

  const handleRetryChange = (key: keyof RetryPolicy, value: any) => {
    onUpdateNode({
      ...node,
      retryPolicy: {
        maxRetries: node.retryPolicy?.maxRetries ?? 2,
        backoffMs: node.retryPolicy?.backoffMs ?? 500,
        strategy: node.retryPolicy?.strategy ?? 'fixed',
        [key]: value
      }
    });
  };

  const handleErrorHandlingChange = (strategy: ErrorHandlingStrategy) => {
    onUpdateNode({
      ...node,
      errorHandling: strategy
    });
  };

  // Rule editor helpers for condition_branch
  const rules = node.data?.rules || [];
  const handleAddRule = () => {
    const updated = [...rules, { field: 'status', operator: 'equals', value: 'active' }];
    handleDataChange('rules', updated);
  };

  const handleUpdateRule = (index: number, key: string, val: string) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [key]: val };
    handleDataChange('rules', updated);
  };

  const handleRemoveRule = (index: number) => {
    const updated = rules.filter((_: any, i: number) => i !== index);
    handleDataChange('rules', updated);
  };

  // Single-node dry run executor
  const handleDryRun = async () => {
    setIsTesting(true);
    setTestOutput(null);
    setTestError(null);

    try {
      let parsedInput: any = {};
      try {
        parsedInput = JSON.parse(testInput);
      } catch {
        parsedInput = { raw: testInput };
      }

      // Create micro workflow with just this node
      const microWorkflow = {
        id: 'micro_test',
        name: 'Single Node Test',
        description: '',
        version: '1.0',
        enabled: true,
        rateLimit: { enabled: false, maxPerMinute: 60, burstLimit: 10 },
        variables,
        nodes: [{ ...node }],
        edges: [],
        createdAt: '',
        updatedAt: ''
      };

      const engine = new WorkflowEngine();
      const res = await engine.executeWorkflow(microWorkflow, parsedInput);

      if (res.status === 'failed') {
        setTestError(res.error || 'Execution failed');
      } else {
        const step = res.steps[0];
        setTestOutput(step?.outputPayload || res.finalOutput);
      }
    } catch (err: any) {
      setTestError(err.message || String(err));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <aside className="w-96 bg-[#0f172a] border-l border-slate-800 flex flex-col h-full z-20 shadow-2xl select-none">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <input
            type="text"
            value={node.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-2 py-1 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
          />
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span className="capitalize">{node.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[10px] text-slate-500 truncate">{node.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDeleteNode(node.id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Delete Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 px-4 pt-2 gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'config'
              ? 'border-cyan-500 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Parameters
        </button>
        <button
          onClick={() => setActiveTab('retry')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'retry'
              ? 'border-cyan-500 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Retries & Policies
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'test'
              ? 'border-cyan-500 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Dry-Run Test
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'config' && (
          <div className="space-y-4">
            {node.type === 'condition_branch' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Rules Combination</label>
                  <select
                    value={node.data?.logicalOperator || 'AND'}
                    onChange={(e) => handleDataChange('logicalOperator', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="AND">AND (All Match)</option>
                    <option value="OR">OR (Any Match)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  {rules.map((rule: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">Rule {idx + 1}</span>
                        {rules.length > 1 && (
                          <button
                            onClick={() => handleRemoveRule(idx)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Field (e.g. amount, user.tier)"
                        value={rule.field || ''}
                        onChange={(e) => handleUpdateRule(idx, 'field', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={rule.operator || 'equals'}
                          onChange={(e) => handleUpdateRule(idx, 'operator', e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="equals">Equals (==)</option>
                          <option value="not_equals">Not Equals (!=)</option>
                          <option value="greater_than">Greater Than (&gt;)</option>
                          <option value="less_than">Less Than (&lt;)</option>
                          <option value="contains">Contains</option>
                          <option value="starts_with">Starts With</option>
                          <option value="is_null">Is Empty / Null</option>
                          <option value="is_not_null">Is Not Null</option>
                          <option value="matches_regex">Matches Regex</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Target Value"
                          value={rule.value || ''}
                          onChange={(e) => handleUpdateRule(idx, 'value', e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleAddRule}
                    className="w-full py-1.5 border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg text-xs text-slate-400 hover:text-cyan-400 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Condition Rule</span>
                  </button>
                </div>
              </div>
            ) : (
              configFields.map((field) => {
                const val = node.data?.[field.name] ?? field.defaultValue ?? '';

                if (field.type === 'select') {
                  return (
                    <div key={field.name} className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">{field.label}</label>
                      <select
                        value={val}
                        onChange={(e) => handleDataChange(field.name, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.type === 'code' || field.type === 'json' || field.type === 'textarea') {
                  return (
                    <div key={field.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">{field.label}</label>
                        <span className="text-[10px] text-slate-500 font-mono">JS / JSON</span>
                      </div>
                      <textarea
                        rows={7}
                        value={val}
                        onChange={(e) => handleDataChange(field.name, e.target.value)}
                        className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                      {field.description && (
                        <p className="text-[11px] text-slate-400">{field.description}</p>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={field.name} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">{field.label}</label>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={val}
                      placeholder={field.placeholder}
                      onChange={(e) => handleDataChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    {field.description && (
                      <p className="text-[11px] text-slate-400">{field.description}</p>
                    )}
                  </div>
                );
              })
            )}

            {/* Variable helper tags */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Insert Interpolation Tags
              </span>
              <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                {['{{input.userId}}', '{{input.amount}}', '{{variables.API_KEY}}', '{{utils.formatDate(Date.now(), "iso")}}'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      navigator.clipboard.writeText(tag);
                    }}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/80 transition-colors"
                    title="Click to copy"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'retry' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Retry Policy</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Max Retries</span>
                  <select
                    value={node.retryPolicy?.maxRetries ?? 2}
                    onChange={(e) => handleRetryChange('maxRetries', Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value={0}>0 (No retries)</option>
                    <option value={1}>1 Retry</option>
                    <option value={2}>2 Retries</option>
                    <option value={3}>3 Retries</option>
                    <option value={5}>5 Retries</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Backoff Strategy</span>
                  <select
                    value={node.retryPolicy?.strategy ?? 'exponential'}
                    onChange={(e) => handleRetryChange('strategy', e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="fixed">Fixed Delay</option>
                    <option value="exponential">Exponential Backoff</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Base Delay (ms)</span>
                  <input
                    type="number"
                    value={node.retryPolicy?.backoffMs ?? 500}
                    step={100}
                    min={100}
                    max={5000}
                    onChange={(e) => handleRetryChange('backoffMs', Number(e.target.value))}
                    className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 text-right"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Error Handling Strategy</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'fail_workflow', label: 'Fail Workflow Immediately', desc: 'Halts pipeline execution and marks run as Failed.' },
                  { id: 'continue_on_error', label: 'Continue Downstream with Error Payload', desc: 'Passes error details to next step.' },
                  { id: 'fallback_node', label: 'Route to Designated Fallback Node', desc: 'Branches to a recovery node.' }
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`block p-2 rounded border cursor-pointer transition-colors ${
                      (node.errorHandling || 'fail_workflow') === item.id
                        ? 'border-cyan-500 bg-cyan-950/20 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <input
                        type="radio"
                        name="errorHandling"
                        checked={(node.errorHandling || 'fail_workflow') === item.id}
                        onChange={() => handleErrorHandlingChange(item.id as ErrorHandlingStrategy)}
                        className="text-cyan-500"
                      />
                      <span>{item.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-5">{item.desc}</p>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Execute this node with mock input to verify transformation, request, or logic output before deploying.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Mock Input JSON</label>
              <textarea
                rows={5}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleDryRun}
              disabled={isTesting}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              {isTesting ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating in Sandbox...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Dry-Run Single Node</span>
                </>
              )}
            </button>

            {testError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="overflow-x-auto">
                  <div className="font-semibold">Dry-Run Error</div>
                  <div className="font-mono text-[11px]">{testError}</div>
                </div>
              </div>
            )}

            {testOutput && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Output Payload</span>
                </div>
                <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48">
                  {JSON.stringify(testOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
