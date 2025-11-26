// src/components/VerifierView.jsx - FIXED VERSION
import { useState } from 'react';
import { Camera, Search, CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { CONTRACTS } from '../contracts/addresses';
import TicketVerifierABI from '../contracts/TicketVerifier.abi.json';
import TicketNFTABI from '../contracts/TicketNFT.abi.json';

// QR Scanner Component
function QRScanner({ onScanSuccess, scanning, setScanning, scanError, setScanError }) {
  const [manualInput, setManualInput] = useState('');

  const handleScan = (err, result) => {
    if (result?.text) {
      try {
        const qrData = JSON.parse(result.text);
        console.log('📱 QR Scanned:', qrData);
        onScanSuccess(qrData);
        setScanning(false);
        setScanError(null);
      } catch (error) {
        console.error('❌ QR Parse Error:', error);
        setScanError('QR Code tidak valid atau rusak');
        setTimeout(() => setScanError(null), 3000);
      }
    }
  };

  const handleManualVerify = () => {
    if (manualInput) {
      // Manual lookup without signature verification
      onScanSuccess({ 
        ticketId: manualInput,
        manual: true 
      });
      setManualInput('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-purple-600" />
        <h2 className="text-2xl font-bold">Verifikasi Tiket</h2>
      </div>

      {scanError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{scanError}</span>
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
              type="text"
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
              Cari
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 font-semibold mb-1">⚠️ Catatan Keamanan:</p>
            <p className="text-xs text-yellow-700">
              Manual lookup tidak memverifikasi signature. Gunakan QR scanner untuk keamanan penuh.
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
              <div className="w-64 h-64 border-4 border-green-500 rounded-lg"></div>
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
function VerificationResult({ result, onClose }) {
  if (!result) return null;

  const getStatusColor = () => {
    if (result.valid) return 'text-green-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (result.valid) {
      return <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />;
    }
    return <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4 animate-pulse" />;
  };

  const getStatusMessage = () => {
    if (result.valid) return '✅ Tiket Valid & Terverifikasi!';
    return '❌ Verifikasi Gagal!';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          {getStatusIcon()}
          
          <h2 className={`text-3xl font-bold mb-2 ${getStatusColor()}`}>
            {getStatusMessage()}
          </h2>
        </div>

        {/* Valid Ticket Info */}
        {result.valid && result.ticketInfo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket ID:</span>
              <span className="font-semibold">#{result.qrData.ticketId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Event ID:</span>
              <span className="font-semibold">#{Number(result.ticketInfo[0])}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket Number:</span>
              <span className="font-semibold">#{Number(result.ticketInfo[1])}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Owner:</span>
              <span className="font-mono text-xs">
                {result.qrData.owner?.slice(0, 6)}...{result.qrData.owner?.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-semibold text-green-600">
                ✅ Verified & Marked Used
              </span>
            </div>
            {result.hash && (
              <div className="mt-2 pt-2 border-t border-green-300">
                <p className="text-xs text-green-700">
                  Transaction: {result.hash.slice(0, 10)}...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error/Invalid Info */}
        {!result.valid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">{result.reason}</p>
                {result.details && (
                  <p className="text-sm text-red-700 mt-1">{result.details}</p>
                )}
              </div>
            </div>
            
            {result.type && (
              <div className="mt-2 pt-2 border-t border-red-300">
                <p className="text-xs text-red-600">Error Type: {result.type}</p>
              </div>
            )}
          </div>
        )}

        {/* Manual Lookup Warning */}
        {result.manual && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800">
              ⚠️ Manual lookup - signature not verified. For full security, use QR scanner.
            </p>
          </div>
        )}

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

// Main Verifier View
export default function VerifierView() {
  const [verificationResult, setVerificationResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const publicClient = usePublicClient();
  const { writeContract, data: hash, error: verifyError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Handle successful blockchain verification
  useState(() => {
    if (isSuccess && hash && verifying) {
      setVerificationResult({
        valid: true,
        reason: '✅ Valid Ticket',
        details: 'Signature verified! Tiket authentic and marked as used.',
        type: 'success',
        hash,
        qrData: verifying,
        ticketInfo: verifying.ticketInfo,
      });
      setVerifying(false);
    }
  }, [isSuccess, hash]);

  const handleVerifyQR = async (qrData) => {
    console.log('🔍 Starting verification for:', qrData);
    
    // Manual lookup (no signature)
    if (qrData.manual) {
      await handleManualLookup(qrData.ticketId);
      return;
    }

    // Full signature verification
    if (!qrData.r || !qrData.s || !qrData.Qx || !qrData.Qy) {
      setVerificationResult({
        valid: false,
        reason: '❌ Invalid QR Data',
        details: 'QR code does not contain valid signature data',
        type: 'invalid_qr'
      });
      return;
    }

    setVerifying(qrData);
    
    try {
      // 1. Check if expired
      const now = Math.floor(Date.now() / 1000);
      if (now > parseInt(qrData.deadline)) {
        setVerificationResult({
          valid: false,
          reason: '⏰ Signature Expired',
          details: `Valid until: ${new Date(parseInt(qrData.deadline) * 1000).toLocaleString()}`,
          type: 'expired',
          qrData
        });
        setVerifying(false);
        return;
      }

      // 2. Get ticket info
      const ticketInfo = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: 'tickets',
        args: [BigInt(qrData.ticketId)],
      });

      const ticketOwner = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: 'ownerOf',
        args: [BigInt(qrData.ticketId)],
      });

      console.log('📋 Ticket info retrieved:', { ticketInfo, ticketOwner });

      // 3. Check ownership
      if (ticketOwner.toLowerCase() !== qrData.owner.toLowerCase()) {
        setVerificationResult({
          valid: false,
          reason: '🚫 Not Owner',
          details: 'This ticket does not belong to the person showing the QR code!',
          type: 'not_owner',
          ticketInfo,
          qrData
        });
        setVerifying(false);
        return;
      }

      // 4. Check if already used
      if (ticketInfo[3]) { // isUsed field
        setVerificationResult({
          valid: false,
          reason: '♻️ Already Used',
          details: 'This ticket has already been used before!',
          type: 'already_used',
          ticketInfo,
          qrData
        });
        setVerifying(false);
        return;
      }

      // 5. ✅ Call verifyAccess on smart contract (this will mark as used automatically)
      console.log('🔐 Calling verifyAccess on blockchain...');
      
      await writeContract({
        address: CONTRACTS.TICKET_VERIFIER,
        abi: TicketVerifierABI,
        functionName: 'verifyAccess',
        args: [
          {
            ticketId: BigInt(qrData.ticketId),
            owner: qrData.owner,
            deadline: BigInt(qrData.deadline),
            metadataHash: qrData.metadataHash,
          },
          {
            r: BigInt(qrData.r),
            s: BigInt(qrData.s),
            Qx: BigInt(qrData.Qx),
            Qy: BigInt(qrData.Qy),
          }
        ],
      });

      // Store ticket info for success display
      qrData.ticketInfo = ticketInfo;

    } catch (error) {
      console.error('❌ Verification error:', error);
      
      let errorType = 'unknown';
      let errorMsg = error.message || 'Verification failed';
      
      if (error.message?.includes('Replayed')) {
        errorType = 'replay_attack';
        errorMsg = '🔁 Replay Attack Detected';
      } else if (error.message?.includes('InvalidSignature')) {
        errorType = 'invalid_signature';
        errorMsg = '❌ Invalid ECDSA Signature';
      } else if (error.message?.includes('InvalidPublicKey')) {
        errorType = 'invalid_pubkey';
        errorMsg = '🔑 Invalid Public Key';
      }

      setVerificationResult({
        valid: false,
        reason: errorMsg,
        details: error.shortMessage || error.message,
        type: errorType,
        qrData
      });
      
      setVerifying(false);
    }
  };

  const handleManualLookup = async (ticketId) => {
    setVerifying(true);
    
    try {
      const ticketInfo = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: 'tickets',
        args: [BigInt(ticketId)],
      });

      setVerificationResult({
        valid: true,
        reason: '📄 Ticket Found',
        details: 'Manual lookup - signature NOT verified',
        type: 'manual',
        ticketInfo,
        ticketId,
        manual: true,
        qrData: { ticketId }
      });
    } catch (error) {
      setVerificationResult({
        valid: false,
        reason: '❌ Ticket Not Found',
        details: error.message,
        type: 'not_found'
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Loading overlay */}
      {(verifying || isConfirming) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
              <div>
                <p className="font-semibold text-lg">Memverifikasi...</p>
                <p className="text-sm text-gray-600">
                  {isConfirming ? 'Menunggu konfirmasi blockchain...' : 'Memeriksa signature...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <QRScanner 
        onScanSuccess={handleVerifyQR}
        scanning={scanning}
        setScanning={setScanning}
        scanError={scanError}
        setScanError={setScanError}
      />
      
      {verificationResult && (
        <VerificationResult 
          result={verificationResult}
          onClose={() => {
            setVerificationResult(null);
            setVerifying(false);
          }}
        />
      )}
    </div>
  );
}