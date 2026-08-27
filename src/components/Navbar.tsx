import React from 'react';
import {
  Bot,
  CheckCircle2,
  Cpu,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'workspace' | 'analytics' | 'knowledge' | 'architecture';
  setActiveTab: (tab: 'workspace' | 'analytics' | 'knowledge' | 'architecture') => void;
  onOpenNewTicket: () => void;
  onOpenBatchSim: () => void;
  isSimulating?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTicket,
  onOpenBatchSim,
  isSimulating,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-slate-900">
                Intelligent Support Desk
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI Triage Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Enterprise Automated Helpdesk & Triage Engine
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-lg bg-slate-100/80 p-1 text-xs font-medium text-slate-600">
          <button
            id="nav-tab-workspace"
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              activeTab === 'workspace'
                ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Triage Workspace
          </button>
          <button
            id="nav-tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              activeTab === 'analytics'
                ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Analytics & SLA
          </button>
          <button
            id="nav-tab-knowledge"
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              activeTab === 'knowledge'
                ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Knowledge Base
          </button>
          <button
            id="nav-tab-architecture"
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              activeTab === 'architecture'
                ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            SDE Architecture
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-simulate-batch"
            onClick={onOpenBatchSim}
            disabled={isSimulating}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin text-indigo-600' : ''}`} />
            Async Batch Sim
          </button>

          <button
            id="btn-new-ticket"
            onClick={onOpenNewTicket}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Ticket</span>
            <span className="hidden lg:inline-flex items-center gap-0.5 rounded bg-indigo-500/50 px-1 py-0.2 text-[10px]">
              <Sparkles className="h-2.5 w-2.5" /> AI
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="flex md:hidden border-t border-slate-200 overflow-x-auto px-4 py-2 gap-2 bg-slate-50 text-xs">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`px-3 py-1 rounded-full whitespace-nowrap ${
            activeTab === 'workspace' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600 bg-white border border-slate-200'
          }`}
        >
          Workspace
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1 rounded-full whitespace-nowrap ${
            activeTab === 'analytics' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600 bg-white border border-slate-200'
          }`}
        >
          Analytics & SLA
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-3 py-1 rounded-full whitespace-nowrap ${
            activeTab === 'knowledge' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600 bg-white border border-slate-200'
          }`}
        >
          Knowledge Base
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-3 py-1 rounded-full whitespace-nowrap ${
            activeTab === 'architecture' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600 bg-white border border-slate-200'
          }`}
        >
          SDE Architecture
        </button>
      </div>
    </header>
  );
};
