import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppState';
import { FileText, ShieldCheck, Landmark } from 'lucide-react';
import { DocumentViewer } from '../components/DocumentViewer';

export const DistrictOfficer = () => {
  const { API_BASE, currentCompany, defaultCompanyId, resolveCompanyId, loading: appLoading } = useApp();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchDistrictReports = useCallback(async (companyId) => {
    try {
      const docsRes = await fetch(`${API_BASE}/company/${companyId}/documents`);
      if (docsRes.ok) {
        const data = await docsRes.json();
        const annualReports = data.filter(d => d.type === 'annual_report');
        setReports(annualReports);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    // Filings belong to the demo company resolved from the backend
    const companyId = currentCompany?.id ?? defaultCompanyId;
    if (companyId) {
      fetchDistrictReports(companyId);
    } else if (!appLoading) {
      resolveCompanyId().then((id) => {
        if (id) fetchDistrictReports(id);
        else setLoading(false);
      });
    }
  }, [currentCompany, defaultCompanyId, appLoading, fetchDistrictReports, resolveCompanyId]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-slate-850 flex items-center justify-center text-orange-400 border border-slate-700">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif">District Compliance Portal</h2>
            <p className="text-xs text-slate-400 mt-0.5">SHe-Box Compliance Auditing Authority • Ministry of Women & Child Development</p>
          </div>
        </div>

        <span className="inline-block text-[10px] bg-slate-850 border border-slate-700 px-3 py-1 rounded font-bold uppercase tracking-wider text-orange-400">
          Official Authority View
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Info panel */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 md:col-span-1">
          <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1 text-slate-500" />
            Statutory Authority
          </h3>
          
          <p className="text-slate-650 text-xs leading-relaxed">
            Under Section 21 of the POSH Act 2013, the District Officer is responsible for monitoring compliance, reviewing annual reports, and reporting to the State Government.
          </p>

          <div className="p-4 bg-slate-50 border rounded-lg text-xs leading-relaxed space-y-1.5 text-slate-500">
            <p className="font-bold text-slate-700 flex items-center">
              <Landmark className="w-3.5 h-3.5 mr-1" />
              Ludhiana District Jurisdiction
            </p>
            <p><strong>District Officer:</strong> Smt. Renuka Das, IAS</p>
            <p><strong>Area:</strong> Ludhiana Urban & Rural, Punjab</p>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900 leading-normal">
            <span className="font-bold block mb-1">Audit Notice:</span>
            Non-compliant companies failing to constitute an IC or file reports are subject to a ₹50,000 fine and licence cancellation review.
          </div>
        </div>

        {/* Reports Directory */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <h3 className="text-base font-bold text-slate-900 border-b pb-2">Submitted POSH Filings Returns</h3>
          
          {loading ? (
            <div className="text-slate-500 text-xs py-10 text-center font-medium">Fetching filed reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-slate-500 text-xs py-10 bg-slate-50 border rounded-xl text-center italic">
              No filings recorded in this district jurisdiction.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((doc, idx) => {
                const cData = typeof doc.content === 'string' ? JSON.parse(doc.content) : doc.content;
                return (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between transition hover:bg-slate-100/50"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-9 h-9 rounded-lg bg-orange-100/70 text-orange-700 flex items-center justify-center">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs md:text-sm">
                          Annual Report Submission — Vardhman Textiles Ltd.
                        </span>
                        <span className="text-slate-400 text-[10px] md:text-xs mt-0.5 block">
                          Calendar Year: <strong>{cData.year}</strong> • Submitted: {new Date(doc.generated_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition flex items-center space-x-1"
                    >
                      <span>Review Filing</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Document Viewer */}
      {selectedDoc && (
        <DocumentViewer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
};
