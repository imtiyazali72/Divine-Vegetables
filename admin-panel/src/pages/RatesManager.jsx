import React, { useState } from 'react';

export default function RatesManager({ products, clients, onUpdateRate, onOverrideRate }) {
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || '');
  const [overrideProductId, setOverrideProductId] = useState(products[0]?.id || '');
  const [customPrice, setCustomPrice] = useState('');
  const [editingRates, setEditingRates] = useState({});

  const handleRateChange = (productId, field, value) => {
    setEditingRates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const saveBaseRate = (product) => {
    const edits = editingRates[product.id] || {};
    const newHotelRate = edits.hotel !== undefined ? edits.hotel : product.base_rate_hotel;
    const newCafeRate = edits.cafe !== undefined ? edits.cafe : product.base_rate_cafe;

    onUpdateRate(product.id, newHotelRate, newCafeRate);
    alert(`Updated daily base rates for ${product.name}!`);
  };

  const handleSaveOverride = (e) => {
    e.preventDefault();
    if (!selectedClient || !overrideProductId || !customPrice) {
      alert("Please fill all fields for custom client rate override!");
      return;
    }

    onOverrideRate(selectedClient, overrideProductId, parseFloat(customPrice));
    alert("Custom Client Price Saved Successfully!");
    setCustomPrice('');
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Custom Client Specific Price Override Box */}
      <div className="glass-panel p-6 border-l-4 border-l-amber-500">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          🎯 Per-Client Custom Price Override Editor
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Fix special rates for specific Hotels/Cafes (Overrides base mandi prices for that specific customer).
        </p>

        <form onSubmit={handleSaveOverride} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Select Hotel / Cafe</label>
            <select 
              value={selectedClient} 
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.business_name} ({c.client_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Select Vegetable Item</label>
            <select 
              value={overrideProductId} 
              onChange={e => setOverrideProductId(e.target.value)}
              className="w-full"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.hindi_name}) - Base ₹{p.base_rate_hotel}/{p.default_unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Special Rate (₹ / Unit)</label>
            <input 
              type="number"
              step="0.5"
              placeholder="e.g. 34.00"
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <button type="submit" className="emerald-btn w-full justify-center">
              💾 Save Custom Rate
            </button>
          </div>
        </form>
      </div>

      {/* 2. Mass Daily Mandi Base Rates Table */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🥬 Daily Mandi Base Rates (Hotels vs. Cafes)
            </h2>
            <p className="text-xs text-slate-400">Update today's morning market rates per kg/crate/bag</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Vegetable Item</th>
                <th>Category</th>
                <th>Selling Unit</th>
                <th>Hotel Base Rate (₹)</th>
                <th>Cafe Base Rate (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const edits = editingRates[p.id] || {};
                const hotelVal = edits.hotel !== undefined ? edits.hotel : p.base_rate_hotel;
                const cafeVal = edits.cafe !== undefined ? edits.cafe : p.base_rate_cafe;

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-slate-700" />
                        <div>
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-xs text-emerald-400 font-hindi">{p.hindi_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-400 text-xs">{p.category}</td>
                    <td>
                      <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded font-mono font-bold">
                        {p.default_unit}
                      </span>
                    </td>
                    <td>
                      <input 
                        type="number"
                        step="0.5"
                        value={hotelVal}
                        onChange={e => handleRateChange(p.id, 'hotel', e.target.value)}
                        className="w-24 text-emerald-400 font-bold"
                      />
                    </td>
                    <td>
                      <input 
                        type="number"
                        step="0.5"
                        value={cafeVal}
                        onChange={e => handleRateChange(p.id, 'cafe', e.target.value)}
                        className="w-24 text-amber-400 font-bold"
                      />
                    </td>
                    <td>
                      <button 
                        onClick={() => saveBaseRate(p)}
                        className="emerald-btn text-xs py-1.5 px-3"
                      >
                        Update Rate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
