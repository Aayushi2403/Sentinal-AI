import React from 'react';
import {
  Bell,
  Cpu,
  Layers,
  Menu,
  Plus,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AgentInfo } from '../types';

interface HeaderProps {
  activeTab: 'workspace' | 'analytics' | 'knowledge' | 'architecture';
  urgentCount: number;
  activeAgent?: AgentInfo | null;
  onOpenNewTicket: () => void;
  onOpenBatchSim: () => void;
  isSimulating?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  urgentCount,
  activeAgent,
  onOpenNewTicket,
  onOpenBatchSim,
  isSimulating,
  onToggleMobileMenu,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'workspace':
        return 'Active Workspace';
      case 'analytics':
        return 'Analytics & SLA Telemetry';
      case 'knowledge':
        return 'Enterprise Knowledge Base';
      case 'architecture':
        return 'Full-Stack Architecture Spec';
      default:
        return 'Active Workspace';
    }
  };

  return (
    <header className="min-h-[4rem] py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0 z-20 gap-2">
      {/* Left: Title & Status */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 truncate">
          {getTabTitle()}
        </h1>

        {urgentCount > 0 ? (
          <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-[11px] font-bold uppercase tracking-wider hidden lg:inline-flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {urgentCount} Urgent Tickets
          </span>
        ) : (
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[11px] font-semibold uppercase tracking-wider hidden lg:inline-flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            All Queues Stable
          </span>
        )}
      </div>

      {/* Right: Actions & Engineer Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Async Queue Simulator Button */}
        <button
          id="btn-simulate-batch"
          onClick={onOpenBatchSim}
          disabled={isSimulating}
          className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          <span>Async Ingestion Sim</span>
        </button>

        {/* New Ticket Button with Sleek Blue Accent */}
        <button
          id="btn-new-ticket"
          onClick={onOpenNewTicket}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>New Ticket</span>
          <span className="hidden sm:inline-flex items-center gap-0.5 rounded bg-blue-500 px-1 py-0.2 text-[9px] font-bold">
            <Sparkles className="h-2.5 w-2.5" /> AI
          </span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Engineer Profile */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {activeAgent?.name || 'Marcus Aurelius'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {activeAgent?.role || 'Tier 3 SRE / Lead'}
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center border-2 border-white shadow-xs ring-1 ring-slate-200 text-xs shrink-0">
            {activeAgent?.name ? activeAgent.name.split(' ').map(n => n[0]).join('') : 'MA'}
          </div>
        </div>
      </div>
    </header>
  );
};
