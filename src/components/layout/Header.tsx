/**
 * FlowForge Header - Top Bar Contract Compliant
 * 3-Zone Architecture: Brand wordmark — Clean nav links — Primary action cluster
 */

import React from 'react';
import { 
  Play, 
  RotateCw, 
  Download, 
  Upload, 
  Terminal, 
  Activity, 
  Webhook, 
  Sliders, 
  KeyRound, 
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { WorkflowDefinition } from '../../types/workflow';

interface HeaderProps {
  activeTab: 'canvas' | 'executions' | 'templates' | 'variables' | 'plugins' | 'tests' | 'docs';
  setActiveTab: (tab: 'canvas' | 'executions' | 'templates' | 'variables' | 'plugins' | 'tests' | 'docs') => void;
  workflow: WorkflowDefinition;
  isRunning: boolean;
  onRunWorkflow: () => void;
  onOpenWebhookModal: () => void;
  onExportWorkflow: () => void;
  onImportWorkflow: () => void;
  rateLimitRemaining?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  workflow,
  isRunning,
  onRunWorkflow,
  onOpenWebhookModal,
  onExportWorkflow,
  onImportWorkflow,
  rateLimitRemaining = 60
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-[#0f172a] px-5 flex items-center justify-between z-30 select-none">
      {/* Zone 1: Single text element wordmark with subtle engine indicator */}
      <div className="flex items-center gap-3">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); setActiveTab('canvas'); }} 
          className="text-base font-bold tracking-tight text-white flex items-center gap-2 hover:text-cyan-400 transition-colors"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-sm font-mono text-xs">
            FF
          </div>
          <span>FlowForge</span>
        </a>

        <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-200 truncate max-w-[200px]">{workflow.name}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px] text-slate-400">v{workflow.version}</span>
        </div>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'canvas'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Canvas
        </button>

        <button
          onClick={() => setActiveTab('executions')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'executions'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Executions
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Templates
        </button>

        <button
          onClick={() => setActiveTab('variables')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'variables'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Variables
        </button>

        <button
          onClick={() => setActiveTab('plugins')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'plugins'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Plugins
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap hidden md:inline-flex ${
            activeTab === 'tests'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Engine Tests
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap hidden lg:inline-flex ${
            activeTab === 'docs'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Docs
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenWebhookModal}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors"
          title="Inspect Webhook Endpoint"
        >
          <Webhook className="w-3.5 h-3.5 text-cyan-400" />
          <span>Webhook</span>
        </button>

        <button
          onClick={onExportWorkflow}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          title="Export Workflow JSON"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export</span>
        </button>

        <button
          onClick={onRunWorkflow}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-sm transition-all"
        >
          {isRunning ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-white" />
              <span>Run Pipeline</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
