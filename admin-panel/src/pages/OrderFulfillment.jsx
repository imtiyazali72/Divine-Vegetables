import React, { useState, useEffect } from 'react';
import { API_BASE, smartFetch } from '../apiConfig';

export default function OrderFulfillment({ orders = [], onFulfillWeights, onDeleteOrder }) {
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PACKED');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [weights, setWeights] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [upiModalData, setUpiModalData] = useState(null);
  const [loadingUpi, setLoadingUpi] = useState(false);

  const handleShowUpiQr = async (orderId) => {
    try {
      setLoadingUpi(true);
      const res = await fetch(`${API_BASE}/invoices/${orderId}/upi-qr`);
      const data = await res.json();
      if (data && data.qr_image_url) {
        setUpiModalData(data);
      } else {
        alert("Could not load UPI QR code for this order");
      }
    } catch (e) {
      alert("Error loading UPI QR code");
    } finally {
      setLoadingUpi(false);
    }
  };


  // Auto-select first pending order when data loads or after deletion
  useEffect(() => {
    if (pendingOrders.length > 0) {
      // If current selected order is no longer in pending list, select first available
      if (!selectedOrder || !pendingOrders.some(o => o.id === selectedOrder.id)) {
        handleSelectOrder(pendingOrders[0]);
      }
    } else {
      setSelectedOrder(null);
    }
  }, [orders]);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    const initialWeights = {};
    order.items?.forEach(item => {
      initialWeights[item.id] = item.actual_packed_qty || item.ordered_qty;
    });
    setWeights(initialWeights);
  };

  const handleWeightChange = (itemId, val) => {
    setWeights(prev => ({
      ...prev,
      [itemId]: val
    }));
  };

  const calculateTotal = () => {
    if (!selectedOrder?.items) return 0;
    return selectedOrder.items.reduce((sum, item) => {
      const w = parseFloat(weights[item.id]) || item.ordered_qty;
      return sum + (w * item.price_per_unit);
    }, 0);
  };

  const handleSubmitFulfillment = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await onFulfillWeights(selectedOrder.id, weights);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Error saving weights. Please check backend connection!');
    }
  };

  const handleWhatsAppShare = async (orderId) => {
    try {
      const res = await smartFetch(`/invoices/${orderId}/whatsapp-payload`);
      if (res.ok) {
        const data = await res.json();
        if (data.whatsapp_url) {
          window.open(data.whatsapp_url, '_blank');
        }
      } else {
        alert("Failed to compose WhatsApp message");
      }
    } catch (err) {
      console.error("WhatsApp share error:", err);
      alert("Error generating WhatsApp invoice link!");
    }
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete || !onDeleteOrder) return;
    setIsDeleting(true);
    try {
      const success = await onDeleteOrder(orderToDelete.id);
      if (success) {
        if (selectedOrder?.id === orderToDelete.id) {
          setSelectedOrder(null);
        }
        setOrderToDelete(null);
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
      
      {/* Left: Orders Selection List */}
      <div className="glass-panel p-6 space-y-4">
        <h2 className="text-base font-bold text-white mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">📋 Nightly Orders to Weigh ({pendingOrders.length})</span>
        </h2>
        <div className="space-y-3">
          {pendingOrders.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No pending orders to weigh tonight.</p>
          ) : (
            pendingOrders.map(o => (
              <div 
                key={o.id}
                onClick={() => handleSelectOrder(o)}
                className={`p-4 rounded-xl cursor-pointer border transition-all relative group ${
                  selectedOrder?.id === o.id 
                    ? 'bg-emerald-950/60 border-emerald-500 shadow-md shadow-emerald-900/30' 
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-emerald-400 text-sm">{o.order_number}</span>
                  <div className="flex items-center gap-2">
                    <span className={o.status === 'PENDING' ? 'badge badge-pending' : 'badge badge-packed'}>
                      {o.status}
                    </span>
                    {/* Quick Delete Icon Button */}
                    <button
                      title="Delete Order (Duplicate / Cancelled)"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrderToDelete(o);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-rose-950/50 border border-transparent hover:border-rose-800/50 transition-all text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="font-semibold text-white text-sm">{o.client_name}</div>
                <div className="text-xs text-slate-400 mt-1 flex justify-between">
                  <span>{o.items?.length || 0} items ordered</span>
                  <span>Est: ₹{(o.estimated_total || 0).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Actual Weight Adjustment Form */}
      <div className="md:col-span-2 glass-panel p-6">
        {!selectedOrder ? (
          <div className="text-center py-20 text-slate-500">
            Select an order from the left column to enter actual packed weights.
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  ⚖️ Packing &amp; Weight Adjustment Console
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Order <span className="text-emerald-400 font-bold">#{selectedOrder.order_number}</span> • Client: <span className="text-white font-bold">{selectedOrder.client_name}</span> ({selectedOrder.client_type})
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleShowUpiQr(selectedOrder.id)}
                    disabled={loadingUpi}
                    className="bg-blue-600/90 hover:bg-blue-500 border border-blue-400/40 text-white font-bold text-xs px-2.5 sm:px-3.5 py-2 rounded-xl flex items-center justify-center gap-1 transition-all shadow-md shadow-blue-950/50"
                    title="Generate dynamic UPI payment QR code for GPay/PhonePe"
                  >
                    📱 {loadingUpi ? '...' : 'UPI QR'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppShare(selectedOrder.id)}
                    className="bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-400/40 text-white font-bold text-xs px-2.5 sm:px-3.5 py-2 rounded-xl flex items-center justify-center gap-1 transition-all shadow-md shadow-emerald-950/50"
                    title="Send pre-composed itemized invoice summary on WhatsApp"
                  >
                    💬 WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderToDelete(selectedOrder)}
                    className="bg-rose-950/70 hover:bg-rose-900 border border-rose-600/50 text-rose-300 font-bold text-xs px-2.5 sm:px-3.5 py-2 rounded-xl flex items-center justify-center gap-1 transition-all shadow-md hover:shadow-rose-950/50"
                    title="Permanently remove duplicate or mistaken order"
                  >
                    🗑️ Delete
                  </button>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4 flex justify-between sm:block items-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">RECALCULATED ACTUAL TOTAL</div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    ₹{calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitFulfillment}>
              {/* MOBILE ITEM CARDS VIEW (No horizontal scrolling required!) */}
              <div className="block sm:hidden space-y-3 mb-6">
                {selectedOrder.items?.map(item => {
                  const currentWeight = weights[item.id] !== undefined ? weights[item.id] : (item.actual_packed_qty || item.ordered_qty);
                  const sub = (parseFloat(currentWeight) || 0) * item.price_per_unit;
                  const isDiff = parseFloat(currentWeight) !== item.ordered_qty;

                  return (
                    <div key={item.id} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-white text-sm">{item.product_name}</div>
                          <div className="text-xs text-emerald-400 font-semibold">Rate: ₹{item.price_per_unit.toFixed(2)} / {item.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-bold">Ordered Qty</div>
                          <div className="text-xs font-bold text-slate-300">{item.ordered_qty} {item.unit}</div>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block uppercase">Actual Packed Weight</label>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input 
                              type="number"
                              step="0.1"
                              value={currentWeight}
                              onChange={e => handleWeightChange(item.id, e.target.value)}
                              className="w-24 text-sm font-bold text-white bg-slate-900 border border-emerald-500/50 px-2 py-1 rounded-lg"
                            />
                            <span className="text-xs font-bold text-slate-400">{item.unit}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Subtotal</div>
                          <div className="text-base font-black text-emerald-400">₹{sub.toFixed(2)}</div>
                        </div>
                      </div>

                      {isDiff && (
                        <div className="text-[10px] text-amber-400 font-semibold text-right">
                          ⚠️ Adjusted from {item.ordered_qty} {item.unit}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP ITEM TABLE VIEW */}
              <div className="hidden sm:block overflow-x-auto mb-6">
                <table>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Rate / Unit</th>
                      <th>Requested Qty</th>
                      <th>Actual Packed Weight (Enter)</th>
                      <th>Final Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map(item => {
                      const currentWeight = weights[item.id] !== undefined ? weights[item.id] : (item.actual_packed_qty || item.ordered_qty);
                      const sub = (parseFloat(currentWeight) || 0) * item.price_per_unit;
                      const isDiff = parseFloat(currentWeight) !== item.ordered_qty;

                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="font-bold text-white">{item.product_name}</div>
                            <div className="text-xs text-slate-400">Unit: {item.unit}</div>
                          </td>
                          <td className="text-emerald-400 font-bold">₹{item.price_per_unit.toFixed(2)}</td>
                          <td className="text-slate-300 font-semibold">{item.ordered_qty} {item.unit}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                step="0.1"
                                value={currentWeight}
                                onChange={e => handleWeightChange(item.id, e.target.value)}
                                className="w-28 text-white font-bold border-emerald-500/50"
                              />
                              <span className="text-xs font-bold text-slate-400">{item.unit}</span>
                            </div>
                            {isDiff && (
                              <div className="text-[10px] text-amber-400 font-semibold mt-1">
                                ⚠️ Adj from {item.ordered_qty} {item.unit}
                              </div>
                            )}
                          </td>
                          <td className="font-bold text-white">₹{sub.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center gap-4 border-t border-slate-800 pt-4">
                {saveSuccess ? (
                  <div className="flex items-center gap-2 bg-emerald-900/60 border border-emerald-500 text-emerald-300 text-sm font-bold px-4 py-2.5 rounded-xl">
                    ✅ Weights saved! Order #{selectedOrder?.order_number} packed — Final: ₹{calculateTotal().toFixed(2)}
                  </div>
                ) : (
                  <div />
                )}
                <button type="submit" className="emerald-btn text-sm px-6 py-3">
                  💾 Save Actual Weights &amp; Pack Order
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* DYNAMIC UPI QR CODE MODAL */}
      {upiModalData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-sm w-full border border-emerald-500/40 text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                📱 Dynamic UPI Payment QR
              </h3>
              <button onClick={() => setUpiModalData(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-xl border border-slate-200">
              <img 
                src={upiModalData.qr_image_url} 
                alt="UPI Payment QR Code" 
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div>
              <div className="text-xs text-slate-400 font-bold">Client: {upiModalData.client_name}</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">₹{upiModalData.amount?.toFixed(2)}</div>
              <div className="text-[11px] text-slate-300 font-mono mt-1">UPI ID: <span className="text-emerald-400 font-bold">{upiModalData.upi_id}</span></div>
            </div>

            <div className="text-[10px] text-slate-400 font-bold bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              Accepts GPay • PhonePe • Paytm • BHIM UPI
            </div>

            <button
              onClick={() => setUpiModalData(null)}
              className="emerald-btn w-full justify-center py-2 text-xs font-bold"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 max-w-md w-full border border-rose-500/50 space-y-4 shadow-2xl shadow-rose-950/50">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                ⚠️ Confirm Order Deletion
              </h3>
              <button 
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-rose-950/40 border border-rose-800/40 p-3.5 rounded-xl text-xs space-y-1">
                <div className="text-rose-200 font-bold text-sm">
                  Order #{orderToDelete.order_number}
                </div>
                <div className="text-slate-300 font-semibold">
                  Client: <span className="text-white font-bold">{orderToDelete.client_name}</span>
                </div>
                <div className="text-slate-400">
                  Est Total: ₹{(orderToDelete.estimated_total || 0).toFixed(2)} • {orderToDelete.items?.length || 0} items
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                If the client accidentally placed a duplicate order, this will permanently remove it from the database and cancel packing.
              </p>
            </div>

            <div className="flex justify-end items-center gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteOrder}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-900/40 transition-all flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : '🗑️ Yes, Delete Order'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

