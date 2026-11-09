import React, { useState } from 'react';
import { useApp } from '../context/AppState';
import { Compass, Search, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const StatusTracker = () => {
  const { API_BASE, systemDate } = useApp();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [caseData, setCaseData] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setCaseData(null);

    try {
      const res = await fetch(`${API_BASE}/cases/track/${code.trim().toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        setCaseData(data);
      } else {
        setError('Invalid tracking code. Please double-check and try again.');
      }
    } catch {
      setError('Failed to reach server. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = ['Received', 'Acknowledged', 'Under Inquiry', 'Resolved'];
    if (status === 'Report Drafted' || status === 'Awaiting Employer Action') {
      return 2; // Under Inquiry / Processing
    }
    if (status === 'Appealed') {
      return 3;
    }
    const idx = steps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const getDaysRemaining = (deadlineStr) => {
    const deadline = new Date(deadlineStr);
    const timeDiff = deadline.getTime() - systemDate.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return days;
  };

  const getDeadlineText = (kase) => {
    if (kase.status === 'Received' || kase.status === 'Acknowledged' || kase.status === 'Under Inquiry') {
      const days = getDaysRemaining(kase.deadline_90);
      if (days < 0) {
        return { text: `Overdue by ${Math.abs(days)} Days`, color: 'text-red-650 bg-red-50 border-red-200' };
      }
      return { text: `${days} Days Remaining for IC Inquiry Completion`, color: 'text-orange-950 bg-orange-50 border-orange-200' };
    }
    if (kase.status === 'Report Drafted' || kase.status === 'Awaiting Employer Action') {
      const days = getDaysRemaining(kase.deadline_160);
      if (days < 0) {
        return { text: `Employer Resolution Overdue by ${Math.abs(days)} Days`, color: 'text-red-650 bg-red-50 border-red-200' };
      }
      return { text: `${days} Days Remaining for Employer Action`, color: 'text-blue-950 bg-blue-50 border-blue-200' };
    }
    return { text: 'Case successfully resolved and closed.', color: 'text-green-950 bg-green-50 border-green-200' };
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md space-y-4">
        <div className="flex items-center space-x-2.5">
          <Compass className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold font-serif text-slate-900">Track Complaint Status</h2>
        </div>
        
        <p className="text-slate-600 text-sm leading-relaxed">
          Aggrieved parties can check their case milestone tracking. Enter the unique code generated during filing.
        </p>

        <form onSubmit={handleTrack} className="flex space-x-2">
          <input
            type="text"
            required
            placeholder="e.g. CASE-9821-RECEIVED"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 font-mono text-center uppercase tracking-wider"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm font-bold flex items-center space-x-1 transition disabled:opacity-50 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Searching...' : 'Track'}</span>
          </button>
        </form>

        {error && (
          <div className="p-3 bg-red-50 text-red-900 text-xs rounded border border-red-150 font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Result Display */}
      {caseData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden animate-scaleUp">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tracking Code</p>
              <h3 className="text-lg font-mono font-bold text-orange-400">{code.toUpperCase()}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Current Status</p>
              <span className="inline-block mt-0.5 text-xs bg-slate-800 px-2.5 py-1 rounded font-bold border border-slate-700/50 uppercase tracking-wide">
                {caseData.case.status}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Countdown Banner */}
            {(() => {
              const dInfo = getDeadlineText(caseData.case);
              return (
                <div className={`p-4 border rounded-lg text-xs flex items-start space-x-2 font-medium ${dInfo.color}`}>
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">{dInfo.text}</p>
                    <p className="text-slate-500 mt-1 leading-relaxed">
                      Statutory timings mandate completing cases in 90 days of receipt, submitting report in 10 days, and executing recommendations within 60 days.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Stepper Timeline */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Redressal Progress Milestones</h4>
              
              <div className="grid grid-cols-4 gap-2 relative">
                {['Received', 'Acknowledged', 'Inquiry Stage', 'Resolved'].map((stepName, idx) => {
                  const activeStep = getStatusStep(caseData.case.status);
                  const isDone = idx <= activeStep;
                  const isCurrent = idx === activeStep;

                  return (
                    <div key={idx} className="flex flex-col items-center text-center space-y-2">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isDone ? 'bg-orange-500 border-orange-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        {isDone && !isCurrent ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <span className={`text-[10px] md:text-xs font-bold ${isCurrent ? 'text-orange-600' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                        {stepName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestones Audit log list */}
            <div className="border-t pt-5 space-y-4">
              <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Public Case History</h4>
              
              <div className="space-y-3.5">
                {caseData.events.map((evt, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs leading-normal">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>
                    <div className="space-y-0.5">
                      <span className="font-mono text-slate-400 font-bold">
                        {new Date(evt.timestamp).toLocaleDateString('en-IN')}:
                      </span>
                      <span className="font-bold text-slate-900 ml-1.5">{evt.event_type}</span>
                      <p className="text-slate-600 mt-0.5">{evt.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidentiality Warning banner */}
            <div className="p-4 bg-slate-50 border rounded-lg text-[10px] md:text-xs text-slate-500 flex items-start space-x-2 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-700">POSH Confidentiality Shield Active:</span> To safeguard details, testimonies, specific incident accounts, and identities of the parties, individual notes or respondent names are excluded from the public tracking view.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
