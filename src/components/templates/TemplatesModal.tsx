/**
 * FlowForge Workflow Templates Modal
 * Curated production workflows ready for 1-click loading and modification.
 */

import React from 'react';
import { 
  X, 
  Layers, 
  Check, 
  ArrowRight, 
  Webhook, 
  Clock, 
  Play, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';
import { WORKFLOW_TEMPLATES } from '../../engine/templates';
import { WorkflowDefinition } from '../../types/workflow';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkflowDefinition) => void;
  currentWorkflowId: string;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  currentWorkflowId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-3xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/80 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Workflow Templates</h2>
              <p className="text-xs text-slate-400">Production-tested pipelines ready to deploy and adapt</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WORKFLOW_TEMPLATES.map(tpl => {
              const isCurrent = tpl.id === currentWorkflowId;
              const triggerNode = tpl.nodes.find(n => n.category === 'trigger');

              return (
                <div
                  key={tpl.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-cyan-500 bg-cyan-950/20'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[200px]">
                        {tpl.name}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                        {tpl.nodes.length} Nodes
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {tpl.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span>Trigger: {triggerNode?.name || 'Manual'}</span>
                      <span aria-hidden="true">·</span>
                      <span>Branching: Yes</span>
                      <span aria-hidden="true">·</span>
                      <span>Retries: Enabled</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                    {isCurrent ? (
                      <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Currently Loaded</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Ready to clone</span>
                    )}

                    <button
                      onClick={() => {
                        onSelectTemplate(tpl);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-cyan-600 rounded-md transition-colors flex items-center gap-1"
                    >
                      <span>Load Pipeline</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
