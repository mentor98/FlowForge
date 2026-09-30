/**
 * FlowForge — Visual Automation Engine
 * Main Application Component
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/layout/Header';
import { WorkflowCanvas } from './components/canvas/WorkflowCanvas';
import { NodePalette } from './components/canvas/NodePalette';
import { NodeInspector } from './components/canvas/NodeInspector';
import { ExecutionViewer } from './components/executions/ExecutionViewer';
import { WebhookModal } from './components/webhooks/WebhookModal';
import { TemplatesModal } from './components/templates/TemplatesModal';
import { VariablesModal } from './components/variables/VariablesModal';
import { PluginStudioModal } from './components/plugins/PluginStudioModal';
import { TestSuiteModal } from './components/tests/TestSuiteModal';
import { DocsModal } from './components/docs/DocsModal';

import { 
  WorkflowDefinition, 
  WorkflowNode, 
  WorkflowEdge, 
  NodeExecutionStatus, 
  StepExecutionLog, 
  ExecutionRecord, 
  CustomPluginDefinition,
  WorkflowVariable
} from './types/workflow';
import { WORKFLOW_TEMPLATES } from './engine/templates';
import { createNodeInstance } from './engine/builtInNodes';
import { pluginManager } from './engine/pluginManager';
import { workflowEngine } from './engine/workflowEngine';

export default function App() {
  // Active Workflow State (default to Stripe Failed Payment template)
  const [workflow, setWorkflow] = useState<WorkflowDefinition>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('flowforge_active_workflow');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved workflow', e);
      }
    }
    return WORKFLOW_TEMPLATES[0];
  });

  // Selected Node State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'canvas' | 'executions' | 'templates' | 'variables' | 'plugins' | 'tests' | 'docs'>('canvas');

  // Modals visibility
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isVariablesModalOpen, setIsVariablesModalOpen] = useState(false);
  const [isPluginStudioOpen, setIsPluginStudioOpen] = useState(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Execution & Live Debugging State
  const [isRunning, setIsRunning] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeExecutionStatus>>({});
  const [currentStepLogs, setCurrentStepLogs] = useState<StepExecutionLog[]>([]);
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);

  // Registered Custom Plugins
  const [plugins, setPlugins] = useState<CustomPluginDefinition[]>(() => pluginManager.getAll());

  // Save to local storage on workflow update
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('flowforge_active_workflow', JSON.stringify(workflow));
      } catch (e) {
        console.error('Failed to save workflow', e);
      }
    }
  }, [workflow]);

  // Load execution history from server if available
  const refreshExecutions = useCallback(async () => {
    try {
      const res = await fetch('/api/executions');
      if (res.ok) {
        const data = await res.json();
        if (data.executions && data.executions.length > 0) {
          setExecutions(data.executions);
        }
      }
    } catch {
      // Local fallback
    }
  }, []);

  useEffect(() => {
    refreshExecutions();
  }, [refreshExecutions]);

  // Add Built-in Node to Canvas
  const handleAddNode = (type: string) => {
    const canvasCenterX = 400 + (Math.random() * 80 - 40);
    const canvasCenterY = 220 + (Math.random() * 80 - 40);
    const newNode = createNodeInstance(type, { x: canvasCenterX, y: canvasCenterY });

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setSelectedNodeId(newNode.id);
  };

  // Add Plugin Node to Canvas
  const handleAddPluginNode = (pluginId: string) => {
    const canvasCenterX = 400 + (Math.random() * 80 - 40);
    const canvasCenterY = 220 + (Math.random() * 80 - 40);
    const newNode = pluginManager.createNodeFromPlugin(pluginId, { x: canvasCenterX, y: canvasCenterY });

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setSelectedNodeId(newNode.id);
  };

  // Update Node Position
  const handleUpdateNodePosition = (nodeId: string, position: { x: number; y: number }) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, position } : n)
    }));
  };

  // Update Node Data / Settings
  const handleUpdateNode = (updatedNode: WorkflowNode) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
    }));
  };

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId)
    }));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  // Add Edge Connection
  const handleAddEdge = (newEdge: WorkflowEdge) => {
    setWorkflow(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge]
    }));
  };

  // Delete Edge Connection
  const handleDeleteEdge = (edgeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e.id !== edgeId)
    }));
  };

  // Run Workflow Pipeline
  const handleRunWorkflow = async (overridePayload?: any) => {
    if (isRunning) return;
    setIsRunning(true);

    // Reset node execution statuses
    const initialStatuses: Record<string, NodeExecutionStatus> = {};
    workflow.nodes.forEach(n => { initialStatuses[n.id] = 'idle'; });
    setNodeStatuses(initialStatuses);
    setCurrentStepLogs([]);

    try {
      const record = await workflowEngine.executeWorkflow(
        workflow,
        overridePayload,
        {
          onStepStart: (nodeId) => {
            setNodeStatuses(prev => ({ ...prev, [nodeId]: 'running' }));
          },
          onStepStatusChange: (nodeId, status) => {
            setNodeStatuses(prev => ({ ...prev, [nodeId]: status }));
          },
          onStepComplete: (stepLog) => {
            setCurrentStepLogs(prev => [...prev, stepLog]);
          }
        }
      );

      setExecutions(prev => [record, ...prev]);

      // Sync execution with backend store
      try {
        await fetch(`/api/workflows/${workflow.id}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: overridePayload || {} })
        });
      } catch {
        // Backend optional in isolated preview
      }
    } catch (e) {
      console.error('Workflow execution error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  // Replay Execution from History
  const handleReplayExecution = (record: ExecutionRecord) => {
    setActiveTab('canvas');
    handleRunWorkflow(record.triggerPayload);
  };

  // Load Template
  const handleSelectTemplate = (template: WorkflowDefinition) => {
    setWorkflow(JSON.parse(JSON.stringify(template)));
    setSelectedNodeId(null);
    setNodeStatuses({});
    setCurrentStepLogs([]);
    setActiveTab('canvas');
  };

  // Export Workflow JSON
  const handleExportWorkflow = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workflow, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${workflow.name.toLowerCase().replace(/\s+/g, '_')}_workflow.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Workflow JSON
  const handleImportWorkflow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            if (parsed.nodes && parsed.edges) {
              setWorkflow(parsed);
              setSelectedNodeId(null);
            }
          } catch {
            alert('Invalid workflow JSON file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunWorkflow();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeEl = document.activeElement;
        const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
        if (!isInput && selectedNodeId) {
          handleDeleteNode(selectedNodeId);
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setIsWebhookModalOpen(false);
        setIsTemplatesModalOpen(false);
        setIsVariablesModalOpen(false);
        setIsPluginStudioOpen(false);
        setIsTestSuiteOpen(false);
        setIsDocsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, isRunning, workflow]);

  const selectedNode = workflow.nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f19] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'templates') setIsTemplatesModalOpen(true);
          else if (tab === 'variables') setIsVariablesModalOpen(true);
          else if (tab === 'plugins') setIsPluginStudioOpen(true);
          else if (tab === 'tests') setIsTestSuiteOpen(true);
          else if (tab === 'docs') setIsDocsOpen(true);
          else setActiveTab(tab);
        }}
        workflow={workflow}
        isRunning={isRunning}
        onRunWorkflow={() => handleRunWorkflow()}
        onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
        onExportWorkflow={handleExportWorkflow}
        onImportWorkflow={handleImportWorkflow}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'canvas' ? (
          <>
            {/* Left: Node Palette Component Library */}
            <NodePalette
              onAddNode={handleAddNode}
              onAddPluginNode={handleAddPluginNode}
              plugins={plugins}
            />

            {/* Center: Interactive Workflow Canvas */}
            <WorkflowCanvas
              nodes={workflow.nodes}
              edges={workflow.edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onUpdateNodePosition={handleUpdateNodePosition}
              onAddEdge={handleAddEdge}
              onDeleteEdge={handleDeleteEdge}
              nodeStatuses={nodeStatuses}
              stepLogs={currentStepLogs}
              isRunning={isRunning}
            />

            {/* Right: Node Inspector Drawer */}
            {selectedNode && (
              <NodeInspector
                node={selectedNode}
                onUpdateNode={handleUpdateNode}
                onDeleteNode={handleDeleteNode}
                onClose={() => setSelectedNodeId(null)}
                allNodes={workflow.nodes}
                variables={workflow.variables}
              />
            )}
          </>
        ) : activeTab === 'executions' ? (
          <ExecutionViewer
            executions={executions}
            onReplayExecution={handleReplayExecution}
            onSelectNodeInCanvas={(nodeId) => {
              setSelectedNodeId(nodeId);
              setActiveTab('canvas');
            }}
          />
        ) : null}
      </div>

      {/* Modals & Dialogs */}
      <WebhookModal
        workflow={workflow}
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        onExecutionCompleted={refreshExecutions}
      />

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        currentWorkflowId={workflow.id}
      />

      <VariablesModal
        isOpen={isVariablesModalOpen}
        onClose={() => setIsVariablesModalOpen(false)}
        variables={workflow.variables}
        onUpdateVariables={(updatedVars) => {
          setWorkflow(prev => ({ ...prev, variables: updatedVars }));
        }}
      />

      <PluginStudioModal
        isOpen={isPluginStudioOpen}
        onClose={() => setIsPluginStudioOpen(false)}
        plugins={plugins}
        onRefreshPlugins={() => setPlugins(pluginManager.getAll())}
      />

      <TestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
      />

      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
