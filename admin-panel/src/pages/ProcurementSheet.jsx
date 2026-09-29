import React, { useState, useEffect } from 'react';
import { smartFetch } from '../apiConfig';

export default function ProcurementSheet({ orders = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyFreshBuffer, setBuyFreshBuffer] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockInputs, setStockInputs] = useState({});
  const [savingStock, setSavingStock] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    fetchProcurementData();
  }, [orders]);

  const fetchProcurementData = async () => {
    setLoading(true);
    try {
      const res = await smartFetch('/inventory/procurement-calculation');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        
        // Initialize stock inputs
        const initialInputs = {};
        data.items?.forEach(it => {
          initialInputs[`${it.product_name}___${it.unit}`] = it.leftover_stock || 0;
        });
        setStockInputs(initialInputs);
      }
    } catch (err) {
      console.error("Error fetching procurement data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockInputChange = (key, val) => {
    setStockInputs(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    setSavingStock(true);
    try {
      const stocksPayload = Object.entries(stockInputs).map(([key, qty]) => {
        const [item_name, unit] = key.split('___');
        return {
          item_name,
          unit,
          leftover_qty: parseFloat(qty) || 0
        };
      });

      const res = await smartFetch('/inventory/closing-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stocks: stocksPayload })
      });

      if (res.ok) {
        setShowStockModal(false);
        await fetchProcurementData();
      } else {
        alert("Failed to save closing stock");
      }
    } catch (err) {
      alert("Error saving closing stock!");
    } finally {
      setSavingStock(false);
    }
  };

  const copySheetToClipboard = () => {
    if (items.length === 0) return;

    const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    let text = `🥬 *DIVINE VEGETABLES - MANDI PROCUREMENT SHEET*\n📅 Date: ${todayStr}\n----------------------------------\n`;

    items.forEach((it, idx) => {
      const netBuy = buyFreshBuffer ? it.gross_demand : it.net_mandi_buy;
      text += `${idx + 1}. *${it.product_name}*: ${netBuy} ${it.unit} (Gross: ${it.gross_demand} | Stock: ${it.leftover_stock})\n`;
    });

    text += `----------------------------------\n📌 Total Unique Produce Items: ${items.length}\n🚀 Divine Vegetables Wholesale Hub`;

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            🥬 Mandi Procurement Bulk Buying Sheet
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated nightly produce demand grouped across all pending hotel &amp; cafe orders.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowStockModal(true)}
            className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
          >
            📦 Record Leftover Godown Stock
          </button>

          <button
            onClick={copySheetToClipboard}
            className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all"
          >
            📋 {copiedToast ? 'Copied to Clipboard!' : 'Copy Mandi List'}
          </button>

          <button
            onClick={handlePrint}
            className="bg-blue-600/90 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
          >
            🖨️ Print Sheet
          </button>
        </div>
      </div>

      {/* Control Bar: Buffer Toggle & Metrics Summary */}
      <div className="glass-panel p-4 flex flex-wrap justify-between items-center gap-4 border border-white/10">
        
        {/* Toggle Switch */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input 
            type="checkbox"
            checked={buyFreshBuffer}
            onChange={e => setBuyFreshBuffer(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            🛡️ Keep Leftover Stock as Buffer (Buy 100% Fresh Mandi Demand)
          </span>
        </label>

        <div className="flex items-center gap-6 text-xs">
          <div className="text-slate-400">
            Total Produce Items: <span className="text-white font-bold">{items.length}</span>
          </div>
          <div className="text-slate-400">
            Buffer Mode: <span className={buyFreshBuffer ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {buyFreshBuffer ? 'ON (100% Fresh Mandi Buy)' : 'OFF (Deduct Leftover Stock)'}
            </span>
          </div>
        </div>
      </div>

      {/* Procurement Sheet Table / Cards */}
      <div className="glass-panel p-6">
        {loading ? (
          <div className="text-center py-16 text-slate-400 animate-pulse text-sm">
            Calculating Mandi Nightly Bulk Buying Sheet...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-2">
            <div className="text-2xl">🛒</div>
            <div className="font-bold text-slate-300">No active orders placed for tonight yet.</div>
            <div className="text-xs">Once clients submit produce orders, aggregated Mandi buy quantities will appear here automatically.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Item Name</th>
                  <th className="text-center">Unit</th>
                  <th className="text-center">Gross Hotel Demand</th>
                  <th className="text-center">Godown Leftover</th>
                  <th className="text-right">Net Mandi Buy Needed</th>
                  <th className="text-right">Hotel Orders</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const netBuy = buyFreshBuffer ? it.gross_demand : it.net_mandi_buy;
                  const isReduced = !buyFreshBuffer && it.leftover_stock > 0;

                  return (
                    <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                      <td className="font-bold text-white py-3.5">
                        <div className="text-sm">{it.product_name}</div>
                      </td>
                      <td className="text-center">
                        <span className="bg-slate-800 text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded-full border border-slate-700">
                          {it.unit}
                        </span>
                      </td>
                      <td className="text-center font-bold text-slate-200">
                        {it.gross_demand} {it.unit}
                      </td>
                      <td className="text-center font-semibold text-amber-400">
                        {it.leftover_stock} {it.unit}
                      </td>
                      <td className="text-right font-black text-base">
                        <span className={netBuy > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                          {netBuy} {it.unit}
                        </span>
                        {isReduced && (
                          <div className="text-[10px] text-emerald-400/80 font-normal">
                            (Saved {it.leftover_stock} {it.unit})
                          </div>
                        )}
                      </td>
                      <td className="text-right text-xs text-slate-400 font-medium">
                        {it.hotels_breakdown?.length || 0} Clients
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GODOWN LEFTOVER STOCK MODAL */}
      {showStockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-lg w-full border border-emerald-500/40 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                📦 Record Leftover Godown Stock
              </h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Enter remaining produce quantities in warehouse godown post-dispatch. These values automatically deduct from tonight's gross Mandi procurement requirement.
            </p>

            <form onSubmit={handleSaveStock} className="space-y-4">
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2 no-scrollbar">
                {items.map((it, idx) => {
                  const key = `${it.product_name}___${it.unit}`;
                  return (
                    <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-xs font-bold text-white">{it.product_name}</div>
                        <div className="text-[10px] text-slate-400">Unit: {it.unit}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={stockInputs[key] !== undefined ? stockInputs[key] : (it.leftover_stock || 0)}
                          onChange={e => handleStockInputChange(key, e.target.value)}
                          className="w-24 text-xs font-bold text-emerald-400 bg-slate-950 border border-slate-700 px-2 py-1.5 rounded-lg text-right"
                        />
                        <span className="text-xs text-slate-400 font-bold">{it.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStock}
                  className="emerald-btn text-xs px-5 py-2.5"
                >
                  {savingStock ? 'Saving Stock...' : '💾 Save Godown Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
