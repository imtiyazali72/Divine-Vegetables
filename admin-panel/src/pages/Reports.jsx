import React, { useState, useEffect } from 'react';
import { smartFetch, API_BASE } from '../apiConfig';

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [reportData, setReportData] = useState(null);
  const [profitLossData, setProfitLossData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  // Add Expense Modal State
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expCategory, setExpCategory] = useState('Delivery');
  const [expAmount, setExpAmount] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expSubmitting, setExpSubmitting] = useState(false);

  const fetchAllReports = async (monthStr) => {
    setLoading(true);
    try {
      const [repRes, plRes, expRes, anaRes] = await Promise.all([
        smartFetch(`/admin/reports/monthly?year_month=${monthStr}`),
        fetch(`${API_BASE}/admin/reports/profit-loss?year_month=${monthStr}`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/admin/expenses?year_month=${monthStr}`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/admin/analytics/dashboard-insights`).then(r => r.json()).catch(() => null)
      ]);

      if (repRes.ok) {
        const data = await repRes.json();
        setReportData(data);
      }
      if (plRes) setProfitLossData(plRes);
      if (expRes) setExpenseData(expRes);
      if (anaRes) setAnalyticsData(anaRes);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReports(selectedMonth);
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

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expAmount || parseFloat(expAmount) <= 0) {
      alert("Please enter a valid expense amount");
      return;
    }
    setExpSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expCategory,
          amount: parseFloat(expAmount),
          description: expDescription,
          expense_date: expDate
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Expense of ₹${expAmount} under '${expCategory}' recorded!`);
        setShowAddExpense(false);
        setExpAmount('');
        setExpDescription('');
        fetchAllReports(selectedMonth);
      } else {
        alert(data.detail || "Error recording expense");
      }
    } catch (err) {
      alert("Error saving expense record");
    } finally {
      setExpSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await fetch(`${API_BASE}/admin/expenses/${expenseId}`, { method: 'DELETE' });
      fetchAllReports(selectedMonth);
    } catch (e) {
      alert("Error deleting expense");
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
  const expensesList = Array.isArray(expenseData?.expenses) ? expenseData.expenses : [];

  return (
    <div className="space-y-8">
      
      {/* Header & Month Selector */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">BUSINESS INTELLIGENCE</div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            📈 P&amp;L, Expenses &amp; Business Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real Profit &amp; Loss audit, Operating Expense Manager, and DB-driven analytics
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

          <button 
            onClick={() => setShowAddExpense(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            ➕ Record Expense
          </button>

          {/* PDF Export Button */}
          <button 
            onClick={handleExportPdf}
            disabled={pdfExporting}
            className="emerald-btn text-xs py-2.5 px-4 shadow-lg shadow-emerald-950/50 justify-center w-full sm:w-auto"
          >
            {pdfExporting ? '⏳ Exporting...' : '📄 Export PDF Report'}
          </button>
        </div>
      </div>

      {loading || !reportData ? (
        <div className="glass-panel p-12 text-center text-slate-400 text-xs font-bold space-y-2">
          <div className="animate-spin text-xl w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          <div>Loading monthly audit &amp; financial data...</div>
        </div>
      ) : (
        <>
          {/* 1. PROFIT & LOSS FINANCIAL DASHBOARD */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              💵 Profit &amp; Loss Audit Statement ({selectedMonth})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gross Billed Revenue</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  ₹{(profitLossData?.revenue || reportData.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Delivered order total</div>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cost of Goods (COGS)</div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  ₹{(profitLossData?.cogs || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Mandi purchase cost</div>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gross Profit</div>
                <div className="text-2xl font-black text-blue-400 font-mono">
                  ₹{(profitLossData?.gross_profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Revenue - COGS</div>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operating Expenses</div>
                <div className="text-2xl font-black text-rose-400 font-mono">
                  ₹{(profitLossData?.total_expenses || expenseData?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Fuel, Salaries, Delivery</div>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 p-4 rounded-2xl border border-emerald-500/40">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">NET PROFIT</div>
                <div className="text-2xl font-black text-white font-mono">
                  ₹{(profitLossData?.net_profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-emerald-300 font-bold mt-1">
                  Margin: {profitLossData?.profit_margin_pct || 0}%
                </div>
              </div>
            </div>
          </div>

          {/* 2. ADVANCED REAL DB ANALYTICS (TOP PRODUCTS & HOTELS) */}
          {analyticsData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Best-Selling Vegetables */}
              <div className="glass-panel p-6 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  🥦 Best-Selling Produce Items (Real Database Volume)
                </h4>
                <div className="space-y-2">
                  {analyticsData.top_products?.length === 0 ? (
                    <div className="text-xs text-slate-500 py-4">No order items recorded yet</div>
                  ) : (
                    analyticsData.top_products?.map((p, i) => (
                      <div key={i} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400 w-5">#{i+1}</span>
                          <span className="text-xs font-extrabold text-white">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-white">{p.total_volume} {p.unit}</div>
                          <div className="text-[10px] font-mono text-emerald-400 font-bold">₹{p.total_revenue?.toFixed(2)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Revenue Hotels */}
              <div className="glass-panel p-6 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  🏨 Top Revenue Hotels &amp; Cafes
                </h4>
                <div className="space-y-2">
                  {analyticsData.top_hotels?.length === 0 ? (
                    <div className="text-xs text-slate-500 py-4">No customer sales recorded yet</div>
                  ) : (
                    analyticsData.top_hotels?.map((h, i) => (
                      <div key={i} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-400 w-5">#{i+1}</span>
                          <div>
                            <div className="text-xs font-extrabold text-white">{h.business_name}</div>
                            <span className={h.client_type === 'HOTEL' ? 'badge badge-hotel text-[9px]' : 'badge badge-cafe text-[9px]'}>{h.client_type}</span>
                          </div>
                        </div>
                        <div className="text-xs font-mono font-black text-amber-400">
                          ₹{h.total_spent?.toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. OPERATING EXPENSE MANAGER */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  📋 Operating Expenses Ledger ({selectedMonth})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Track delivery, transport, salaries, fuel &amp; maintenance costs</p>
              </div>

              <button 
                onClick={() => setShowAddExpense(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md"
              >
                ➕ Add New Expense
              </button>
            </div>

            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description / Notes</th>
                    <th>Amount (₹)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-slate-500 py-6 text-xs font-semibold">
                        No expense entries recorded for {selectedMonth}. Click "+ Add New Expense" to log operating costs.
                      </td>
                    </tr>
                  ) : (
                    expensesList.map(exp => (
                      <tr key={exp.id}>
                        <td className="font-mono text-xs text-slate-400">{exp.expense_date_formatted}</td>
                        <td>
                          <span className="bg-rose-950 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-md text-xs font-bold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="text-xs font-medium text-white">{exp.description || '—'}</td>
                        <td className="font-mono font-bold text-rose-400 text-sm">₹{exp.amount.toFixed(2)}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="text-xs text-rose-400 hover:text-rose-200 font-bold"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. ITEMIZED CUSTOMER BREAKDOWN TABLE */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  🏬 Customer Monthly Performance Breakdown
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

      {/* RECORD EXPENSE MODAL */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-md w-full border border-rose-500/40 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                ➕ Record Operating Expense
              </h3>
              <button 
                onClick={() => setShowAddExpense(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Expense Category</label>
                <select 
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value)}
                  className="w-full text-xs font-bold"
                >
                  <option value="Delivery">Delivery &amp; Logistics</option>
                  <option value="Transport">Mandi Freight / Transport</option>
                  <option value="Salary">Labor &amp; Staff Salary</option>
                  <option value="Fuel">Vehicle Fuel &amp; Diesel</option>
                  <option value="Maintenance">Vehicle &amp; Godown Maintenance</option>
                  <option value="Other">Other Operating Expense</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Amount Spent (₹)</label>
                <input 
                  type="number"
                  step="1"
                  placeholder="e.g. 1500"
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  className="w-full text-lg font-bold text-rose-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Expense Date</label>
                <input 
                  type="date"
                  value={expDate}
                  onChange={e => setExpDate(e.target.value)}
                  className="w-full text-xs font-bold text-white bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description / Notes</label>
                <input 
                  type="text"
                  placeholder="e.g. Van 02 Diesel Fill at IndianOil"
                  value={expDescription}
                  onChange={e => setExpDescription(e.target.value)}
                  className="w-full text-xs text-white bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="outline-btn flex-1 justify-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={expSubmitting}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex-1 justify-center shadow-lg"
                >
                  {expSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
