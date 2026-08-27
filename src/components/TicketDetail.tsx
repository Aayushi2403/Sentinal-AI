import React, { useState } from 'react';
import {
  CheckCircle2, ChevronLeft,
} from 'lucide-react';
import { AgentInfo, Ticket, TicketPriority, TicketSentiment, TicketStatus } from '../types';
import { SLACountdownTimer } from './SLACountdownTimer';
import { SmartResponseSuggestions } from './SmartResponseSuggestions';
import { QuickRepliesMenu } from './QuickRepliesMenu';

interface TicketDetailProps {
  ticket: Ticket;
  agents: AgentInfo[];
  onUpdateTicket: (id: string, updates: Partial<Ticket>) => void;
  onSendMessage: (ticketId: string, content: string, isAiDraft?: boolean, confidence?: number) => void;
  onViewKbArticle?: (titleOrId: string) => void;
  onBack?: () => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({
  ticket,
  agents,
  onUpdateTicket,
  onSendMessage,
  onViewKbArticle,
  onBack,
}) => {
  const [replyText, setReplyText] = useState(ticket.aiAnalysis.suggestedDraftReply || '');

  const handleSendReply = (andResolve: boolean = false) => {
    if (!replyText.trim()) return;
    onSendMessage(ticket.id, replyText, true, ticket.aiAnalysis.categoryConfidence);
    if (andResolve) {
      onUpdateTicket(ticket.id, { status: 'resolved' });
    } else if (ticket.status === 'open') {
      onUpdateTicket(ticket.id, { status: 'in_progress' });
    }
  };

  // Get customer avatar initials and background color
  const getCustomerInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };


  const getCustomerAvatarColor = (sentiment: TicketSentiment) => {
    switch (sentiment) {
      case 'frustrated':
        return 'bg-red-100 text-red-600 border border-red-200';
      case 'urgent':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'positive':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col lg:overflow-y-auto lg:h-full select-none">
      {/* Top Section: Customer Header & Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          {/* Customer Avatar & Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="lg:hidden p-1.5 -ml-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${getCustomerAvatarColor(
                ticket.sentiment
              )}`}
            >
              {getCustomerInitials(ticket.customerName)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {ticket.customerName}
                </h3>
                <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  #{ticket.ticketNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {ticket.customerEmail} • <span className="font-medium text-slate-700">{ticket.company}</span>
              </p>
            </div>
          </div>

          {/* Action Selectors & Resolve Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Dropdown */}
            <select
              id="select-ticket-status"
              value={ticket.status}
              onChange={(e) => onUpdateTicket(ticket.id, { status: e.target.value as TicketStatus })}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs focus:outline-none"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_customer">Pending Client</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>

            {/* Priority Dropdown */}
            <select
              id="select-ticket-priority"
              value={ticket.priority}
              onChange={(e) => onUpdateTicket(ticket.id, { priority: e.target.value as TicketPriority })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase shadow-2xs focus:outline-none border ${
                ticket.priority === 'urgent'
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : ticket.priority === 'high'
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <option value="urgent">P1 Urgent</option>
              <option value="high">P2 High</option>
              <option value="medium">P3 Medium</option>
              <option value="low">P4 Low</option>
            </select>

            {/* Assignee / Transfer */}
            <select
              id="select-ticket-assignee"
              value={ticket.assignedAgent || ''}
              onChange={(e) => onUpdateTicket(ticket.id, { assignedAgent: e.target.value })}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs focus:outline-none hidden md:inline-block"
            >
              <option value="">Transfer Agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name} ({a.department.split(' ')[0]})
                </option>
              ))}
            </select>

            {/* Resolve Button */}
            {ticket.status !== 'resolved' ? (
              <button
                id="btn-quick-resolve"
                onClick={() => onUpdateTicket(ticket.id, { status: 'resolved' })}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 transition-all active:scale-98"
              >
                Resolve
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                Resolved in {ticket.resolutionTimeMinutes || 18}m
              </span>
            )}
          </div>
        </div>

        {/* Dynamic SLA Countdown Timer */}
        <div className="mb-3">
          <SLACountdownTimer ticket={ticket} />
        </div>

        {/* Customer Ticket Message Box */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-900">{ticket.title}</span>
            <span className="text-[10px] text-slate-400">
              {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
            "{ticket.description}"
          </p>
        </div>
      </div>

      {/* Main Body: Smart Response Suggestions & Composer */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4 shrink-0">
        {/* Smart Response Suggestions Multi-Template Hub */}
        <SmartResponseSuggestions
          ticket={ticket}
          onApplyTemplate={(content) => {
            setReplyText(content);
          }}
          onViewKbArticle={onViewKbArticle}
        />

        {/* Manual Response Composer Box */}
        <div className="border border-slate-200 rounded-xl p-3 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 shadow-2xs flex flex-col min-h-[130px] shrink-0">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-2 text-[11px] font-semibold text-slate-500 gap-2">
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Agent Response Composer:
            </span>
            <div className="flex items-center gap-3 self-start xl:self-auto">
              <span className="text-[10px] text-slate-400 hidden 2xl:inline">Markdown formatting supported • Live Preview</span>
              <QuickRepliesMenu onSelect={(content) => setReplyText(prev => prev ? prev + '\n\n' + content : content)} />
            </div>
          </div>

          <textarea
            id="textarea-reply-draft"
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Selected template or custom response will appear here. Edit freely before dispatching..."
            className="flex-1 w-full text-xs sm:text-sm text-slate-800 leading-relaxed placeholder:text-slate-400 focus:outline-none resize-none bg-transparent"
          />
        </div>


        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-1 pb-4 sm:pb-6 shrink-0">
          <button
            id="btn-send-reply"
            onClick={() => handleSendReply(false)}
            disabled={!replyText.trim()}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors disabled:opacity-50"
          >
            Send Draft Reply
          </button>

          <button
            id="btn-send-and-resolve"
            onClick={() => handleSendReply(true)}
            disabled={!replyText.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-98 disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Send & Resolve</span>
          </button>
        </div>
      </div>
    </div>
  );
};
