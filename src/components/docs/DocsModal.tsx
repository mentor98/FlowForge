/**
 * FlowForge Documentation & Architecture Viewer
 * In-app interactive documentation covering engine design, plugin SDK, security, and REST API.
 */

import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Terminal, 
  Shield, 
  Cpu, 
  Boxes, 
  Server, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [activeSection, setActiveSection] = useState<'architecture' | 'plugins' | 'security' | 'api' | 'deployment'>('architecture');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">FlowForge Developer Documentation</h2>
              <p className="text-xs text-slate-400">Engine architecture, custom node plugin SDK, security & REST API</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-60 bg-[#0d1322] border-r border-slate-800 p-3 space-y-1 select-none">
            {[
              { id: 'architecture', label: '1. Architecture & DAG', icon: Cpu },
              { id: 'plugins', label: '2. Plugin Development', icon: Boxes },
              { id: 'security', label: '3. Security & Sandboxing', icon: Shield },
              { id: 'api', label: '4. REST API & Webhooks', icon: Server },
              { id: 'deployment', label: '5. Setup & Deployment', icon: Terminal }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body Viewer */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed bg-[#0f172a]">
            {activeSection === 'architecture' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">1. Engine Architecture & DAG Execution</h3>
                <p>
                  FlowForge is an open-source visual automation engine that executes asynchronous workflows modeled as Directed Acyclic Graphs (DAGs). Each node in a workflow belongs to one of five core categories:
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-emerald-400 block mb-1">Triggers</span>
                    <p className="text-slate-400 text-[11px]">Root nodes that initiate pipelines via Webhook HTTP requests, cron timers, or manual invocation.</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-purple-400 block mb-1">Conditions</span>
                    <p className="text-slate-400 text-[11px]">Logical evaluators supporting multi-rule boolean operations (AND/OR) with dedicated <code>true</code> and <code>false</code> output sockets.</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-blue-400 block mb-1">Transformations</span>
                    <p className="text-slate-400 text-[11px]">JSON template mapping, object path extraction, and secure sandboxed JavaScript execution.</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-pink-400 block mb-1">Actions & Integrations</span>
                    <p className="text-slate-400 text-[11px]">External HTTP calls, webhooks to Slack/Discord, audit logging, and delay timers.</p>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-white pt-2">Execution Flow Lifecycle</h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-400">
                  <li><strong>Rate Limiting Verification:</strong> Sliding-window validation checks both 1-minute throughput and 5-second burst limits.</li>
                  <li><strong>Topological Dispatch:</strong> The engine validates edges, identifies root trigger nodes, and enters an asynchronous execution loop.</li>
                  <li><strong>Branch Gating:</strong> Downstream nodes are executed only along sockets activated by the parent node (e.g. <code>true</code> vs <code>false</code>).</li>
                  <li><strong>Retry Mechanism:</strong> Automatic retries with exponential backoff on transient errors (HTTP 5xx, network timeouts).</li>
                </ol>
              </div>
            )}

            {activeSection === 'plugins' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">2. Plugin Architecture & Custom Nodes</h3>
                <p>
                  Developers can author custom nodes without modifying the engine core. Every plugin defines input/output sockets, configuration form schema, and an isolated execution handler.
                </p>

                <h4 className="text-sm font-semibold text-white">Plugin Manifest Schema</h4>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto">
{`export interface CustomPluginDefinition {
  id: string;               // Unique slug (e.g. "plugin_jwt_generator")
  name: string;             // Display name in canvas palette
  version: string;          // SemVer string (e.g. "1.0.0")
  category: NodeCategory;   // "transform" | "action" | "trigger"
  icon: string;             // Lucide icon identifier
  inputs: PortDefinition[]; // Input sockets
  outputs: PortDefinition[];// Output sockets
  configFields: Field[];    // Dynamic parameters form
  handlerCode: string;      // Safe JavaScript function body
}`}
                </pre>

                <h4 className="text-sm font-semibold text-white">Writing an Execution Handler</h4>
                <p className="text-slate-400">
                  Handlers have access to <code>input</code> (incoming payload), <code>config</code> (node settings), <code>variables</code> (environment tokens), and <code>utils</code> (helper library).
                </p>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-amber-300 overflow-x-auto">
{`// Example: Base64 String Encoder Plugin
const text = input.text || JSON.stringify(input);
const encoded = utils.b64Encode(text);

return {
  originalLength: text.length,
  encodedLength: encoded.length,
  base64: encoded,
  processedAt: utils.formatDate(Date.now(), "iso")
};`}
                </pre>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">3. Security Model & Execution Boundaries</h3>
                <p>
                  FlowForge executes user transformations and custom plugins inside a hardened sandbox designed to isolate host systems and prevent infinite loops.
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-white block mb-1">Global Shadowing & Token Interception</span>
                    <p className="text-slate-400 text-[11px]">
                      Prohibited tokens like <code>window</code>, <code>document</code>, <code>process</code>, <code>require</code>, <code>eval</code>, <code>localStorage</code>, and constructor prototype access are intercepted via static analysis and shadowed within isolated closures.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-white block mb-1">Execution Timeout Boundary</span>
                    <p className="text-slate-400 text-[11px]">
                      Every sandboxed script is executed with a strict 2000ms deadline. Infinite loops (e.g. <code>while(true)</code>) are automatically aborted by <code>SandboxTimeoutError</code>.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-white block mb-1">Sliding-Window Rate Limiting</span>
                    <p className="text-slate-400 text-[11px]">
                      Workflows feature dual-threshold rate limiting: a per-minute quota (e.g. 60 req/min) and a 5-second burst threshold (e.g. max 15 requests per 5s) to mitigate denial-of-service surges.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'api' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">4. REST API & Webhook Specifications</h3>
                <p>FlowForge exposes full-stack REST API endpoints hosted on Express:</p>

                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold mr-2">POST</span>
                    <span className="text-white">/api/webhooks/:webhookId</span>
                    <p className="text-slate-400 text-[10px] mt-1 font-sans">Receives live external HTTP webhooks, triggers the matching pipeline, and records execution.</p>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px]">
                    <span className="text-cyan-400 font-bold mr-2">GET</span>
                    <span className="text-white">/api/workflows</span>
                    <p className="text-slate-400 text-[10px] mt-1 font-sans">Returns all saved workflow definitions and configurations.</p>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold mr-2">POST</span>
                    <span className="text-white">/api/workflows/:id/execute</span>
                    <p className="text-slate-400 text-[10px] mt-1 font-sans">Manually triggers workflow with custom JSON body: <code>{`{ "payload": { ... } }`}</code>.</p>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px]">
                    <span className="text-blue-400 font-bold mr-2">GET</span>
                    <span className="text-white">/api/executions</span>
                    <p className="text-slate-400 text-[10px] mt-1 font-sans">Queries historical run records, step waterfall logs, and output payloads.</p>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px]">
                    <span className="text-purple-400 font-bold mr-2">POST</span>
                    <span className="text-white">/api/tests/run</span>
                    <p className="text-slate-400 text-[10px] mt-1 font-sans">Executes the 8-suite engine verification suite and returns diagnostics.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'deployment' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">5. Setup, Local Development & Deployment</h3>
                <p>Run FlowForge locally or deploy in production containerized environments:</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Quick Start</span>
                    <button
                      onClick={() => copyText('npm install\nnpm run dev', 'quickstart')}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedKey === 'quickstart' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'quickstart' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-cyan-300">
{`# Install dependencies
npm install

# Start full-stack engine & visual editor
npm run dev

# Run automated engine test suite
npm run lint`}
                  </pre>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-300 block">Production Build</span>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300">
{`# Compile visual editor bundle
npm run build

# Start production server
npm start`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
