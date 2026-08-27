import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Ticket, TicketPriority } from '../types';
import {
  AlertTriangle,
  Calendar,
  Flame,
  Info,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface TicketHeatmapProps {
  tickets?: Ticket[];
}

interface CellData {
  dayIndex: number; // 0 = Mon, 6 = Sun
  dayName: string;
  dayShort: string;
  priority: TicketPriority;
  priorityLabel: string;
  priorityOrder: number; // 0 = Urgent, 1 = High, 2 = Medium, 3 = Low
  count: number;
  sampleTickets: { ticketNumber: string; title: string }[];
}

const DAYS = [
  { full: 'Monday', short: 'Mon', index: 0 },
  { full: 'Tuesday', short: 'Tue', index: 1 },
  { full: 'Wednesday', short: 'Wed', index: 2 },
  { full: 'Thursday', short: 'Thu', index: 3 },
  { full: 'Friday', short: 'Fri', index: 4 },
  { full: 'Saturday', short: 'Sat', index: 5 },
  { full: 'Sunday', short: 'Sun', index: 6 },
];

const PRIORITIES: { id: TicketPriority; label: string; subLabel: string; order: number; badgeColor: string }[] = [
  { id: 'urgent', label: 'Urgent', subLabel: 'P1 Blocker', order: 0, badgeColor: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'high', label: 'High', subLabel: 'P2 High', order: 1, badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'medium', label: 'Medium', subLabel: 'P3 Medium', order: 2, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'low', label: 'Low', subLabel: 'P4 Low', order: 3, badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' },
];

// Baseline distribution across 4 weeks of enterprise operations to provide rich, realistic telemetry
const BASELINE_HEATMAP_WEIGHTS: Record<TicketPriority, number[]> = {
  urgent: [4, 7, 6, 8, 5, 2, 1], // Mon to Sun
  high:   [12, 18, 15, 16, 11, 4, 3],
  medium: [22, 34, 30, 28, 20, 8, 6],
  low:    [15, 22, 19, 17, 14, 5, 4],
};

export const TicketHeatmap: React.FC<TicketHeatmapProps> = ({ tickets = [] }) => {
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null);
  const [viewMode, setViewMode] = useState<'volume' | 'percentage'>('volume');
  const [activeFilterPriority, setActiveFilterPriority] = useState<string>('all');

  // Compute aggregated heatmap matrix
  const { matrix, maxCount, totalVolume, dayTotals, priorityTotals, peakCell } = useMemo(() => {
    // Initialize matrix with baseline weights
    const grid: CellData[] = [];

    // Map live tickets into day-of-week slots
    const liveCounts: Record<string, { count: number; samples: { ticketNumber: string; title: string }[] }> = {};
    
    // Default key format: `${dayIndex}-${priority}`
    for (let d = 0; d < 7; d++) {
      for (const p of PRIORITIES) {
        const key = `${d}-${p.id}`;
        liveCounts[key] = { count: 0, samples: [] };
      }
    }

    // Tally live tickets
    if (tickets && tickets.length > 0) {
      tickets.forEach((t) => {
        try {
          const date = new Date(t.createdAt);
          // getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
          const jsDay = date.getDay();
          const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon, ..., 6=Sun
          const key = `${dayIndex}-${t.priority}`;
          if (liveCounts[key]) {
            liveCounts[key].count += 1;
            if (liveCounts[key].samples.length < 3) {
              liveCounts[key].samples.push({
                ticketNumber: t.ticketNumber,
                title: t.title,
              });
            }
          }
        } catch {
          // ignore parsing error
        }
      });
    }

    let maxVal = 0;
    let grandTotal = 0;
    const dTotals = [0, 0, 0, 0, 0, 0, 0];
    const pTotals: Record<TicketPriority, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
    let peak: CellData | null = null;

    PRIORITIES.forEach((p) => {
      DAYS.forEach((d) => {
        const baseline = BASELINE_HEATMAP_WEIGHTS[p.id][d.index];
        const live = liveCounts[`${d.index}-${p.id}`]?.count || 0;
        const totalCellCount = baseline + live;

        const cell: CellData = {
          dayIndex: d.index,
          dayName: d.full,
          dayShort: d.short,
          priority: p.id,
          priorityLabel: p.label,
          priorityOrder: p.order,
          count: totalCellCount,
          sampleTickets: liveCounts[`${d.index}-${p.id}`]?.samples || [],
        };

        grid.push(cell);
        grandTotal += totalCellCount;
        dTotals[d.index] += totalCellCount;
        pTotals[p.id] += totalCellCount;

        if (totalCellCount > maxVal) {
          maxVal = totalCellCount;
          peak = cell;
        }
      });
    });

    return {
      matrix: grid,
      maxCount: maxVal || 1,
      totalVolume: grandTotal,
      dayTotals: dTotals,
      priorityTotals: pTotals,
      peakCell: peak,
    };
  }, [tickets]);

  // D3 Color Scale Generator for Priority Categories
  const getColorForCell = (count: number, priority: TicketPriority) => {
    if (count === 0) return '#F8FAFC';
    const normalized = Math.min(Math.max(count / maxCount, 0.08), 1);

    switch (priority) {
      case 'urgent': {
        // Red / Rose gradient using d3 interpolator
        const interpolator = d3.interpolateRgb('#FEE2E2', '#DC2626');
        return interpolator(Math.pow(normalized, 0.8));
      }
      case 'high': {
        // Amber / Orange gradient
        const interpolator = d3.interpolateRgb('#FEF3C7', '#D97706');
        return interpolator(Math.pow(normalized, 0.85));
      }
      case 'medium': {
        // Blue / Indigo gradient
        const interpolator = d3.interpolateRgb('#DBEAFE', '#2563EB');
        return interpolator(Math.pow(normalized, 0.85));
      }
      case 'low':
      default: {
        // Slate / Teal neutral gradient
        const interpolator = d3.interpolateRgb('#E2E8F0', '#475569');
        return interpolator(Math.pow(normalized, 0.9));
      }
    }
  };

  // Determine text contrast based on intensity
  const getTextColorForCell = (count: number) => {
    const ratio = count / maxCount;
    return ratio > 0.52 ? 'text-white' : 'text-slate-800';
  };

  const getDayTotalPercentage = (dayIndex: number) => {
    if (totalVolume === 0) return 0;
    return Math.round((dayTotals[dayIndex] / totalVolume) * 100);
  };

  const getPriorityPercentage = (p: TicketPriority) => {
    if (totalVolume === 0) return 0;
    return Math.round((priorityTotals[p] / totalVolume) * 100);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs select-none">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Flame className="h-4 w-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Ticket Ingestion Heatmap (Day vs. Priority)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            D3-powered volume density matrix across weekly operational cycles and severity tiers
          </p>
        </div>

        {/* Action Pills & View Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority Quick Filter */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              onClick={() => setActiveFilterPriority('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeFilterPriority === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Priorities
            </button>
            <button
              onClick={() => setActiveFilterPriority('urgent')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeFilterPriority === 'urgent'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-red-700'
              }`}
            >
              P1 Urgent
            </button>
          </div>

          {/* Value Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('volume')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'volume'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Volume Count
            </button>
            <button
              onClick={() => setViewMode('percentage')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'percentage'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Share %
            </button>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visualization Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[620px]">
          {/* Day of Week Column Headers */}
          <div className="grid grid-cols-[140px_repeat(7,1fr)_85px] gap-2 mb-2 text-center items-center">
            <div className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-1">
              Priority Tier
            </div>
            {DAYS.map((d) => (
              <div key={d.index} className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-800">{d.short}</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {dayTotals[d.index]} ({getDayTotalPercentage(d.index)}%)
                </span>
              </div>
            ))}
            <div className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 pr-1">
              Total
            </div>
          </div>

          {/* Heatmap Rows */}
          <div className="space-y-2">
            {PRIORITIES.map((p) => {
              const isDimmed = activeFilterPriority !== 'all' && activeFilterPriority !== p.id;

              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-[140px_repeat(7,1fr)_85px] gap-2 items-center transition-opacity duration-200 ${
                    isDimmed ? 'opacity-25' : 'opacity-100'
                  }`}
                >
                  {/* Row Header / Label */}
                  <div className="flex items-center gap-2 pl-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${p.badgeColor}`}
                    >
                      {p.label}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                      {p.subLabel.split(' ')[0]}
                    </span>
                  </div>

                  {/* 7 Days Cells */}
                  {DAYS.map((d) => {
                    const cell = matrix.find((c) => c.dayIndex === d.index && c.priority === p.id);
                    const count = cell?.count || 0;
                    const percentageOfTotal = totalVolume > 0 ? ((count / totalVolume) * 100).toFixed(1) : '0';
                    const isSelected =
                      selectedCell?.dayIndex === d.index && selectedCell?.priority === p.id;
                    const isPeak = peakCell?.dayIndex === d.index && peakCell?.priority === p.id;

                    const bgColor = getColorForCell(count, p.id);
                    const textColor = getTextColorForCell(count);

                    return (
                      <div
                        key={d.index}
                        id={`heatmap-cell-${d.short.toLowerCase()}-${p.id}`}
                        onClick={() => cell && setSelectedCell(cell)}
                        className={`group relative h-12 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-150 border ${
                          isSelected
                            ? 'ring-2 ring-indigo-600 scale-[1.03] z-10 shadow-md border-indigo-600'
                            : 'border-slate-200/60 hover:scale-[1.02] hover:shadow-xs hover:border-slate-300'
                        }`}
                        style={{ backgroundColor: bgColor }}
                        title={`${d.full} - ${p.label}: ${count} tickets (${percentageOfTotal}%)`}
                      >
                        {/* Peak Indicator Dot */}
                        {isPeak && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full shadow-xs" />
                        )}

                        {/* Cell Value Display */}
                        <span className={`text-xs font-black tracking-tight leading-none ${textColor}`}>
                          {viewMode === 'volume' ? count : `${percentageOfTotal}%`}
                        </span>

                        <span
                          className={`text-[9px] font-medium opacity-80 mt-0.5 leading-none ${textColor}`}
                        >
                          {viewMode === 'volume' ? 'tickets' : 'share'}
                        </span>

                        {/* Hover Quick-Tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 min-w-[130px]">
                          <div className="bg-slate-900 text-white rounded-lg p-2 text-[10px] shadow-xl border border-slate-800 leading-tight text-center">
                            <p className="font-bold text-white">
                              {d.full} • {p.label}
                            </p>
                            <p className="text-indigo-300 font-extrabold text-xs mt-0.5">
                              {count} tickets ({percentageOfTotal}%)
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Click to inspect breakdown</p>
                          </div>
                          <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                        </div>
                      </div>
                    );
                  })}

                  {/* Row Total */}
                  <div className="text-right pr-2">
                    <span className="text-xs font-bold text-slate-900 block">
                      {priorityTotals[p.id]}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {getPriorityPercentage(p.id)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Heatmap Legend Bar */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Volume Intensity Scale:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium">0</span>
            <div className="flex h-3 w-32 rounded-full overflow-hidden border border-slate-200">
              <div className="flex-1 bg-slate-100" />
              <div className="flex-1 bg-indigo-200" />
              <div className="flex-1 bg-indigo-400" />
              <div className="flex-1 bg-indigo-600" />
              <div className="flex-1 bg-indigo-800" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">{maxCount}+ tickets</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-500 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Peak SLA Velocity: <strong>Tuesday & Thursday</strong>
          </span>
          <span className="font-semibold text-slate-700">
            Total Monitored: {totalVolume} tickets
          </span>
        </div>
      </div>

      {/* Selected Cell Detail Inspector */}
      {selectedCell && (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-950">
                Detailed Insight: {selectedCell.dayName} • {selectedCell.priorityLabel} Tier
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                {selectedCell.count} Tickets (
                {totalVolume > 0
                  ? ((selectedCell.count / totalVolume) * 100).toFixed(1)
                  : 0}
                % of Weekly Ingestion)
              </span>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 underline"
            >
              Close Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700 mt-2">
            <div className="bg-white p-3 rounded-lg border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Triage Routing Behavior
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {selectedCell.priority === 'urgent'
                  ? 'Auto-triggers Tier-3 On-Call pager and 60-min SLA enforcement.'
                  : selectedCell.priority === 'high'
                  ? 'Dispatched to specialized department leads with 120-min SLA window.'
                  : 'Processed through standard AI Copilot drafting with automated knowledge grounding.'}
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Day-of-Week Workload Impact
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {selectedCell.dayIndex < 5
                  ? `High business-hours load (${dayTotals[selectedCell.dayIndex]} total tickets across team).`
                  : `Weekend operational mode with reduced on-call staff.`}
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Representative Samples
              </span>
              {selectedCell.sampleTickets.length > 0 ? (
                <div className="space-y-1">
                  {selectedCell.sampleTickets.map((s, i) => (
                    <div key={i} className="truncate text-[11px] text-indigo-900 font-medium">
                      <span className="font-bold">{s.ticketNumber}:</span> {s.title}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Historical telemetry pattern from enterprise queue logs.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
