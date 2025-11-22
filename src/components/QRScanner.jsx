// src/components/QRScanner.jsx
import { useState } from 'react';
import { Camera, Search } from 'lucide-react';
import { BarcodeScannerComponent } from 'react-qr-barcode-scanner';

export default function QRScanner({ onScanSuccess }) {
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanError, setScanError] = useState(null);

  const handleScan = (err, result) => {
    if (result) {
      try {
        const ticketData = JSON.parse(result.text);
        onScanSuccess(ticketData);
        setScanning(false);
        setScanError(null);
      } catch (error) {
        setScanError('QR Code tidak valid');
        setTimeout(() => setScanError(null), 3000);
      }
    }
    
    if (err) {
      console.error('Scan error:', err);
    }
  };

  const handleManualVerify = () => {
    if (manualInput) {
      onScanSuccess({ 
        ticketId: parseInt(manualInput),
        eventId: 1, // Default event
        manual: true 
      });
      setManualInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualVerify();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Scan Tiket</h2>

      {scanError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {scanError}
        </div>
      )}

      {!scanning ? (
        <div className="space-y-4">
          <button
            onClick={() => setScanning(true)}
            className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center gap-2 transition"
          >
            <Camera className="w-5 h-5" />
            Buka Kamera
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Atau</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Masukkan Ticket ID"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleManualVerify}
              disabled={!manualInput}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              <Search className="w-4 h-4" />
              Cari
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 mt-4">
            <p>💡 Tips:</p>
            <p>Arahkan kamera ke QR code tiket untuk memverifikasi</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg overflow-hidden relative">
            <BarcodeScannerComponent
              width="100%"
              height={400}
              onUpdate={handleScan}
              stopStream={!scanning}
            />
            
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-64 h-64 border-4 border-white rounded-lg opacity-50"></div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p>📷 Posisikan QR code di dalam kotak</p>
          </div>
          
          <button
            onClick={() => setScanning(false)}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            Tutup Kamera
          </button>
        </div>
      )}
    </div>
  );
}