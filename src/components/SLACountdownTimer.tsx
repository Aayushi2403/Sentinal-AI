import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Hourglass,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Ticket, TicketPriority } from '../types';

interface SLACountdownTimerProps {
  ticket: Ticket;
  compact?: boolean;
}

export const SLACountdownTimer: React.FC<SLACountdownTimerProps> = ({
  ticket,
  compact = false,
}) => {
  const [now, setNow] = useState<number>(Date.now());

  // Tick every second to keep countdown dynamic and accurate
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [ticket.id, ticket.status]);

  // Derive SLA total minutes from ticket or priority tier
  const getSlaTotalMinutes = (priority: TicketPriority, explicitTotal?: number) => {
    if (explicitTotal && explicitTotal > 0) return explicitTotal;
    switch (priority) {
      case 'urgent':
        return 60; // 1 hour P1
      case 'high':
        return 120; // 2 hours P2
      case 'medium':
        return 240; // 4 hours P3
      case 'low':
      default:
        return 480; // 8 hours P4
    }
  };

  const slaTotalMinutes = getSlaTotalMinutes(ticket.priority, ticket.slaTotalMinutes);
  const slaTotalMs = slaTotalMinutes * 60 * 1000;
  const createdTime = new Date(ticket.createdAt).getTime();
  const targetDeadlineMs = createdTime + slaTotalMs;
  const deadlineDate = new Date(targetDeadlineMs);

  const isResolved = ticket.status === 'resolved';

  // Elapsed vs Remaining
  const elapsedMs = Math.max(0, now - createdTime);
  const remainingMs = targetDeadlineMs - now;
  const isBreached = remainingMs <= 0;

  // Percentage elapsed for progress bar (0 to 100)
  const elapsedPercent = Math.min(100, Math.max(0, (elapsedMs / slaTotalMs) * 100));
  const remainingPercent = Math.max(0, 100 - elapsedPercent);

  // Time format calculations
  const absRemainingMs = Math.abs(remainingMs);
  const remHours = Math.floor(absRemainingMs / (1000 * 60 * 60));
  const remMinutes = Math.floor((absRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remSeconds = Math.floor((absRemainingMs % (1000 * 60)) / 1000);

  // Format countdown string: "42m 18s" or "1h 14m 02s"
  const formattedCountdown = `${
    remHours > 0 ? `${remHours}h ` : ''
  }${remMinutes}m ${remSeconds.toString().padStart(2, '0')}s`;

  // Determine SLA urgency tier & styling
  const getSlaState = () => {
    if (isResolved) {
      return {
        status: 'resolved',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        progressBarBg: 'bg-emerald-500',
        cardBorder: 'border-emerald-200/80 bg-emerald-50/20',
        textColor: 'text-emerald-800',
        title: 'SLA Goal Met',
        subtext: `Resolved in ${ticket.resolutionTimeMinutes || Math.round(elapsedMs / 60000)}m (Target: ${slaTotalMinutes}m)`,
      };
    }

    if (isBreached) {
      return {
        status: 'breached',
        badgeBg: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
        progressBarBg: 'bg-red-600',
        cardBorder: 'border-red-300 bg-red-50/50 shadow-xs',
        textColor: 'text-red-700',
        title: 'SLA Breached',
        subtext: `Resolution overdue by +${formattedCountdown}`,
      };
    }

    // Critical: less than 15 minutes or less than 20% of time left
    if (remainingMs < 15 * 60 * 1000 || remainingPercent < 20) {
      return {
        status: 'critical',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
        progressBarBg: 'bg-rose-500',
        cardBorder: 'border-rose-200 bg-rose-50/30',
        textColor: 'text-rose-700',
        title: 'Critical SLA Risk',
        subtext: `Immediate action required (${formattedCountdown} remaining)`,
      };
    }

    // Warning: less than 35% time left
    if (remainingPercent < 35) {
      return {
        status: 'warning',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        progressBarBg: 'bg-amber-500',
        cardBorder: 'border-amber-200 bg-amber-50/20',
        textColor: 'text-amber-700',
        title: 'Approaching SLA Deadline',
        subtext: `${formattedCountdown} remaining (${Math.round(remainingPercent)}% window left)`,
      };
    }

    // Normal / Healthy
    return {
      status: 'healthy',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      progressBarBg: 'bg-blue-600',
      cardBorder: 'border-slate-200/90 bg-slate-50/50',
      textColor: 'text-slate-700',
      title: 'Within SLA Compliance',
      subtext: `${formattedCountdown} until target deadline`,
    };
  };

  const slaState = getSlaState();

  const formattedDeadlineTime = deadlineDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id={`sla-timer-${ticket.id}`}
      className={`rounded-xl border p-3.5 sm:p-4 transition-all duration-200 ${slaState.cardBorder}`}
    >
      {/* Top Header: Label, Live Countdown Clock & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg shadow-2xs ${
              isResolved
                ? 'bg-emerald-100 text-emerald-700'
                : isBreached
                ? 'bg-red-100 text-red-700 animate-pulse'
                : slaState.status === 'critical'
                ? 'bg-rose-100 text-rose-700'
                : slaState.status === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {isResolved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : isBreached ? (
              <ShieldAlert className="h-4 w-4" />
            ) : slaState.status === 'critical' ? (
              <Flame className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                SLA Resolution Timer
              </span>
              <span
                className={`px-2 py-0.2 rounded-md text-[10px] font-bold uppercase tracking-wider border ${slaState.badgeBg}`}
              >
                {ticket.priority.toUpperCase()} ({slaTotalMinutes}m Target)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              {slaState.subtext}
            </p>
          </div>
        </div>

        {/* Dynamic Digital Clock Display */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isResolved ? (
            <div className="bg-emerald-100/80 px-3 py-1 rounded-lg border border-emerald-200 text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block leading-none">
                Resolved
              </span>
              <span className="font-mono text-xs sm:text-sm font-black text-emerald-800">
                {ticket.resolutionTimeMinutes || Math.round(elapsedMs / 60000)}m
              </span>
            </div>
          ) : (
            <div
              className={`px-3 py-1 rounded-lg border text-right shadow-2xs ${
                isBreached
                  ? 'bg-red-100 border-red-300'
                  : slaState.status === 'critical'
                  ? 'bg-rose-100 border-rose-300'
                  : slaState.status === 'warning'
                  ? 'bg-amber-100 border-amber-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-end gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBreached
                      ? 'bg-red-600 animate-ping'
                      : slaState.status === 'critical'
                      ? 'bg-rose-600 animate-pulse'
                      : slaState.status === 'warning'
                      ? 'bg-amber-600'
                      : 'bg-blue-600'
                  }`}
                />
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
                  {isBreached ? 'Overdue Time' : 'Time Remaining'}
                </span>
              </div>
              <span
                className={`font-mono text-xs sm:text-sm font-black tracking-tight ${
                  isBreached
                    ? 'text-red-700'
                    : slaState.status === 'critical'
                    ? 'text-rose-700'
                    : slaState.status === 'warning'
                    ? 'text-amber-800'
                    : 'text-blue-700'
                }`}
              >
                {isBreached ? `+${formattedCountdown}` : formattedCountdown}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Visual SLA Progress Bar Track */}
      <div className="space-y-1.5 mt-1">
        <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden relative shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${slaState.progressBarBg}`}
            style={{
              width: `${isResolved ? 100 : isBreached ? 100 : Math.min(100, Math.max(4, elapsedPercent))}%`,
            }}
          />
        </div>

        {/* Progress Bar Footer: Created time, % elapsed, and Deadline */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span>
            Created: {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="font-semibold text-slate-600">
            {isResolved
              ? '100% SLA Window Complete'
              : isBreached
              ? 'SLA Breached (100%+ Elapsed)'
              : `${Math.round(elapsedPercent)}% Elapsed • ${Math.round(remainingPercent)}% Left`}
          </span>
          <span className="font-bold text-slate-700">
            Deadline: {formattedDeadlineTime}
          </span>
        </div>
      </div>
    </div>
  );
};
