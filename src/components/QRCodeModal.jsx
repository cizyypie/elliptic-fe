// src/components/QRCodeModal.jsx
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeModal({ ticket, onClose }) {
  if (!ticket) return null;

  const qrData = JSON.stringify({
    ticketId: Number(ticket.tokenId || ticket.ticketId),
    eventId: Number(ticket.eventId),
    ticketNumber: Number(ticket.ticketNumber),
    owner: ticket.owner,
    timestamp: Date.now()
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">QR Code Tiket</h2>
        
        <div className="bg-gray-100 p-6 rounded-xl mb-4 flex justify-center">
          <QRCodeSVG 
            value={qrData}
            size={280}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="text-center mb-4">
          <p className="font-semibold text-lg">Event #{ticket.eventId}</p>
          <p className="text-gray-600">Tiket #{Number(ticket.ticketNumber)}</p>
          <p className="text-sm text-gray-500 mt-2 mb-1">
            Tunjukkan QR code ini saat masuk venue
          </p>
          {ticket.owner && (
            <p className="text-xs text-gray-400 font-mono">
              Owner: {ticket.owner.slice(0, 6)}...{ticket.owner.slice(-4)}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}