/**
 * FlowForge Engine Automated Test Runner
 * Interactive interface to run and inspect engine test cases, assertions, and sandbox diagnostics.
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  Play, 
  Terminal, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown 
} from 'lucide-react';
import { EngineTestResult } from '../../types/workflow';
import { flowForgeTestSuite } from '../../engine/testSuite';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<EngineTestResult[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const runTests = async () => {
    setIsRunning(true);
    try {
      const res = await flowForgeTestSuite.runAllTests();
      setResults(res);
    } catch (e) {
      console.error('Failed to run test suite', e);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (results.length === 0) {
      runTests();
    }
  }, []);

  const toggleLog = (id: string) => {
    setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-3xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Engine Test Suite & Verification</h2>
              <p className="text-xs text-slate-400">Automated verification of DAG engine, branching, sandbox, and rate limits</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Summary Banner */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{passedCount} Passed</span>
              </div>
              {failedCount > 0 && (
                <div className="flex items-center gap-1.5 text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{failedCount} Failed</span>
                </div>
              )}
              <span className="text-slate-500">·</span>
              <span className="text-slate-300 font-mono tabular-nums">
                Total: {totalDuration}ms
              </span>
            </div>

            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {isRunning ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running Suite...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Re-run All Tests</span>
                </>
              )}
            </button>
          </div>

          {/* Test Cases List */}
          <div className="space-y-2">
            {results.map((test) => {
              const isExpanded = expandedLogs[test.id];

              return (
                <div
                  key={test.id}
                  className="border border-slate-800 rounded-lg bg-slate-900/40 overflow-hidden"
                >
                  <div
                    onClick={() => toggleLog(test.id)}
                    className="p-3 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {test.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-semibold text-slate-200">
                          {test.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{test.assertionsCount} Assertions</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-cyan-400 tabular-nums">{test.durationMs}ms</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        test.passed
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                          : 'bg-rose-950/60 text-rose-400 border-rose-800'
                      }`}>
                        {test.passed ? 'PASSED' : 'FAILED'}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
                      {test.error && (
                        <div className="p-2 bg-rose-950/80 border border-rose-800 rounded text-xs font-mono text-rose-300">
                          Error: {test.error}
                        </div>
                      )}

                      <div className="space-y-1 font-mono text-[11px]">
                        {test.logs.map((log, lIdx) => (
                          <div key={lIdx} className="text-slate-400 flex items-start gap-1.5">
                            <span className="text-cyan-500 select-none">›</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
