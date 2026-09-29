import React from 'react';

export default function MobileBottomNav({ activeTab, setActiveTab, viewMode, setViewMode, activeSubTab, setActiveSubTab }) {
  if (viewMode === 'client') {
    return (
      <div className="fixed bottom-3 left-4 right-4 z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="bg-slate-900/80 backdrop-blur-xl p-2 rounded-2xl border border-emerald-500/30 shadow-2xl shadow-emerald-950/60 flex items-center justify-around">
          
          <button
            onClick={() => setActiveSubTab && setActiveSubTab('catalog')}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'catalog'
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base">🥬</span>
            <span className="text-[10px] font-bold">Order Produce</span>
          </button>

          <button
            onClick={() => setActiveSubTab && setActiveSubTab('my-orders')}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'my-orders'
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base">🚚</span>
            <span className="text-[10px] font-bold">Deliveries</span>
          </button>

        </div>
      </div>
    );
  }

  // ADMIN MODE MOBILE LIQUID DOCK
  return (
    <div className="fixed bottom-3 left-4 right-4 z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="bg-slate-900/80 backdrop-blur-xl p-1.5 rounded-2xl border border-emerald-500/30 shadow-2xl shadow-emerald-950/60 flex items-center justify-around">
        
        {[
          { id: 'dashboard', icon: '📊', label: 'Dashboard' },
          { id: 'fulfill', icon: '⚖️', label: 'Weighing' },
          { id: 'ledger', icon: '📖', label: 'Udhaar' },
          { id: 'routes', icon: '🚚', label: 'Routes' },
          { id: 'reports', icon: '📈', label: 'Reports' },
        ].map(nav => (
          <button
            key={nav.id}
            onClick={() => setActiveTab(nav.id)}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all ${
              activeTab === nav.id
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/50 scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base">{nav.icon}</span>
            <span className="text-[9px] font-bold">{nav.label}</span>
          </button>
        ))}

      </div>
    </div>
  );
}
