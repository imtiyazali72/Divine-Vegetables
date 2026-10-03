import React, { useState } from 'react';

export default function Sidebar({ activeTab, setActiveTab, viewMode, setViewMode, cutoffInfo, onChangePasswordClick, soundEnabled, onToggleSound }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'rates', label: 'Daily Rates', icon: '💰' },
    { id: 'analytics', label: 'Price Analytics', icon: '📈' },
    { id: 'procurement', label: 'Mandi Sheet', icon: '🛒' },
    { id: 'fulfill', label: 'Weighing & Pack', icon: '⚖️' },
    { id: 'invoices', label: 'PDF Invoices', icon: '📄' },
    { id: 'ledger', label: 'Udhaar Ledger', icon: '📖' },
    { id: 'routes', label: 'Live Routes', icon: '🚚' },
    { id: 'reports', label: 'Monthly Reports', icon: '📑' },
  ];

  return (
    <>
      {/* DESKTOP STICKY LEFT VERTICAL SIDEBAR (REAL iOS LIQUID GLASS + NO SCROLLBAR) */}
      <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 h-screen sidebar-real-glass no-scrollbar z-50 p-5 justify-between overflow-y-auto">
        <div className="space-y-6">
          
          {/* Brand & Logo Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-300 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] shrink-0">
              <div className="w-full h-full bg-slate-950/70 rounded-[14px] flex items-center justify-center text-xl backdrop-blur-md">
                🥬
              </div>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white leading-tight">
                DIVINE VEGETABLES
              </h1>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold tracking-wide shadow-[0_0_10px_rgba(16,185,129,0.2)] inline-block mt-0.5">
                OWNER ADMIN
              </span>
            </div>
          </div>

          {/* Navigation Links (iPhone Glass Active & Hover Pills) */}
          <nav className="space-y-1.5 pt-2">
            <div className="text-[10px] font-bold text-slate-400/80 uppercase tracking-widest px-3 mb-2">Main Menu</div>
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); if (viewMode !== 'owner') setViewMode('owner'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold transition-all duration-200 text-left ${
                    isActive 
                      ? 'nav-pill-active-ios' 
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.07] hover:backdrop-blur-md rounded-2xl border border-transparent'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Hairline Divider & Utility Actions */}
          <div className="border-t border-white/10 pt-4 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400/80 uppercase tracking-widest px-3 mb-1">Portals &amp; Sound</div>
            
            {onToggleSound && (
              <button
                onClick={onToggleSound}
                className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-bold rounded-2xl transition-all duration-200 text-left border ${
                  soundEnabled 
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                    : 'text-slate-400 bg-slate-800/40 border-slate-700/50'
                }`}
              >
                <span>{soundEnabled ? '🔔' : '🔕'}</span>
                <span>{soundEnabled ? 'Order Sound: ON' : 'Order Sound: MUTED'}</span>
              </button>
            )}

            <button
              onClick={() => setViewMode('client')}
              className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-bold text-blue-400 hover:text-blue-300 hover:bg-white/[0.07] hover:backdrop-blur-md rounded-2xl transition-all duration-200 text-left border border-transparent"
            >
              <span>🏨</span>
              <span>Client Portal View</span>
            </button>

            <button
              onClick={onChangePasswordClick}
              className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-white/[0.07] hover:backdrop-blur-md rounded-2xl transition-all duration-200 text-left border border-transparent"
            >
              <span>🔑</span>
              <span>Change Admin PIN</span>
            </button>

            <button
              onClick={() => setViewMode('logout-admin')}
              className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-white/[0.07] hover:backdrop-blur-md rounded-2xl transition-all duration-200 text-left border border-transparent"
            >
              <span>🚪</span>
              <span>Logout Admin Session</span>
            </button>
          </div>

        </div>

        {/* Bottom Status Tag (Liquid Glass Container) */}
        <div className="bg-white/5 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 text-[11px] shadow-inner space-y-1">
          <div className="text-slate-400 font-bold flex justify-between items-center">
            <span>Mandi Operating Status</span>
            <span className="text-[9px] bg-slate-800/60 border border-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">24/7</span>
          </div>
          <div className="text-emerald-400 font-bold flex items-center gap-2 pt-0.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Nightly Cutoff Window Active</span>
          </div>
        </div>

      </aside>

      {/* MOBILE TOP BAR WITH HAMBURGER DRAWER */}
      <div className="md:hidden glass-panel sticky top-0 z-40 px-4 py-3 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setMobileDrawerOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-lg text-white transition-all active:scale-95"
          >
            ☰
          </button>
          <span className="font-black text-white text-sm tracking-tight">DIVINE VEGETABLES</span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleSound && (
            <button 
              onClick={onToggleSound} 
              className="text-xs px-2 py-1 bg-slate-800 text-emerald-400 border border-emerald-500/40 rounded-lg"
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>
          )}
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold">
            ADMIN
          </span>
        </div>
      </div>

      {/* MOBILE SLIDE-OVER DRAWER (LIQUID GLASS) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl z-50 flex md:hidden animate-fade-in">
          <div className="w-72 bg-slate-950/90 border-r border-white/10 h-full p-5 space-y-6 flex flex-col justify-between shadow-2xl backdrop-blur-2xl">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥬</span>
                  <span className="font-black text-white text-sm tracking-tight">DIVINE VEGETABLES</span>
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setViewMode('owner'); setMobileDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-left transition-all ${
                      activeTab === item.id 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="border-t border-white/10 pt-3 space-y-1.5">
                {onToggleSound && (
                  <button
                    onClick={() => { onToggleSound(); setMobileDrawerOpen(false); }}
                    className="w-full flex items-center gap-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/15 py-2 px-3 rounded-2xl text-left"
                  >
                    <span>{soundEnabled ? '🔔' : '🔕'}</span>
                    <span>{soundEnabled ? 'Order Sound: ON' : 'Order Sound: MUTED'}</span>
                  </button>
                )}
                <button
                  onClick={() => { setViewMode('client'); setMobileDrawerOpen(false); }}
                  className="w-full flex items-center gap-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/15 py-2 px-3 rounded-2xl text-left"
                >
                  <span>🏨</span>
                  <span>Preview Client Portal</span>
                </button>
                <button
                  onClick={() => { onChangePasswordClick(); setMobileDrawerOpen(false); }}
                  className="w-full flex items-center gap-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/15 py-2 px-3 rounded-2xl text-left"
                >
                  <span>🔑</span>
                  <span>Change Admin PIN</span>
                </button>
                <button
                  onClick={() => { setViewMode('logout-admin'); setMobileDrawerOpen(false); }}
                  className="w-full flex items-center gap-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/15 py-2 px-3 rounded-2xl text-left"
                >
                  <span>🚪</span>
                  <span>Logout Admin Session</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)}></div>
        </div>
      )}
    </>
  );
}

