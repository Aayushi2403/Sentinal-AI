import React from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'workspace' | 'analytics' | 'knowledge' | 'architecture';
  setActiveTab: (tab: 'workspace' | 'analytics' | 'knowledge' | 'architecture') => void;
  urgentCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  urgentCount = 0,
}) => {
  return (
    <aside className="w-64 bg-[#0F172A] flex flex-col shrink-0 h-full border-r border-slate-800 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-5 sm:p-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-xs">
          <div className="w-4 h-4 bg-white rounded-xs"></div>
        </div>
        <div>
          <span className="text-white font-bold text-lg tracking-tight block leading-tight">
            Sentinel AI
          </span>
          <span className="text-[10px] text-slate-400 tracking-wide font-medium">
            Intelligent Triage Ops
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        <button
          id="nav-tab-workspace"
          onClick={() => setActiveTab('workspace')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-all ${
            activeTab === 'workspace'
              ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                activeTab === 'workspace' ? 'bg-blue-500 shadow-xs' : 'bg-transparent'
              }`}
            />
            <span className="text-sm">Tickets Queue</span>
          </div>
          {urgentCount > 0 && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
              {urgentCount}
            </span>
          )}
        </button>

        <button
          id="nav-tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all ${
            activeTab === 'analytics'
              ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              activeTab === 'analytics' ? 'bg-blue-500' : 'bg-transparent'
            }`}
          />
          <span className="text-sm">Analytics & SLA</span>
        </button>

        <button
          id="nav-tab-knowledge"
          onClick={() => setActiveTab('knowledge')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all ${
            activeTab === 'knowledge'
              ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              activeTab === 'knowledge' ? 'bg-blue-500' : 'bg-transparent'
            }`}
          />
          <span className="text-sm">Knowledge Base</span>
        </button>

        <button
          id="nav-tab-architecture"
          onClick={() => setActiveTab('architecture')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all ${
            activeTab === 'architecture'
              ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              activeTab === 'architecture' ? 'bg-blue-500' : 'bg-transparent'
            }`}
          />
          <span className="text-sm">Architecture Spec</span>
        </button>
      </nav>

      {/* Engine Status Card */}
      <div className="p-4 border-t border-slate-800/90">
        <div className="bg-slate-800/90 rounded-xl p-3.5 border border-slate-700/60 shadow-inner">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
            Engine Status
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-green-400 font-mono font-medium">
              Gemini-3.7 / pgvector
            </span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm"></div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
            <span>Latency: 240ms</span>
            <span className="text-blue-400 font-medium">92.4% Acc</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
