/**
 * FlowForge Plugin Architect Studio
 * Complete environment to develop, sandbox-test, and register custom node plugins.
 */

import React, { useState } from 'react';
import { 
  X, 
  Boxes, 
  Plus, 
  Play, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Trash2, 
  Sliders, 
  Layers, 
  Sparkles,
  KeyRound
} from 'lucide-react';
import { CustomPluginDefinition } from '../../types/workflow';
import { pluginManager } from '../../engine/pluginManager';

interface PluginStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugins: CustomPluginDefinition[];
  onRefreshPlugins: () => void;
}

export const PluginStudioModal: React.FC<PluginStudioModalProps> = ({
  isOpen,
  onClose,
  plugins,
  onRefreshPlugins
}) => {
  if (!isOpen) return null;

  const [selectedPluginId, setSelectedPluginId] = useState<string>(
    plugins.length > 0 ? plugins[0].id : 'new'
  );

  const [isEditingNew, setIsEditingNew] = useState(false);

  // Plugin Form State
  const [formName, setFormName] = useState('XML to JSON Parser');
  const [formId, setFormId] = useState('plugin_xml_parser');
  const [formAuthor, setFormAuthor] = useState('Community Developer');
  const [formDescription, setFormDescription] = useState('Converts XML strings and feeds into structured JSON objects.');
  const [formCategory, setFormCategory] = useState<'transform' | 'action' | 'trigger'>('transform');
  const [formIcon, setFormIcon] = useState('Boxes');
  const [formHandlerCode, setFormHandlerCode] = useState(`
// Custom Node Handler
// Available in scope: input, config, variables, utils
const raw = typeof input === "string" ? input : (input.xml || "<root><item>Hello</item></root>");

// Simple tag extractor for sandbox demonstration
const match = raw.match(/<([a-zA-Z0-9]+)>([^<]+)<\\/\\1>/);
const tag = match ? match[1] : "data";
const val = match ? match[2] : raw;

return {
  parsed: true,
  rootTag: tag,
  extractedValue: val,
  processedAt: utils.formatDate(Date.now(), "iso")
};
`);

  // Test bench state
  const [testInput, setTestInput] = useState('{\n  "xml": "<user><name>Ada Lovelace</name></user>"\n}');
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const activePlugin = plugins.find(p => p.id === selectedPluginId);

  const handleSelectPlugin = (plugin: CustomPluginDefinition) => {
    setIsEditingNew(false);
    setSelectedPluginId(plugin.id);
    setFormName(plugin.name);
    setFormId(plugin.id);
    setFormAuthor(plugin.author);
    setFormDescription(plugin.description);
    setFormCategory(plugin.category as any);
    setFormIcon(plugin.icon);
    setFormHandlerCode(plugin.handlerCode);
    setTestResult(null);
    setTestError(null);
  };

  const handleStartNewPlugin = () => {
    setIsEditingNew(true);
    setSelectedPluginId('new');
    const randomId = `plugin_${Date.now().toString(36)}`;
    setFormId(randomId);
    setFormName('Custom Node Plugin');
    setFormAuthor('FlowForge Contributor');
    setFormDescription('Executes custom automated pipeline logic.');
    setFormCategory('transform');
    setFormIcon('Boxes');
    setFormHandlerCode(`
// Write your custom node handler
// input: Incoming data payload
// config: Node parameters defined in schema
// utils: Helper functions (formatDate, b64Encode, etc.)
return {
  success: true,
  echo: input,
  timestamp: utils.formatDate(Date.now(), "iso")
};
`);
    setTestResult(null);
    setTestError(null);
  };

  const handleTestPlugin = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      let parsedInput = {};
      try {
        parsedInput = JSON.parse(testInput);
      } catch {
        parsedInput = { raw: testInput };
      }

      const tempPlugin: CustomPluginDefinition = {
        id: formId,
        name: formName,
        version: '1.0.0',
        author: formAuthor,
        description: formDescription,
        category: formCategory as any,
        icon: formIcon,
        inputs: [{ id: 'input', name: 'In', type: 'input', dataType: 'any' }],
        outputs: [{ id: 'output', name: 'Out', type: 'output', dataType: 'any' }],
        configFields: [],
        handlerCode: formHandlerCode,
        builtIn: false
      };

      const result = await pluginManager.executePlugin(tempPlugin, parsedInput, {});
      setTestResult(result);
    } catch (err: any) {
      setTestError(err.message || String(err));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSavePlugin = () => {
    const plugin: CustomPluginDefinition = {
      id: formId,
      name: formName,
      version: '1.0.0',
      author: formAuthor,
      description: formDescription,
      category: formCategory as any,
      icon: formIcon,
      inputs: [{ id: 'input', name: 'In', type: 'input', dataType: 'any' }],
      outputs: [{ id: 'output', name: 'Out', type: 'output', dataType: 'any' }],
      configFields: [
        { name: 'setting', label: 'Custom Setting', type: 'string', defaultValue: 'default' }
      ],
      handlerCode: formHandlerCode,
      builtIn: false
    };

    pluginManager.register(plugin);
    onRefreshPlugins();
    setIsEditingNew(false);
    setSelectedPluginId(plugin.id);
  };

  const handleDeletePlugin = (id: string) => {
    pluginManager.remove(id);
    onRefreshPlugins();
    if (plugins.length > 0) {
      handleSelectPlugin(plugins[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-violet-950/60 border border-violet-800/80 text-violet-400">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Plugin Architecture & Node Studio</h2>
              <p className="text-xs text-slate-400">Develop, sandbox-test, and publish custom node plugins</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout: Left Plugin List + Right Editor */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Plugin List */}
          <div className="w-72 bg-[#0d1322] border-r border-slate-800 flex flex-col h-full">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Installed Plugins</span>
              <button
                onClick={handleStartNewPlugin}
                className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>New Node</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {plugins.map(p => {
                const isSelected = !isEditingNew && selectedPluginId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPlugin(p)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-800/90 border-l-2 border-violet-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {p.name}
                      </span>
                      {p.builtIn && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1 py-0.2 rounded">
                          Built-in
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {p.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Studio Editor & Test Bench */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0f172a]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isEditingNew ? 'Create New Node Plugin' : `Editing Plugin: ${formName}`}
              </span>

              <div className="flex items-center gap-2">
                {!activePlugin?.builtIn && !isEditingNew && (
                  <button
                    onClick={() => handleDeletePlugin(formId)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    title="Delete plugin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleSavePlugin}
                  className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-md text-xs font-semibold transition-colors"
                >
                  Save & Publish Node
                </button>
              </div>
            </div>

            {/* Plugin Meta Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Node Display Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Plugin Identifier (Slug)</label>
                <input
                  type="text"
                  value={formId}
                  disabled={!isEditingNew}
                  onChange={(e) => setFormId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-violet-300 disabled:opacity-60 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Author / Team</label>
                <input
                  type="text"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  <option value="transform">Transformation</option>
                  <option value="action">Action / Integration</option>
                  <option value="trigger">Trigger</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Code Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-violet-400" />
                  <span>Execution Handler Code (Sandboxed JavaScript)</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">Isolation: Safe Sandbox</span>
              </div>

              <textarea
                rows={9}
                value={formHandlerCode}
                onChange={(e) => setFormHandlerCode(e.target.value)}
                className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 text-cyan-300 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Test Bench */}
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Sandbox Test Bench</span>
                <button
                  onClick={handleTestPlugin}
                  disabled={isTesting}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/40 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {isTesting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>Test Handler</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Sample Input Payload</label>
                  <textarea
                    rows={4}
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Execution Output</label>
                  {testError ? (
                    <div className="p-2 bg-rose-950/60 border border-rose-800/80 rounded text-xs text-rose-300 font-mono max-h-24 overflow-y-auto">
                      {testError}
                    </div>
                  ) : testResult ? (
                    <pre className="p-2 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-emerald-300 max-h-24 overflow-y-auto">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  ) : (
                    <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded text-xs text-slate-500 italic">
                      Click "Test Handler" to verify output in the execution sandbox.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
