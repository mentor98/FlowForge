/**
 * FlowForge Node Palette / Component Library
 * Allows users to search and add triggers, conditions, transforms, actions, and plugins.
 */

import React, { useState } from 'react';
import { 
  Search, 
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
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { BUILT_IN_NODES, NodeTypeDefinition } from '../../engine/builtInNodes';
import { CustomPluginDefinition } from '../../types/workflow';

interface NodePaletteProps {
  onAddNode: (type: string) => void;
  onAddPluginNode: (pluginId: string) => void;
  plugins: CustomPluginDefinition[];
}

export const NodePalette: React.FC<NodePaletteProps> = ({
  onAddNode,
  onAddPluginNode,
  plugins
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Play': return <Play className="w-4 h-4 text-emerald-400" />;
      case 'Webhook': return <Webhook className="w-4 h-4 text-cyan-400" />;
      case 'Clock': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'GitFork': return <GitFork className="w-4 h-4 text-purple-400" />;
      case 'Filter': return <Filter className="w-4 h-4 text-indigo-400" />;
      case 'FileJson': return <FileJson className="w-4 h-4 text-blue-400" />;
      case 'Code2': return <Code2 className="w-4 h-4 text-yellow-400" />;
      case 'Maximize2': return <Maximize2 className="w-4 h-4 text-teal-400" />;
      case 'Globe': return <Globe className="w-4 h-4 text-sky-400" />;
      case 'Send': return <Send className="w-4 h-4 text-pink-400" />;
      case 'Hourglass': return <Hourglass className="w-4 h-4 text-orange-400" />;
      case 'Terminal': return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'KeyRound': return <KeyRound className="w-4 h-4 text-amber-400" />;
      case 'Boxes': return <Boxes className="w-4 h-4 text-violet-400" />;
      case 'Layers': return <Layers className="w-4 h-4 text-cyan-400" />;
      default: return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  const categories = [
    { id: 'trigger', name: 'Triggers' },
    { id: 'condition', name: 'Logic & Conditions' },
    { id: 'transform', name: 'Transformations' },
    { id: 'action', name: 'Actions & Services' },
    { id: 'plugin', name: 'Custom Plugins' }
  ];

  const filteredBuiltIn = BUILT_IN_NODES.filter(node => 
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPlugins = plugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-72 bg-[#0d1322] border-r border-slate-800 flex flex-col h-full select-none z-20">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search nodes & plugins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Nodes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {categories.map(category => {
          const isCollapsed = collapsedCategories[category.id];

          if (category.id === 'plugin') {
            if (filteredPlugins.length === 0) return null;
            return (
              <div key={category.id} className="space-y-1.5">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase py-1 hover:text-slate-300"
                >
                  <span>{category.name} ({filteredPlugins.length})</span>
                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
                </button>

                {!isCollapsed && (
                  <div className="space-y-1">
                    {filteredPlugins.map(plugin => (
                      <div
                        key={plugin.id}
                        onClick={() => onAddPluginNode(plugin.id)}
                        className="group flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-violet-500/40 cursor-pointer transition-all"
                      >
                        <div className="mt-0.5 p-1.5 rounded-md bg-slate-800 group-hover:bg-slate-700/80">
                          {getIcon(plugin.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-200 truncate group-hover:text-white">
                              {plugin.name}
                            </span>
                            <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                            {plugin.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const nodesInCategory = filteredBuiltIn.filter(n => n.category === category.id);
          if (nodesInCategory.length === 0) return null;

          return (
            <div key={category.id} className="space-y-1.5">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase py-1 hover:text-slate-300"
              >
                <span>{category.name} ({nodesInCategory.length})</span>
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
              </button>

              {!isCollapsed && (
                <div className="space-y-1">
                  {nodesInCategory.map(node => (
                    <div
                      key={node.type}
                      onClick={() => onAddNode(node.type)}
                      className="group flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-cyan-500/40 cursor-pointer transition-all"
                    >
                      <div className="mt-0.5 p-1.5 rounded-md bg-slate-800 group-hover:bg-slate-700/80">
                        {getIcon(node.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-200 truncate group-hover:text-white">
                            {node.name}
                          </span>
                          <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                          {node.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredBuiltIn.length === 0 && filteredPlugins.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            No matching nodes found.
          </div>
        )}
      </div>
    </aside>
  );
};
