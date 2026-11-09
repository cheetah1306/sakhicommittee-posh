import React from 'react';
import { useApp } from '../context/AppState';
import { ShieldCheck, MessageSquare, Compass, Users, FileText, ArrowRight } from 'lucide-react';

export const Home = ({ onNavigate }) => {
  const { users, login, logout, currentUser } = useApp();

  const handleRoleLogin = async (email) => {
    const res = await login(email);
    if (res.success) {
      // Route from the login response: the users list can be empty if its initial fetch failed
      const user = res.user || users.find(u => u.email === email);
      if (user) {
        if (user.role === 'admin') onNavigate('admin-dashboard');
        else if (user.role === 'ic_member') onNavigate('ic-portal');
        else if (user.role === 'district_officer') onNavigate('district-officer');
      }
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <div className="relative bg-slate-900 text-white rounded-2xl overflow-hidden py-16 px-8 md:px-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/30 via-slate-900 to-slate-900 -z-10"></div>
        <div className="max-w-3xl space-y-6">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-orange-950 text-orange-400 border border-orange-900/50 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>POSH Redressal & Legal Compliance</span>
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-serif leading-tight text-white">
            Secure, legally compliant POSH management for Indian MSMEs.
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed">
            Ensure workplace safety and complete statutory alignment. Manage your Internal Committee (IC) constitution, anonymous complaint tracking, and annual reporting with automated legal countdowns.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => onNavigate('file-complaint')}
              className="px-6 py-3 bg-orange-700 hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg transition flex items-center space-x-2 border border-orange-600"
            >
              <MessageSquare className="w-4.5 h-4.5" />
              <span>File a Safe Complaint</span>
            </button>
            <button
              onClick={() => onNavigate('track-complaint')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition flex items-center space-x-2 border border-slate-700"
            >
              <Compass className="w-4.5 h-4.5" />
              <span>Track Complaint Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Core Legal Columns */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Valid IC Wizard</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Configure a legally compliant committee of 4+ members. Validates the 50%-women threshold and presence of presiding and external members.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">90-Day Inquiry Clock</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Timestamps incoming complaints to start the statutory 90-day inquiry clock. Tracks compliance alerts and countdowns.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Auto Annual Reports</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Generates compliant reports for District Officers and copyable snippets for Board Directors. Avoids fine penalties of up to ₹50,000.
          </p>
        </div>
      </div>

      {/* Demo Portal / Login Switcher */}
      <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-slate-100 shadow-lg space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-serif text-white">Presenter Demo Login Switcher</h2>
          <p className="text-slate-400 text-sm mt-1">
            Simulate different organizational roles to test compliant workflows. No signups or passwords required.
          </p>
        </div>

        {currentUser && (
          <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 flex justify-between items-center text-sm">
            <div>
              <span className="text-slate-500 font-bold mr-1">Logged in as:</span>
              <span className="text-slate-200 font-bold">{currentUser.name}</span>
              <span className="ml-2 text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-bold border border-slate-700/50">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-red-400 hover:text-red-300 font-bold transition border border-slate-700/50"
            >
              Sign Out
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          {/* MSME Admin Role */}
          <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Company Management</span>
              <h4 className="text-base font-bold mt-1 text-white">MSME Business Owner</h4>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Appoints the IC, views compliance health score, logs training workshops, and generates annual filings.
              </p>
            </div>
            
            <button
              onClick={() => handleRoleLogin('admin@vardhman.com')}
              className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded flex items-center justify-center space-x-1 transition border border-slate-700"
            >
              <span>Enter as Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* IC Member Role */}
          <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Case Redressal</span>
              <h4 className="text-base font-bold mt-1 text-white">IC Presiding Officer</h4>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Manages assigned cases, triggers hearing logs, verifies conciliation checklist, and files findings.
              </p>
            </div>
            
            <button
              onClick={() => handleRoleLogin('priya@vardhman.com')}
              className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded flex items-center justify-center space-x-1 transition border border-slate-700"
            >
              <span>Enter as IC Member</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* District Officer Role */}
          <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Statutory Authority</span>
              <h4 className="text-base font-bold mt-1 text-white">District Officer</h4>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Govt authority viewing annual compliance submissions and tracking local filings (Read-only view).
              </p>
            </div>
            
            <button
              onClick={() => handleRoleLogin('district.officer@gov.in')}
              className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded flex items-center justify-center space-x-1 transition border border-slate-700"
            >
              <span>Enter as District Officer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
