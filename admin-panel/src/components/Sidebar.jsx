import React, { useState } from 'react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  viewMode, 
  setViewMode, 
  cutoffInfo, 
  onChangePasswordClick, 
  onBackupClick,
  soundMode = 'continuous', 
  onSetSoundMode, 
  onTestSound 
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);

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

  const getSoundModeLabel = () => {
    if (soundMode === 'continuous') return '🔁 Loop Ring';
    if (soundMode === 'once') return '🔔 1-Time 4s';
    return '🔕 Muted';
  };

  const cycleSoundMode = () => {
    if (!onSetSoundMode) return;
    if (soundMode === 'continuous') onSetSoundMode('once');
    else if (soundMode === 'once') onSetSoundMode('muted');
    else onSetSoundMode('continuous');
  };

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

          {/* Hairline Divider & Sound Alert Controls */}
          <div className="border-t border-white/10 pt-4 space-y-2.5">
            <div className="text-[10px] font-bold text-slate-400/80 uppercase tracking-widest px-3 mb-1">Sound Alert Settings</div>
            
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center px-1">
                <span>🔊 Order Ringing</span>
                <button 
                  onClick={() => onTestSound && onTestSound(true)}
                  className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg hover:bg-amber-500/20 active:scale-95 font-bold"
                  title="Test Order Alert Sound"
                >
                  Test 🔊
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                <button
                  onClick={() => onSetSoundMode && onSetSoundMode('continuous')}
                  className={`py-2 px-1 rounded-xl text-center border transition-all ${
                    soundMode === 'continuous'
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.3)] font-extrabold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Loop ring continuously every 1.8s until owner views order"
                >
                  🔁 Loop
                </button>
                
                <button
                  onClick={() => onSetSoundMode && onSetSoundMode('once')}
                  className={`py-2 px-1 rounded-xl text-center border transition-all ${
                    soundMode === 'once'
                      ? 'bg-blue-500/25 text-blue-300 border-blue-400/60 shadow-[0_0_10px_rgba(59,130,246,0.3)] font-extrabold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Play 4-second long chime once"
                >
                  🔔 1-Time
                </button>

                <button
                  onClick={() => onSetSoundMode && onSetSoundMode('muted')}
                  className={`py-2 px-1 rounded-xl text-center border transition-all ${
                    soundMode === 'muted'
                      ? 'bg-rose-500/25 text-rose-300 border-rose-400/60 shadow-[0_0_10px_rgba(244,63,94,0.3)] font-extrabold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Mute sound alerts"
                >
                  🔕 Mute
                </button>
              </div>

              <button
                onClick={() => setShowSoundModal(true)}
                className="w-full text-center text-[10px] text-emerald-400 hover:underline pt-1 font-bold block"
              >
                ⚙️ Sound Info &amp; Details →
              </button>
            </div>

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
              onClick={onBackupClick}
              className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-bold text-teal-400 hover:text-teal-300 hover:bg-white/[0.07] hover:backdrop-blur-md rounded-2xl transition-all duration-200 text-left border border-transparent"
            >
              <span>💾</span>
              <span>Backup &amp; Restore</span>
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
      <div className="md:hidden glass-panel sticky top-0 z-40 px-3 py-2 border-b border-white/10 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => setMobileDrawerOpen(true)}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-base text-white transition-all active:scale-95 shrink-0"
          >
            ☰
          </button>
          <span className="font-black text-white text-xs tracking-tight truncate">DIVINE VEGETABLES</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => setShowSoundModal(true)} 
            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
              soundMode === 'continuous'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                : soundMode === 'once'
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Click to open Sound Settings"
          >
            <span>🔊 Sound</span>
            <span className="text-[9px] font-mono">({soundMode === 'continuous' ? 'Loop' : soundMode === 'once' ? '1-Time' : 'Muted'})</span>
          </button>
          <button 
            onClick={() => onTestSound && onTestSound(true)} 
            className="text-[10px] font-bold px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg active:scale-95"
            title="Test Loud Order Ring Chime"
          >
            🔊 Ring Test
          </button>
        </div>
      </div>

      {/* MOBILE SLIDE-OVER DRAWER (LIQUID GLASS) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl z-50 flex md:hidden animate-fade-in">
          <div className="w-80 bg-slate-950/95 border-r border-white/10 h-full p-5 space-y-5 flex flex-col justify-between shadow-2xl backdrop-blur-2xl overflow-y-auto">
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥬</span>
                  <span className="font-black text-white text-sm tracking-tight">DIVINE VEGETABLES</span>
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
              </div>

              <nav className="space-y-1">
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

              {/* Sound Mode Menu Feature Button inside Drawer */}
              <div className="border-t border-white/10 pt-3 space-y-1.5">
                <button
                  onClick={() => { setShowSoundModal(true); setMobileDrawerOpen(false); }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <span>🔊</span>
                    <span>Sound Alert Settings</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-mono uppercase">
                    {soundMode === 'continuous' ? 'Loop' : soundMode === 'once' ? '1-Time' : 'Muted'}
                  </span>
                </button>

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

      {/* SOUND ALERT SETTINGS MODAL */}
      {showSoundModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-5 sm:p-6 max-w-md w-full border border-emerald-500/50 space-y-5 shadow-2xl bg-slate-950/95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                🔊 Order Sound Alert Settings
              </h3>
              <button onClick={() => setShowSoundModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Jab bhi Naya B2B Order aaye, to sound ring kis tarah se bajna chahiye? Apni pasand ki setting select karein:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => { if (onSetSoundMode) onSetSoundMode('continuous'); }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  soundMode === 'continuous'
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-2xl mt-0.5">🔁</span>
                <div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    Continuous Loop Ringing (1-2 Sec Gap)
                    {soundMode === 'continuous' && <span className="bg-emerald-500 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black">ACTIVE</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Order aane par alarm ring har 1.8 seconds me bajti rahegi jab tak aap order View/Dismiss na kar dein.
                  </p>
                </div>
              </button>

              <button
                onClick={() => { if (onSetSoundMode) onSetSoundMode('once'); }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  soundMode === 'once'
                    ? 'bg-blue-500/20 border-blue-400/60 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-2xl mt-0.5">🔔</span>
                <div>
                  <div className="text-xs font-bold text-blue-300 flex items-center gap-2">
                    One-Time Long Ring (4 Seconds)
                    {soundMode === 'once' && <span className="bg-blue-500 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black">ACTIVE</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Order aane par sirf 1 baar 4-second tak long chime alert ring bajega.
                  </p>
                </div>
              </button>

              <button
                onClick={() => { if (onSetSoundMode) onSetSoundMode('muted'); }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  soundMode === 'muted'
                    ? 'bg-rose-500/20 border-rose-400/60 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-2xl mt-0.5">🔕</span>
                <div>
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-2">
                    Muted / Silent Mode
                    {soundMode === 'muted' && <span className="bg-rose-500 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black">ACTIVE</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Order sound ring bilkul off / mute rahega.
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={() => onTestSound && onTestSound(true)}
                className="px-3.5 py-2 text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl hover:bg-amber-500/30 active:scale-95 flex items-center gap-1.5"
              >
                <span>🔊 Test Ring Sound</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSoundModal(false)}
                className="emerald-btn text-xs py-2 px-4"
              >
                Save &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

