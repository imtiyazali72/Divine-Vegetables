import React, { useState } from 'react';

export default function UdhaarLedger({ clients = [], onRecordPayment, onUpdateCreditLimit }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');

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
    const cleanDigits = (c.phone || '').replace(/\D/g, '');
    const phone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const bal = (c.current_balance || 0).toFixed(2);
    const text = `Namaste ${c.business_name}! 🙏\n\nDivine Vegetables reminder: Aapka ₹${bal} ka payment pending hai. Kripya nikat-tam samay me payment clear karein.\n\nDhanyawad! Divine Vegetables.`;
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
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!selectedClient || !paymentAmount) return;

    onRecordPayment(selectedClient.id, parseFloat(paymentAmount), paymentMode);
    alert(`Payment of ₹${paymentAmount} recorded for ${selectedClient.business_name}!`);
    setSelectedClient(null);
    setPaymentAmount('');
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
    <div className="space-y-8">
      
      {/* Registered Hotels & Cafes Directory */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🏬 Registered Hotels &amp; Cafes Udhaar Control ({clients.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage credit limits, lock delinquent accounts &amp; send WhatsApp reminders</p>
          </div>

          <button 
            onClick={() => setShowAddClient(true)}
            className="emerald-btn text-xs"
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
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleLock(c)}
                  className={`w-full text-xs font-bold py-1.5 rounded-xl border transition-all ${
                    c.is_order_locked
                      ? 'bg-rose-950/80 border-rose-600 text-rose-300 hover:bg-rose-900'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {c.is_order_locked ? '🔒 Unlock Client Ordering' : '🟢 Lock Client Ordering'}
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
                            ? 'bg-rose-950/80 border-rose-600 text-rose-300 hover:bg-rose-900'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {c.is_order_locked ? '🔒 Order Locked' : '🟢 Active'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenPayment(c)}
                          className="emerald-btn text-xs py-1.5 px-3"
                        >
                          💵 Collect
                        </button>

                        <button 
                          onClick={() => sendWhatsAppReminder(c)}
                          className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-xs font-bold py-1.5 px-2.5 rounded-xl transition-all flex items-center gap-1"
                          title="Send WhatsApp Payment Reminder"
                        >
                          💬 Reminder
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
          <div className="glass-panel p-6 max-w-md w-full border border-emerald-500/40">
            <h3 className="text-lg font-bold text-white mb-1">Record Udhaar Collection</h3>
            <p className="text-xs text-slate-400 mb-4">
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
                <label className="text-xs font-bold text-slate-300 block mb-1">Payment Mode</label>
                <select 
                  value={paymentMode} 
                  onChange={e => setPaymentMode(e.target.value)}
                  className="w-full"
                >
                  <option value="UPI">UPI (GooglePay / PhonePe)</option>
                  <option value="CASH">Cash Collection</option>
                  <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
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

    </div>
  );
}
