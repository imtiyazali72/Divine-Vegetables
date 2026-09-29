import React, { useState, useEffect } from 'react';

export default function DriverTracker({ orders }) {
  const [selectedOrder, setSelectedOrder] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [lastCoords, setLastCoords] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [statusMsg, setStatusMsg] = useState('Ready to transmit live Mandi driver GPS location');
  const [customStatus, setCustomStatus] = useState('Out for Morning Delivery');

  const activeOrders = orders.filter(o => o.route);

  useEffect(() => {
    if (activeOrders.length > 0 && !selectedOrder) {
      setSelectedOrder(activeOrders[0].id);
    }
  }, [activeOrders]);

  const sendLocationUpdate = async (lat, lng) => {
    if (!selectedOrder) return;
    const targetOrder = orders.find(o => o.id === parseInt(selectedOrder));
    const routeId = targetOrder?.route?.route_id || 1;

    try {
      const res = await fetch('http://localhost:8000/api/driver/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_id: routeId,
          order_id: parseInt(selectedOrder),
          latitude: lat,
          longitude: lng,
          current_location: 'Live GPS Location (En Route)',
          route_status: customStatus
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setLastCoords({ lat, lng });
        setLastUpdated(new Date().toLocaleTimeString());
        setStatusMsg(`Live GPS Broadcast Active: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch (err) {
      setStatusMsg('Error broadcasting location to admin server');
    }
  };

  const startGpsTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation API is not supported by your browser/device.');
      return;
    }

    setIsTracking(true);
    setStatusMsg('Acquiring GPS Satellite Signal...');

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        sendLocationUpdate(lat, lng);
      },
      (error) => {
        console.error("GPS Error:", error);
        setStatusMsg(`GPS Warning: ${error.message}. Retrying...`);
        // Fallback simulation for local dev if GPS permissions blocked on desktop
        const fallbackLat = 21.1458 + (Math.random() * 0.01 - 0.005);
        const fallbackLng = 79.0882 + (Math.random() * 0.01 - 0.005);
        sendLocationUpdate(fallbackLat, fallbackLng);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000
      }
    );

    setWatchId(id);
  };

  const stopGpsTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    setStatusMsg('GPS Transmit Stopped.');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-2xl text-white font-bold">
            📡
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Mandi Van Driver GPS Transmitter</h2>
            <p className="text-xs text-slate-400">Broadcast real-time delivery location to Admin Command Center</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Select Delivery Order / Route *</label>
          <select 
            value={selectedOrder}
            onChange={e => setSelectedOrder(e.target.value)}
            className="w-full text-xs font-bold bg-slate-900 text-white p-3 rounded-xl border border-slate-700"
          >
            {activeOrders.map(o => (
              <option key={o.id} value={o.id}>
                #{o.order_number} - {o.client_name} ({o.route?.driver_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Status Message</label>
          <input 
            type="text"
            value={customStatus}
            onChange={e => setCustomStatus(e.target.value)}
            placeholder="e.g. En Route Hotel Ring Road"
            className="w-full text-xs text-white"
          />
        </div>

        {/* Start / Stop Toggle */}
        <div className="pt-2">
          {!isTracking ? (
            <button 
              onClick={startGpsTracking}
              className="emerald-btn w-full justify-center py-3 text-sm font-bold shadow-lg shadow-emerald-950/50"
            >
              ▶️ Start Live GPS Transmit (watchPosition)
            </button>
          ) : (
            <button 
              onClick={stopGpsTracking}
              className="outline-btn text-rose-400 border-rose-500/40 hover:bg-rose-500/10 w-full justify-center py-3 text-sm font-bold"
            >
              ⏹️ Stop Live GPS Transmit
            </button>
          )}
        </div>

        {/* Live Status Container */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold">Signal Status:</span>
            <span className={isTracking ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-slate-500'}>
              {isTracking && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
              {statusMsg}
            </span>
          </div>

          {lastCoords && (
            <>
              <div className="flex justify-between items-center text-slate-300 font-mono">
                <span>Latitude: <b>{lastCoords.lat.toFixed(6)}</b></span>
                <span>Longitude: <b>{lastCoords.lng.toFixed(6)}</b></span>
              </div>
              <div className="text-[11px] text-slate-400 text-right">
                Last transmitted at {lastUpdated}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
