import React, { useState, useEffect } from 'react';
import { API_BASE } from '../apiConfig';

export default function PriceAnalytics({ products = [], onUpdateRate }) {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPriceTrends = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/admin/analytics/price-trends`);
      const data = await res.json();
      if (data && data.products) {
        setTrends(data.products);
      }
    } catch (err) {
      console.error("Failed to fetch price trends:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceTrends();
  }, []);

  const categories = ['ALL', 'Green Vegetables', 'Root Vegetables', 'Exotic', 'Herbs', 'Dairy'];

  const filteredTrends = trends.filter(p => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchQuery = !searchQuery || 
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.hindi_name && p.hindi_name.includes(searchQuery));
    return matchCat && matchQuery;
  });

  const spikingCount = trends.filter(t => t.volatility === 'SPIKING').length;
  const droppingCount = trends.filter(t => t.volatility === 'DROPPING').length;
  const stableCount = trends.filter(t => t.volatility === 'STABLE').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <span>📈 MANDI INTELLIGENCE &amp; ANALYTICS</span>
          </div>
          <h2 className="text-2xl font-black text-white">Vegetable Daily Price Trends</h2>
          <p className="text-xs text-slate-400">Track Mandi rate fluctuations, price spikes, drops, and set optimal wholesale margins.</p>
        </div>

        <button 
          onClick={fetchPriceTrends}
          className="px-4 py-2 text-xs font-bold bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-slate-200 transition-all flex items-center gap-2"
        >
          🔄 Refresh Market Data
        </button>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400">TRACKED PRODUCE</div>
          <div className="text-2xl font-black text-white mt-1">{trends.length} Items</div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1">Active Mandi Catalog</div>
        </div>

        <div className="glass-panel p-4 border border-amber-500/30">
          <div className="text-[11px] font-bold text-amber-400">RATE SPIKES (UP)</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{spikingCount} Items</div>
          <div className="text-[10px] text-amber-500 font-semibold mt-1">Price Increased &gt; 5%</div>
        </div>

        <div className="glass-panel p-4 border border-emerald-500/30">
          <div className="text-[11px] font-bold text-emerald-400">PRICE DROPS (DOWN)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{droppingCount} Items</div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-1">Cost Reduced &gt; 5%</div>
        </div>

        <div className="glass-panel p-4 border border-blue-500/30">
          <div className="text-[11px] font-bold text-blue-400">STABLE RATES</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{stableCount} Items</div>
          <div className="text-[10px] text-blue-500 font-semibold mt-1">Consistent Pricing</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40' 
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat === 'ALL' ? '🛒 All Categories' : cat}
            </button>
          ))}
        </div>

        <input 
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="🔍 Search item (e.g. Tamatar, Aloo)..."
          className="w-full sm:w-64 text-xs font-semibold bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Price Trend Cards Grid */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-slate-400 font-semibold text-sm">
          ⏳ Analyzing Mandi Rate Histories &amp; Volatility Metrics...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrends.map(item => {
            const isSpike = item.volatility === 'SPIKING';
            const isDrop = item.volatility === 'DROPPING';

            return (
              <div 
                key={item.product_id}
                className="glass-panel p-5 border border-slate-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {item.category}
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-1.5">{item.product_name}</h3>
                    {item.hindi_name && (
                      <span className="text-xs text-emerald-400 font-medium">({item.hindi_name})</span>
                    )}
                  </div>

                  <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    isSpike ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    isDrop ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {isSpike && '▲ Rate Spike '}
                    {isDrop && '▼ Rate Drop '}
                    {!isSpike && !isDrop && '● Stable '}
                    {item.change_pct > 0 ? `+${item.change_pct}%` : `${item.change_pct}%`}
                  </span>
                </div>

                {/* Current Rates Comparison */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400">HOTEL RATE</div>
                    <div className="text-base font-black text-emerald-400">₹{item.current_hotel_rate} <span className="text-[10px] text-slate-500 font-medium">/{item.unit}</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400">CAFE RATE</div>
                    <div className="text-base font-black text-blue-400">₹{item.current_cafe_rate} <span className="text-[10px] text-slate-500 font-medium">/{item.unit}</span></div>
                  </div>
                </div>

                {/* Sparkline Rate History Timeline */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Price Points History</div>
                  <div className="flex items-end justify-between gap-1 h-16 pt-2 px-1 border-b border-slate-800">
                    {item.history && item.history.map((h, idx) => {
                      const maxRate = Math.max(...item.history.map(x => x.hotel_rate)) || 1;
                      const barHeight = Math.max(20, Math.round((h.hotel_rate / maxRate) * 100));

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative">
                          <div 
                            className={`w-full max-w-[14px] rounded-t-sm transition-all ${
                              idx === item.history.length - 1 ? 'bg-emerald-400 shadow-md shadow-emerald-500/50' : 'bg-slate-700 hover:bg-emerald-500/60'
                            }`}
                            style={{ height: `${barHeight}%` }}
                          ></div>
                          <span className="text-[9px] text-slate-500 mt-1 font-mono">{h.date}</span>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 bg-slate-950 text-white text-[10px] p-2 rounded-lg border border-emerald-500 shadow-xl whitespace-nowrap">
                            <div className="font-bold">{h.date}</div>
                            <div>Hotel: ₹{h.hotel_rate}</div>
                            <div>Cafe: ₹{h.cafe_rate}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
