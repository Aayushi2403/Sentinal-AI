import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Frown,
  Meh,
  Search,
  Smile,
  Sparkles,
  TrendingDown,
  User,
} from 'lucide-react';
import { Ticket, TicketCategory, TicketSentiment, TicketStatus } from '../types';

interface TicketListProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  onSelectTicket: (ticket: Ticket) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedSentiment: string;
  setSelectedSentiment: (s: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSentiment,
  setSelectedSentiment,
  selectedStatus,
  setSelectedStatus,
}) => {
  const handleDownloadCSV = () => {
    if (!tickets || tickets.length === 0) return;

    const headers = [
      'Ticket Number',
      'Title',
      'Status',
      'Priority',
      'Category',
      'Customer Name',
      'Customer Email',
      'Company',
      'Assigned Agent',
      'Sentiment',
      'Sentiment Score',
      'SLA Remaining (min)',
      'Resolution Time (min)',
      'AI Category Confidence (%)',
      'Grounded Runbooks',
      'Root Cause Hypothesis',
      'Created At',
      'Description',
    ];

    const escapeCSV = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = tickets.map((t) => [
      escapeCSV(t.ticketNumber),
      escapeCSV(t.title),
      escapeCSV(t.status),
      escapeCSV(t.priority),
      escapeCSV(t.category),
      escapeCSV(t.customerName),
      escapeCSV(t.customerEmail),
      escapeCSV(t.company),
      escapeCSV(t.assignedAgent || 'Unassigned'),
      escapeCSV(t.sentiment),
      escapeCSV(t.sentimentScore),
      escapeCSV(t.slaMinutesRemaining),
      escapeCSV(t.resolutionTimeMinutes ?? ''),
      escapeCSV(Math.round((t.aiAnalysis?.categoryConfidence || 0) * 100)),
      escapeCSV(t.aiAnalysis?.groundedArticles?.join('; ') || ''),
      escapeCSV(t.aiAnalysis?.rootCauseHypothesis || ''),
      escapeCSV(t.createdAt),
      escapeCSV(t.description),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.setAttribute('href', url);
    link.setAttribute('download', `sentinel_tickets_report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return '2m ago';
    }
  };

  const getPriorityBorderClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-amber-500';
      case 'medium':
        return 'border-l-blue-500';
      default:
        return 'border-l-slate-300';
    }
  };

  const getPriorityHeader = (ticket: Ticket) => {
    switch (ticket.priority) {
      case 'urgent':
        return (
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-tight">
            #{ticket.ticketNumber} • Urgent (P1)
          </span>
        );
      case 'high':
        return (
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
            #{ticket.ticketNumber} • High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
            #{ticket.ticketNumber} • Med Priority
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            #{ticket.ticketNumber} • Low Priority
          </span>
        );
    }
  };

  const getSentimentPill = (sentiment: TicketSentiment, score: number) => {
    switch (sentiment) {
      case 'frustrated':
        return (
          <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-semibold rounded-md border border-red-200/60">
            Frustrated ({Math.round(Math.abs(score) * 100)}%)
          </span>
        );
      case 'urgent':
        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-md border border-amber-200/60">
            Critical ({Math.round(Math.abs(score) * 100)}%)
          </span>
        );
      case 'negative':
        return (
          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-medium rounded-md border border-orange-200/60">
            Friction ({Math.round(Math.abs(score) * 100)}%)
          </span>
        );
      case 'positive':
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-md border border-emerald-200/60">
            Positive ({Math.round(score * 100)}%)
          </span>
        );
      case 'neutral':
      default:
        return (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md">
            Neutral (44%)
          </span>
        );
    }
  };

  const categories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Authentication & SSO', value: 'Authentication & SSO' },
    { label: 'Billing & Invoices', value: 'Billing & Invoices' },
    { label: 'IT Infrastructure', value: 'IT Infrastructure' },
    { label: 'Bug & Technical Issue', value: 'Bug & Technical Issue' },
    { label: 'Security & Access', value: 'Security & Access' },
    { label: 'Product & Feature Request', value: 'Product & Feature Request' },
  ];

  return (
    <div className="flex lg:h-full flex-col gap-3 select-none lg:overflow-y-auto p-3">
      {/* Queue Header & Actions */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <span>Incoming Queue</span>
          <span className="text-[11px] font-medium text-slate-400">({tickets.length})</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            id="btn-download-csv"
            onClick={handleDownloadCSV}
            disabled={tickets.length === 0}
            title="Download CSV report of current filtered tickets"
            className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 text-[11px] px-2 py-0.5 rounded-md font-semibold border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            <Download className="h-3 w-3 text-slate-500" />
            <span>Download CSV</span>
          </button>
          <div className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border border-blue-200/60 hidden sm:inline-block">
            Auto-Prioritized
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          id="input-ticket-search"
          type="text"
          placeholder="Search tickets, customers, errors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-8.5 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none shadow-2xs transition-all"
        />
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <select
          id="select-filter-category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          id="select-filter-sentiment"
          value={selectedSentiment}
          onChange={(e) => setSelectedSentiment(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Sentiments</option>
          <option value="frustrated">Frustrated</option>
          <option value="urgent">Urgent</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
          <option value="positive">Positive</option>
        </select>

        <select
          id="select-filter-status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Cards List Container */}
      <div className="space-y-2.5">
        {tickets.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-2xs">
            <CheckCircle className="h-6 w-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No matching tickets</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Try adjusting your query or filter tags.
            </p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const isSelected = ticket.id === selectedTicketId;
            const borderClass = getPriorityBorderClass(ticket.priority);

            return (
              <div
                key={ticket.id}
                id={`ticket-item-${ticket.id}`}
                onClick={() => onSelectTicket(ticket)}
                className={`bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-slate-200/80 border-l-4 ${borderClass} flex flex-col gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-blue-500/30 bg-blue-50/15 shadow-sm'
                    : 'hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Header: ID, Priority, Timestamp */}
                <div className="flex justify-between items-start gap-2">
                  {getPriorityHeader(ticket)}
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {getRelativeTime(ticket.createdAt)}
                  </span>
                </div>

                {/* Title */}
                <p className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1 leading-snug">
                  {ticket.title}
                </p>

                {/* Description Excerpt */}
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {ticket.description}
                </p>

                {/* Tags Row */}
                <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-md">
                    {ticket.category.split(' ')[0]}
                  </span>

                  {getSentimentPill(ticket.sentiment, ticket.sentimentScore)}

                  {ticket.status === 'resolved' ? (
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-md border border-emerald-200/60 ml-auto">
                      Resolved
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 ml-auto flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {ticket.slaMinutesRemaining}m
                    </span>
                  )}
                </div>

                {/* Customer footer */}
                <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5 mt-0.5">
                  <span className="font-medium text-slate-600 truncate max-w-[65%]">
                    {ticket.customerName} • {ticket.company}
                  </span>
                  <span className="font-semibold text-blue-600">
                    {Math.round(ticket.aiAnalysis.categoryConfidence * 100)}% Match
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
