import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppState';
import { Plus, Sparkles, BookOpen, AlertTriangle, FileText, UserPlus, Users } from 'lucide-react';
import { DocumentViewer } from '../components/DocumentViewer';

export const AdminDashboard = () => {
  const { currentCompany, cases, systemDate, reloadAll, API_BASE } = useApp();
  const [activeTab, setActiveTab] = useState('health');
  
  // States for Wizard
  const [members, setMembers] = useState([
    { name: 'Mrs. Priya Sharma', role: 'presiding', gender: 'female' },
    { name: 'Ms. Ananya Sen', role: 'employee', gender: 'female' },
    { name: 'Mr. Rajesh Kumar', role: 'employee', gender: 'male' },
    { name: 'Dr. Sunita Deshmukh', role: 'external', gender: 'female' }
  ]);
  const [newMemName, setNewMemName] = useState('');
  const [newMemRole, setNewMemRole] = useState('employee');
  const [newMemGender, setNewMemGender] = useState('female');
  const [wizardError, setWizardError] = useState('');
  const [wizardSuccess, setWizardSuccess] = useState('');

  // States for Training
  const [trainings, setTrainings] = useState([]);
  const [trainDate, setTrainDate] = useState('');
  const [trainAttendees, setTrainAttendees] = useState('');
  const [trainTopic, setTrainTopic] = useState('');
  const [trainError, setTrainError] = useState('');
  const [trainSuccess, setTrainSuccess] = useState('');

  // States for Documents
  const [companyDocs, setCompanyDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // States for Annual Report Generation
  const [arYear, setArYear] = useState('2026');
  const [arNarrative, setArNarrative] = useState('');
  const [arError, setArError] = useState('');
  const [arSuccess, setArSuccess] = useState('');

  const fetchTrainings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/company/${currentCompany.id}/trainings`);
      if (res.ok) {
        const data = await res.json();
        setTrainings(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [API_BASE, currentCompany]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/company/${currentCompany.id}/documents`);
      if (res.ok) {
        const data = await res.json();
        setCompanyDocs(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [API_BASE, currentCompany]);

  useEffect(() => {
    if (currentCompany) {
      fetchTrainings();
      fetchDocuments();
    }
  }, [currentCompany, fetchTrainings, fetchDocuments]);

  // Onboarding Wizard - add to list
  const addWizardMember = () => {
    if (!newMemName.trim()) return;
    setMembers([...members, { name: newMemName, role: newMemRole, gender: newMemGender }]);
    setNewMemName('');
  };

  // Remove from list
  const removeWizardMember = (idx) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  // Save IC Committee
  const handleSaveIC = async (e) => {
    e.preventDefault();
    setWizardError('');
    setWizardSuccess('');

    try {
      const res = await fetch(`${API_BASE}/company/${currentCompany.id}/ic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members })
      });

      if (res.ok) {
        setWizardSuccess('Internal Committee configured successfully and letters drafted.');
        await reloadAll();
      } else {
        const data = await res.json();
        setWizardError(data.error || 'Failed to configure committee.');
      }
    } catch {
      setWizardError('Failed to connect to server.');
    }
  };

  // Save Training log
  const handleSaveTraining = async (e) => {
    e.preventDefault();
    setTrainError('');
    setTrainSuccess('');

    if (!trainDate || !trainAttendees || !trainTopic) {
      setTrainError('All training log fields are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/company/${currentCompany.id}/trainings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: trainDate,
          attendee_count: parseInt(trainAttendees, 10),
          topic: trainTopic
        })
      });

      if (res.ok) {
        setTrainSuccess('Awareness training logged successfully.');
        setTrainDate('');
        setTrainAttendees('');
        setTrainTopic('');
        await fetchTrainings();
      } else {
        setTrainError('Failed to log training session.');
      }
    } catch {
      setTrainError('Server error logging training.');
    }
  };

  // Generate Policy Document
  const handleGeneratePolicy = async () => {
    try {
      const policyContent = {
        companyName: currentCompany.name,
        effectiveDate: new Date().toISOString(),
        sector: currentCompany.sector,
        state: currentCompany.state,
        presidingOfficer: currentCompany.icMembers?.find(m => m.role === 'presiding')?.name || 'N/A',
        externalMember: currentCompany.icMembers?.find(m => m.role === 'external')?.name || 'N/A',
        membersList: currentCompany.icMembers?.filter(m => m.role === 'employee').map(m => m.name) || [],
        text: `The sexual harassment policy of ${currentCompany.name} outlines our zero-tolerance framework in accordance with the POSH Act 2013...`
      };

      const res = await fetch(`${API_BASE}/company/${currentCompany.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'policy',
          content: policyContent
        })
      });

      if (res.ok) {
        alert('POSH Policy successfully drafted and published.');
        await fetchDocuments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate Annual POSH Report
  const handleGenerateAnnualReport = async (e) => {
    e.preventDefault();
    setArError('');
    setArSuccess('');

    const resolved = cases.filter(c => c.status === 'Resolved').length;
    const pending = cases.filter(c => c.status !== 'Resolved').length;

    const annualReportContent = {
      year: parseInt(arYear, 10),
      companyName: currentCompany.name,
      complaintsReceived: cases.length,
      complaintsResolved: resolved,
      complaintsPending: pending,
      trainingsConducted: trainings.length,
      narrative: arNarrative || `A total of ${cases.length} cases were processed during ${arYear}. ${resolved} cases were fully resolved and closed by the IC, and ${pending} remain pending.`
    };

    try {
      const res = await fetch(`${API_BASE}/company/${currentCompany.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'annual_report',
          content: annualReportContent
        })
      });

      if (res.ok) {
        setArSuccess(`Annual POSH Report for ${arYear} has been generated and filed.`);
        setArNarrative('');
        await fetchDocuments();
      } else {
        setArError('Failed to generate annual report.');
      }
    } catch {
      setArError('Connection failure generating report.');
    }
  };

  // Generate Board Disclosure Snippet
  const handleViewBoardDisclosure = () => {
    const resolved = cases.filter(c => c.status === 'Resolved').length;
    const pending = cases.filter(c => c.status !== 'Resolved').length;

    const doc = {
      type: 'board_disclosure',
      generated_at: new Date().toISOString(),
      content: {
        complaintsReceived: cases.length,
        complaintsResolved: resolved,
        complaintsPending: pending,
        trainingsConducted: trainings.length
      }
    };
    setSelectedDoc(doc);
  };

  // Statutory 90-day inquiry deadline that applies to active redressal cases
  const getStatutoryDeadline = (kase) => {
    if (['Received', 'Acknowledged', 'Under Inquiry', 'Report Drafted', 'Awaiting Employer Action'].includes(kase.status)) {
      return kase.deadline_90 ? new Date(kase.deadline_90) : null;
    }
    // Resolved and appealed cases have left the IC's clock.
    return null;
  };

  // Calculate Health Score
  const getHealthScore = () => {
    if (!currentCompany) return { score: 0, rating: 'Red', details: [] };

    let score = 0;
    const details = [];
    const isLcc = currentCompany.employee_count < 10;

    // 1. IC Committee (40 points)
    if (isLcc) {
      score += 40;
      details.push({ label: 'Committee: Exempt (< 10 employees, LCC route)', valid: true });
    } else {
      const ic = currentCompany.icMembers || [];
      const hasPresiding = ic.some(m => m.role === 'presiding');
      const hasExternal = ic.some(m => m.role === 'external');
      const womenRatio = ic.filter(m => m.gender === 'female').length / Math.max(1, ic.length);
      const isValidIC = ic.length >= 4 && hasPresiding && hasExternal && womenRatio >= 0.5;

      if (isValidIC) {
        score += 40;
        details.push({ label: 'Internal Committee validly constituted', valid: true });
      } else {
        details.push({ label: 'IC Constitution invalid or missing', valid: false });
      }
    }

    // 2. Training log (25 points)
    if (trainings.length > 0) {
      score += 25;
      details.push({ label: `POSH training conducted (${trainings.length} workshops)`, valid: true });
    } else {
      details.push({ label: 'No POSH training sessions logged this year', valid: false });
    }

    // 3. Cases deadlines (20 points)
    const overdueCases = cases
      .map((kase) => ({ kase, deadline: getStatutoryDeadline(kase) }))
      .filter(({ deadline }) => deadline && systemDate.getTime() > deadline.getTime());

    if (overdueCases.length === 0) {
      score += 20;
      details.push({ label: 'All cases compliant within legal timelines', valid: true });
    } else {
      const codes = overdueCases.map(({ kase }) => kase.tracking_code).join(', ');
      details.push({
        label: `${overdueCases.length} ${overdueCases.length === 1 ? 'case is' : 'cases are'} past the statutory deadline (${codes})`,
        valid: false
      });
    }

    // 4. Annual filing (15 points)
    const hasAnnualReport = companyDocs.some(d => d.type === 'annual_report');
    if (hasAnnualReport) {
      score += 15;
      details.push({ label: 'Annual POSH report filed with District Officer', valid: true });
    } else {
      details.push({ label: 'Annual POSH report missing or not generated', valid: false });
    }

    let rating = 'Red';
    if (score >= 80) rating = 'Green';
    else if (score >= 50) rating = 'Amber';

    // An overdue statutory deadline is a compliance breach, so Green is not available
    if (overdueCases.length > 0 && rating === 'Green') rating = 'Amber';

    return { score, rating, details };
  };

  if (!currentCompany) return <div className="text-center py-10 font-medium">Loading company details...</div>;

  const hScore = getHealthScore();
  const isLccPathway = currentCompany.employee_count < 10;

  return (
    <div className="space-y-8 pb-16">
      {/* Company Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold tracking-wider">
            {currentCompany.sector} • {currentCompany.state}
          </span>
          <h2 className="text-2xl font-bold font-serif text-slate-900 mt-1">{currentCompany.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Statutory employee headcount: <strong>{currentCompany.employee_count} employees</strong></p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => setActiveTab('wizard')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition border flex items-center space-x-1"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Committee</span>
          </button>
          
          <button
            onClick={handleViewBoardDisclosure}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Board Disclosure</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('health')}
          className={`pb-3 transition ${activeTab === 'health' ? 'border-b-2 border-orange-600 text-orange-950 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Compliance Health
        </button>
        
        <button
          onClick={() => setActiveTab('wizard')}
          className={`pb-3 transition ${activeTab === 'wizard' ? 'border-b-2 border-orange-600 text-orange-950 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
        >
          IC Constitution Wizard
        </button>

        <button
          onClick={() => setActiveTab('trainings')}
          className={`pb-3 transition ${activeTab === 'trainings' ? 'border-b-2 border-orange-600 text-orange-950 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Awareness Training Logs
        </button>

        <button
          onClick={() => setActiveTab('filing')}
          className={`pb-3 transition ${activeTab === 'filing' ? 'border-b-2 border-orange-600 text-orange-950 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Annual Report Filing
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'health' && (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Health Score Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 md:col-span-1 flex flex-col justify-between">
            <h3 className="text-base font-bold uppercase tracking-wider text-slate-500">Compliance Health Rating</h3>
            
            <div className="text-center py-6">
              <div className="inline-block relative">
                <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center ${hScore.rating === 'Green' ? 'border-green-500 text-green-950 bg-green-50/20' : hScore.rating === 'Amber' ? 'border-amber-500 text-amber-950 bg-amber-50/20' : 'border-red-500 text-red-950 bg-red-50/20'}`}>
                  <span className="text-3xl font-extrabold font-mono">{hScore.score}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Score</span>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-4">Status: <span className={hScore.rating === 'Green' ? 'text-green-600' : hScore.rating === 'Amber' ? 'text-amber-600' : 'text-red-650'}>{hScore.rating} Compliance Level</span></p>
            </div>

            <p className="text-xs text-slate-500 leading-normal text-center italic border-t pt-3">
              Combines committee audits, training logs, cases timeline milestones, and annual filing returns.
            </p>
          </div>

          {/* Checklist Audit */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 md:col-span-2">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Redressal Compliance Audit Trail</h3>
            
            <div className="space-y-4">
              {hScore.details.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center space-x-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.valid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className={item.valid ? 'text-slate-800' : 'text-slate-500 line-through'}>{item.label}</span>
                  </div>
                  {item.valid ? (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">Pass</span>
                  ) : (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Critical</span>
                  )}
                </div>
              ))}
            </div>

            {/* Generated Documents Drawer */}
            <div className="border-t pt-5 space-y-3">
              <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Company POSH Artifacts</h4>
              
              {companyDocs.length === 0 ? (
                <div className="text-slate-500 text-xs py-2 bg-slate-50 p-4 rounded border text-center">
                  No statutory documents generated yet. Constitute your IC or file reports to create documents.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {companyDocs.map((doc, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDoc(doc)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border rounded-lg text-left text-xs transition flex justify-between items-center group cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-slate-800 uppercase tracking-wide block">
                          {doc.type.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-[10px] mt-0.5 block">
                          Generated {new Date(doc.generated_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wizard Constitutional Setup */}
      {activeTab === 'wizard' && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Internal Committee (IC) Nominees list</h3>
              <p className="text-slate-500 text-xs mt-0.5">Constitutes the active members handling grievance redressals.</p>
            </div>

            {isLccPathway ? (
              <div className="p-5 bg-amber-50 border-l-4 border-amber-500 text-amber-950 rounded-lg text-xs leading-relaxed space-y-3">
                <div className="flex items-center space-x-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Exemption pathway active (Local Complaints Committee)</span>
                </div>
                <p>
                  Because your statutory headcount is <strong>under 10 employees</strong>, you are exempt under Section 4(1) from forming a private Internal Committee. Complaints should be directed to the <strong>District Officer's Local Complaints Committee (LCC)</strong>.
                </p>
                <p className="font-bold">
                  District Officer contact: Smt. Renuka Das (Ludhiana District Magistrate Office, email: district.officer@gov.in)
                </p>
                <p>
                  You are still legally required to maintain a written anti-harassment policy. Click the button below to generate a default compliance policy:
                </p>
                
                <button
                  onClick={handleGeneratePolicy}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold transition text-xs border border-amber-600"
                >
                  Generate Written Policy
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveIC} className="space-y-6">
                {wizardError && <div className="p-3 bg-red-50 text-red-900 border text-xs rounded font-medium">{wizardError}</div>}
                {wizardSuccess && <div className="p-3 bg-green-50 text-green-900 border text-xs rounded font-medium">{wizardSuccess}</div>}

                {/* List table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-left">
                      <tr>
                        <th className="px-4 py-2.5">Name</th>
                        <th className="px-4 py-2.5">Role</th>
                        <th className="px-4 py-2.5">Gender</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {members.map((mem, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 text-slate-900">{mem.name}</td>
                          <td className="px-4 py-2.5 text-slate-600 uppercase tracking-wide">{mem.role}</td>
                          <td className="px-4 py-2.5 uppercase text-slate-500">{mem.gender}</td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => removeWizardMember(idx)}
                              className="text-red-600 hover:text-red-800 font-bold hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Validation Banner */}
                {(() => {
                  const womenCount = members.filter(m => m.gender === 'female').length;
                  const ratio = womenCount / Math.max(1, members.length);
                  const isRatioValid = ratio >= 0.5;
                  const hasPresiding = members.some(m => m.role === 'presiding' && m.gender === 'female');
                  const hasExternal = members.some(m => m.role === 'external');
                  const hasMinSize = members.length >= 4;

                  const allValid = isRatioValid && hasPresiding && hasExternal && hasMinSize;

                  return (
                    <div className={`p-4 border rounded-lg text-xs leading-normal space-y-2 ${allValid ? 'bg-green-50 border-green-200 text-green-950' : 'bg-red-50 border-red-200 text-red-950'}`}>
                      <p className="font-bold uppercase tracking-wide">Statutory IC Requirements Verification:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${isRatioValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>At least 50% Women ({Math.round(ratio * 100)}%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${hasPresiding ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>1 Presiding Officer (Senior Woman)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${hasExternal ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>1 External NGO/Legal Member</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${hasMinSize ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>Min 4 Committee Members</span>
                        </div>
                      </div>
                      
                      {!allValid && (
                        <p className="text-[10px] text-red-700 italic pt-1 font-bold">
                          The committee configuration violates POSH Section 4 parameters. Do not submit an invalid IC layout.
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={handleGeneratePolicy}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition border"
                  >
                    Generate POSH Policy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-700 hover:bg-orange-600 text-white rounded text-xs font-bold transition border border-orange-600 cursor-pointer"
                  >
                    Constitute Committee
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Form input Nominee */}
          {!isLccPathway && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center">
                <UserPlus className="w-4 h-4 mr-1 text-slate-500" />
                Add Nominee Member
              </h3>
              
              <div className="space-y-3.5 text-xs font-medium">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mrs. Priya Sharma"
                    value={newMemName}
                    onChange={(e) => setNewMemName(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Role Type</label>
                  <select
                    value={newMemRole}
                    onChange={(e) => setNewMemRole(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none bg-white"
                  >
                    <option value="employee">Employee Member</option>
                    <option value="presiding">Presiding Officer (Senior Woman)</option>
                    <option value="external">External Member (NGO/Legal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Gender</label>
                  <select
                    value={newMemGender}
                    onChange={(e) => setNewMemGender(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none bg-white"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={addWizardMember}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold transition flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Nominee</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* trainings log */}
      {activeTab === 'trainings' && (
        <div className="grid md:grid-cols-3 gap-8">
          {/* History */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Training History</h3>
            
            {trainings.length === 0 ? (
              <div className="text-slate-500 text-xs py-6 text-center italic bg-slate-50 rounded border">
                No workshops logged. The POSH Rules mandate periodic awareness sessions for all employees.
              </div>
            ) : (
              <div className="space-y-3">
                {trainings.map((t, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-950 block">{t.topic}</span>
                      <span className="text-slate-400 mt-1 block">Conducted {new Date(t.date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-200 rounded font-bold text-slate-800">
                      {t.attendee_count} Attendees
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form log */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center">
              <BookOpen className="w-4 h-4 mr-1 text-slate-500" />
              Log Training Session
            </h3>

            <form onSubmit={handleSaveTraining} className="space-y-4 text-xs font-medium">
              {trainError && <div className="p-2 bg-red-50 text-red-900 border text-[11px] rounded font-medium">{trainError}</div>}
              {trainSuccess && <div className="p-2 bg-green-50 text-green-900 border text-[11px] rounded font-medium">{trainSuccess}</div>}

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Topic / Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POSH Act Sensitization Seminar"
                  value={trainTopic}
                  onChange={(e) => setTrainTopic(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Conducted Date</label>
                <input
                  type="date"
                  required
                  value={trainDate}
                  onChange={(e) => setTrainDate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Attendees count</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15"
                  value={trainAttendees}
                  onChange={(e) => setTrainAttendees(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold transition flex items-center justify-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Save Log</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* filing Annual report */}
      {activeTab === 'filing' && (
        <div className="grid md:grid-cols-3 gap-8">
          {/* filing dashboard */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Annual Reporting (Section 21 filings)</h3>
            
            <p className="text-slate-600 text-xs leading-relaxed">
              Employers must submit an Annual Report summarizing complaints and redressals to the District Officer by 31 January each year.
            </p>

            {/* Stats list preview */}
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border font-sans text-xs">
              <div className="text-center py-2">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Complaints Received</span>
                <span className="text-xl font-bold text-slate-950 block mt-1">{cases.length}</span>
              </div>
              
              <div className="text-center py-2 border-x">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Complaints Resolved</span>
                <span className="text-xl font-bold text-slate-950 block mt-1">
                  {cases.filter(c => c.status === 'Resolved').length}
                </span>
              </div>

              <div className="text-center py-2">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Pending Cases</span>
                <span className="text-xl font-bold text-slate-950 block mt-1">
                  {cases.filter(c => c.status !== 'Resolved').length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted Filing History</h4>
              
              {companyDocs.filter(d => d.type === 'annual_report').length === 0 ? (
                <div className="p-4 bg-slate-50 text-slate-500 text-xs border rounded-lg text-center">
                  No Annual Reports submitted yet for this company. Generate the filing report from the panel to the right.
                </div>
              ) : (
                <div className="space-y-2">
                  {companyDocs.filter(d => d.type === 'annual_report').map((doc, idx) => {
                    const cData = typeof doc.content === 'string' ? JSON.parse(doc.content) : doc.content;
                    return (
                      <div key={idx} className="p-3 bg-slate-50 border rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-950">Annual Report Submission FY {cData.year}</span>
                          <span className="text-slate-400 text-[10px] mt-0.5 block">Generated {new Date(doc.generated_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 font-bold rounded transition text-[11px]"
                        >
                          View Report
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Form generator */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1 text-slate-500" />
              Generate Filing Report
            </h3>

            <form onSubmit={handleGenerateAnnualReport} className="space-y-4 text-xs font-medium">
              {arError && <div className="p-2 bg-red-50 text-red-900 border text-[11px] rounded font-medium">{arError}</div>}
              {arSuccess && <div className="p-2 bg-green-50 text-green-900 border text-[11px] rounded font-medium">{arSuccess}</div>}

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Calendar Year</label>
                <select
                  value={arYear}
                  onChange={(e) => setArYear(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none bg-white"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Filing Narrative Summary</label>
                <textarea
                  rows="4"
                  placeholder="Optional details summarizing the findings, disciplinary action taken, etc."
                  value={arNarrative}
                  onChange={(e) => setArNarrative(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orange-700 hover:bg-orange-600 text-white rounded font-bold transition flex items-center justify-center space-x-1 border border-orange-600 cursor-pointer"
              >
                <span>Draft & File Report</span>
              </button>
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
