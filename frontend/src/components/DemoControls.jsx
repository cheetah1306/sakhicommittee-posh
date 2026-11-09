import React, { useState } from 'react';
import { useApp } from '../context/AppState';
import { Calendar, FastForward, RotateCcw, AlertTriangle, ChevronDown } from 'lucide-react';

export const DemoControls = () => {
  const { timeOffsetDays, systemDate, timeTravel, resetDemo } = useApp();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleTimeTravel = async (days) => {
    setLoading(true);
    await timeTravel(days);
    setLoading(false);
  };

  const handleReset = async () => {
    if (window.confirm('Reset the database to pre-seeded demo state? This will clear all changes.')) {
      setLoading(true);
      await resetDemo();
      setLoading(false);
    }
  };

  const formattedDate = systemDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const shortDate = systemDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short'
  });

  // Collapsed by default so the panel never covers page controls
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-expanded={false}
        title="Open demo clock controls"
        className="fixed bottom-4 right-4 z-40 flex items-center space-x-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 rounded-full shadow-xl no-print transition"
      >
        <Calendar className="w-4 h-4 text-orange-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Demo Clock</span>
        <span className="text-[10px] font-mono text-slate-400">{shortDate}</span>
        {timeOffsetDays !== 0 && (
          <span className="text-[10px] bg-orange-950 text-orange-400 border border-orange-900/50 px-1.5 py-0.5 rounded font-mono">
            +{timeOffsetDays}d
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-2xl p-4 max-w-sm w-[calc(100vw-2rem)] no-print">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold uppercase tracking-wider">Demo Clock Controls</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          title="Minimize demo clock controls"
          className="flex items-center space-x-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition"
        >
          <ChevronDown className="w-3 h-3" />
          <span>Minimize</span>
        </button>
      </div>

      <div className="space-y-3">
        {/* Date Display */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center font-mono">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Simulated System Date</div>
          <div className="text-sm text-slate-200 font-bold mt-0.5">{formattedDate}</div>
          <div className="text-[10px] text-orange-500 mt-1 font-bold">
            {timeOffsetDays === 0 ? 'Normal Clock' : `Fast Forwarded +${timeOffsetDays} Days`}
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleTimeTravel(10)}
            disabled={loading}
            className="flex flex-col items-center justify-center py-2 px-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition border border-slate-700 disabled:opacity-50"
            title="Fast forward simulated time by 10 days"
          >
            <FastForward className="w-4.5 h-4.5 text-slate-300 mb-1" />
            <span>+10 Days</span>
          </button>
          
          <button
            onClick={() => handleTimeTravel(90)}
            disabled={loading}
            className="flex flex-col items-center justify-center py-2 px-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition border border-slate-700 disabled:opacity-50"
            title="Fast forward by 90 days to test inquiry deadlines expiry"
          >
            <FastForward className="w-4.5 h-4.5 text-orange-400 mb-1" />
            <span className="text-orange-300">+90 Days</span>
          </button>
          
          <button
            onClick={() => handleTimeTravel(160)}
            disabled={loading}
            className="flex flex-col items-center justify-center py-2 px-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition border border-slate-700 disabled:opacity-50"
            title="Fast forward by 160 days to test employer resolution expiry"
          >
            <FastForward className="w-4.5 h-4.5 text-red-400 mb-1" />
            <span className="text-red-300">+160 Days</span>
          </button>
        </div>

        {/* Reset Trigger */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mr-1" />
            Wipes custom inputs
          </span>
          
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center space-x-1 py-1 px-3 bg-red-950 text-red-300 hover:bg-red-900 border border-red-900/50 rounded-lg transition disabled:opacity-50 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
