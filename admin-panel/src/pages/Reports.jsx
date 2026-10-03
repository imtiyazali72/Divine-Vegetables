import React, { useState, useEffect } from 'react';
import { smartFetch } from '../apiConfig';

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  const fetchReport = async (monthStr) => {
    setLoading(true);
    try {
      const res = await smartFetch(`/admin/reports/monthly?year_month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.total_sales === 'number') {
          setReportData(data);
        } else {
          setReportData(null);
        }
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.error("Error fetching monthly report:", err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedMonth);
  }, [selectedMonth]);

  const handleExportPdf = async () => {
    setPdfExporting(true);
    try {
      const res = await smartFetch('/admin/reports/export-monthly-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year_month: selectedMonth })
      });
      const data = await res.json();
      if (data && data.pdf_url) {
        window.open(`http://localhost:8000${data.pdf_url}`, '_blank');
      } else {
        alert("Report PDF generated successfully!");
      }
    } catch (err) {
      alert("Error generating report PDF");
    } finally {
      setPdfExporting(false);
    }
  };

  const monthOptions = [
    { value: '2026-09', label: 'September 2026 (Current)' },
    { value: '2026-08', label: 'August 2026' },
    { value: '2026-07', label: 'July 2026' },
    { value: '2026-06', label: 'June 2026' },
    { value: '2026-05', label: 'May 2026' },
  ];

  const clientBreakdown = Array.isArray(reportData?.client_breakdown) ? reportData.client_breakdown : [];

  return (
    <div className="space-y-8">
      
      {/* Header & Month Selector */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">BUSINESS INTELLIGENCE</div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            📈 Monthly Revenue &amp; Udhaar Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical sales performance, collection tracking, and Month-over-Month (MoM) growth audit
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Month Selector Dropdown */}
          <select 
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-slate-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer w-full sm:w-auto"
          >
            {monthOptions.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* PDF Export Button */}
          <button 
            onClick={handleExportPdf}
            disabled={pdfExporting}
            className="emerald-btn text-xs py-2.5 px-4 shadow-lg shadow-emerald-950/50 justify-center w-full sm:w-auto"
          >
            {pdfExporting ? '⏳ Exporting...' : '📄 Export Branded PDF Report'}
          </button>
        </div>
      </div>

      {loading || !reportData ? (
        <div className="glass-panel p-12 text-center text-slate-400 text-xs font-bold space-y-2">
          <div className="animate-spin text-xl w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          <div>Loading monthly audit report data...</div>
        </div>
      ) : (
        <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL MONTHLY SALES</div>
              <div className="text-3xl font-black text-white">₹{(reportData.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-emerald-400 font-bold mt-2 flex items-center gap-1">
                <span>{reportData.total_orders || 0} Orders Billed</span>
              </div>
            </div>

            <div className="glass-panel p-6 border-l-4 border-l-amber-500">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL OUTSTANDING UDHAAR</div>
              <div className="text-3xl font-black text-amber-400">₹{(reportData.total_udhaar || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-slate-400 mt-2">Active client dues balance</div>
            </div>

            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">AVG ORDER VALUE (AOV)</div>
              <div className="text-3xl font-black text-blue-400">₹{(reportData.avg_order_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-slate-400 mt-2">Per order average billing</div>
            </div>

            <div className="glass-panel p-6 border-l-4 border-l-purple-500">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MoM GROWTH INDICATOR</div>
              <div className="text-sm font-extrabold mt-1" style={{ color: reportData.mom_color || '#10B981' }}>
                {reportData.mom_growth_str || 'Active'}
              </div>
              <div className="text-xs text-slate-400 mt-2">Compared to preceding month</div>
            </div>

          </div>

          {/* Itemized Customer Breakdown Table */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  🏬 Customer Performance Breakdown for {reportData.month_label || selectedMonth}
                </h3>
                <p className="text-xs text-slate-400">Individual hotel &amp; cafe sales volume, collections, and current balance</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Category</th>
                    <th>Monthly Billed Sales (₹)</th>
                    <th>Payments Collected (₹)</th>
                    <th>Current Outstanding (₹)</th>
                    <th>Phone Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {clientBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-slate-500 py-6 text-xs font-semibold">
                        No customer billing data recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    clientBreakdown.map(c => (
                      <tr key={c.id}>
                        <td className="font-bold text-white">{c.business_name}</td>
                        <td>
                          <span className={c.client_type === 'HOTEL' ? 'badge badge-hotel' : 'badge badge-cafe'}>
                            {c.client_type}
                          </span>
                        </td>
                        <td className="font-mono font-bold text-emerald-400">₹{(c.monthly_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="font-mono font-semibold text-blue-400">₹{(c.monthly_payments || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`font-mono font-bold ${(c.current_balance || 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                          ₹{(c.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-xs font-mono text-slate-300">{c.phone}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
