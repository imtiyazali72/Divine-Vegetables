import React, { useState } from 'react';
import { API_BASE } from '../apiConfig';

export default function Navbar({ activeTab, setActiveTab, viewMode, setViewMode, cutoffInfo, onChangePassword }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      alert("New password and confirm password do not match!");
      return;
    }
    if (!newPass) {
      alert("Please enter a new password");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("✅ Owner Admin Password changed successfully!");
        setShowPasswordModal(false);
        setOldPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        alert(data.detail || "Failed to change password");
      }
    } catch (err) {
      alert("Error changing password");
    }
  };

  // CLIENT MODE: Clean layout without admin toggles
  if (viewMode === 'client') {
    return (
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 mb-8 border-b border-emerald-900/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-900/40 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-2xl">
                🥬
              </div>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                DIVINE VEGETABLES
              </h1>
              <p className="text-xs text-slate-400 font-medium">B2B Wholesale Produce Supplier • Mandi Direct</p>
            </div>
          </div>

        </div>
      </header>
    );
  }

  // OWNER ADMIN MODE
  return (
    <header className="glass-panel sticky top-0 z-50 px-6 py-4 mb-8 border-b border-emerald-900/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Divine Vegetables Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-900/40 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-2xl">
              🥬
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                DIVINE VEGETABLES
              </h1>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                OWNER ADMIN (admin)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">B2B Wholesale Produce Supplier • Mandi Hub</p>
          </div>
        </div>

        {/* View Switcher & Password Settings */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => { setViewMode('owner'); setActiveTab('dashboard'); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'owner'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👑 Admin View
            </button>
            <button
              onClick={() => { setViewMode('client'); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'client'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏨 Preview Portal
            </button>
          </div>

          <button 
            onClick={() => setShowPasswordModal(true)}
            className="outline-btn text-xs text-amber-400 border-amber-500/40 py-1.5 px-3"
            title="Change Admin Password"
          >
            🔑 Change Password
          </button>
        </div>

        {/* Navigation Tabs (Owner View Only) */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'rates', label: '💰 Rates' },
            { id: 'fulfill', label: '⚖️ Weighing' },
            { id: 'invoices', label: '📄 PDF Invoices' },
            { id: 'ledger', label: '📖 Udhaar' },
            { id: 'routes', label: '🚚 Routes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

      </div>

      {/* CHANGE ADMIN PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-md w-full border border-amber-500/40 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                🔑 Change Owner Admin Password
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400">Fixed Admin Username: <b className="text-emerald-400">admin</b></p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Current Admin Password</label>
                <input 
                  type="password"
                  value={oldPass}
                  onChange={e => setOldPass(e.target.value)}
                  placeholder="Enter current password (Default: 1234)"
                  className="w-full text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">New Admin Password</label>
                <input 
                  type="password"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full text-xs text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Confirm New Password</label>
                <input 
                  type="password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full text-xs text-white font-bold"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
                  className="outline-btn flex-1 justify-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="emerald-btn flex-1 justify-center"
                >
                  💾 Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
