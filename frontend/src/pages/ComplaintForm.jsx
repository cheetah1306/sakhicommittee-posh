import React, { useState } from 'react';
import { useApp } from '../context/AppState';
import { ShieldCheck, Calendar, MapPin, AlignLeft, EyeOff, UserCheck, CheckCircle, ArrowRight, ArrowLeft, Copy, Check } from 'lucide-react';

export const ComplaintForm = ({ onNavigate }) => {
  const { currentCompany, defaultCompanyId, reloadAll, API_BASE } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [complainantName, setComplainantName] = useState('');
  const [complainantContact, setComplainantContact] = useState('');
  const [evidenceName, setEvidenceName] = useState(''); // File mock helper
  
  // Result
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (result) {
      navigator.clipboard.writeText(result.tracking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError('');

    const companyId = currentCompany?.id ?? defaultCompanyId;
    if (!companyId) {
      setLoading(false);
      setError('Could not identify the company to file against. Please refresh the page and try again.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          incident_date: incidentDate,
          location,
          description,
          is_anonymous: isAnonymous,
          complainant_name: complainantName,
          complainant_contact: complainantContact
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        await reloadAll?.();
        setStep(4);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit complaint.');
      }
    } catch {
      setError('Connection failed. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Form Header */}
      <div className="bg-slate-900 text-white p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold font-serif">Safe & Confidential Incident Reporting</h2>
        <p className="text-slate-400 text-xs md:text-sm mt-1">
          Compliant with the Indian POSH Act, 2013. Files are stored on a secure, restricted database.
        </p>

        {/* Stepper indicator */}
        {step < 4 && (
          <div className="flex items-center space-x-3 mt-6">
            <div className={`h-2 rounded-full flex-1 transition-all ${step >= 1 ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
            <div className={`h-2 rounded-full flex-1 transition-all ${step >= 2 ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
            <div className={`h-2 rounded-full flex-1 transition-all ${step >= 3 ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-sm text-red-900 rounded font-medium">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Step 1: Incident Location & Timing</h3>
              <p className="text-slate-500 text-xs">Please provide approximate incident details to start the timeline check.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Date of Incident
                </label>
                <input
                  type="date"
                  required
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Location / Department
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finance Office, Ludhiana Branch, Cafeteria"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!incidentDate || !location}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded text-sm font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Step 2: Incident Account & Evidence</h3>
              <p className="text-slate-500 text-xs">Write a descriptive log of what occurred. All detail logs are restricted to the IC panel.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center">
                  <AlignLeft className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Detailed Description
                </label>
                <textarea
                  rows="5"
                  required
                  placeholder="Provide details regarding what transpired, words spoken, who was present, etc. Be as clear as possible."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Upload Evidence File (Optional Placeholder)
                </label>
                <input
                  type="file"
                  onChange={(e) => setEvidenceName(e.target.files[0]?.name || '')}
                  className="w-full border border-slate-300 rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                {evidenceName && <p className="text-xs text-orange-600 mt-1 font-bold">Selected: {evidenceName}</p>}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-bold flex items-center space-x-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!description}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded text-sm font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Step 3: Identity & Safety Preference</h3>
              <p className="text-slate-500 text-xs">Choose whether to stay fully anonymous or share your contact details.</p>
            </div>

            <div className="space-y-5">
              {/* Option Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(true)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center transition ${isAnonymous ? 'border-orange-600 bg-orange-50/40 text-orange-950' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                >
                  <EyeOff className={`w-6 h-6 mb-2 ${isAnonymous ? 'text-orange-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-sm">Stay Anonymous</span>
                  <span className="text-[10px] text-slate-500 mt-1 leading-tight">No contact details are recorded. Only tracking code is given.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAnonymous(false)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center transition ${!isAnonymous ? 'border-orange-600 bg-orange-50/40 text-orange-950' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                >
                  <UserCheck className={`w-6 h-6 mb-2 ${!isAnonymous ? 'text-orange-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-sm">Provide Identity</span>
                  <span className="text-[10px] text-slate-500 mt-1 leading-tight">Allows the IC to reach out for hearings or statements directly.</span>
                </button>
              </div>

              {/* Form entries for identity */}
              {!isAnonymous && (
                <div className="space-y-3.5 p-4 bg-slate-50 border rounded-lg animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required={!isAnonymous}
                      placeholder="e.g. Meera Nair"
                      value={complainantName}
                      onChange={(e) => setComplainantName(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Email / Contact Number
                    </label>
                    <input
                      type="text"
                      required={!isAnonymous}
                      placeholder="e.g. meera.nair@vardhman.com"
                      value={complainantContact}
                      onChange={(e) => setComplainantContact(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-900 rounded text-xs leading-relaxed space-y-1">
                <p className="font-bold flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Legal Safety Guard:
                </p>
                <p>
                  Section 16 of the POSH Act guarantees complete confidentiality. Identities of complainants, respondents, and witnesses cannot be leaked under penalty of law.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-bold flex items-center space-x-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-orange-700 hover:bg-orange-600 disabled:opacity-50 text-white rounded text-sm font-bold flex items-center space-x-1.5 transition border border-orange-600 cursor-pointer"
              >
                {loading ? (
                  <span>Filing...</span>
                ) : (
                  <>
                    <span>Submit & Start Case</span>
                    <CheckCircle className="w-4.5 h-4.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 4 && result && (
          <div className="text-center space-y-6 py-4 animate-scaleUp">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 border border-green-200">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold font-serif text-slate-900">Complaint Filed Successfully</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your incident has been securely recorded and timestamped.
              </p>
            </div>

            {/* Tracking Code Box */}
            <div className="max-w-md mx-auto bg-slate-900 text-white p-6 rounded-xl border border-slate-800 space-y-3 relative shadow-inner">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Case Tracking Code</p>
              <p className="text-2xl font-mono font-bold tracking-wider text-orange-400">{result.tracking_code}</p>
              
              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-[11px] rounded transition mx-auto font-bold border border-slate-850"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
              
              <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-400 leading-normal text-left">
                <span className="text-orange-500 font-bold">IMPORTANT:</span> Write down this code now. This code is the only way to check status updates. If you filed anonymously, it is impossible to recover this code.
              </div>
            </div>

            {/* Timeline Calculation Display */}
            <div className="max-w-md mx-auto border bg-slate-50 p-4 rounded-xl text-left text-xs text-slate-700 space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Filing Date:</span>
                <span className="font-mono">{new Date(result.received_at).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-orange-950 font-bold">
                <span>90-Day Inquiry Deadline:</span>
                <span className="font-mono text-orange-700">{new Date(result.deadline_90).toLocaleDateString('en-IN')}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal pt-1.5">
                The company's Internal Committee (IC) has a statutory duty to conclude its inquiry hearings and compile recommendations by the 90-day deadline above.
              </p>
            </div>

            {/* Simulated Notification Indicators */}
            <div className="text-xs text-slate-500 italic flex justify-center items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
              <span>Simulation: Acknowledgment receipt created and logged to audit trail.</span>
            </div>

            <div className="pt-4">
              <button
                onClick={() => onNavigate('home')}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm font-bold transition cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
