// src/components/VerifierView.jsx
import { useState } from 'react';
import { Camera, Search, CheckCircle, XCircle } from 'lucide-react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { useVerifyTicket } from '../hooks/useContracts';

// QR Scanner Component
function QRScanner({ onScanSuccess }) {
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanError, setScanError] = useState(null);

  const handleScan = (err, result) => {
    if (result) {
      try {
        const ticketData = JSON.parse(result.text);
        onScanSuccess(ticketData.ticketId);
        setScanning(false);
        setScanError(null);
      } catch (error) {
        setScanError('QR Code tidak valid');
        setTimeout(() => setScanError(null), 3000);
      }
    }
  };

  const handleManualVerify = () => {
    if (manualInput) {
      onScanSuccess(parseInt(manualInput));
      setManualInput('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-2 text-center">Scan Tiket</h2>
      <p className="text-gray-600 text-sm text-center mb-6">
        Scan QR code atau masukkan ID tiket secara manual
      </p>

      {scanError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
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
            Buka Kamera untuk Scan
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
              onKeyPress={(e) => e.key === 'Enter' && handleManualVerify()}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleManualVerify}
              disabled={!manualInput}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              <Search className="w-4 h-4" />
              Verifikasi
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800">
              💡 <strong>Tips:</strong> Arahkan kamera ke QR code tiket atau masukkan nomor ID tiket secara manual
            </p>
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
            
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-white rounded-lg opacity-50"></div>
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

// Verification Result Modal
function VerificationResult({ result, onClose, onMarkUsed, isPending }) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          {result.valid ? (
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />
          ) : (
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4 animate-pulse" />
          )}
          
          <h2 className={`text-3xl font-bold mb-2 ${
            result.valid ? 'text-green-600' : 'text-red-600'
          }`}>
            {result.valid ? 'Tiket Valid! ✅' : 'Tiket Tidak Valid! ❌'}
          </h2>
        </div>

        {result.valid && result.ticket && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Token ID:</span>
              <span className="font-semibold">#{result.ticketId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Event ID:</span>
              <span className="font-semibold">#{Number(result.ticket.eventId)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket Number:</span>
              <span className="font-semibold">#{Number(result.ticket.ticketNumber)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Owner:</span>
              <span className="font-mono text-xs">
                {result.owner?.slice(0, 6)}...{result.owner?.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${result.ticket.isUsed ? 'text-red-600' : 'text-green-600'}`}>
                {result.ticket.isUsed ? 'Sudah Digunakan' : 'Belum Digunakan'}
              </span>
            </div>
          </div>
        )}

        {!result.valid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-center text-red-700">{result.reason}</p>
          </div>
        )}

        <div className="space-y-2">
          {result.valid && !result.ticket?.isUsed && (
            <button
              onClick={() => onMarkUsed(result.ticketId)}
              disabled={isPending}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {isPending ? 'Memproses...' : '✅ Tandai Sudah Digunakan'}
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Verifier View
export default function VerifierView() {
  const [verificationResult, setVerificationResult] = useState(null);
  const { verifyTicket, markAsUsed, isPending } = useVerifyTicket();

  const handleVerifyTicket = async (ticketId) => {
    try {
      const result = await verifyTicket(ticketId);
      setVerificationResult(result);
    } catch (error) {
      console.error('Error verifying ticket:', error);
      setVerificationResult({
        valid: false,
        ticketId,
        reason: 'Error: ' + error.message
      });
    }
  };

  const handleMarkUsed = async (ticketId) => {
    try {
      await markAsUsed(ticketId);
      setVerificationResult(null);
      alert('Tiket berhasil ditandai sebagai sudah digunakan! ✅');
    } catch (error) {
      console.error('Error marking ticket:', error);
      alert('Gagal menandai tiket: ' + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <QRScanner onScanSuccess={handleVerifyTicket} />
      
      {verificationResult && (
        <VerificationResult 
          result={verificationResult}
          onClose={() => setVerificationResult(null)}
          onMarkUsed={handleMarkUsed}
          isPending={isPending}
        />
      )}
    </div>
  );
}