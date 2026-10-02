import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import Dashboard from './pages/Dashboard';
import RatesManager from './pages/RatesManager';
import OrderFulfillment from './pages/OrderFulfillment';
import InvoicesRemote from './pages/InvoicesRemote';
import UdhaarLedger from './pages/UdhaarLedger';
import RouteTracker from './pages/RouteTracker';
import Reports from './pages/Reports';
import DriverTracker from './pages/DriverTracker';
import ClientPortal from './pages/ClientPortal';
import ProcurementSheet from './pages/ProcurementSheet';
import PriceAnalytics from './pages/PriceAnalytics';
import { API_BASE, smartFetch } from './apiConfig';

export default function App() {
  const [viewMode, setViewMode] = useState('client'); // 'client', 'owner', or 'admin-challenge'
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => sessionStorage.getItem('divine_admin_auth') === 'true'
  );
  
  // Admin Challenge Form state
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotQuestion, setForgotQuestion] = useState('');
  const [forgotIsConfigured, setForgotIsConfigured] = useState(true);
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('catalog'); // for client portal mobile dock
  const [cutoffInfo, setCutoffInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);

  // Real-time Order Audio Chime & Notification Toast state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderToast, setNewOrderToast] = useState(null);
  const prevOrdersRef = useRef(null);

  // Real-time Cutoff Countdown Seconds Ticking Clock
  const [countdownSecs, setCountdownSecs] = useState(null);

  const playOrderSound = () => {
    try {
      if (!soundEnabled) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.2);
      gain2.gain.setValueAtTime(0.4, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 1.2);
    } catch (e) {}
  };

  // Change Password & Security Config Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [secQuestion, setSecQuestion] = useState('What is your favorite city?');
  const [secAnswer, setSecAnswer] = useState('');
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);

  // Sync route and Hash to enforce admin protection
  useEffect(() => {
    const handleRouteCheck = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#admin' || hash === '#owner') {
        const isAuth = sessionStorage.getItem('divine_admin_auth') === 'true';
        if (isAuth) {
          setIsAdminAuthenticated(true);
          setViewMode('owner');
        } else {
          setIsAdminAuthenticated(false);
          setViewMode('admin-challenge');
        }
      }
    };

    handleRouteCheck();
    window.addEventListener('hashchange', handleRouteCheck);
    window.addEventListener('popstate', handleRouteCheck);
    return () => {
      window.removeEventListener('hashchange', handleRouteCheck);
      window.removeEventListener('popstate', handleRouteCheck);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [cutoffRes, prodRes, ordRes, clientRes] = await Promise.all([
        fetch(`${API_BASE}/cutoff-status`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/products`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/orders`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/clients`).then(r => r.json()).catch(() => []),
      ]);

      if (cutoffRes) {
        setCutoffInfo(cutoffRes);
        if (cutoffRes.seconds_remaining !== undefined) {
          setCountdownSecs(cutoffRes.seconds_remaining);
        }
      }
      if (Array.isArray(prodRes)) setProducts(prodRes);
      if (Array.isArray(ordRes)) {
        setOrders(ordRes);

        // Detect new order arrival during auto-polling
        if (prevOrdersRef.current !== null && ordRes.length > prevOrdersRef.current.length) {
          const newestOrder = ordRes[0];
          if (newestOrder) {
            playOrderSound();
            const clientName = newestOrder.client?.business_name || "B2B Hotel Client";
            setNewOrderToast({
              clientName: clientName,
              orderNumber: newestOrder.order_number,
              amount: newestOrder.estimated_total
            });
          }
        }
        prevOrdersRef.current = ordRes;
      }
      if (Array.isArray(clientRes)) setClients(clientRes);
    } catch (err) {
      console.error("Backend fetch error, retrying...", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // 1-Second ticking countdown interval timer
  useEffect(() => {
    if (countdownSecs === null || countdownSecs <= 0) return;
    const timer = setInterval(() => {
      setCountdownSecs(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSecs]);

  const formatCountdownStr = (secs) => {
    if (secs === null || secs === undefined) return "Window Active";
    if (secs <= 0) return "Cutoff Closed";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };


  const handleUpdateRate = async (productId, baseRateHotel, baseRateCafe) => {
    try {
      await fetch(`${API_BASE}/admin/update-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, base_rate_hotel: baseRateHotel, base_rate_cafe: baseRateCafe })
      });
      fetchData();
    } catch (e) {}
  };

  const handleOverrideRate = async (clientId, productId, customRate) => {
    try {
      await fetch(`${API_BASE}/admin/override-client-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, product_id: productId, custom_rate: customRate })
      });
      fetchData();
    } catch (e) {}
  };

  const handlePlaceOrder = async (orderPayload) => {
    try {
      const res = await smartFetch('/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      let data = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { detail: text || `Server error (${res.status})` };
      }

      if (!res.ok) {
        throw new Error(data.detail || data.message || `Order placement failed with status ${res.status}`);
      }

      await fetchData();
      return data;
    } catch (err) {
      console.error("Error submitting order to backend:", err);
      throw err;
    }
  };

  const handleFulfillWeights = async (orderId, weightsMap) => {
    try {
      await fetch(`${API_BASE}/admin/fulfill-order-weights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, weights: weightsMap })
      });
      fetchData();
    } catch (e) {}
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const res = await smartFetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.message || 'Failed to delete order');
      }
      await fetchData();
      return true;
    } catch (err) {
      console.error("Error deleting order:", err);
      alert(`⚠️ Delete Order Failed: ${err.message}`);
      return false;
    }
  };

  const handleGenerateInvoice = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/invoices/generate/${orderId}`, { method: 'POST' });
      const data = await res.json();
      fetchData();
      return data;
    } catch (e) {
      return null;
    }
  };

  const handleRecordPayment = async (clientId, amount, mode) => {
    try {
      await fetch(`${API_BASE}/admin/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, amount, mode })
      });
      fetchData();
    } catch (e) {}
  };

  const handleUpdateCreditLimit = async (clientId, creditLimit, isOrderLocked) => {
    try {
      const res = await smartFetch(`/admin/clients/${clientId}/credit-limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credit_limit: creditLimit, is_order_locked: isOrderLocked })
      });
      if (res.ok) {
        await fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error updating credit limit:", e);
      return false;
    }
  };

  // Switch views safely with PIN challenge protection
  const handleSwitchToOwner = (mode) => {
    if (mode === 'owner') {
      const isAuth = sessionStorage.getItem('divine_admin_auth') === 'true';
      if (isAuth && isAdminAuthenticated) {
        setViewMode('owner');
        window.location.hash = '#admin';
      } else {
        setViewMode('admin-challenge');
        window.location.hash = '#admin';
      }
    } else if (mode === 'logout-admin') {
      sessionStorage.removeItem('divine_admin_auth');
      setIsAdminAuthenticated(false);
      setViewMode('client');
      window.location.hash = '#client';
    } else {
      setViewMode('client');
      window.location.hash = '#client';
    }
  };

  // Verify Admin PIN Challenge Form Handler
  const handleVerifyAdminPin = async (e) => {
    e.preventDefault();
    setAdminAuthError('');
    if (!adminPinInput.trim()) {
      setAdminAuthError('Please enter admin password!');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPinInput.trim() })
      });
      const data = await res.json();
      if (res.status === 200 && data.status === 'success') {
        sessionStorage.setItem('divine_admin_auth', 'true');
        setIsAdminAuthenticated(true);
        setViewMode('owner');
        window.location.hash = '#admin';
        setAdminPinInput('');
      } else {
        setAdminAuthError(data.detail || 'Incorrect Admin Password / PIN!');
      }
    } catch (err) {
      setAdminAuthError('Authentication failed. Is backend server running at http://localhost:8000?');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Open Forgot Password Modal & Fetch Question
  const handleOpenForgotPassword = async () => {
    setForgotError('');
    setForgotAnswer('');
    setForgotNewPass('');
    setForgotConfirmPass('');
    setShowForgotModal(true);

    try {
      const res = await fetch(`${API_BASE}/admin/security-question`);
      const data = await res.json();
      if (data && data.is_configured && data.question) {
        setForgotQuestion(data.question);
        setForgotIsConfigured(true);
      } else {
        setForgotQuestion('');
        setForgotIsConfigured(false);
      }
    } catch (err) {
      setForgotQuestion('');
      setForgotIsConfigured(false);
    }
  };

  // Reset Password via Security Answer
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotAnswer.trim()) {
      setForgotError('Please enter your security answer!');
      return;
    }
    if (!forgotNewPass) {
      setForgotError('Please enter a new password!');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('New password and confirm password do not match!');
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/reset-password-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          security_answer: forgotAnswer.trim(),
          new_password: forgotNewPass.trim()
        })
      });
      const data = await res.json();
      if (res.status === 200 && data.status === 'success') {
        alert(data.message || '🔑 Admin password reset successfully! You can now login with your new password.');
        setShowForgotModal(false);
        setAdminPinInput(forgotNewPass.trim());
      } else {
        setForgotError(data.detail || 'Incorrect Security Answer!');
      }
    } catch (err) {
      setForgotError('Failed to reset password. Server connection error!');
    } finally {
      setForgotSubmitting(false);
    }
  };

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

    setSettingsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_password: oldPass,
          new_password: newPass,
          security_question: secQuestion,
          security_answer: secAnswer
        })
      });
      const data = await res.json();
      if (res.status === 200 && data.status === 'success') {
        alert("✅ Owner Admin Password & Security Question updated & saved to Database!");
        setShowPasswordModal(false);
        setOldPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        alert(data.detail || "Failed to change password");
      }
    } catch (err) {
      alert("Error changing password");
    } finally {
      setSettingsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060c18] via-[#0b132b] to-[#040812] text-slate-100 flex flex-col relative overflow-hidden">
      
      {/* AMBIENT MESH LIGHT ORBS (PREREQUISITE FOR REAL GLASSMORPHISM CONTRAST) */}
      <div className="fixed top-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="fixed top-1/4 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="fixed bottom-10 right-10 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0"></div>
      
      {/* SIDEBAR NAVIGATION (DESKTOP VERTICAL STICKY + MOBILE DRAWER) - ONLY WHEN AUTHENTICATED */}
      {viewMode === 'owner' && isAdminAuthenticated && (
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          viewMode={viewMode}
          setViewMode={handleSwitchToOwner}
          cutoffInfo={cutoffInfo}
          onChangePasswordClick={() => setShowPasswordModal(true)}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className={viewMode === 'owner' && isAdminAuthenticated ? "md:pl-64 flex-1 flex flex-col min-h-screen transition-all relative z-10" : "flex-1 flex flex-col min-h-screen transition-all relative z-10"}>
        
        {/* Floating Real-time Order Notification Toast Popup */}
        {newOrderToast && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 border-2 border-emerald-500 text-white p-4 rounded-2xl shadow-2xl animate-bounce flex items-center gap-4 max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-2xl shrink-0">
              🔔
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">NEW B2B ORDER RECEIVED!</div>
              <h4 className="text-sm font-extrabold text-white">{newOrderToast.clientName}</h4>
              <p className="text-[11px] text-slate-300 font-mono">Order #{newOrderToast.orderNumber} • ₹{newOrderToast.amount?.toFixed(2)}</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button 
                onClick={() => { setActiveTab('fulfill'); setViewMode('owner'); setNewOrderToast(null); }}
                className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 rounded-lg text-white whitespace-nowrap"
              >
                View Order
              </button>
              <button 
                onClick={() => setNewOrderToast(null)}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Public B2B Top Header Banner for Client Mode */}
        {viewMode === 'client' && (
          <header className="glass-panel sticky top-0 z-40 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-emerald-900/30 flex-shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-center sm:text-left">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 p-0.5 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/50">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-base sm:text-lg">
                    🥬
                  </div>
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">DIVINE VEGETABLES</h1>
                  <p className="text-[10px] text-slate-400 font-medium">B2B Produce Ordering Portal for Hotels &amp; Cafes</p>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap w-full sm:w-auto">
                {/* Audio Notification Sound Toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "Order Alert Sound Active" : "Order Sound Muted"}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 ${
                    soundEnabled 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {soundEnabled ? '🔔 Sound ON' : '🔕 Muted'}
                </button>

                {/* Live Cutoff Countdown Timer */}
                <span className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border flex items-center gap-1.5 shrink-0 ${
                  countdownSecs !== null && countdownSecs < 1800 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse font-bold' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Mandi Window Closes in: <span className="font-mono font-bold text-white">{formatCountdownStr(countdownSecs)}</span>
                </span>
              </div>
            </div>
          </header>
        )}

        <main className="max-w-7xl w-full mx-auto px-4 md:px-8 py-4 flex-1 flex flex-col justify-center">
          
          {/* 1. ADMIN AUTHENTICATION CHALLENGE SCREEN */}
          {viewMode === 'admin-challenge' && (
            <div className="max-w-md w-full mx-auto my-auto glass-panel p-6 sm:p-8 border border-amber-500/40 space-y-5 shadow-2xl">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-amber-950/50">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl">
                    🔒
                  </div>
                </div>
                <h2 className="text-xl font-extrabold text-white">Owner Admin Access Challenge</h2>
                <p className="text-xs text-slate-400">Enter secure admin password to unlock Divine Vegetables Management Console.</p>
              </div>

              {adminAuthError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl text-center font-bold">
                  ⚠️ {adminAuthError}
                </div>
              )}

              <form onSubmit={handleVerifyAdminPin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Admin Username</label>
                  <input 
                    type="text" 
                    value="admin" 
                    disabled 
                    className="w-full text-xs font-bold text-emerald-400 bg-slate-900 border border-slate-800 cursor-not-allowed opacity-80"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">Admin Password / PIN</label>
                    <button 
                      type="button"
                      onClick={handleOpenForgotPassword}
                      className="text-xs text-amber-400 hover:underline font-bold"
                    >
                      ❓ Forgot Password?
                    </button>
                  </div>
                  <input 
                    type="password"
                    value={adminPinInput}
                    onChange={e => setAdminPinInput(e.target.value)}
                    placeholder="Enter Admin Password (Default: 1234)"
                    className="w-full text-sm font-bold text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    autoFocus
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={authSubmitting}
                  className="emerald-btn w-full justify-center py-3 text-sm font-bold bg-amber-600 hover:bg-amber-500 border-amber-500"
                >
                  {authSubmitting ? 'Verifying Password...' : '🔓 Verify & Unlock Admin Panel'}
                </button>

                <div className="text-center pt-2">
                  <button 
                    type="button" 
                    onClick={() => handleSwitchToOwner('client')}
                    className="text-xs text-slate-400 hover:text-white font-semibold underline"
                  >
                    ← Return to B2B Customer Portal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. CLIENT PORTAL VIEW */}
          {viewMode === 'client' && (
            <div className="flex-1 flex flex-col justify-between py-2">
              <ClientPortal 
                clients={clients}
                products={products}
                cutoffInfo={cutoffInfo}
                onPlaceOrder={handlePlaceOrder}
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
                apiBase={API_BASE}
              />

              {/* Discrete Footer Admin Trigger Link */}
              <footer className="mt-auto py-3 border-t border-slate-900/60 text-center space-y-1 flex-shrink-0">
                <p className="text-[11px] text-slate-500">© 2026 Divine Vegetables B2B Produce Supply. All rights reserved.</p>
                <div>
                  <a 
                    href="#admin"
                    onClick={(e) => { e.preventDefault(); handleSwitchToOwner('owner'); }}
                    className="text-[10px] text-slate-600 hover:text-slate-400 font-mono transition-all"
                  >
                    Owner Operations Access
                  </a>
                </div>
              </footer>
            </div>
          )}

          {/* 3. VERIFIED OWNER ADMIN DASHBOARD */}
          {viewMode === 'owner' && isAdminAuthenticated && (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  orders={orders} 
                  clients={clients} 
                  setActiveTab={setActiveTab} 
                  onGenerateInvoice={handleGenerateInvoice}
                />
              )}

              {activeTab === 'rates' && (
                <RatesManager 
                  products={products} 
                  clients={clients} 
                  onUpdateRate={handleUpdateRate}
                  onOverrideRate={handleOverrideRate}
                />
              )}

              {activeTab === 'analytics' && (
                <PriceAnalytics 
                  products={products}
                  onUpdateRate={handleUpdateRate}
                />
              )}


              {activeTab === 'procurement' && (
                <ProcurementSheet 
                  orders={orders}
                />
              )}

              {activeTab === 'fulfill' && (
                <OrderFulfillment 
                  orders={orders} 
                  onFulfillWeights={handleFulfillWeights}
                  onDeleteOrder={handleDeleteOrder}
                />
              )}

              {activeTab === 'invoices' && (
                <InvoicesRemote 
                  orders={orders} 
                  clients={clients}
                  onGenerateInvoice={handleGenerateInvoice}
                />
              )}

              {activeTab === 'ledger' && (
                <UdhaarLedger 
                  clients={clients} 
                  onRecordPayment={handleRecordPayment}
                  onUpdateCreditLimit={handleUpdateCreditLimit}
                />
              )}

              {(activeTab === 'routes' || activeTab === 'live-routes') && (
                <RouteTracker 
                  orders={orders || []}
                />
              )}

              {(activeTab === 'reports' || activeTab === 'monthly-reports') && (
                <Reports />
              )}

              {activeTab === 'driver-gps' && (
                <DriverTracker orders={orders} />
              )}
            </>
          )}
        </main>
      </div>

      {/* MOBILE IPHONE-STYLE LIQUID CRYSTAL GLASS DOCK */}
      <MobileBottomNav 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode === 'owner' && isAdminAuthenticated ? 'owner' : 'client'}
        setViewMode={handleSwitchToOwner}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
      />

      {/* FORGOT PASSWORD SECURITY QUESTION RESET MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-md w-full border border-amber-500/50 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ❓ Reset Admin Password
              </h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            {!forgotIsConfigured ? (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-3">
                <div className="text-amber-400 font-bold text-xs flex items-center gap-2">
                  <span>⚠️ No Security Question Configured Yet</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No security question has been set by the Owner Admin yet. Please log in using your initial credentials (default password: <b className="text-emerald-400 font-mono">1234</b>) and configure your Security Question &amp; Answer under Admin Settings.
                </p>
                <button 
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="emerald-btn text-xs w-full justify-center py-2.5 mt-2"
                >
                  Got it, return to login
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-300">Answer your pre-set security question to verify your identity and reset your admin password.</p>

                {forgotError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-2.5 rounded-xl font-bold text-center">
                    ⚠️ {forgotError}
                  </div>
                )}

                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                      Configured Security Question:
                    </label>
                    <div className="text-xs font-extrabold text-white">{forgotQuestion}</div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Your Security Answer *</label>
                    <input 
                      type="text"
                      value={forgotAnswer}
                      onChange={e => setForgotAnswer(e.target.value)}
                      placeholder="Enter your security answer"
                      className="w-full text-xs font-bold text-white"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">New Admin Password *</label>
                    <input 
                      type="password"
                      value={forgotNewPass}
                      onChange={e => setForgotNewPass(e.target.value)}
                      placeholder="Enter new admin password"
                      className="w-full text-xs font-bold text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Confirm New Password *</label>
                    <input 
                      type="password"
                      value={forgotConfirmPass}
                      onChange={e => setForgotConfirmPass(e.target.value)}
                      placeholder="Re-enter new admin password"
                      className="w-full text-xs font-bold text-white"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="outline-btn flex-1 justify-center"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={forgotSubmitting}
                      className="emerald-btn flex-1 justify-center bg-amber-600 hover:bg-amber-500 border-amber-500 font-bold"
                    >
                      {forgotSubmitting ? 'Resetting...' : '🔑 Reset Password'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* CHANGE ADMIN PASSWORD & SECURITY QUESTION SETTINGS MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 max-w-md w-full border border-amber-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                🔑 Admin Password &amp; Security Setup
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400">Fixed Admin Username: <b className="text-emerald-400 font-mono">admin</b></p>

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

              {/* Dedicated Security Question Configuration Card */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-amber-500/30 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🔐 Reset Protection Security Question</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Configure a security question &amp; answer to easily recover your admin password if forgotten.
                </p>
                
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Select or Write Security Question</label>
                  <select 
                    value={secQuestion} 
                    onChange={e => setSecQuestion(e.target.value)}
                    className="w-full text-xs font-bold mb-2"
                  >
                    <option value="What is your favorite city?">What is your favorite city?</option>
                    <option value="What was the name of your first school?">What was the name of your first school?</option>
                    <option value="What is your primary mandi supplier name?">What is your primary mandi supplier name?</option>
                    <option value="What is your pet or secret code name?">What is your pet or secret code name?</option>
                  </select>
                  <input 
                    type="text"
                    value={secQuestion}
                    onChange={e => setSecQuestion(e.target.value)}
                    placeholder="Custom Security Question"
                    className="w-full text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Private Security Answer *</label>
                  <input 
                    type="text"
                    value={secAnswer}
                    onChange={e => setSecAnswer(e.target.value)}
                    placeholder="Enter private security answer"
                    className="w-full text-xs text-white font-bold"
                    required
                  />
                </div>
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
                  disabled={settingsSubmitting}
                  className="emerald-btn flex-1 justify-center font-bold"
                >
                  {settingsSubmitting ? 'Saving...' : '💾 Save Password & Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
