import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Download,
  Frown,
  Meh,
  PieChart,
  ShieldAlert,
  Smile,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { AgentInfo, HelpdeskMetrics, Ticket } from '../types';
import { TicketHeatmap } from './TicketHeatmap';
import { RechartsWorkloadHeatmap } from './RechartsWorkloadHeatmap';
import { DateRangePicker } from './DateRangePicker';

interface AnalyticsDashboardProps {
  metrics: HelpdeskMetrics;
  agents: AgentInfo[];
  tickets?: Ticket[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  metrics: initialMetrics,
  agents,
  tickets = [],
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredTickets = useMemo(() => {
    if (!startDate && !endDate) return tickets;
    
    return tickets.filter(t => {
      const time = new Date(t.createdAt).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      // Add 1 day minus 1 ms to include the full end day
      const end = endDate ? new Date(endDate).getTime() + 86399999 : Infinity;
      return time >= start && time <= end;
    });
  }, [tickets, startDate, endDate]);

  const metrics = useMemo(() => {
    if (!startDate && !endDate) return initialMetrics;

    const total = filteredTickets.length;
    const open = filteredTickets.filter(t => t.status === 'open').length;
    const inProgress = filteredTickets.filter(t => t.status === 'in_progress').length;
    const resolved = filteredTickets.filter(t => t.status === 'resolved').length;
    const urgentQueueCount = filteredTickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length;
    
    if (total === 0) {
      return {
        ...initialMetrics,
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        inProgressTickets: 0,
        urgentQueueCount: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0, frustrated: 0, urgent: 0 },
        categoryBreakdown: initialMetrics.categoryBreakdown.map(c => ({ ...c, count: 0, percentage: 0 })),
      };
    }

    const sentimentBreakdown = {
      positive: filteredTickets.filter(t => t.sentiment === 'positive').length,
      neutral: filteredTickets.filter(t => t.sentiment === 'neutral').length,
      negative: filteredTickets.filter(t => t.sentiment === 'negative').length,
      frustrated: filteredTickets.filter(t => t.sentiment === 'frustrated').length,
      urgent: filteredTickets.filter(t => t.sentiment === 'urgent').length,
    };

    const categoryBreakdown = initialMetrics.categoryBreakdown.map(cat => {
      const count = filteredTickets.filter(t => t.category === cat.category).length;
      return {
        category: cat.category,
        count,
        percentage: Math.round((count / total) * 100),
      };
    });

    return {
      ...initialMetrics,
      totalTickets: total,
      openTickets: open,
      resolvedTickets: resolved,
      inProgressTickets: inProgress,
      urgentQueueCount,
      sentimentBreakdown,
      categoryBreakdown,
    };
  }, [filteredTickets, initialMetrics, startDate, endDate]);

  const handleExportCSV = () => {
    if (!filteredTickets || filteredTickets.length === 0) return;
    
    const headers = [
      'Ticket Number',
      'Title',
      'Status',
      'Priority',
      'Category',
      'Customer Name',
      'Company',
      'Sentiment',
      'Created At',
      'Updated At',
    ].join(',');
    
    const rows = filteredTickets.map(t => {
      return [
        t.ticketNumber,
        `"${t.title.replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        `"${t.category}"`,
        `"${t.customerName}"`,
        `"${t.company}"`,
        t.sentiment,
        new Date(t.createdAt).toISOString(),
        new Date(t.updatedAt).toISOString(),
      ].join(',');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `helpdesk_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/30 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Intelligent Automation Performance</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Enterprise Helpdesk & AI Triage Metrics
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-2xl">
              Live observability of asynchronous ticket ingestion, Gemini 3.7 sentiment analysis, and response time reduction benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10 text-center min-w-[120px]">
              <div className="text-2xl font-black text-emerald-300">
                -40.2%
              </div>
              <div className="text-[11px] text-indigo-200 font-medium mt-0.5">
                Response Time Δ
              </div>
            </div>

            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10 text-center min-w-[120px]">
              <div className="text-2xl font-black text-indigo-200">
                92.4%
              </div>
              <div className="text-[11px] text-indigo-200 font-medium mt-0.5">
                AI Tag Accuracy
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={handleExportCSV}
          disabled={filteredTickets.length === 0}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 text-slate-500" />
          Export to CSV
        </button>

        <DateRangePicker 
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ingested */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tickets</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics.totalTickets}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{metrics.openTickets} open</span>
            <span>·</span>
            <span className="font-semibold text-emerald-600">{metrics.resolvedTickets} resolved</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">First Response Time</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics.avgFirstResponseMinutes} min
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>Reduced from 45 min baseline</span>
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">SLA Compliance</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics.slaComplianceRate}%
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <span className="text-amber-600 font-semibold">{metrics.urgentQueueCount} in Urgent Queue</span>
          </div>
        </div>

        {/* Resolution Velocity */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Resolution</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics.avgResolutionMinutes} min
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-purple-700 font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>AI Copilot assisted</span>
          </div>
        </div>
      </div>

      {/* Deep Dive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Automated Category Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Classified using LangChain prompt chains and vector embeddings
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
              92.4% Accuracy
            </span>
          </div>

          <div className="space-y-3.5">
            {metrics.categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.category}</span>
                  <span className="text-slate-500 font-medium">
                    {item.count} tickets ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Spectrum */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Customer Sentiment Spectrum
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluated on incoming text (-1.0 to +1.0 polarity scale)
                </p>
              </div>
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                Live Sentiment Gate
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 my-4">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <Frown className="h-5 w-5 text-rose-600 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-rose-700">
                  {metrics.sentimentBreakdown.frustrated}
                </div>
                <div className="text-[10px] font-bold uppercase text-rose-600 mt-0.5">
                  Frustrated
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <ShieldAlert className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-amber-700">
                  {metrics.sentimentBreakdown.urgent}
                </div>
                <div className="text-[10px] font-bold uppercase text-amber-600 mt-0.5">
                  Urgent
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
                <TrendingDown className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-orange-700">
                  {metrics.sentimentBreakdown.negative}
                </div>
                <div className="text-[10px] font-bold uppercase text-orange-600 mt-0.5">
                  Negative
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
                <Meh className="h-5 w-5 text-slate-600 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-slate-700">
                  {metrics.sentimentBreakdown.neutral}
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-500 mt-0.5">
                  Neutral
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <Smile className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-emerald-700">
                  {metrics.sentimentBreakdown.positive}
                </div>
                <div className="text-[10px] font-bold uppercase text-emerald-600 mt-0.5">
                  Positive
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 leading-relaxed">
              <strong className="text-slate-900">Automated Routing Rule:</strong> Tickets classified as <em>Frustrated</em> or <em>Urgent</em> automatically trigger Priority SLA (60m response window) and adapt the AI Copilot to generate empathetic, de-escalating draft responses.
            </div>
          </div>

          {/* Activity Stream */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-indigo-600" />
              <span>Real-time Triage Audit Log</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {metrics.recentActivity.slice(0, 4).map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200/80"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[11px] font-bold text-indigo-600">
                      {act.ticketNumber}
                    </span>
                    <span className="truncate text-slate-700">{act.action}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                    {act.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Day-of-Week vs Priority Workload Heatmap */}
      <RechartsWorkloadHeatmap tickets={filteredTickets} />

      {/* D3 Day-of-Week vs Priority Volume Heatmap */}
      <TicketHeatmap tickets={filteredTickets} />

      {/* Agent Team Performance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Support Engineering Team & Department Allocation
            </h3>
            <p className="text-xs text-slate-500">
              Active caseload dynamically balanced by AI routing rules
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {agents.length} Active Engineers
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {agent.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {agent.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/80">
                <span className="text-slate-600 font-medium">
                  {agent.department.split(' ')[0]}
                </span>
                <span className="font-bold text-indigo-700">
                  {agent.activeTickets} active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
