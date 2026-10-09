import React, { useState, useEffect } from 'react';
import { API_BASE } from '../apiConfig';

export default function UdhaarLedger({ clients = [], onRecordPayment, onUpdateCreditLimit }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentRefNo, setPaymentRefNo] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Payment History Drawer State
  const [historyClient, setHistoryClient] = useState(null);
  const [clientPayments, setClientPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Monthly Statement Modal State
  const [statementClient, setStatementClient] = useState(null);
  const [statementYearMonth, setStatementYearMonth] = useState('2026-09');
  const [statementData, setStatementData] = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // WhatsApp Payment Reminders Admin Toggle State (Enable / OFF anytime)
  const [whatsappEnabled, setWhatsappEnabled] = useState(() => {
    return localStorage.getItem('divine_wa_reminders_enabled') !== 'false';
  });

  // Dynamic UPI ID for instant GPay / PhonePe / Paytm payment links
  const [upiId, setUpiId] = useState(() => {
    return localStorage.getItem('divine_upi_id') || 'divineveg@upi';
  });
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiInput, setUpiInput] = useState(upiId);

  const toggleWhatsappReminders = () => {
    const nextState = !whatsappEnabled;
    setWhatsappEnabled(nextState);
    localStorage.setItem('divine_wa_reminders_enabled', nextState ? 'true' : 'false');
  };

  const handleSaveUpiId = (e) => {
    e.preventDefault();
    if (!upiInput.trim()) return;
    const cleanUpi = upiInput.trim();
    setUpiId(cleanUpi);
    localStorage.setItem('divine_upi_id', cleanUpi);
    setShowUpiModal(false);
    alert(`✅ UPI ID updated to "${cleanUpi}"! WhatsApp payment links will now use this ID.`);
  };

  const [showAddClient, setShowAddClient] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newClientType, setNewClientType] = useState('HOTEL');
  const [newPaymentCycle, setNewPaymentCycle] = useState('WEEKLY');
  const [newCreditLimit, setNewCreditLimit] = useState('50000');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');

  const [editingCreditLimit, setEditingCreditLimit] = useState({});

  const sendWhatsAppReminder = (c) => {
    if (!whatsappEnabled) {
      alert("⚠️ WhatsApp Reminders feature is currently OFF (Disabled by Admin).\n\nYou can enable it anytime by clicking the '💬 WhatsApp Reminders: OFF' toggle button at the top!");
      return;
    }
    const cleanDigits = (c.phone || '').replace(/\D/g, '');
    const phone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const balRaw = (c.current_balance || 0);
    const bal = balRaw.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("Divine Vegetables")}&am=${balRaw}&cu=INR&tn=${encodeURIComponent("Udhaar_Payment_" + c.business_name)}`;
    
    const text = `Namaste ${c.contact_person || c.business_name}! 🙏\n\n*DIVINE VEGETABLES B2B PRODUCE SUPPLY*\n----------------------------------\nUdhaar Payment Reminder for *${c.business_name}*:\n\n💰 *Total Pending Udhaar*: ₹${bal}\n📅 *Payment Cycle*: ${c.payment_cycle || 'WEEKLY'}\n📱 *Registered Phone*: ${c.phone}\n\n👉 *Direct UPI Payment Link (Click to Pay)*:\n${upiDeepLink}\n\n📲 *UPI ID for GPay / PhonePe / Paytm / BHIM*:\n*${upiId}*\n\nKripya nikat-tam samay me payment clear karein. Payment clear karne ke baad screenshot is WhatsApp par bhej dein.\n\nDhanyawad! 🥬🍅\n*Divine Vegetables Operations Team*`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCreditLimitChange = (clientId, val) => {
    setEditingCreditLimit(prev => ({ ...prev, [clientId]: val }));
  };

  const handleCreditLimitBlur = async (c) => {
    const val = editingCreditLimit[c.id];
    if (val === undefined || val === null || val === '') return;
    const num = parseFloat(val);
    if (isNaN(num)) return;
    if (onUpdateCreditLimit) {
      await onUpdateCreditLimit(c.id, num, c.is_order_locked);
    }
  };

  const handleToggleLock = async (c) => {
    if (onUpdateCreditLimit) {
      await onUpdateCreditLimit(c.id, c.credit_limit, !c.is_order_locked);
    }
  };

  const handleOpenPayment = (client) => {
    setSelectedClient(client);
    setPaymentAmount(client.current_balance);
    setPaymentRefNo(`UTR-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentNotes('Udhaar Payment Received');
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!selectedClient || !paymentAmount) return;

    onRecordPayment(selectedClient.id, parseFloat(paymentAmount), paymentMode, paymentRefNo, paymentNotes);
    alert(`Payment of ₹${paymentAmount} recorded for ${selectedClient.business_name} (Ref: ${paymentRefNo})!`);
    setSelectedClient(null);
    setPaymentAmount('');
    setPaymentRefNo('');
    setPaymentNotes('');
  };

  // Fetch Payment History for Client
  const handleOpenHistory = async (client) => {
    setHistoryClient(client);
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/admin/payments?client_id=${client.id}`);
      const data = await res.json();
      setClientPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch Monthly Statement for Client
  const fetchMonthlyStatement = async (clientId, ym) => {
    setLoadingStatement(true);
    try {
      const res = await fetch(`${API_BASE}/admin/clients/${clientId}/statement?year_month=${ym}`);
      const data = await res.json();
      setStatementData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleOpenStatement = (client) => {
    setStatementClient(client);
    fetchMonthlyStatement(client.id, statementYearMonth);
  };

  const handleStatementMonthChange = (ym) => {
    setStatementYearMonth(ym);
    if (statementClient) {
      fetchMonthlyStatement(statementClient.id, ym);
    }
  };

  const shareStatementWhatsApp = () => {
    if (!statementData || !statementClient) return;
    const cleanDigits = (statementClient.phone || '').replace(/\D/g, '');
    const phone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const text = `Namaste *${statementClient.contact_person || statementClient.business_name}*! 🙏\n\n*DIVINE VEGETABLES - Monthly Statement (${statementYearMonth})*\n----------------------------------\nHotel: *${statementClient.business_name}*\n📦 Total Billed Sales: *₹${statementData.total_sales?.toFixed(2)}*\n💵 Total Payments Received: *₹${statementData.total_payments?.toFixed(2)}*\n💰 *Net Outstanding Due*: *₹${statementData.net_outstanding?.toFixed(2)}*\n\nThank you for partnering with Divine Vegetables! 🥬🍅`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!newBusinessName || !newPhone) {
      alert("Please enter Business Name and Phone number");
      return;
    }

    alert(`Registered new ${newClientType}: ${newBusinessName}!`);
    setShowAddClient(false);
    setNewBusinessName('');
    setNewAddress('');
    setNewPhone('');
    setNewContactPerson('');
  };

  return (
    <div className="space-y-6">
      
      {/* FEATURE CONTROL BANNER (WhatsApp Reminders & UPI QR Settings) */}
      <div className="glass-panel p-4 sm:p-5 border border-emerald-500/40 bg-gradient-to-r from-slate-900/90 via-emerald-950/40 to-slate-900/90 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
            💬
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2 flex-wrap">
              WhatsApp Udhaar Reminders &amp; Instant UPI Payment Feature
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                whatsappEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {whatsappEnabled ? '🟢 FEATURE ON' : '🔴 FEATURE OFF'}
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Admin can enable or turn off WhatsApp Udhaar Reminders anytime. Current UPI Handle: <strong className="font-mono text-emerald-400 font-extrabold">{upiId}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap w-full md:w-auto">
          <button
            type="button"
            onClick={toggleWhatsappReminders}
            className={`text-xs font-extrabold px-4 py-2 rounded-xl border transition-all flex items-center justify-center gap-2 flex-1 md:flex-initial shadow-md ${
              whatsappEnabled
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            <span>{whatsappEnabled ? '🔴 Turn OFF Feature' : '🟢 Enable Feature'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setUpiInput(upiId); setShowUpiModal(true); }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 flex-1 md:flex-initial"
          >
            <span>💳 Edit UPI ID</span>
          </button>
        </div>
      </div>

      {/* Registered Hotels & Cafes Directory */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🏬 Registered Hotels &amp; Cafes Udhaar Control ({clients.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage credit limits, lock delinquent accounts &amp; send WhatsApp reminders with UPI payment link</p>
          </div>

          <button 
            onClick={() => setShowAddClient(true)}
            className="emerald-btn text-xs py-2 px-3"
          >
            ➕ Register New Hotel / Cafe
          </button>
        </div>

        {/* MOBILE CARD VIEW (No horizontal scrolling required!) */}
        <div className="block sm:hidden space-y-4">
          {clients.map(c => {
            const limit = c.credit_limit || 50000;
            const bal = c.current_balance || 0;
            const pct = limit > 0 ? Math.min(100, (bal / limit) * 100) : 0;
            
            let barColor = 'bg-emerald-500';
            if (pct >= 100) barColor = 'bg-rose-500 animate-pulse';
            else if (pct >= 80) barColor = 'bg-amber-500';

            return (
              <div key={c.id} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-extrabold text-white text-base flex items-center gap-2">
                      {c.business_name}
                      {c.is_order_locked && (
                        <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded-md font-bold">
                          🔒 LOCKED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">{c.contact_person} • {c.phone}</div>
                  </div>
                  <span className={c.client_type === 'HOTEL' ? 'badge badge-hotel' : 'badge badge-cafe'}>
                    {c.client_type}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Udhaar</div>
                    <div className={`text-xl font-black ${bal > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Max Credit Limit</div>
                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                      <span className="text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        step="1000"
                        value={editingCreditLimit[c.id] !== undefined ? editingCreditLimit[c.id] : limit}
                        onChange={e => handleCreditLimitChange(c.id, e.target.value)}
                        onBlur={() => handleCreditLimitBlur(c)}
                        className="w-24 text-xs font-bold text-white bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400">Credit Utilization ({pct.toFixed(0)}% Used)</span>
                    <span className={pct >= 100 ? 'text-rose-400 font-bold' : 'text-slate-400'}>Limit: ₹{(limit/1000).toFixed(0)}k</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button 
                    onClick={() => handleOpenPayment(c)}
                    className="emerald-btn text-xs py-2 px-3 w-full justify-center shadow-lg"
                  >
                    💵 Collect Payment
                  </button>

                  <button 
                    onClick={() => sendWhatsAppReminder(c)}
                    className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 w-full"
                  >
                    💬 WhatsApp
                  </button>

                  <button 
                    onClick={() => handleOpenStatement(c)}
                    className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 w-full"
                  >
                    📄 Statement
                  </button>

                  <button 
                    onClick={() => handleOpenHistory(c)}
                    className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 w-full"
                  >
                    📜 History
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleLock(c)}
                  className={`w-full text-xs font-bold py-2 rounded-xl border transition-all ${
                    c.is_order_locked
                      ? 'bg-rose-950/80 border-rose-600 text-rose-300 hover:bg-rose-900 font-extrabold shadow-lg'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {c.is_order_locked ? '🔴 Locked (Click to 🔓 Unlock Account)' : '🟢 Active (Click to 🔒 Lock Account)'}
                </button>
              </div>
            );
          })}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden sm:block overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Hotel / Cafe Name</th>
                <th>Client Type</th>
                <th>Max Credit Limit (₹)</th>
                <th>Outstanding Udhaar (₹)</th>
                <th>Credit Utilization</th>
                <th>Order Lock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => {
                const limit = c.credit_limit || 50000;
                const bal = c.current_balance || 0;
                const pct = limit > 0 ? Math.min(100, (bal / limit) * 100) : 0;
                
                let barColor = 'bg-emerald-500';
                if (pct >= 100) barColor = 'bg-rose-500 animate-pulse';
                else if (pct >= 80) barColor = 'bg-amber-500';

                return (
                  <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                    <td>
                      <div className="font-bold text-white text-base flex items-center gap-2">
                        {c.business_name}
                        {c.is_order_locked && (
                          <span className="text-xs bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded-md font-bold">
                            🔒 LOCKED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{c.contact_person} • {c.phone}</div>
                    </td>
                    <td>
                      <span className={c.client_type === 'HOTEL' ? 'badge badge-hotel' : 'badge badge-cafe'}>
                        {c.client_type}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          step="1000"
                          value={editingCreditLimit[c.id] !== undefined ? editingCreditLimit[c.id] : limit}
                          onChange={e => handleCreditLimitChange(c.id, e.target.value)}
                          onBlur={() => handleCreditLimitBlur(c)}
                          className="w-28 text-xs font-bold text-white bg-slate-950 border border-slate-700 px-2 py-1 rounded-lg"
                        />
                      </div>
                    </td>
                    <td>
                      <span className={`font-black text-base ${bal > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="w-40">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400">{pct.toFixed(0)}% Used</span>
                          <span className={pct >= 100 ? 'text-rose-400' : 'text-slate-400'}>Limit: ₹{(limit/1000).toFixed(0)}k</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                          <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleLock(c)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                          c.is_order_locked
                            ? 'bg-rose-950/80 border-rose-600 text-rose-300 hover:bg-rose-900 font-extrabold shadow-lg shadow-rose-950/60'
                            : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                        }`}
                        title={c.is_order_locked ? "Click to unlock client ordering" : "Click to lock client ordering"}
                      >
                        {c.is_order_locked ? '🔴 Locked (Click to 🔓 Unlock)' : '🟢 Active (Click to 🔒 Lock)'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button 
                          onClick={() => handleOpenPayment(c)}
                          className="emerald-btn text-xs py-1.5 px-2.5"
                        >
                          💵 Collect
                        </button>

                        <button 
                          onClick={() => sendWhatsAppReminder(c)}
                          className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-xs font-bold py-1.5 px-2 rounded-xl transition-all"
                          title="Send WhatsApp Payment Reminder"
                        >
                          💬 Reminder
                        </button>

                        <button 
                          onClick={() => handleOpenStatement(c)}
                          className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-bold py-1.5 px-2 rounded-xl transition-all"
                          title="View Monthly Hotel Statement"
                        >
                          📄 Statement
                        </button>

                        <button 
                          onClick={() => handleOpenHistory(c)}
                          className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-bold py-1.5 px-2 rounded-xl transition-all"
                          title="View Payment Collection History"
                        >
                          📜 History
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-lg w-full border border-emerald-500/40 space-y-4">
            <h3 className="text-lg font-bold text-white">Register New Hotel or Cafe</h3>
            <p className="text-xs text-slate-400">Add a new customer to Divine Vegetables supply list</p>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Hotel / Cafe Business Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Royal Orchid Hotel"
                  value={newBusinessName}
                  onChange={e => setNewBusinessName(e.target.value)}
                  className="w-full text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Customer Category</label>
                  <select 
                    value={newClientType}
                    onChange={e => setNewClientType(e.target.value)}
                    className="w-full text-xs"
                  >
                    <option value="HOTEL">HOTEL</option>
                    <option value="CAFE">CAFE</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Payment Term Cycle</label>
                  <select 
                    value={newPaymentCycle}
                    onChange={e => setNewPaymentCycle(e.target.value)}
                    className="w-full text-xs"
                  >
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Contact Person</label>
                  <input 
                    type="text"
                    placeholder="e.g. Manager / Head Chef"
                    value={newContactPerson}
                    onChange={e => setNewContactPerson(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number</label>
                  <input 
                    type="text"
                    placeholder="+91 98000 00000"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Delivery Address</label>
                <input 
                  type="text"
                  placeholder="Full Address for morning delivery"
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className="outline-btn flex-1 justify-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="emerald-btn flex-1 justify-center"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-md w-full border border-emerald-500/40 space-y-4">
            <h3 className="text-lg font-bold text-white mb-1">Record Udhaar Collection</h3>
            <p className="text-xs text-slate-400 mb-2">
              Client: <span className="text-emerald-400 font-bold">{selectedClient.business_name}</span>
            </p>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Amount Paid (₹)</label>
                <input 
                  type="number"
                  step="1"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full text-lg font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Payment Method</label>
                <select 
                  value={paymentMode} 
                  onChange={e => setPaymentMode(e.target.value)}
                  className="w-full text-xs font-bold"
                >
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash Collection</option>
                  <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Payment Reference / UTR Number</label>
                <input 
                  type="text"
                  placeholder="e.g. UTR-9823412093 or Cheque #00124"
                  value={paymentRefNo}
                  onChange={e => setPaymentRefNo(e.target.value)}
                  className="w-full text-xs font-mono text-white bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Payment Notes / Remark</label>
                <input 
                  type="text"
                  placeholder="e.g. Cleared 1st week September invoice"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full text-xs font-medium text-white bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="outline-btn flex-1 justify-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="emerald-btn flex-1 justify-center"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Monthly Hotel Statement Modal */}
      {statementClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-2xl w-full border border-blue-500/40 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  📄 Monthly Hotel Statement
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hotel: <span className="text-blue-400 font-bold">{statementClient.business_name}</span> ({statementClient.contact_person})
                </p>
              </div>
              <button 
                onClick={() => setStatementClient(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Filter by Month & Year */}
            <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Select Month:</span>
                <input 
                  type="month"
                  value={statementYearMonth}
                  onChange={e => handleStatementMonthChange(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={shareStatementWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                >
                  💬 Share on WhatsApp
                </button>
              </div>
            </div>

            {loadingStatement ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading statement lines...</div>
            ) : statementData ? (
              <div className="space-y-4">
                {/* Statement Line Items Table */}
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                        <th className="p-2.5 text-left">Date</th>
                        <th className="p-2.5 text-left">Description</th>
                        <th className="p-2.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {statementData.line_items?.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="p-4 text-center text-slate-500">No transactions recorded for {statementYearMonth}</td>
                        </tr>
                      ) : (
                        statementData.line_items?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-mono text-slate-400">{item.date_formatted}</td>
                            <td className="p-2.5 font-medium text-white">{item.description}</td>
                            <td className={`p-2.5 text-right font-bold font-mono ${item.type === 'SALE' ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {item.type === 'SALE' ? `+₹${item.amount.toFixed(2)}` : `-₹${Math.abs(item.amount).toFixed(2)}`}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Statement Totals Summary Box */}
                <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Total Sales</div>
                    <div className="text-sm font-black text-amber-400 font-mono">₹{(statementData.total_sales || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Total Payments</div>
                    <div className="text-sm font-black text-emerald-400 font-mono">₹{(statementData.total_payments || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Net Outstanding</div>
                    <div className="text-sm font-black text-white font-mono">₹{(statementData.net_outstanding || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button 
                type="button"
                onClick={() => setStatementClient(null)}
                className="outline-btn text-xs px-4"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {historyClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-xl w-full border border-purple-500/40 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  📜 Payment Collection History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client: <span className="text-purple-300 font-bold">{historyClient.business_name}</span>
                </p>
              </div>
              <button 
                onClick={() => setHistoryClient(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading payment records...</div>
            ) : clientPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No payment history recorded for this client yet.</div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                      <th className="p-2.5 text-left">Date &amp; Time</th>
                      <th className="p-2.5 text-left">Method</th>
                      <th className="p-2.5 text-left">Ref / UTR</th>
                      <th className="p-2.5 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {clientPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-900/40">
                        <td className="p-2.5 font-mono text-slate-400">{p.payment_date_formatted}</td>
                        <td className="p-2.5 font-bold text-emerald-400">{p.payment_mode}</td>
                        <td className="p-2.5 font-mono text-slate-300">{p.reference_no}</td>
                        <td className="p-2.5 text-right font-black font-mono text-emerald-400">₹{p.amount_paid?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button 
                type="button"
                onClick={() => setHistoryClient(null)}
                className="outline-btn text-xs px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure UPI ID Settings Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-md w-full border border-emerald-500/40 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                💳 Configure B2B Payment UPI ID
              </h3>
              <button 
                onClick={() => setShowUpiModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-slate-300">
              This UPI ID will be included in the instant WhatsApp payment reminder link sent to Hotel &amp; Cafe owners.
            </p>

            <form onSubmit={handleSaveUpiId} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  UPI VPA Handle (e.g. GPay / PhonePe / Paytm)
                </label>
                <input 
                  type="text"
                  placeholder="e.g. divineveg@upi or 9800000000@paytm"
                  value={upiInput}
                  onChange={e => setUpiInput(e.target.value)}
                  className="w-full text-sm font-bold font-mono text-emerald-400 bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl"
                />
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Preview Payment Link Format:</div>
                <div className="text-[11px] font-mono text-slate-300 truncate">
                  upi://pay?pa=<span className="text-emerald-400 font-bold">{upiInput || 'divineveg@upi'}</span>&amp;pn=DivineVegetables
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowUpiModal(false)}
                  className="outline-btn flex-1 justify-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="emerald-btn flex-1 justify-center"
                >
                  Save UPI ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
