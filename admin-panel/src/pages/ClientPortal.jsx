import React, { useState, useEffect } from 'react';
import { API_BASE as DEFAULT_API_BASE } from '../apiConfig';

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Potato (Aloo)", hindi_name: "आलू", category: "Root Vegetables", default_unit: "KG", image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400" },
  { id: 2, name: "Tomato Hybrid (Tamatar)", hindi_name: "टमाटर", category: "Green Vegetables", default_unit: "KG", image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400" },
  { id: 3, name: "Onion Red (Pyaz)", hindi_name: "प्याज", category: "Root Vegetables", default_unit: "KG", image_url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=400" },
  { id: 4, name: "Capsicum Green (Shimla Mirch)", hindi_name: "शिमला मिर्च", category: "Green Vegetables", default_unit: "KG", image_url: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400" },
  { id: 5, name: "Cauliflower (Gobi)", hindi_name: "फूलगोभी", category: "Green Vegetables", default_unit: "PETI", image_url: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400" },
  { id: 6, name: "Ginger (Adrak)", hindi_name: "अदरक", category: "Herbs", default_unit: "KG", image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400" },
  { id: 7, name: "Garlic (Lahsun)", hindi_name: "लहसुन", category: "Herbs", default_unit: "KG", image_url: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400" },
  { id: 8, name: "Paneer Fresh Dairy", hindi_name: "पनीर", category: "Dairy", default_unit: "KG", image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400" },
  { id: 9, name: "Button Mushroom Box", hindi_name: "मशरूम", category: "Exotic", default_unit: "BAG", image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400" },
  { id: 10, name: "Exotic Iceberg Lettuce", hindi_name: "सलाद पत्ता", category: "Exotic", default_unit: "KG", image_url: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400" }
];

export default function ClientPortal({ clients, products, cutoffInfo, onPlaceOrder, activeSubTab = 'catalog', setActiveSubTab, apiBase }) {
  const BASE_URL = apiBase || DEFAULT_API_BASE;
  const displayProducts = (Array.isArray(products) && products.length > 0) ? products : DEFAULT_PRODUCTS;

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('divine_client_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }); // Logged in client user info
  const [isRegistering, setIsRegistering] = useState(false);

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('9823456789');
  const [loginPass, setLoginPass] = useState('123');

  // Register Form State
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regClientType, setRegClientType] = useState('HOTEL');
  const [regContactPerson, setRegContactPerson] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Portal State
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('divine_client_cart');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }); // { productId: qty }

  useEffect(() => {
    try {
      localStorage.setItem('divine_client_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [deliveryDate, setDeliveryDate] = useState(getTomorrowStr());
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [clientOrders, setClientOrders] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('divine_client_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('divine_client_user');
    }
  }, [currentUser]);

  const fetchClientOrders = async (clientId) => {
    if (!clientId) return;
    try {
      const res = await fetch(`${BASE_URL}/orders?client_id=${clientId}`);
      const data = await res.json();
      setClientOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (currentUser?.client?.id) {
      fetchClientOrders(currentUser.client.id);
      const interval = setInterval(() => fetchClientOrders(currentUser.client.id), 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser, BASE_URL]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginPhone, password: loginPass })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        if (data.role === 'OWNER') {
          alert("Admin account login detected. Please use Owner Operations link in footer.");
          return;
        }
        setCurrentUser(data);
      } else {
        alert(data.detail || "Invalid phone number or password!");
      }
    } catch (err) {
      alert(`Login failed! Unable to reach backend server at ${BASE_URL}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regBusinessName || !regPhone || !regPassword) {
      alert("Please fill all required fields!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/register-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: regBusinessName,
          client_type: regClientType,
          contact_person: regContactPerson,
          phone: regPhone,
          address: regAddress,
          password: regPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert(data.message);
        setIsRegistering(false);
        setLoginPhone(regPhone);
        setLoginPass(regPassword);
      } else {
        alert(data.detail || "Registration failed!");
      }
    } catch (err) {
      alert(`Registration failed! Server connection error at ${BASE_URL}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQtyChange = (productId, delta) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: parseFloat(next.toFixed(1)) };
    });
  };

  const calculateTotalWeight = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (Object.keys(cart).length === 0) {
      alert("Cart is empty! Please select vegetable items first.");
      return;
    }

    setSubmitting(true);
    const itemsPayload = Object.entries(cart).map(([prodId, qty]) => {
      const prod = displayProducts.find(p => p.id === parseInt(prodId));
      return {
        product_id: parseInt(prodId),
        product_name: prod ? prod.name : `Product #${prodId}`,
        ordered_qty: qty,
        quantity: qty
      };
    });

    try {
      const clientId = currentUser?.client?.id || 1;
      const res = await onPlaceOrder({
        client_id: clientId,
        hotel_id: clientId,
        phone: currentUser?.username || currentUser?.client?.phone,
        items: itemsPayload,
        delivery_date: deliveryDate,
        notes: kitchenNotes,
        bypass_cutoff: true
      });

      setSubmitting(false);

      if (res && res.order_number) {
        setCart({});
        try { localStorage.removeItem('divine_client_cart'); } catch (e) {}
        setKitchenNotes('');
        if (setActiveSubTab) setActiveSubTab('my-orders');
        if (clientId) fetchClientOrders(clientId);
        alert(`🎉 Order Placed Successfully!\n\nOrder #${res.order_number} submitted to Divine Vegetables! Our mandi team will weigh & pack your order for morning delivery.`);
      } else {
        alert(`⚠️ Could not complete order: ${res?.detail || "Server error"}. Your cart selection remains saved!`);
      }
    } catch (err) {
      setSubmitting(false);
      const errorDetail = err?.message || "Could not connect to backend API";
      alert(`⚠️ Order Submission Error: ${errorDetail}\n\nDon't worry! Your selected cart items are safely saved so you can retry submitting.`);
    } finally {
      setSubmitting(false);
    }
  };

  // IF NOT LOGGED IN: SHOW CLIENT LOGIN / FIRST-TIME SIGNUP SCREEN
  if (!currentUser) {
    return (
      <div className="max-w-md w-full mx-auto my-auto glass-panel p-6 sm:p-8 border border-emerald-500/30 space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl">
              🥬
            </div>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">DIVINE VEGETABLES</h2>
          <p className="text-[11px] text-slate-400 font-medium">B2B Produce Ordering Portal for Hotels &amp; Cafes</p>
        </div>

        {/* Tab Switcher: Login vs First-Time Registration */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setIsRegistering(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !isRegistering ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            🔑 Client Login
          </button>
          <button 
            onClick={() => setIsRegistering(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              isRegistering ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            ✨ First-Time Signup
          </button>
        </div>

        {!isRegistering ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Registered Phone / Username</label>
              <input 
                type="text"
                value={loginPhone}
                onChange={e => setLoginPhone(e.target.value)}
                placeholder="e.g. 9823456789"
                className="w-full text-sm font-bold text-white bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Password</label>
              <input 
                type="password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="Password"
                className="w-full text-sm text-white bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button type="submit" className="emerald-btn w-full justify-center py-3 text-sm font-bold shadow-lg shadow-emerald-950/40">
              🔑 Login to Ordering Portal
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-slate-400">First time ordering from Divine Vegetables? </span>
              <button 
                type="button" 
                onClick={() => setIsRegistering(true)}
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                Register Here
              </button>
            </div>
          </form>
        ) : (
          /* FIRST TIME SIGNUP FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Hotel / Cafe Business Name *</label>
              <input 
                type="text"
                value={regBusinessName}
                onChange={e => setRegBusinessName(e.target.value)}
                placeholder="e.g. Taj Residency Hotel"
                className="w-full text-xs font-bold text-white bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Category *</label>
                <select 
                  value={regClientType} 
                  onChange={e => setRegClientType(e.target.value)}
                  className="w-full text-xs bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="HOTEL">HOTEL</option>
                  <option value="CAFE">CAFE</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Mobile / Phone *</label>
                <input 
                  type="text"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="9800000000"
                  className="w-full text-xs font-bold text-white bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Contact Person Name</label>
              <input 
                type="text"
                value={regContactPerson}
                onChange={e => setRegContactPerson(e.target.value)}
                placeholder="e.g. Head Chef Ramesh"
                className="w-full text-xs text-white bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Delivery Address</label>
              <input 
                type="text"
                value={regAddress}
                onChange={e => setRegAddress(e.target.value)}
                placeholder="Kitchen Address for Morning Delivery"
                className="w-full text-xs text-white bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Choose Account Password *</label>
              <input 
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                placeholder="Set password"
                className="w-full text-xs text-white bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <button type="submit" className="emerald-btn w-full justify-center py-2.5 text-xs font-bold shadow-lg shadow-emerald-950/40">
              ✨ Register Business &amp; Start Ordering
            </button>
          </form>
        )}
      </div>
    );
  }

  // LOGGED IN CLIENT PORTAL
  const clientInfo = currentUser.client || {};

  return (
    <div className="space-y-8">
      
      {/* Logged-in Customer Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-blue-500 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">CLIENT PURCHASER PORTAL</div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Welcome, <span className="text-emerald-400">{clientInfo.business_name}</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 font-semibold">
              {clientInfo.client_type}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Contact: {clientInfo.contact_person} ({clientInfo.phone}) • Address: {clientInfo.address}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-900 px-4 py-2 rounded-xl border border-amber-500/30 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold">MANDI RATE POLICY</div>
            <div className="text-xs font-bold text-amber-400">Daily Market Rates Applied on Dispatch</div>
          </div>

          <button 
            onClick={() => setCurrentUser(null)}
            className="outline-btn text-xs text-rose-400 border-rose-500/40 hover:bg-rose-500/10"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Credit Limit & Order Locked Warning Banner */}
      {clientInfo.is_order_locked ? (
        <div className="bg-rose-950/80 border border-rose-500/50 p-4 rounded-2xl flex items-center gap-3 text-rose-300 text-xs font-bold shadow-lg">
          <span className="text-2xl">🔒</span>
          <div>
            <div className="font-extrabold text-sm text-white">Ordering Locked on Your Account</div>
            <div>Your ordering privileges are locked by Divine Vegetables Admin due to overdue balance. Please contact Divine Vegetables Admin to clear dues.</div>
          </div>
        </div>
      ) : (clientInfo.current_balance && clientInfo.credit_limit && clientInfo.current_balance >= clientInfo.credit_limit) ? (
        <div className="bg-amber-950/80 border border-amber-500/50 p-4 rounded-2xl flex items-center gap-3 text-amber-300 text-xs font-bold shadow-lg">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-extrabold text-sm text-white">Approved Credit Limit Reached (₹{clientInfo.credit_limit?.toLocaleString('en-IN')})</div>
            <div>Your outstanding balance (₹{clientInfo.current_balance?.toLocaleString('en-IN')}) has reached your approved credit limit. Please clear pending dues to place fresh orders.</div>
          </div>
        </div>
      ) : null}

      {/* Sub Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button 
          onClick={() => setActiveSubTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'catalog'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🥬 Fresh Vegetable Catalog & Order
        </button>
        <button 
          onClick={() => setActiveSubTab('my-orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'my-orders'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🚚 My Orders & Delivery Status ({clientOrders.length})
        </button>
      </div>

      {/* 1. Catalog & Ordering Tab (NO PRICES SHOWN TO CUSTOMER) */}
      {activeSubTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Vegetables Grid */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Fresh Produce Catalog (Select Quantities in KG / Peti / Bag)
              </h3>
              <span className="text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-semibold">
                🏷️ Market Rates Applied at Dispatch
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayProducts.map(p => {
                const currentQty = cart[p.id] || 0;

                return (
                  <div key={p.id} className="glass-panel p-4 flex flex-col justify-between border border-slate-800 hover:border-emerald-500/40 transition-all">
                    <div className="flex gap-3 items-start mb-3">
                      <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0" />
                      <div>
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="text-xs text-emerald-400 font-hindi">{p.hindi_name}</div>
                        <div className="text-xs text-slate-400 mt-1">{p.category}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-1">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">UNIT</div>
                        <div className="text-xs font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded font-mono">{p.default_unit}</div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        <button 
                          onClick={() => handleQtyChange(p.id, -1.0)}
                          className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-sm flex items-center justify-center hover:bg-rose-500/30"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-white px-1 font-mono">
                          {currentQty > 0 ? `${currentQty} ${p.default_unit}` : `0 ${p.default_unit}`}
                        </span>
                        <button 
                          onClick={() => handleQtyChange(p.id, 1.0)}
                          className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center hover:bg-emerald-500/30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart & Checkout Panel */}
          <div className="glass-panel p-6 space-y-6 border-l-2 border-l-emerald-500">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                🛒 Order Summary
              </h3>
              <p className="text-xs text-slate-400">Morning delivery slot: 5:00 AM - 7:00 AM</p>
            </div>

            {Object.keys(cart).length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Your order cart is empty. Click + on produce to select required quantity.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(cart).map(([prodId, qty]) => {
                  const prod = displayProducts.find(p => p.id === parseInt(prodId));
                  if (!prod) return null;

                  return (
                    <div key={prodId} className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <div className="font-bold text-white">{prod.name}</div>
                        <div className="text-slate-400">{prod.hindi_name}</div>
                      </div>
                      <div className="font-bold text-emerald-400 font-mono">{qty} {prod.default_unit}</div>
                    </div>
                  );
                })}

                <div className="border-t border-slate-800 pt-3">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>Total Produce Items:</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">{Object.keys(cart).length} Items ({calculateTotalWeight()} Units)</span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 mt-2">
                    <p className="text-[11px] text-amber-300 leading-snug">
                      ℹ️ <b>Market Rate Rule:</b> Daily mandi market rates & actual weighed quantities will be itemized in your PDF invoice upon morning dispatch.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Delivery Date</label>
                <input 
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Kitchen / Chef Notes (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Medium size potatoes, fresh green tomatoes"
                  value={kitchenNotes}
                  onChange={e => setKitchenNotes(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting || Object.keys(cart).length === 0}
                className="emerald-btn w-full justify-center text-sm py-3"
              >
                {submitting ? 'Submitting Order...' : '🚀 Send Order to Divine Vegetables'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* 2. My Orders & Delivery Status Tab */}
      {activeSubTab === 'my-orders' && (
        <div className="glass-panel p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            🚚 Orders History & Live Delivery Tracking
          </h3>

          {clientOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No orders placed yet for {clientInfo.business_name}.
            </div>
          ) : (
            <div className="space-y-4">
              {clientOrders.map(o => (
                <div key={o.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-emerald-400 font-bold font-mono">#{o.order_number}</span>
                      <div className="text-xs text-slate-400">Date: {o.order_date} • Delivery: {o.delivery_date}</div>
                    </div>
                    <div className="text-right">
                      <span className={o.status === 'PENDING' ? 'badge badge-pending' : 'badge badge-packed'}>
                        {o.status}
                      </span>
                      {o.status === 'PACKED' || o.status === 'DELIVERED' ? (
                        <div className="text-sm font-black text-emerald-400 mt-1">Invoice Bill: ₹{o.actual_final_total.toFixed(2)}</div>
                      ) : (
                        <div className="text-xs text-amber-400 font-semibold mt-1">Rates & Weight Packing in Progress</div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300">
                    <div className="font-bold text-slate-200 mb-1">Items Summary:</div>
                    {o.items?.map(i => (
                      <div key={i.id} className="flex justify-between py-0.5">
                        <span>{i.product_name}</span>
                        <span className="font-mono">
                          Ordered: {i.ordered_qty} {i.unit} {i.actual_packed_qty ? `| Packed: ${i.actual_packed_qty} ${i.unit}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  {o.route && (
                    <div className="text-xs text-slate-400 flex justify-between items-center bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/40">
                      <div>
                        <b>Route Status:</b> <span className="text-emerald-400">{o.route.route_status}</span>
                      </div>
                      <div>
                        <b>Driver:</b> {o.route.driver_name} ({o.route.driver_phone})
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
