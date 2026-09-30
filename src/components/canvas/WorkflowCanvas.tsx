/**
 * FlowForge Visual Workflow Canvas
 * Interactive node-graph editor with SVG bezier curves, animated execution pulses,
 * multi-socket branching, magnetic port dragging, pan, zoom, and live status overlays.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Webhook, 
  Clock, 
  GitFork, 
  Filter, 
  FileJson, 
  Code2, 
  Maximize2, 
  Globe, 
  Send, 
  Hourglass, 
  Terminal, 
  KeyRound, 
  Boxes, 
  Layers, 
  Plus, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Sparkles,
  Settings
} from 'lucide-react';
import { 
  WorkflowNode, 
  WorkflowEdge, 
  NodeExecutionStatus, 
  StepExecutionLog 
} from '../../types/workflow';
import { getBezierPath, getPortCoordinates, Point } from '../../utils/canvasUtils';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  onAddEdge: (edge: WorkflowEdge) => void;
  onDeleteEdge: (edgeId: string) => void;
  nodeStatuses: Record<string, NodeExecutionStatus>;
  stepLogs?: StepExecutionLog[];
  isRunning: boolean;
}

const NODE_WIDTH = 230;

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNodePosition,
  onAddEdge,
  onDeleteEdge,
  nodeStatuses,
  stepLogs = [],
  isRunning
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom State
  const [pan, setPan] = useState<Point>({ x: 60, y: 60 });
  const [zoom, setZoom] = useState<number>(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  // Wire Connection Dragging State
  const [connectingSource, setConnectingSource] = useState<{
    nodeId: string;
    portId: string;
    startPoint: Point;
  } | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });

  // Hovered edge for delete button
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Convert Screen Coordinates to Canvas Space
  const screenToCanvas = useCallback((clientX: number, clientY: number): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  }, [pan, zoom]);

  // Handle Wheel (Zoom and Trackpad Pan)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.4), 2.2);
      
      const mouseCanvas = screenToCanvas(e.clientX, e.clientY);
      setZoom(newZoom);
      setPan({
        x: e.clientX - containerRef.current!.getBoundingClientRect().left - mouseCanvas.x * newZoom,
        y: e.clientY - containerRef.current!.getBoundingClientRect().top - mouseCanvas.y * newZoom
      });
    } else {
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // Background Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasCoord = screenToCanvas(e.clientX, e.clientY);
    setMousePos(canvasCoord);

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggingNodeId) {
      const newPos = {
        x: Math.round(canvasCoord.x - dragOffset.x),
        y: Math.round(canvasCoord.y - dragOffset.y)
      };
      onUpdateNodePosition(draggingNodeId, newPos);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setConnectingSource(null);
  };

  // Node Drag Initiator
  const startDragNode = (e: React.MouseEvent, node: WorkflowNode) => {
    e.stopPropagation();
    onSelectNode(node.id);
    const canvasCoord = screenToCanvas(e.clientX, e.clientY);
    setDraggingNodeId(node.id);
    setDragOffset({
      x: canvasCoord.x - node.position.x,
      y: canvasCoord.y - node.position.y
    });
  };

  // Connection Drag Initiator
  const startConnection = (e: React.MouseEvent, nodeId: string, portId: string, portPoint: Point) => {
    e.stopPropagation();
    setConnectingSource({
      nodeId,
      portId,
      startPoint: portPoint
    });
  };

  // Complete Connection
  const completeConnection = (e: React.MouseEvent, targetNodeId: string, targetPortId: string) => {
    e.stopPropagation();
    if (!connectingSource) return;

    if (connectingSource.nodeId === targetNodeId) {
      // Prevent self connection
      setConnectingSource(null);
      return;
    }

    // Check if edge already exists
    const exists = edges.some(
      edge => edge.fromNodeId === connectingSource.nodeId &&
              edge.fromPortId === connectingSource.portId &&
              edge.toNodeId === targetNodeId &&
              edge.toPortId === targetPortId
    );

    if (!exists) {
      const newEdge: WorkflowEdge = {
        id: `edge_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        fromNodeId: connectingSource.nodeId,
        fromPortId: connectingSource.portId,
        toNodeId: targetNodeId,
        toPortId: targetPortId,
        label: connectingSource.portId === 'true' ? 'true' : (connectingSource.portId === 'false' ? 'false' : undefined)
      };
      onAddEdge(newEdge);
    }

    setConnectingSource(null);
  };

  // Fit View
  const handleFitView = () => {
    if (nodes.length === 0) return;
    const minX = Math.min(...nodes.map(n => n.position.x));
    const maxX = Math.max(...nodes.map(n => n.position.x + NODE_WIDTH));
    const minY = Math.min(...nodes.map(n => n.position.y));
    const maxY = Math.max(...nodes.map(n => n.position.y + 140));

    const width = maxX - minX + 200;
    const height = maxY - minY + 200;
    const containerWidth = containerRef.current?.clientWidth || 1000;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const newZoom = Math.min(Math.max(Math.min(containerWidth / width, containerHeight / height), 0.5), 1.2);
    setZoom(newZoom);
    setPan({
      x: (containerWidth - (maxX + minX) * newZoom) / 2,
      y: (containerHeight - (maxY + minY) * newZoom) / 2
    });
  };

  // Icon Resolver
  const getNodeIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Play': return <Play className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Webhook': return <Webhook className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Clock': return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'GitFork': return <GitFork className="w-3.5 h-3.5 text-purple-400" />;
      case 'Filter': return <Filter className="w-3.5 h-3.5 text-indigo-400" />;
      case 'FileJson': return <FileJson className="w-3.5 h-3.5 text-blue-400" />;
      case 'Code2': return <Code2 className="w-3.5 h-3.5 text-yellow-400" />;
      case 'Maximize2': return <Maximize2 className="w-3.5 h-3.5 text-teal-400" />;
      case 'Globe': return <Globe className="w-3.5 h-3.5 text-sky-400" />;
      case 'Send': return <Send className="w-3.5 h-3.5 text-pink-400" />;
      case 'Hourglass': return <Hourglass className="w-3.5 h-3.5 text-orange-400" />;
      case 'Terminal': return <Terminal className="w-3.5 h-3.5 text-emerald-400" />;
      case 'KeyRound': return <KeyRound className="w-3.5 h-3.5 text-amber-400" />;
      case 'Boxes': return <Boxes className="w-3.5 h-3.5 text-violet-400" />;
      case 'Layers': return <Layers className="w-3.5 h-3.5 text-cyan-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex-1 h-full w-full bg-[#0b0f19] canvas-grid overflow-hidden select-none cursor-crosshair"
    >
      {/* Zoom / Pan Controls HUD */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg shadow-xl backdrop-blur-sm">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.15, 2))}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 60, y: 60 }); }}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-xs font-mono font-medium px-2"
          title="Reset Zoom (100%)"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleFitView}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Fit Canvas to View"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Main Canvas SVG Layer for Connection Cables */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        <defs>
          <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="grad-true" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="grad-false" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Existing Edges */}
        {edges.map((edge) => {
          const sourceNode = nodes.find(n => n.id === edge.fromNodeId);
          const targetNode = nodes.find(n => n.id === edge.toNodeId);
          if (!sourceNode || !targetNode) return null;

          const sourcePortIndex = sourceNode.outputs.findIndex(p => p.id === edge.fromPortId);
          const targetPortIndex = targetNode.inputs.findIndex(p => p.id === edge.toPortId);

          const startPt = getPortCoordinates(
            sourceNode.position,
            NODE_WIDTH,
            'output',
            sourcePortIndex >= 0 ? sourcePortIndex : 0,
            sourceNode.outputs.length
          );

          const endPt = getPortCoordinates(
            targetNode.position,
            NODE_WIDTH,
            'input',
            targetPortIndex >= 0 ? targetPortIndex : 0,
            targetNode.inputs.length
          );

          const pathStr = getBezierPath(startPt, endPt);
          const isSourceRunning = nodeStatuses[sourceNode.id] === 'running';
          const isSourceSuccess = nodeStatuses[sourceNode.id] === 'success';
          const isTargetRunning = nodeStatuses[targetNode.id] === 'running';
          const isHovered = hoveredEdgeId === edge.id;

          let strokeColor = '#334155'; // slate-700
          if (edge.fromPortId === 'true') strokeColor = '#059669'; // emerald-600
          else if (edge.fromPortId === 'false') strokeColor = '#e11d48'; // rose-600
          else if (isSourceSuccess) strokeColor = '#0284c7'; // sky-600

          const isWireActive = isRunning && (isSourceRunning || isTargetRunning);

          // Calculate midpoint for label and delete button
          const midX = (startPt.x + endPt.x) / 2;
          const midY = (startPt.y + endPt.y) / 2;

          return (
            <g
              key={edge.id}
              className="pointer-events-auto cursor-pointer group"
              onMouseEnter={() => setHoveredEdgeId(edge.id)}
              onMouseLeave={() => setHoveredEdgeId(null)}
            >
              {/* Invisible thicker stroke for easier hover & clicking */}
              <path
                d={pathStr}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
                onClick={() => onDeleteEdge(edge.id)}
              />

              {/* Base Wire */}
              <path
                d={pathStr}
                fill="none"
                stroke={isHovered ? '#f43f5e' : strokeColor}
                strokeWidth={isHovered ? 3 : 2}
                className="transition-colors"
              />

              {/* Animated Glowing Execution Pulse */}
              {isWireActive && (
                <path
                  d={pathStr}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  className="pulse-wire"
                />
              )}

              {/* Branch Label Badge */}
              {edge.label && (
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x={-18}
                    y={-9}
                    width={36}
                    height={18}
                    rx={4}
                    fill={edge.label === 'true' ? '#064e3b' : '#881337'}
                    stroke={edge.label === 'true' ? '#10b981' : '#f43f5e'}
                    strokeWidth={1}
                  />
                  <text
                    x={0}
                    y={3.5}
                    textAnchor="middle"
                    fill={edge.label === 'true' ? '#34d399' : '#fda4af'}
                    fontSize={10}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {edge.label}
                  </text>
                </g>
              )}

              {/* Hover Delete Action Icon */}
              {isHovered && (
                <g 
                  transform={`translate(${midX}, ${midY - (edge.label ? 18 : 0)})`} 
                  onClick={() => onDeleteEdge(edge.id)}
                  className="cursor-pointer"
                >
                  <circle cx={0} cy={0} r={9} fill="#e11d48" />
                  <text x={0} y={3.5} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="bold">×</text>
                </g>
              )}
            </g>
          );
        })}

        {/* Dynamic Dragging Wire */}
        {connectingSource && (
          <path
            d={getBezierPath(connectingSource.startPoint, mousePos)}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2.5}
            strokeDasharray="4 4"
            className="pulse-wire"
          />
        )}
      </svg>

      {/* Nodes DOM Layer */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const status = nodeStatuses[node.id] || 'idle';
          const stepLog = stepLogs.find(l => l.nodeId === node.id);

          let borderStatusClass = 'border-slate-800';
          let shadowClass = 'shadow-lg';

          if (status === 'running') {
            borderStatusClass = 'border-cyan-400 ring-2 ring-cyan-500/30';
            shadowClass = 'shadow-cyan-900/30 shadow-xl';
          } else if (status === 'success') {
            borderStatusClass = 'border-emerald-500/80';
          } else if (status === 'failed') {
            borderStatusClass = 'border-rose-500 ring-2 ring-rose-500/30';
            shadowClass = 'shadow-rose-950/40 shadow-xl';
          } else if (status === 'retrying') {
            borderStatusClass = 'border-amber-400 ring-2 ring-amber-500/30 animate-pulse';
          } else if (isSelected) {
            borderStatusClass = 'border-cyan-500 ring-1 ring-cyan-500/40';
          }

          return (
            <div
              key={node.id}
              style={{
                transform: `translate(${node.position.x}px, ${node.position.y}px)`,
                width: `${NODE_WIDTH}px`
              }}
              onMouseDown={(e) => startDragNode(e, node)}
              className={`absolute pointer-events-auto bg-[#0f172a] rounded-xl border ${borderStatusClass} ${shadowClass} select-none transition-shadow cursor-grab active:cursor-grabbing group`}
            >
              {/* Node Header */}
              <div className="h-11 px-3 bg-slate-900/90 rounded-t-xl border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded bg-slate-800/80 shrink-0">
                    {getNodeIcon(node.icon)}
                  </div>
                  <span className="text-xs font-semibold text-slate-100 truncate">
                    {node.name}
                  </span>
                </div>

                {/* Status Indicator Badge */}
                <div className="shrink-0 flex items-center gap-1">
                  {status === 'running' && (
                    <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  )}
                  {status === 'retrying' && (
                    <span className="text-[10px] font-mono text-amber-400 font-bold px-1 bg-amber-950/60 rounded border border-amber-800">
                      RTY
                    </span>
                  )}
                  {status === 'success' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {status === 'failed' && (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  {status === 'idle' && (
                    <span className="text-[10px] text-slate-500 capitalize">{node.category}</span>
                  )}
                </div>
              </div>

              {/* Node Body & Ports */}
              <div className="p-2.5 space-y-2">
                {/* Description or Meta */}
                {node.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 leading-tight px-1">
                    {node.description}
                  </p>
                )}

                {/* Duration indicator if finished */}
                {stepLog && stepLog.durationMs !== undefined && (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono tabular-nums">
                    <span>Duration:</span>
                    <span className="text-cyan-400 font-semibold">{stepLog.durationMs}ms</span>
                  </div>
                )}

                {/* Ports layout */}
                <div className="flex justify-between items-start pt-1">
                  {/* Left: Input Ports */}
                  <div className="space-y-1.5 -ml-4">
                    {node.inputs.map((port, idx) => (
                      <div
                        key={port.id}
                        onMouseUp={(e) => completeConnection(e, node.id, port.id)}
                        className="flex items-center gap-1.5 group/port cursor-pointer"
                        title={`Input: ${port.name}`}
                      >
                        <div className="w-3 h-3 rounded-full bg-slate-900 border-2 border-indigo-400 hover:border-cyan-300 hover:scale-125 transition-all shadow-sm" />
                        <span className="text-[10px] text-slate-400 group-hover/port:text-slate-200">
                          {port.label || port.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Right: Output Ports */}
                  <div className="space-y-1.5 -mr-4 flex flex-col items-end">
                    {node.outputs.map((port, idx) => {
                      const portPt = getPortCoordinates(
                        node.position,
                        NODE_WIDTH,
                        'output',
                        idx,
                        node.outputs.length
                      );

                      let portBorderColor = 'border-cyan-400';
                      let portLabelColor = 'text-slate-400';
                      if (port.id === 'true') {
                        portBorderColor = 'border-emerald-400';
                        portLabelColor = 'text-emerald-400 font-medium';
                      } else if (port.id === 'false') {
                        portBorderColor = 'border-rose-400';
                        portLabelColor = 'text-rose-400 font-medium';
                      }

                      return (
                        <div
                          key={port.id}
                          onMouseDown={(e) => startConnection(e, node.id, port.id, portPt)}
                          className="flex items-center gap-1.5 group/port cursor-pointer"
                          title={`Output: ${port.name}`}
                        >
                          <span className={`text-[10px] ${portLabelColor} group-hover/port:text-slate-200`}>
                            {port.label || port.name}
                          </span>
                          <div className={`w-3 h-3 rounded-full bg-slate-900 border-2 ${portBorderColor} hover:scale-125 transition-all shadow-sm`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
