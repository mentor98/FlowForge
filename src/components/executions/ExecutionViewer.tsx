/**
 * FlowForge Execution History & Debugger
 * High-density execution audit log, step inspection, payload diffing, and replay controls.
 */

import React, { useState } from 'react';
import { 
  Play, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Terminal, 
  Filter, 
  RotateCcw,
  ExternalLink,
  Layers
} from 'lucide-react';
import { ExecutionRecord, StepExecutionLog } from '../../types/workflow';

interface ExecutionViewerProps {
  executions: ExecutionRecord[];
  onReplayExecution: (record: ExecutionRecord) => void;
  onSelectNodeInCanvas?: (nodeId: string) => void;
}

export const ExecutionViewer: React.FC<ExecutionViewerProps> = ({
  executions,
  onReplayExecution,
  onSelectNodeInCanvas
}) => {
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    executions.length > 0 ? executions[0].id : null
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'running'>('all');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredExecutions = executions.filter(e => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  const selectedExecution = executions.find(e => e.id === selectedExecutionId) || filteredExecutions[0];

  const toggleStep = (stepKey: string) => {
    setExpandedSteps(prev => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="flex-1 flex h-full bg-[#0b0f19] overflow-hidden select-none">
      {/* Left List of Executions */}
      <div className="w-80 bg-[#0d1322] border-r border-slate-800 flex flex-col h-full">
        {/* Header & Filter */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Execution History</span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              {filteredExecutions.length} runs
            </span>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-md border border-slate-800 text-[11px]">
            {(['all', 'completed', 'failed', 'running'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex-1 py-1 text-center font-medium capitalize rounded transition-colors ${
                  statusFilter === tab
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Executions List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {filteredExecutions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No executions found. Trigger a run from the canvas or send a webhook!
            </div>
          ) : (
            filteredExecutions.map(exec => {
              const isSelected = selectedExecution?.id === exec.id;
              const dateStr = new Date(exec.startedAt).toLocaleTimeString();

              return (
                <div
                  key={exec.id}
                  onClick={() => setSelectedExecutionId(exec.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-800/90 border-l-2 border-cyan-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {exec.status === 'completed' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      {exec.status === 'failed' && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      {exec.status === 'running' && (
                        <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
                        {exec.workflowName}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                      {dateStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span className="capitalize">{exec.triggerType.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-slate-300 tabular-nums">
                      {exec.durationMs !== undefined ? `${exec.durationMs}ms` : '...'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      {selectedExecution ? (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0f172a]">
          {/* Detail Header */}
          <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  Execution Details
                </span>
                <span className="font-mono text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80">
                  {selectedExecution.id}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span>Started: {new Date(selectedExecution.startedAt).toLocaleString()}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-slate-200">
                  Duration: {selectedExecution.durationMs ?? 0}ms
                </span>
                <span aria-hidden="true">·</span>
                <span className="capitalize font-medium text-cyan-400">
                  {selectedExecution.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onReplayExecution(selectedExecution)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-semibold shadow-sm transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Run</span>
              </button>
            </div>
          </div>

          {/* Error Banner if any */}
          {selectedExecution.error && (
            <div className="m-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Pipeline Failure</div>
                <div className="font-mono text-[11px] mt-0.5">{selectedExecution.error}</div>
              </div>
            </div>
          )}

          {/* Trigger Payload Card */}
          <div className="px-4 py-2">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Initial Trigger Payload</span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(selectedExecution.triggerPayload, null, 2), 'trigger')}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'trigger' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-2 bg-slate-950 rounded border border-slate-800/80 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-36">
                {JSON.stringify(selectedExecution.triggerPayload || {}, null, 2)}
              </pre>
            </div>
          </div>

          {/* Step Timeline Waterfall */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Step Execution Waterfall ({selectedExecution.steps.length} steps)
              </span>
            </div>

            <div className="space-y-2">
              {selectedExecution.steps.map((step, idx) => {
                const stepKey = `${selectedExecution.id}_step_${idx}`;
                const isExpanded = expandedSteps[stepKey] ?? (idx === 0 || step.status === 'failed');

                return (
                  <div
                    key={stepKey}
                    className="border border-slate-800 rounded-lg bg-slate-900/40 overflow-hidden"
                  >
                    {/* Step Title Row */}
                    <div
                      onClick={() => toggleStep(stepKey)}
                      className="p-3 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {step.status === 'success' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {step.status === 'failed' && (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        {step.status === 'running' && (
                          <RotateCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              {idx + 1}. {step.nodeName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                              {step.nodeType}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {step.retriesCount > 0 && (
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                            {step.retriesCount} Retries
                          </span>
                        )}
                        <span className="text-xs font-mono text-cyan-400 tabular-nums">
                          {step.durationMs}ms
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Step Expanded Details */}
                    {isExpanded && (
                      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
                        {step.error && (
                          <div className="p-2 bg-rose-950/60 border border-rose-800/80 rounded text-xs text-rose-300 font-mono">
                            Error: {step.error}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Input Payload */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                              <span>Step Input</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(JSON.stringify(step.inputPayload, null, 2), `in_${idx}`);
                                }}
                                className="text-[10px] hover:text-white flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedKey === `in_${idx}` ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                              {JSON.stringify(step.inputPayload || {}, null, 2)}
                            </pre>
                          </div>

                          {/* Output Payload */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                              <span>Step Output</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(JSON.stringify(step.outputPayload, null, 2), `out_${idx}`);
                                }}
                                className="text-[10px] hover:text-white flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedKey === `out_${idx}` ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-48">
                              {JSON.stringify(step.outputPayload || {}, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          Select an execution from the list to view step-by-step logs.
        </div>
      )}
    </div>
  );
};
