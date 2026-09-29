import React, { useState } from 'react';

export default function InvoicesRemote({ orders, clients, onGenerateInvoice }) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    setLoadingPdf(true);
    try {
      const res = await onGenerateInvoice(selectedOrderId);
      if (res && res.pdf_url) {
        setGeneratedPdfUrl(`http://localhost:8000${res.pdf_url}`);
      }
    } catch (err) {
      alert("Error generating invoice PDF");
    } finally {
      setLoadingPdf(false);
    }
  };

  const currentOrder = orders.find(o => o.id === parseInt(selectedOrderId));
  const currentClient = clients.find(c => c.business_name === currentOrder?.client_name);

  const getWhatsAppShareLink = () => {
    if (!currentOrder || !generatedPdfUrl) return '#';
    const text = `Hello *${currentOrder.client_name}*,\n\nHere is your fresh produce invoice *#DV-INV-2026-${currentOrder.id}* from *Divine Vegetables* for delivery on ${currentOrder.delivery_date}.\n\nTotal Amount: *₹${currentOrder.actual_final_total.toFixed(2)}*\nPDF Invoice Link: ${generatedPdfUrl}\n\nThank you for choosing Divine Vegetables! 🥬🍅`;
    return `https://api.whatsapp.com/send?phone=${encodeURIComponent(currentClient?.phone || '')}&text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-8">
      
      {/* Remote PDF Generator Top Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          📄 Out-of-City Remote PDF Invoice Generator
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Generate branded Divine Vegetables PDF Invoices remotely from anywhere in the world and send to Hotels/Cafes instantly via WhatsApp or Email.
        </p>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Select Order to Generate PDF</label>
            <select 
              value={selectedOrderId}
              onChange={e => setSelectedOrderId(e.target.value)}
              className="w-full"
            >
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  Order #{o.order_number} - {o.client_name} (₹{o.actual_final_total.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <button type="submit" disabled={loadingPdf} className="emerald-btn w-full justify-center">
              {loadingPdf ? 'Generating PDF...' : '✨ Generate Branded PDF Invoice'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {generatedPdfUrl && (
              <a 
                href={getWhatsAppShareLink()} 
                target="_blank" 
                rel="noreferrer"
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-900/40 w-full"
              >
                💬 Share PDF via WhatsApp
              </a>
            )}
          </div>
        </form>
      </div>

      {/* PDF Preview Frame */}
      {generatedPdfUrl && (
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              📑 Divine Vegetables PDF Invoice Preview
            </h3>
            <a 
              href={generatedPdfUrl} 
              target="_blank" 
              download
              className="outline-btn text-xs"
            >
              ⬇️ Download PDF File
            </a>
          </div>
          <div className="w-full h-[650px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            <iframe 
              src={generatedPdfUrl} 
              title="Invoice PDF" 
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

    </div>
  );
}
