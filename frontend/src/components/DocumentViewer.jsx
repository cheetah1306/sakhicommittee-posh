import React from 'react';
import { Printer, X } from 'lucide-react';

export const DocumentViewer = ({ doc, onClose }) => {
  if (!doc) return null;

  const content = typeof doc.content === 'string' ? JSON.parse(doc.content) : doc.content;
  const generatedDate = new Date(doc.generated_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const renderContent = () => {
    switch (doc.type) {
      case 'policy':
        return (
          <div className="space-y-6 text-justify leading-relaxed font-serif text-slate-800">
            <div className="text-center border-b pb-6">
              <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-900">POSH Act Compliance Policy</h2>
              <p className="text-sm font-sans text-slate-500 mt-1">Constituted under the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013</p>
              <p className="text-sm font-sans text-slate-600 mt-2 font-bold">{content.companyName}</p>
              <p className="text-xs font-sans text-slate-400 mt-1">Effective Date: {new Date(content.effectiveDate).toLocaleDateString('en-IN')}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Objective & Scope</h3>
              <p>
                This policy is constituted to ensure a work environment that is free from sexual harassment, intimidation, and exploitation. It extends to all employees, contract workers, interns, and visitors across all offices and workspaces of {content.companyName}.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Internal Committee (IC) Constitution</h3>
              <p className="mb-3">
                In compliance with Section 4 of the POSH Act, {content.companyName} has constituted an Internal Committee (IC) to review and resolve harassment complaints. The committee is constituted of:
              </p>
              <table className="min-w-full divide-y divide-slate-200 font-sans text-sm mb-4">
                <thead>
                  <tr className="bg-slate-50 text-left font-bold text-slate-700">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2 font-medium">{content.presidingOfficer}</td>
                    <td className="px-4 py-2 text-slate-600">Presiding Officer (Senior Woman)</td>
                    <td className="px-4 py-2">Female</td>
                  </tr>
                  {content.membersList.map((m, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 font-medium">{m}</td>
                      <td className="px-4 py-2 text-slate-600">Employee Member</td>
                      <td className="px-4 py-2">Any</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="px-4 py-2 font-medium">{content.externalMember}</td>
                    <td className="px-4 py-2 text-slate-600">External Member (NGO/Legal)</td>
                    <td className="px-4 py-2">Female</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-sm italic text-slate-600">
                The members of the IC shall hold office for a period not exceeding three (3) years from their appointment date. At least 50% of the members of the IC are women.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Redressal Procedure</h3>
              <p className="mb-2">
                Any aggrieved employee may file a complaint with the IC within <strong>three (3) months</strong> of the occurrence of the incident.
              </p>
              <p>
                The IC shall follow the principles of natural justice and complete the formal inquiry within a statutory limit of <strong>90 days</strong> from the filing date. A report containing recommendations will be submitted to the employer within 10 days of completing the inquiry.
              </p>
            </div>

            <div className="pt-8 border-t flex justify-between items-center font-sans text-sm">
              <div>
                <p className="font-bold">{content.companyName}</p>
                <p className="text-slate-500">Board of Directors</p>
              </div>
              <div className="text-right">
                <div className="h-10 w-24 border-b border-slate-300 italic text-slate-400 text-xs flex items-end justify-center pb-1">Stamp/Signature</div>
                <p className="text-slate-500 mt-1">Authorized Signatory</p>
              </div>
            </div>
          </div>
        );

      case 'appointment_letter':
        return (
          <div className="space-y-6 leading-relaxed font-serif text-slate-800">
            <div className="text-right font-sans text-sm text-slate-500">
              <p>Date: {generatedDate}</p>
            </div>
            
            <div className="border-b pb-6 text-center">
              <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-900">{content.companyName}</h2>
              <p className="text-sm font-sans text-slate-500">Appointment to the Internal Committee (IC)</p>
            </div>

            <div className="space-y-4">
              <p className="font-sans font-bold">To,</p>
              <div className="font-sans pl-4">
                <p className="font-bold text-slate-900">{content.memberName}</p>
                <p className="text-slate-600">Designation: {content.designation || 'Committee Appointee'}</p>
              </div>

              <p className="pt-4 font-bold">Subject: Appointment as {content.icRole === 'presiding' ? 'Presiding Officer' : content.icRole === 'external' ? 'External Member' : 'Employee Member'} of the Internal Committee (IC)</p>

              <p>Dear {content.memberName},</p>

              <p>
                We are pleased to inform you that you have been nominated and appointed as the <strong>{content.icRole === 'presiding' ? 'Presiding Officer (Senior Woman)' : content.icRole === 'external' ? 'External Member (NGO/Legal Advisor)' : 'Employee Member'}</strong> of the Internal Committee (IC) of {content.companyName}, constituted in accordance with Section 4 of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013.
              </p>

              <p>
                Your appointment is effective from <strong>{new Date(content.termStart).toLocaleDateString('en-IN')}</strong> and shall remain valid for a term of three (3) years expiring on <strong>{new Date(content.termEnd).toLocaleDateString('en-IN')}</strong>, unless reconstituted earlier by the management.
              </p>

              <p>
                As an IC member, you are expected to maintain strict confidentiality of all complaints, proceedings, and identities in compliance with Section 16 of the Act. Any breach of confidentiality is a punishable offence.
              </p>

              <p>We thank you for taking up this critical responsibility to ensure a safe, inclusive workplace.</p>
            </div>

            <div className="pt-12 flex justify-between items-center font-sans text-sm">
              <div>
                <p className="font-bold">For {content.companyName}</p>
                <div className="h-8"></div>
                <p className="text-slate-500">Authorized Signatory</p>
              </div>
              <div className="text-right">
                <p className="italic text-slate-400">Accepted by Appointee</p>
                <div className="h-8"></div>
                <p className="font-bold">{content.memberName}</p>
              </div>
            </div>
          </div>
        );

      case 'inquiry_report':
        return (
          <div className="space-y-6 leading-relaxed font-serif text-slate-800">
            <div className="text-center border-b pb-6">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">IC Final Inquiry Report & Recommendations</h2>
              <p className="text-xs font-sans text-slate-400 mt-1">Filed under Section 13(1) of the POSH Act, 2013</p>
              <p className="text-sm font-sans text-slate-600 mt-1">Case Tracking: <span className="font-mono bg-slate-100 px-1 font-bold text-slate-700">{content.caseTrackingCode}</span></p>
              <p className="text-xs font-sans text-slate-400">Submission Date: {generatedDate}</p>
            </div>

            <div className="space-y-4 text-sm font-sans">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border">
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">Complainant</p>
                  <p className="font-bold text-slate-900">{content.complainant || 'Confidential (Anonymous)'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">Respondent</p>
                  <p className="font-bold text-slate-900">{content.respondent}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Allegations Reviewed</h3>
              <p className="italic text-slate-700 bg-slate-50 border-l-4 border-slate-300 p-3">
                "{content.incidentDetails}"
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Findings of the Internal Committee</h3>
              <p className="text-justify">{content.findings}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Recommended Actions to Employer</h3>
              <p className="whitespace-pre-line text-justify bg-amber-50 p-4 rounded border border-amber-200 text-amber-900 font-sans text-sm">
                {content.recommendations}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">4. Inquiry Panel Signatures</h3>
              <div className="grid grid-cols-2 gap-y-6 pt-4 font-sans text-xs">
                {content.signatories.map((sig, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="h-8 border-b border-dashed border-slate-400 w-40 text-center italic text-slate-300">Signed</div>
                    <p className="mt-1 font-bold text-slate-700">{sig}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'annual_report':
        return (
          <div className="space-y-6 leading-relaxed font-serif text-slate-800">
            <div className="text-center border-b pb-6">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">Annual POSH Report</h2>
              <p className="text-xs font-sans text-slate-400 mt-1">Submitted to the District Officer under Section 21 of the POSH Act</p>
              <p className="text-sm font-sans text-slate-600 mt-1 font-bold">Filing Year: {content.year}</p>
              <p className="text-xs font-sans text-slate-400">Generated on: {generatedDate}</p>
            </div>

            <div className="space-y-4">
              <p>
                This report summarizes the complaints received and actions taken by <strong>{content.companyName}</strong> during the calendar year <strong>{content.year}</strong>.
              </p>

              <div className="bg-slate-50 p-6 rounded border space-y-4 font-sans text-sm">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide border-b pb-2">Statutory Disclosure Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-r pr-4">
                    <p className="text-slate-500">Number of sexual harassment complaints received:</p>
                    <p className="text-2xl font-bold text-slate-950 mt-1">{content.complaintsReceived}</p>
                  </div>
                  <div className="pl-4">
                    <p className="text-slate-500">Number of complaints resolved / disposed:</p>
                    <p className="text-2xl font-bold text-slate-950 mt-1">{content.complaintsResolved}</p>
                  </div>
                  <div className="border-r border-t pt-3 pr-4">
                    <p className="text-slate-500">Number of cases pending beyond 90 days:</p>
                    <p className="text-2xl font-bold text-slate-950 mt-1">{content.complaintsPending}</p>
                  </div>
                  <div className="border-t pt-3 pl-4">
                    <p className="text-slate-500">Number of POSH awareness workshops conducted:</p>
                    <p className="text-2xl font-bold text-slate-950 mt-1">{content.trainingsConducted}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Narrative & Action Details</h3>
                <p className="text-justify">{content.narrative || 'Zero cases were received or resolved during the calendar year.'}</p>
              </div>
            </div>

            <div className="pt-8 border-t flex justify-between items-center font-sans text-sm">
              <div>
                <p className="font-bold">For {content.companyName}</p>
                <p className="text-slate-500">Internal Committee & Management</p>
              </div>
              <div className="text-right">
                <div className="h-10 w-24 border-b border-slate-300 italic text-slate-400 text-xs flex items-end justify-center pb-1">Stamp/Signature</div>
                <p className="text-slate-500 mt-1">Presiding Officer, IC</p>
              </div>
            </div>
          </div>
        );

      case 'board_disclosure':
        return (
          <div className="space-y-6 leading-relaxed font-sans text-slate-800">
            <div className="border-b pb-6 text-center">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">Board\'s Report Disclosure Snippet</h2>
              <p className="text-xs text-slate-500 mt-1">Statutory disclosure required under Section 134 of Companies Act and POSH Rules</p>
            </div>

            <div className="space-y-4">
              <p className="text-sm">
                Copy the text snippet below to paste into your company\'s annual **Board\'s Report** or statutory corporate disclosures:
              </p>

              <div className="bg-slate-950 text-slate-200 p-6 rounded-lg font-mono text-sm leading-relaxed whitespace-pre-wrap select-all relative group border">
                <div className="absolute top-2 right-2 text-xs text-slate-500 group-hover:text-slate-300">Click to Select All</div>
                {`DISCLOSURE UNDER THE SEXUAL HARASSMENT OF WOMEN AT WORKPLACE (PREVENTION, PROHIBITION AND REDRESSAL) ACT, 2013

Your Directors state that the Company has constituted an Internal Committee (IC) in compliance with the provisions of Section 4 of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013. The Company has in place a POSH Policy outlining a zero-tolerance mechanism for harassment.

During the year under review, the status of complaints and trainings is detailed below:
- Number of complaints received during the financial year: ${content.complaintsReceived}
- Number of complaints disposed of during the financial year: ${content.complaintsResolved}
- Number of complaints pending for more than ninety days: ${content.complaintsPending}
- Number of workshops or awareness programs against sexual harassment carried out: ${content.trainingsConducted}

The Company continues to maintain a secure and safe work environment for all employees, contract workers, and trainees.`}
              </div>

              <div className="bg-blue-50 p-4 rounded text-xs text-blue-900 flex flex-col space-y-1">
                <p className="font-bold">Legal Compliance Note:</p>
                <p>
                  As per mid-2025 Indian regulatory rules, companies are legally mandated to publish this block in their annual filings. Failure to declare this in the Board Report can attract fines and audit flags from the Registrar of Companies (ROC).
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unsupported Document Type</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] print-card border">
        
        {/* Viewer Header */}
        <div className="px-6 py-4 bg-slate-900 text-white rounded-t-xl flex justify-between items-center no-print">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase bg-slate-700 px-2.5 py-1 rounded font-bold tracking-wider">
              {doc.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400">Generated in Demo State</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded transition font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Page Container */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center print:bg-white print:p-0">
          <div className="document-page w-full max-w-[210mm] min-h-[297mm] p-[20mm] mx-auto print:p-0 print:border-none print:shadow-none bg-white">
            {renderContent()}
          </div>
        </div>

        {/* Viewer Footer */}
        <div className="px-6 py-3 border-t bg-slate-50 text-right text-xs text-slate-500 rounded-b-xl no-print">
          Close this preview to return to your dashboard. Use browser print layout options to download as a legal PDF file.
        </div>
      </div>
    </div>
  );
};
