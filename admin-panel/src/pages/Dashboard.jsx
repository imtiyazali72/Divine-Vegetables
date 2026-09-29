import React, { useState } from 'react';

export default function Dashboard({ orders, clients, setActiveTab, onGenerateInvoice }) {
  const [invoiceLoading, setInvoiceLoading] = useState({});
  const [showUdhaarModal, setShowUdhaarModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayStr();
  const yesterdayStr = getYesterdayStr();

  // Today's Sales: Sum actual_final_total for finalized (status !== 'PENDING') orders matching today's date
  const todayOrders = orders.filter(
    o => o.status !== 'PENDING' && (o.order_date_iso === todayStr || o.delivery_date === todayStr)
  );
  const totalRevenue = todayOrders.reduce((sum, o) => sum + (o.actual_final_total || 0), 0);

  // Yesterday's Sales for Day-over-Day calculation
  const yesterdaySales = orders
    .filter(o => o.status !== 'PENDING' && (o.order_date_iso === yesterdayStr || o.delivery_date === yesterdayStr))
    .reduce((sum, o) => sum + (o.actual_final_total || 0), 0);

  let salesGrowthStr = "No prior day data";
  let salesGrowthColor = "text-slate-400";
  if (yesterdaySales > 0) {
    const diff = totalRevenue - yesterdaySales;
    const pct = (diff / yesterdaySales) * 100;
    salesGrowthStr = `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}% vs yesterday mandi sales`;
    salesGrowthColor = pct >= 0 ? "text-emerald-400" : "text-rose-400";
  } else if (totalRevenue > 0) {
    salesGrowthStr = `↑ ₹${totalRevenue.toFixed(2)} today's first sales`;
    salesGrowthColor = "text-emerald-400";
  }

  // Total Outstanding Udhaar: Sum of current_balance across all registered clients
  const totalUdhaar = clients.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const unpaidClients = clients.filter(c => (c.current_balance || 0) > 0);

  // Pending Weight Packing: Count of unweighted orders
  const pendingFulfill = orders.filter(o => o.status === 'PENDING').length;

  const handlePdfInvoice = async (orderId) => {
    setInvoiceLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await onGenerateInvoice(orderId);
      if (res && res.pdf_url) {
        window.open(`http://localhost:8000${res.pdf_url}`, '_blank');
      } else {
        alert('PDF generated successfully! Go to Invoices tab to download.');
      }
    } catch (err) {
      alert('Error generating PDF invoice. Please make sure the backend server is running!');
    } finally {
      setInvoiceLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* TODAY'S SALES CARD (CLICKABLE DRILL-DOWN) */}
        <div 
          onClick={() => setShowSalesModal(true)}
          className="glass-panel p-6 border-l-4 border-l-emerald-500 cursor-pointer hover:border-emerald-400 hover:scale-[1.02] transition-all group shadow-lg"
          title="Click to view itemized Today's Sales breakdown"
        >
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">TODAY'S SALES (ACTUAL WEIGHTED)</div>
            <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-all">🔍 Details</span>
          </div>
          <div className="text-3xl font-black text-white">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className={`text-xs font-semibold mt-2 ${salesGrowthColor}`}>{salesGrowthStr}</div>
        </div>

        {/* TOTAL OUTSTANDING UDHAAR CARD (CLICKABLE DRILL-DOWN) */}
        <div 
          onClick={() => setShowUdhaarModal(true)}
          className="glass-panel p-6 border-l-4 border-l-amber-500 cursor-pointer hover:border-amber-400 hover:scale-[1.02] transition-all group shadow-lg"
          title="Click to view itemized Unpaid Udhaar breakdown"
        >
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL OUTSTANDING UDHAAR</div>
            <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-all">🔍 Details</span>
          </div>
          <div className="text-3xl font-black text-amber-400">₹{totalUdhaar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-slate-400 mt-2">{clients.length} Registered Hotels &amp; Cafes</div>
        </div>

        {/* PENDING WEIGHT PACKING CARD */}
        <div className="glass-panel p-6 border-l-4 border-l-rose-500">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">PENDING WEIGHT PACKING</div>
          <div className="text-3xl font-black text-rose-400">{pendingFulfill} Orders</div>
          <button 
            onClick={() => setActiveTab('fulfill')}
            className="text-xs text-rose-300 underline font-semibold mt-2 block hover:text-white"
          >
            Fulfill weights now →
          </button>
        </div>

        {/* NIGHTLY ORDER WINDOW CARD */}
        <div className="glass-panel p-6 border-l-4 border-l-blue-500">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">NIGHTLY ORDER WINDOW</div>
          <div className="text-xl font-bold text-blue-400">10:00 PM – 2:30 AM</div>
          <div className="text-xs text-slate-400 mt-2">Automatic cutoff active for clients</div>
        </div>

      </div>

      {/* Itemized Hotel & Cafe Orders Feed */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              📦 Registered Hotels &amp; Cafes Itemized Orders
            </h2>
            <p className="text-xs text-slate-400">View exact vegetable &amp; fruit quantities (KG / Peti) ordered by each customer</p>
          </div>
          <button 
            onClick={() => setActiveTab('fulfill')}
            className="emerald-btn text-xs"
          >
            ⚖️ Weigh &amp; Pack Orders
          </button>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center text-slate-500 py-12 text-xs">
              No orders placed yet tonight by registered hotels or cafes.
            </div>
          ) : (
            orders.map(o => (
              <div key={o.id} className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-4">
                
                {/* Order Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-base">{o.client_name}</span>
                      <span className={o.client_type === 'HOTEL' ? 'badge badge-hotel' : 'badge badge-cafe'}>
                        {o.client_type}
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                        #{o.order_number}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Ordered Date: {o.order_date} • Requested Delivery: <b className="text-slate-200">{o.delivery_date}</b>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={o.status === 'PENDING' ? 'badge badge-pending' : 'badge badge-packed'}>
                      {o.status}
                    </span>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-bold">TOTAL BILL</div>
                      <div className="text-lg font-black text-emerald-400">₹{(o.actual_final_total || 0).toFixed(2)}</div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('fulfill')}
                      className="outline-btn text-xs py-1.5 px-3"
                    >
                      ⚖️ Weigh &amp; Pack
                    </button>
                    <button 
                      onClick={() => handlePdfInvoice(o.id)}
                      disabled={!!invoiceLoading[o.id]}
                      className="emerald-btn text-xs py-1.5 px-3"
                      style={{ opacity: invoiceLoading[o.id] ? 0.6 : 1, cursor: invoiceLoading[o.id] ? 'not-allowed' : 'pointer' }}
                    >
                      {invoiceLoading[o.id] ? '⏳ Generating...' : '📄 PDF Invoice'}
                    </button>
                  </div>
                </div>

                {/* Itemized Produce List Table */}
                <div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    🥬 Vegetables &amp; Fruits Ordered Breakdown:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {o.items?.map(item => (
                      <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-white">{item.product_name}</div>
                          <div className="text-[11px] text-slate-400">Rate: ₹{item.price_per_unit}/unit</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-400">{item.ordered_qty} {item.unit}</div>
                          {item.actual_packed_qty && item.actual_packed_qty !== item.ordered_qty && (
                            <div className="text-[10px] text-amber-400 font-semibold">Packed: {item.actual_packed_qty} {item.unit}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL 1: OUTSTANDING UDHAAR ITEMIZATION DRILL-DOWN */}
      {showUdhaarModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-2xl w-full border border-amber-500/40 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  📖 Outstanding Udhaar Itemized Breakdown
                </h3>
                <p className="text-xs text-slate-400">Total Unpaid Dues: <b className="text-amber-400">₹{totalUdhaar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></p>
              </div>
              <button onClick={() => setShowUdhaarModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <div className="space-y-3">
              {unpaidClients.length === 0 ? (
                <div className="text-center text-emerald-400 py-8 text-xs font-bold">
                  🎉 All hotels &amp; cafes are fully paid! ₹0 outstanding balance.
                </div>
              ) : (
                unpaidClients.map(c => (
                  <div key={c.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white text-sm">{c.business_name}</div>
                      <div className="text-xs text-slate-400">{c.contact_person} • {c.phone} • {c.address}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Payment Term: {c.payment_cycle}</div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-base font-black text-amber-400 font-mono">₹{c.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <button 
                        onClick={() => { setShowUdhaarModal(false); setActiveTab('ledger'); }}
                        className="emerald-btn text-[11px] py-1 px-2.5"
                      >
                        💵 Collect Payment
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TODAY'S SALES ITEMIZATION DRILL-DOWN */}
      {showSalesModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-2xl w-full border border-emerald-500/40 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  🥬 Today's Finalized Weighted Sales Breakdown
                </h3>
                <p className="text-xs text-slate-400">Date: {todayStr} • Billed Revenue: <b className="text-emerald-400">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></p>
              </div>
              <button onClick={() => setShowSalesModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <div className="space-y-3">
              {todayOrders.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-xs font-bold">
                  No weighted/fulfilled sales recorded for today yet.
                </div>
              ) : (
                todayOrders.map(o => (
                  <div key={o.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{o.client_name}</span>
                        <span className="text-xs font-mono text-emerald-400">#{o.order_number}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Status: <span className="text-emerald-300 font-bold">{o.status}</span> • Delivery Slot: {o.delivery_date}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-base font-black text-emerald-400 font-mono">₹{o.actual_final_total.toFixed(2)}</div>
                      <button 
                        onClick={() => { setShowSalesModal(false); handlePdfInvoice(o.id); }}
                        className="outline-btn text-[11px] py-1 px-2.5"
                      >
                        📄 View PDF Invoice
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
