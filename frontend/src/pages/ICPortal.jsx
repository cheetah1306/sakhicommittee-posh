import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppState';
import { CheckSquare, AlertTriangle, Scale, FileText, Send, MapPin, Calendar } from 'lucide-react';
import { DocumentViewer } from '../components/DocumentViewer';

export const ICPortal = () => {
  const { cases, currentUser, currentCompany, systemDate, reloadAll, API_BASE } = useApp();
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [activeCase, setActiveCase] = useState(null);

  // States for actions inside case
  const [noteContent, setNoteContent] = useState('');
  const [transitionStatus, setTransitionStatus] = useState('');
  const [transitionNote, setTransitionNote] = useState('');
  
  // States for Inquiry Report wizard
  const [respondentName, setRespondentName] = useState('');
  const [reportFindings, setReportFindings] = useState('');
  const [reportRecs, setReportRecs] = useState('');
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);

  // States for Document preview
  const [caseDocs, setCaseDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchCaseDetails = useCallback(async (caseId) => {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveCase(data);
        setTransitionStatus(data.status);
      }
    } catch (err) {
      console.error(err);
    }
  }, [API_BASE]);

  const fetchCaseDocuments = useCallback(async (caseId) => {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setCaseDocs(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [API_BASE]);

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetails(selectedCaseId);
      fetchCaseDocuments(selectedCaseId);
    } else {
      setActiveCase(null);
      setCaseDocs([]);
    }
  }, [selectedCaseId, cases, fetchCaseDetails, fetchCaseDocuments]);

  const handlePostNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/cases/${activeCase.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: noteContent,
          actor_name: currentUser?.name || 'IC Member'
        })
      });

      if (res.ok) {
        setNoteContent('');
        await fetchCaseDetails(activeCase.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateChecklist = async (type, currentValue) => {
    try {
      const res = await fetch(`${API_BASE}/cases/${activeCase.id}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          value: !currentValue
        })
      });

      if (res.ok) {
        await fetchCaseDetails(activeCase.id);
        await reloadAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransition = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/cases/${activeCase.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextStatus: transitionStatus,
          note: transitionNote,
          actorName: currentUser?.name || 'IC Member'
        })
      });

      if (res.ok) {
        setTransitionNote('');
        await fetchCaseDetails(activeCase.id);
        await reloadAll();
      } else {
        const data = await res.json();
        alert(data.error || 'State transition failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Inquiry Report generation
  const handleDraftInquiryReport = async (e) => {
    e.preventDefault();
    if (!respondentName || !reportFindings || !reportRecs) {
      alert('All report fields are required.');
      return;
    }

    const reportContent = {
      title: `Inquiry Report - ${activeCase.tracking_code}`,
      caseTrackingCode: activeCase.tracking_code,
      complainant: activeCase.is_anonymous ? 'Anonymous Complainant' : activeCase.complainant_name,
      respondent: respondentName,
      incidentDetails: activeCase.description,
      findings: reportFindings,
      recommendations: reportRecs,
      signatories: [
        'Mrs. Priya Sharma (Presiding Officer)',
        'Ms. Ananya Sen (Employee Member)',
        'Mr. Rajesh Kumar (Employee Member)',
        'Dr. Sunita Deshmukh (External Member)'
      ]
    };

    try {
      // 1. Save Report Document
      const companyId = currentUser?.company_id || currentCompany?.id;
      const docRes = await fetch(`${API_BASE}/company/${companyId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'inquiry_report',
          content: reportContent,
          case_id: activeCase.id
        })
      });

      if (docRes.ok) {
        // 2. Transition case status to "Report Drafted"
        await fetch(`${API_BASE}/cases/${activeCase.id}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nextStatus: 'Report Drafted',
            note: 'Final inquiry findings report compiled and signed off by the IC.',
            actorName: currentUser?.name || 'IC Member'
          })
        });

        setIsReportWizardOpen(false);
        setRespondentName('');
        setReportFindings('');
        setReportRecs('');
        await fetchCaseDetails(activeCase.id);
        await fetchCaseDocuments(activeCase.id);
        await reloadAll();
        alert('Inquiry Report successfully generated and logged.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Deadline calculation
  const getDeadlineStatus = (deadlineStr, baseDateStr) => {
    const deadline = new Date(deadlineStr);
    const start = new Date(baseDateStr);
    const totalDuration = deadline.getTime() - start.getTime();
    const elapsed = systemDate.getTime() - start.getTime();
    
    let percent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    let color = 'bg-green-500';
    let text = 'On Time';
    const daysRemaining = Math.ceil((deadline.getTime() - systemDate.getTime()) / (1000 * 3600 * 24));

    if (daysRemaining < 0) {
      percent = 100;
      color = 'bg-red-650 animate-pulse';
      text = `Overdue by ${Math.abs(daysRemaining)} Days`;
    } else if (percent >= 50) {
      color = 'bg-amber-500';
      text = `Amber: ${daysRemaining} Days left`;
    } else {
      text = `${daysRemaining} Days left`;
    }

    return { percent, color, text, isOverdue: daysRemaining < 0 };
  };

  // Statutory 90-day inquiry clock that applies to active redressal cases
  const getStageDeadline = (kase) => {
    if (['Received', 'Acknowledged', 'Under Inquiry', 'Report Drafted', 'Awaiting Employer Action'].includes(kase.status) && kase.deadline_90) {
      return { label: '90-Day Inquiry Clock', deadline: kase.deadline_90, start: kase.received_at };
    }
    // Resolved and appealed cases have left the IC's statutory clock.
    return null;
  };

  // Sort cases: soonest current-stage deadline first, closed cases last.
  const sortedCases = [...cases].sort((a, b) => {
    const aDeadline = getStageDeadline(a)?.deadline;
    const bDeadline = getStageDeadline(b)?.deadline;
    if (!aDeadline && !bDeadline) return 0;
    if (!aDeadline) return 1;
    if (!bDeadline) return -1;
    return new Date(aDeadline).getTime() - new Date(bDeadline).getTime();
  });

  return (
    <div className="grid md:grid-cols-3 gap-8 pb-16">
      {/* Cases List Selector */}
      <div className="md:col-span-1 space-y-4">
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">IC Redressal Cases</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Assigned to: {currentUser?.name || 'Internal Committee'}</p>
          </div>
          <Scale className="w-5 h-5 text-orange-400" />
        </div>

        <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
          {sortedCases.length === 0 ? (
            <div className="text-slate-500 text-xs py-10 bg-white border p-6 rounded-xl text-center italic">
              No cases filed yet for this company.
            </div>
          ) : (
            sortedCases.map((kase) => {
              const stage = getStageDeadline(kase);
              const dStat = stage ? getDeadlineStatus(stage.deadline, stage.start) : null;
              const isSelected = selectedCaseId === kase.id;

              return (
                <button
                  key={kase.id}
                  onClick={() => setSelectedCaseId(kase.id)}
                  className={`w-full text-left p-4 rounded-xl border transition flex flex-col justify-between space-y-3 cursor-pointer ${isSelected ? 'border-orange-600 bg-orange-50/10 shadow-md ring-1 ring-orange-500/25' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-1.5 py-0.5 rounded">
                        {kase.tracking_code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1 font-serif">
                        {kase.is_anonymous ? 'Anonymous Case' : `Complainant: ${kase.complainant_name}`}
                      </h4>
                    </div>
                    
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${kase.status === 'Resolved' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                      {kase.status}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                    {kase.description}
                  </p>

                  {/* Deadline Progress */}
                  {stage && dStat && (
                    <div className="space-y-1 w-full border-t pt-2.5">
                      <div className="flex justify-between text-[9px] font-bold">
                        <span className="text-slate-400">{stage.label}:</span>
                        <span className={dStat.isOverdue ? 'text-red-650' : 'text-slate-500'}>{dStat.text}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
                        <div className={`h-full rounded-full ${dStat.color}`} style={{ width: `${dStat.percent}%` }}></div>
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Case Details Workspace */}
      <div className="md:col-span-2 space-y-6">
        {activeCase ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden animate-fadeIn">
            {/* Case Header */}
            <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono font-bold text-orange-400">
                  {activeCase.tracking_code}
                </span>
                <h3 className="text-xl font-bold font-serif text-white mt-1.5">
                  {activeCase.is_anonymous ? 'Anonymous Complainant' : activeCase.complainant_name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  Received: {new Date(activeCase.received_at).toLocaleDateString('en-IN')}
                </p>
              </div>

              {/* Status Switcher Selector */}
              <div className="text-right space-y-2">
                <span className="inline-block text-xs bg-orange-950 text-orange-400 border border-orange-900/50 px-3 py-1 rounded font-bold uppercase tracking-wider">
                  {activeCase.status}
                </span>
                
                {/* Inquiry Report Draft button */}
                {activeCase.status === 'Under Inquiry' && (
                  <button
                    onClick={() => setIsReportWizardOpen(true)}
                    className="block w-full text-center py-1.5 px-3 bg-orange-700 hover:bg-orange-600 text-white text-[11px] font-bold rounded-lg transition border border-orange-600 shadow"
                  >
                    Draft Final Report
                  </button>
                )}
              </div>
            </div>

            {/* Layout Workspace Body */}
            <div className="p-6 grid sm:grid-cols-3 gap-6">
              
              {/* Left Column (Details, Documents, Checklist) */}
              <div className="sm:col-span-2 space-y-6">
                {/* description */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Incident Details</h4>
                  <div className="bg-slate-50 border p-4 rounded-xl text-slate-800 text-sm leading-relaxed space-y-3.5">
                    <p className="text-justify font-medium">{activeCase.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3 text-slate-500 font-semibold">
                      <div className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>{activeCase.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>Incident: {new Date(activeCase.incident_date).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>

                    {!activeCase.is_anonymous && (
                      <div className="border-t pt-3 text-xs">
                        <span className="text-slate-400">Contact Details:</span>
                        <span className="text-slate-800 ml-1.5 font-bold">{activeCase.complainant_contact}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checklist (Natural justice) */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center">
                    <CheckSquare className="w-4 h-4 mr-1 text-slate-500" />
                    Statutory Natural Justice Checklist
                  </h4>
                  
                  <div className="border rounded-xl p-4 space-y-3 text-xs bg-slate-50/50">
                    <label className="flex items-start space-x-2.5 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!activeCase.has_conciliation_offered}
                        onChange={() => handleUpdateChecklist('has_conciliation_offered', activeCase.has_conciliation_offered)}
                        className="mt-0.5 cursor-pointer"
                      />
                      <div>
                        <span className="text-slate-900 block">Offer Conciliation</span>
                        <span className="text-slate-400 text-[10px] font-normal leading-tight block">Aggrieved woman must be offered settling via conciliation before inquiry (Section 10(1)).</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!activeCase.has_conciliation_agreed}
                        onChange={() => handleUpdateChecklist('has_conciliation_agreed', activeCase.has_conciliation_agreed)}
                        className="mt-0.5 cursor-pointer"
                      />
                      <div>
                        <span className="text-slate-900 block">Conciliation Mutual Agreement Status</span>
                        <span className="text-slate-400 text-[10px] font-normal leading-tight block">Parties agree to settle without monetary terms. Logs settlement report.</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!activeCase.has_hearing_given}
                        onChange={() => handleUpdateChecklist('has_hearing_given', activeCase.has_hearing_given)}
                        className="mt-0.5 cursor-pointer"
                      />
                      <div>
                        <span className="text-slate-900 block">Hearings for Both Parties Conducted</span>
                        <span className="text-slate-400 text-[10px] font-normal leading-tight block">IC must give an equal opportunity to both complainant and respondent to present their case.</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!activeCase.has_evidence_reviewed}
                        onChange={() => handleUpdateChecklist('has_evidence_reviewed', activeCase.has_evidence_reviewed)}
                        className="mt-0.5 cursor-pointer"
                      />
                      <div>
                        <span className="text-slate-900 block">Evidence & Testimonies Examined</span>
                        <span className="text-slate-400 text-[10px] font-normal leading-tight block">Witnesses and exhibits reviewed and recorded in inquiry minutes.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Audit trail */}
                <div className="border-t pt-5 space-y-4">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Internal Inquiry Event Logs</h4>
                  
                  {/* Notes compiler form */}
                  <form onSubmit={handlePostNote} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Log hearing summary, interim relief decisions, etc..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="flex-1 border border-slate-350 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 bg-slate-50 focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center transition"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      <span>Log</span>
                    </button>
                  </form>

                  {/* List of events */}
                  <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                    {activeCase.events?.map((evt, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/50 rounded-lg border text-xs leading-normal">
                        <div className="flex justify-between text-slate-400 text-[10px] font-bold mb-1">
                          <span>{evt.actor_name}</span>
                          <span className="font-mono">{new Date(evt.timestamp).toLocaleDateString('en-IN')} {new Date(evt.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded mr-2 inline-block">
                          {evt.event_type}
                        </span>
                        <span className="text-slate-700 font-medium">{evt.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (Transitions, Case documents) */}
              <div className="sm:col-span-1 space-y-6 border-t sm:border-t-0 sm:border-l sm:pl-6 pt-6 sm:pt-0">
                {/* State Machine Transition */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Workflow Transition</h4>
                  
                  <form onSubmit={handleTransition} className="space-y-3 text-xs font-medium bg-slate-50 p-4 rounded-xl border">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Select Next Status</label>
                      <select
                        value={transitionStatus}
                        onChange={(e) => setTransitionStatus(e.target.value)}
                        className="w-full border rounded px-2.5 py-1.5 focus:outline-none bg-white text-xs"
                      >
                        <option value="Received">Received</option>
                        <option value="Acknowledged">Acknowledged</option>
                        <option value="Under Inquiry">Under Inquiry</option>
                        <option value="Report Drafted">Report Drafted</option>
                        <option value="Awaiting Employer Action">Awaiting Employer Action</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Appealed">Appealed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Audit log Note</label>
                      <textarea
                        rows="2"
                        placeholder="Log rationale for state transition..."
                        value={transitionNote}
                        onChange={(e) => setTransitionNote(e.target.value)}
                        className="w-full border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded transition text-xs"
                    >
                      Apply Status
                    </button>
                  </form>
                </div>

                {/* Case Documents */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Inquiry Documents</h4>
                  
                  {caseDocs.length === 0 ? (
                    <div className="text-[10px] text-slate-500 bg-slate-50 border p-3 rounded text-center italic">
                      No Inquiry Reports drafted yet for this case.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {caseDocs.map((doc, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedDoc(doc)}
                          className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border rounded-lg text-left text-xs transition flex justify-between items-center group cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-slate-800 uppercase tracking-wide block">Inquiry Report</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Signed Panel</span>
                          </div>
                          <FileText className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed rounded-xl py-24 text-center text-slate-450 flex flex-col items-center justify-center space-y-3">
            <Scale className="w-12 h-12 text-slate-300" />
            <div>
              <p className="font-bold text-slate-650 text-sm">Case Redressal Workspace</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Select a case from the list on the left to manage inquiry hearings, checklists, and compile reports.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Report Wizard Modal */}
      {isReportWizardOpen && activeCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-5 border animate-scaleUp">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 font-serif">Inquiry Report Compiler</h3>
              <button onClick={() => setIsReportWizardOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Close</button>
            </div>

            <form onSubmit={handleDraftInquiryReport} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Respondent Name / Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Mehta (Finance Manager)"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  className="w-full border border-slate-350 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Inquiry Findings</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Detail the findings of the inquiry, testimonies reviewed, and conclusions reached by the IC..."
                  value={reportFindings}
                  onChange={(e) => setReportFindings(e.target.value)}
                  className="w-full border border-slate-350 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Disciplinary Recommendations</label>
                <textarea
                  rows="3"
                  required
                  placeholder="List disciplinary recommendations to the employer (e.g. suspension, transfer, counselling, contract termination)..."
                  value={reportRecs}
                  onChange={(e) => setReportRecs(e.target.value)}
                  className="w-full border border-slate-350 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                ></textarea>
              </div>

              <div className="bg-orange-50 p-3.5 border border-orange-200 rounded text-[10px] text-orange-950 leading-relaxed flex items-start space-x-1.5">
                <AlertTriangle className="w-4.5 h-4.5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Constitutional Consent:</span> Submitting this report drafts a legally binding document signed by all 4 IC members. It shifts the case to <span className="font-bold">Report Drafted</span>, triggering the 10-day submission clock to the employer.
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsReportWizardOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded font-bold transition text-xs border border-orange-600 cursor-pointer"
                >
                  Draft & Sign Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Document Viewer */}
      {selectedDoc && (
        <DocumentViewer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
};
