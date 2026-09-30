/**
 * FlowForge Variables & Secrets Manager
 * Manages environment and workflow-scoped variables with secret masking and copyable tags.
 */

import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ShieldCheck 
} from 'lucide-react';
import { WorkflowVariable } from '../../types/workflow';

interface VariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: Record<string, WorkflowVariable>;
  onUpdateVariables: (variables: Record<string, WorkflowVariable>) => void;
}

export const VariablesModal: React.FC<VariablesModalProps> = ({
  isOpen,
  onClose,
  variables,
  onUpdateVariables
}) => {
  if (!isOpen) return null;

  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New variable form
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newIsSecret, setNewIsSecret] = useState(false);
  const [newDescription, setNewDescription] = useState('');

  const toggleSecret = (key: string) => {
    setVisibleSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyTag = (key: string) => {
    navigator.clipboard.writeText(`{{variables.${key}}}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleDelete = (key: string) => {
    const updated = { ...variables };
    delete updated[key];
    onUpdateVariables(updated);
  };

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    const formattedKey = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const updated = {
      ...variables,
      [formattedKey]: {
        key: formattedKey,
        value: newValue,
        isSecret: newIsSecret,
        description: newDescription
      }
    };

    onUpdateVariables(updated);
    setNewKey('');
    setNewValue('');
    setNewIsSecret(false);
    setNewDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Variables & Secrets Vault</h2>
              <p className="text-xs text-slate-400">Manage pipeline tokens, endpoints, and credentials</p>
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
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Add Variable Form */}
          <form onSubmit={handleAddVariable} className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-semibold text-slate-200 block">Add New Variable</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Key Name</label>
                <input
                  type="text"
                  placeholder="API_KEY, BASE_URL"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Value</label>
                <input
                  type="text"
                  placeholder="https://api.domain.com"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsSecret}
                  onChange={(e) => setNewIsSecret(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <span>Mask as Encrypted Secret</span>
              </label>

              <button
                type="submit"
                disabled={!newKey.trim()}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Variable</span>
              </button>
            </div>
          </form>

          {/* Variables Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Configured Variables ({Object.keys(variables).length})
            </span>

            {Object.keys(variables).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/20 border border-slate-800 rounded-lg">
                No variables defined yet. Add keys to reference them in HTTP nodes and transformations.
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(variables).map(([key, item]) => {
                  const isVisible = visibleSecrets[key];
                  const displayValue = item.isSecret && !isVisible
                    ? '••••••••••••••••••••'
                    : item.value;

                  return (
                    <div
                      key={key}
                      className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-300">
                            {key}
                          </span>
                          {item.isSecret && (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/80">
                              Secret
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-slate-400 mt-1 truncate">
                          {displayValue}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.isSecret && (
                          <button
                            onClick={() => toggleSecret(key)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title={isVisible ? 'Hide secret' : 'Reveal secret'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
                          </button>
                        )}

                        <button
                          onClick={() => handleCopyTag(key)}
                          className="px-2 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded font-mono text-[11px] flex items-center gap-1 transition-colors"
                          title="Copy interpolation tag"
                        >
                          {copiedKey === key ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === key ? 'Copied' : `{{${key}}}`}</span>
                        </button>

                        <button
                          onClick={() => handleDelete(key)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                          title="Delete variable"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
