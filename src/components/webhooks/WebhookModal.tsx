/**
 * FlowForge Webhook Inspector & Simulator
 * Provides real webhook endpoint URL, cURL generator, and in-browser payload dispatcher.
 */

import React, { useState } from 'react';
import { 
  X, 
  Webhook, 
  Copy, 
  Check, 
  Play, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  ExternalLink 
} from 'lucide-react';
import { WorkflowDefinition } from '../../types/workflow';

interface WebhookModalProps {
  workflow: WorkflowDefinition;
  isOpen: boolean;
  onClose: () => void;
  onExecutionCompleted?: () => void;
}

export const WebhookModal: React.FC<WebhookModalProps> = ({
  workflow,
  isOpen,
  onClose,
  onExecutionCompleted
}) => {
  if (!isOpen) return null;

  const webhookSlug = workflow.webhookId || 'pipeline-webhook';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const fullWebhookUrl = `${baseUrl}/api/webhooks/${webhookSlug}`;

  const [httpMethod, setHttpMethod] = useState<'POST' | 'GET' | 'PUT'>('POST');
  const [testPayload, setTestPayload] = useState('{\n  "event": "order.completed",\n  "orderId": "ord_884912",\n  "customer": "alex.morgan@company.com",\n  "amount": 349.00,\n  "currency": "USD"\n}');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [responseResult, setResponseResult] = useState<any>(null);
  const [responseError, setResponseError] = useState<string | null>(null);

  const curlCommand = `curl -X ${httpMethod} "${fullWebhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${testPayload.replace(/\n/g, '').replace(/\s+/g, ' ')}'`;

  const copyUrl = () => {
    navigator.clipboard.writeText(fullWebhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1500);
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1500);
  };

  const handleSendWebhook = async () => {
    setIsSending(true);
    setResponseResult(null);
    setResponseError(null);

    try {
      let parsedBody = undefined;
      if (['POST', 'PUT'].includes(httpMethod)) {
        parsedBody = JSON.parse(testPayload);
      }

      const res = await fetch(`/api/webhooks/${webhookSlug}`, {
        method: httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'X-FlowForge-Source': 'in-browser-simulator'
        },
        body: parsedBody ? JSON.stringify(parsedBody) : undefined
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      setResponseResult(data);
      onExecutionCompleted?.();
    } catch (err: any) {
      setResponseError(err.message || String(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
              <Webhook className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Incoming Webhook Trigger</h2>
              <p className="text-xs text-slate-400">Trigger this workflow via external HTTP requests</p>
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
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Endpoint URL Card */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Live Webhook Endpoint</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 truncate">
                {fullWebhookUrl}
              </div>
              <button
                onClick={copyUrl}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
          </div>

          {/* cURL Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">cURL Command Example</label>
              <button
                onClick={copyCurl}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
              {curlCommand}
            </pre>
          </div>

          {/* In-Browser Test Dispatcher */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test Webhook Dispatch</span>
              </span>

              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-xs">
                {(['POST', 'GET', 'PUT'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setHttpMethod(m)}
                    className={`px-2 py-0.5 font-mono text-[11px] rounded ${
                      httpMethod === m ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {['POST', 'PUT'].includes(httpMethod) && (
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Request JSON Body
                </label>
                <textarea
                  rows={4}
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <button
              onClick={handleSendWebhook}
              disabled={isSending}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              {isSending ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching to Webhook Endpoint...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Send Real HTTP Webhook Call</span>
                </>
              )}
            </button>

            {responseError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Webhook Error</div>
                  <div className="font-mono text-[11px] mt-0.5">{responseError}</div>
                </div>
              </div>
            )}

            {responseResult && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Webhook Accepted & Executed (ID: {responseResult.executionId})</span>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-40">
                  {JSON.stringify(responseResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
