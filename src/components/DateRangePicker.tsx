import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const handlePreset = (days: number) => {
    if (days === 0) {
      onStartDateChange('');
      onEndDateChange('');
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    onEndDateChange(end.toISOString().split('T')[0]);
    onStartDateChange(start.toISOString().split('T')[0]);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs w-full sm:w-auto">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date Range:</span>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <input 
          type="date" 
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-500 min-w-[120px] flex-1 sm:flex-none"
        />
        <span className="text-slate-400 text-xs">to</span>
        <input 
          type="date" 
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-500 min-w-[120px] flex-1 sm:flex-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-3 pt-2 sm:pt-0 w-full sm:w-auto">
        <button onClick={() => handlePreset(7)} className="text-[11px] font-medium px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md transition-colors border border-slate-200 hover:border-slate-300">Last 7 Days</button>
        <button onClick={() => handlePreset(30)} className="text-[11px] font-medium px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md transition-colors border border-slate-200 hover:border-slate-300">Last 30 Days</button>
        <button onClick={() => handlePreset(0)} className="text-[11px] font-medium px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md transition-colors border border-slate-200 hover:border-slate-300">All Time</button>
      </div>
    </div>
  );
};
