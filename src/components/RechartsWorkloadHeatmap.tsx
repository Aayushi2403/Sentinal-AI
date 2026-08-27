import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  Area,
} from 'recharts';
import { Ticket, TicketPriority } from '../types';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Filter,
  Flame,
  Layers,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

interface RechartsWorkloadHeatmapProps {
  tickets?: Ticket[];
}

interface MatrixPoint {
  dayIndex: number;
  dayName: string;
  priorityIndex: number;
  priorityKey: TicketPriority;
  priorityLabel: string;
  volume: number;
  slaTargetMin: number;
  avgResolutionMin: number;
  staffingRecommended: number;
}

const DAYS_OF_WEEK = [
  { index: 0, name: 'Monday', short: 'Mon' },
  { index: 1, name: 'Tuesday', short: 'Tue' },
  { index: 2, name: 'Wednesday', short: 'Wed' },
  { index: 3, name: 'Thursday', short: 'Thu' },
  { index: 4, name: 'Friday', short: 'Fri' },
  { index: 5, name: 'Saturday', short: 'Sat' },
  { index: 6, name: 'Sunday', short: 'Sun' },
];

const PRIORITY_TIERS: {
  index: number;
  key: TicketPriority;
  label: string;
  code: string;
  slaMin: number;
  color: string;
  baseColor: string;
}[] = [
  { index: 3, key: 'urgent', label: 'Urgent', code: 'P1 Blocker', slaMin: 60, color: '#EF4444', baseColor: 'rgb(239, 68, 68)' },
  { index: 2, key: 'high', label: 'High', code: 'P2 High', slaMin: 120, color: '#F59E0B', baseColor: 'rgb(245, 158, 11)' },
  { index: 1, key: 'medium', label: 'Medium', code: 'P3 Medium', slaMin: 240, color: '#3B82F6', baseColor: 'rgb(59, 130, 246)' },
  { index: 0, key: 'low', label: 'Low', code: 'P4 Low', slaMin: 480, color: '#64748B', baseColor: 'rgb(100, 116, 139)' },
];

// Baseline enterprise operational distributions across days & priorities
const BASELINE_WEEKLY_MATRIX: Record<TicketPriority, number[]> = {
  urgent: [6, 11, 9, 12, 7, 3, 2],
  high:   [14, 22, 18, 20, 15, 6, 4],
  medium: [28, 42, 36, 35, 26, 10, 8],
  low:    [18, 26, 22, 21, 16, 7, 5],
};

// Custom SVG Rect Tile for the Recharts Scatter Heatmap
const HeatmapTileShape = (props: any) => {
  const { cx, cy, fill, payload, width = 64, height = 36 } = props;
  const halfW = width / 2;
  const halfH = height / 2;

  const isHighDensity = payload.volume >= 25;
  const isUrgent = payload.priorityKey === 'urgent';

  return (
    <g className="transition-all duration-150 cursor-pointer group">
      <rect
        x={cx - halfW}
        y={cy - halfH}
        width={width}
        height={height}
        rx={6}
        ry={6}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={1.5}
        className="filter drop-shadow-2xs group-hover:brightness-105 group-hover:stroke-indigo-400 group-hover:stroke-2"
      />
      {/* Volume text inside tile */}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-[11px] font-black pointer-events-none select-none fill-slate-900"
        style={{
          fill: payload.volume > 18 ? '#ffffff' : '#0f172a',
          fontWeight: 800,
        }}
      >
        {payload.volume}
      </text>
      {/* Tiny priority pulse for urgent peaks */}
      {isUrgent && payload.volume > 8 && (
        <circle
          cx={cx + halfW - 6}
          cy={cy - halfH + 6}
          r={2.5}
          fill="#DC2626"
          stroke="#ffffff"
          strokeWidth={1}
        />
      )}
    </g>
  );
};

export const RechartsWorkloadHeatmap: React.FC<RechartsWorkloadHeatmapProps> = ({ tickets = [] }) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [activeVisualization, setActiveVisualization] = useState<'matrix' | 'workload_trends'>('matrix');

  // Compute aggregated heatmap data points for Recharts ScatterChart
  const { heatmapData, maxVolume, totalFilteredVolume, dayTrendData, peakPoint, staffRecommendation } = useMemo(() => {
    // Tally live tickets
    const liveTally: Record<string, number> = {};
    for (let d = 0; d < 7; d++) {
      for (const p of PRIORITY_TIERS) {
        liveTally[`${d}-${p.key}`] = 0;
      }
    }

    if (tickets && tickets.length > 0) {
      tickets.forEach((t) => {
        try {
          const date = new Date(t.createdAt);
          const jsDay = date.getDay(); // 0 = Sun
          const dIndex = jsDay === 0 ? 6 : jsDay - 1; // 0 = Mon, 6 = Sun
          const key = `${dIndex}-${t.priority}`;
          if (liveTally[key] !== undefined) {
            liveTally[key] += 1;
          }
        } catch {
          // ignore parsing error
        }
      });
    }

    const points: MatrixPoint[] = [];
    let maxVal = 0;
    let sumVal = 0;
    let maxPt: MatrixPoint | null = null;

    PRIORITY_TIERS.forEach((p) => {
      DAYS_OF_WEEK.forEach((d) => {
        const baseline = BASELINE_WEEKLY_MATRIX[p.key][d.index];
        const live = liveTally[`${d.index}-${p.key}`] || 0;
        const total = baseline + live;

        // Staffing recommendation calculation: 1 engineer per 8 standard tickets, 1 engineer per 3 urgent tickets
        const staffNeeded = Math.max(1, Math.ceil(p.key === 'urgent' ? total / 3 : total / 8));

        const pt: MatrixPoint = {
          dayIndex: d.index,
          dayName: d.name,
          priorityIndex: p.index,
          priorityKey: p.key,
          priorityLabel: p.label,
          volume: total,
          slaTargetMin: p.slaMin,
          avgResolutionMin: Math.round(p.slaMin * 0.42),
          staffingRecommended: staffNeeded,
        };

        if (total > maxVal) {
          maxVal = total;
          maxPt = pt;
        }

        // Apply filters
        const dayMatches =
          selectedDayFilter === 'all' ||
          (selectedDayFilter === 'weekdays' && d.index < 5) ||
          (selectedDayFilter === 'weekends' && d.index >= 5) ||
          selectedDayFilter === d.name.toLowerCase();

        const priorityMatches =
          selectedPriorityFilter === 'all' || selectedPriorityFilter === p.key;

        if (dayMatches && priorityMatches) {
          points.push(pt);
          sumVal += total;
        }
      });
    });

    // Compute Day-by-Day Stacked & Trend breakdown for Recharts Bar/Area Chart
    const trends = DAYS_OF_WEEK.map((d) => {
      let urgentVol = (BASELINE_WEEKLY_MATRIX['urgent'][d.index] || 0) + (liveTally[`${d.index}-urgent`] || 0);
      let highVol = (BASELINE_WEEKLY_MATRIX['high'][d.index] || 0) + (liveTally[`${d.index}-high`] || 0);
      let mediumVol = (BASELINE_WEEKLY_MATRIX['medium'][d.index] || 0) + (liveTally[`${d.index}-medium`] || 0);
      let lowVol = (BASELINE_WEEKLY_MATRIX['low'][d.index] || 0) + (liveTally[`${d.index}-low`] || 0);

      if (selectedPriorityFilter !== 'all') {
        if (selectedPriorityFilter !== 'urgent') urgentVol = 0;
        if (selectedPriorityFilter !== 'high') highVol = 0;
        if (selectedPriorityFilter !== 'medium') mediumVol = 0;
        if (selectedPriorityFilter !== 'low') lowVol = 0;
      }

      const totalDay = urgentVol + highVol + mediumVol + lowVol;
      // Recommended engineers on duty
      const recommendedEngineers = Math.max(1, Math.round(urgentVol * 0.4 + highVol * 0.25 + mediumVol * 0.12 + lowVol * 0.08));

      return {
        day: d.short,
        fullDay: d.name,
        Urgent: urgentVol,
        High: highVol,
        Medium: mediumVol,
        Low: lowVol,
        Total: totalDay,
        EngineersRequired: recommendedEngineers,
        SlaRiskIndex: Math.min(100, Math.round((urgentVol * 3.5 + highVol * 1.8))),
      };
    });

    return {
      heatmapData: points,
      maxVolume: maxVal || 1,
      totalFilteredVolume: sumVal,
      dayTrendData: trends,
      peakPoint: maxPt,
      staffRecommendation: Math.max(2, Math.ceil(sumVal / 38)),
    };
  }, [tickets, selectedDayFilter, selectedPriorityFilter]);

  // Color generator for Heatmap Matrix Tiles
  const getTileFill = (pt: MatrixPoint) => {
    const intensity = Math.min(Math.max(pt.volume / maxVolume, 0.12), 1);

    if (pt.priorityKey === 'urgent') {
      return intensity > 0.6
        ? '#DC2626'
        : intensity > 0.35
        ? '#EF4444'
        : '#FCA5A5';
    }
    if (pt.priorityKey === 'high') {
      return intensity > 0.6
        ? '#D97706'
        : intensity > 0.35
        ? '#F59E0B'
        : '#FDE68A';
    }
    if (pt.priorityKey === 'medium') {
      return intensity > 0.6
        ? '#2563EB'
        : intensity > 0.35
        ? '#3B82F6'
        : '#BFDBFE';
    }
    // Low
    return intensity > 0.6
      ? '#475569'
      : intensity > 0.35
      ? '#64748B'
      : '#E2E8F0';
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs select-none space-y-5">
      {/* Header with Title & Workload Management Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="h-4 w-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Workload Allocation & Ticket Volume Heatmap
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <Sparkles className="h-2.5 w-2.5" />
              Recharts Visualizer
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analyze historical and live operational volume by weekday and severity level to optimize agent scheduling and SLA staffing
          </p>
        </div>

        {/* Action Toggles: View Mode & Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Chart Mode */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              onClick={() => setActiveVisualization('matrix')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeVisualization === 'matrix'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Heatmap Matrix
            </button>
            <button
              onClick={() => setActiveVisualization('workload_trends')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeVisualization === 'workload_trends'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Capacity & Trends
            </button>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 text-xs">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Priority:
            </label>
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Priorities (P1-P4)</option>
              <option value="urgent">P1 Urgent Only</option>
              <option value="high">P2 High Only</option>
              <option value="medium">P3 Medium Only</option>
              <option value="low">P4 Low Only</option>
            </select>
          </div>

          {/* Day of Week Filter */}
          <div className="flex items-center gap-1 text-xs">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Days:
            </label>
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Full Week (Mon-Sun)</option>
              <option value="weekdays">Weekdays Only</option>
              <option value="weekends">Weekends Only</option>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workload Insights Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Filtered Volume Scope
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900">{totalFilteredVolume}</span>
            <span className="text-xs text-slate-500 font-medium">tickets analyzed</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Peak Shift Ingestion
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-extrabold text-rose-700">
              {peakPoint ? `${peakPoint.dayName} (${peakPoint.volume})` : 'Tuesday (42)'}
            </span>
            <span className="text-xs text-slate-500 font-medium">max load</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Target SLA Velocity
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-extrabold text-emerald-700">96.2%</span>
            <span className="text-xs text-slate-500 font-medium">compliance goal</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Recommended Shift Staffing
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-extrabold text-indigo-700">
              {staffRecommendation} On-Duty
            </span>
            <span className="text-xs text-slate-500 font-medium">engineers required</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Render */}
      {activeVisualization === 'matrix' ? (
        <div className="space-y-3">
          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 30, bottom: 20, left: 60 }}
              >
                <XAxis
                  type="number"
                  dataKey="dayIndex"
                  name="Day"
                  domain={[-0.5, 6.5]}
                  ticks={[0, 1, 2, 3, 4, 5, 6]}
                  tickFormatter={(val) => DAYS_OF_WEEK[val]?.short || ''}
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#334155' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="priorityIndex"
                  name="Priority"
                  domain={[-0.5, 3.5]}
                  ticks={[0, 1, 2, 3]}
                  tickFormatter={(val) => {
                    const match = PRIORITY_TIERS.find((p) => p.index === val);
                    return match ? match.label : '';
                  }}
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#334155' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <ZAxis type="number" dataKey="volume" range={[200, 200]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#94A3B8' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data: MatrixPoint = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-white shadow-xl text-xs space-y-1.5 min-w-[200px]">
                          <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                            <span className="font-extrabold text-indigo-300">
                              {data.dayName} • {data.priorityLabel} Tier
                            </span>
                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                              {data.priorityKey === 'urgent' ? 'P1' : data.priorityKey === 'high' ? 'P2' : data.priorityKey === 'medium' ? 'P3' : 'P4'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-200">
                            <span>Ticket Ingestion Volume:</span>
                            <strong className="text-white text-sm">{data.volume}</strong>
                          </div>
                          <div className="flex items-center justify-between text-slate-300 text-[11px]">
                            <span>SLA Target Limit:</span>
                            <span className="text-amber-300 font-semibold">{data.slaTargetMin} min</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300 text-[11px]">
                            <span>Est. Resolution Velocity:</span>
                            <span className="text-emerald-300 font-semibold">{data.avgResolutionMin} min</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300 text-[11px] pt-1 border-t border-slate-800">
                            <span>Recommended On-Call:</span>
                            <span className="text-indigo-200 font-bold">{data.staffingRecommended} Engineers</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={heatmapData}
                  shape={<HeatmapTileShape />}
                >
                  {heatmapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getTileFill(entry)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Tier Color Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Intensity Legend:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
                <span className="text-slate-700 font-semibold text-[11px]">P1 Urgent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                <span className="text-slate-700 font-semibold text-[11px]">P2 High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
                <span className="text-slate-700 font-semibold text-[11px]">P3 Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-500 inline-block" />
                <span className="text-slate-700 font-semibold text-[11px]">P4 Low</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Numbers inside cells indicate total tickets for that weekday/priority slot
            </div>
          </div>
        </div>
      ) : (
        /* Workload & Capacity Trends (Stacked Distribution with Engineer Staffing Curve) */
        <div className="space-y-3">
          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dayTrendData}
                margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#334155' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  label={{ value: 'Ticket Volume', angle: -90, position: 'insideLeft', style: { fill: '#94A3B8', fontSize: 10 } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#6366F1' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  label={{ value: 'Staff Required', angle: 90, position: 'insideRight', style: { fill: '#6366F1', fontSize: 10 } }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-white shadow-xl text-xs space-y-1.5 min-w-[210px]">
                          <div className="border-b border-slate-700 pb-1 font-bold text-indigo-300">
                            {item.fullDay} Workload Breakdown
                          </div>
                          <div className="space-y-1 text-slate-200">
                            <div className="flex justify-between">
                              <span className="text-red-400">P1 Urgent:</span>
                              <strong>{item.Urgent}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-400">P2 High:</span>
                              <strong>{item.High}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-400">P3 Medium:</span>
                              <strong>{item.Medium}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">P4 Low:</span>
                              <strong>{item.Low}</strong>
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-slate-700 flex justify-between font-bold text-white">
                            <span>Total Ingestion:</span>
                            <span>{item.Total} tickets</span>
                          </div>
                          <div className="flex justify-between text-indigo-300 font-bold text-[11px]">
                            <span>Recommended On-Duty:</span>
                            <span>{item.EngineersRequired} Engineers</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar yAxisId="left" dataKey="Urgent" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="High" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="Medium" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="Low" stackId="a" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="EngineersRequired"
                  name="Staffing Curve (Engineers)"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366F1', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs text-slate-700 flex items-start gap-2.5">
            <UserCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-indigo-950 font-bold">Workload Balancing Policy:</strong>{' '}
              Workload peaks on Tuesdays and Thursdays require minimum 5 on-call support engineers to prevent SLA breaches on P1 Urgent blocker incidents. Weekend shifts can operate safely at 1-2 on-call engineers.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
