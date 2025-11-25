// src/components/QRScanner.jsx - Enhanced with Full Verification
import { useState } from 'react';
import { Camera, Search, Shield, AlertTriangle } from 'lucide-react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { CONTRACTS } from '../contracts/addresses';
import TicketVerifierABI from '../contracts/TicketVerifier.abi.json';
import TicketNFTABI from '../contracts/TicketNFT.abi.json';

export default function QRScanner({ onVerificationResult }) {
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanError, setScanError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const publicClient = usePublicClient();
  const { writeContract, data: hash, error: verifyError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleScan = (err, result) => {
    if (result?.text) {
      try {
        const qrData = JSON.parse(result.text);
        verifyQRData(qrData);
        setScanning(false);
        setScanError(null);
      } catch (error) {
        setScanError('QR Code tidak valid atau rusak');
        setTimeout(() => setScanError(null), 3000);
      }
    }
  };

  const verifyQRData = async (qrData) => {
    setVerifying(true);
    setScanError(null);

    try {
      // 1. Validate QR data structure
      if (!qrData.ticketId || !qrData.owner || !qrData.r || !qrData.s || !qrData.Qx || !qrData.Qy) {
        throw new Error('QR data tidak lengkap');
      }

      // 2. Check expiry
      const now = Math.floor(Date.now() / 1000);
      if (now > parseInt(qrData.deadline)) {
        onVerificationResult({
          valid: false,
          reason: '⏰ Signature Expired',
          details: 'QR code sudah tidak berlaku. Minta owner generate ulang.',
          type: 'expired'
        });
        setVerifying(false);
        return;
      }

      // 3. Get ticket info from blockchain
      const ticketInfo = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: 'getTicket',
        args: [BigInt(qrData.ticketId)],
      });

      const ticketOwner = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: 'ownerOf',
        args: [BigInt(qrData.ticketId)],
      });

      // 4. Verify ownership
      if (ticketOwner.toLowerCase() !== qrData.owner.toLowerCase()) {
        onVerificationResult({
          valid: false,
          reason: '🚫 Not Owner',
          details: 'Tiket ini bukan milik orang yang menunjukkan QR code!',
          type: 'not_owner',
          ticketInfo,
          qrData
        });
        setVerifying(false);
        return;
      }

      // 5. Check if already used
      const isUsed = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: 'isTicketUsed',
        args: [BigInt(qrData.ticketId)],
      });

      if (isUsed) {
        onVerificationResult({
          valid: false,
          reason: '♻️ Already Used',
          details: 'Tiket ini sudah pernah digunakan sebelumnya!',
          type: 'already_used',
          ticketInfo,
          qrData
        });
        setVerifying(false);
        return;
      }

      // 6. Check if already verified (double use attempt)
      const isVerified = await publicClient.readContract({
        address: CONTRACTS.TICKET_VERIFIER,
        abi: TicketVerifierABI,
        functionName: 'isTicketVerified',
        args: [BigInt(qrData.ticketId)],
      });

      if (isVerified) {
        onVerificationResult({
          valid: false,
          reason: '🔄 Double Use Attempt',
          details: 'Tiket ini sudah diverifikasi! Kemungkinan double use.',
          type: 'double_use',
          ticketInfo,
          qrData
        });
        setVerifying(false);
        return;
      }

      // 7. Verify signature on blockchain
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

      // Success will be handled by useEffect watching isSuccess
    } catch (error) {
      console.error('Verification error:', error);
      
      let errorType = 'unknown';
      let errorMsg = error.message || 'Gagal memverifikasi';
      
      // Parse specific errors
      if (error.message?.includes('ReplayAttack')) {
        errorType = 'replay_attack';
        errorMsg = '🔁 Replay Attack Detected';
      } else if (error.message?.includes('InvalidSignature')) {
        errorType = 'invalid_signature';
        errorMsg = '❌ Invalid ECDSA Signature';
      } else if (error.message?.includes('InvalidPublicKey')) {
        errorType = 'invalid_pubkey';
        errorMsg = '🔑 Invalid Public Key';
      }

      onVerificationResult({
        valid: false,
        reason: errorMsg,
        details: error.shortMessage || error.message,
        type: errorType,
        qrData
      });
      
      setVerifying(false);
    }
  };

  // Handle successful verification
  useState(() => {
    if (isSuccess && hash) {
      onVerificationResult({
        valid: true,
        reason: '✅ Valid Ticket',
        details: 'Signature verified! Tiket authentic.',
        type: 'success',
        hash
      });
      setVerifying(false);
    }
  }, [isSuccess, hash]);

  const handleManualVerify = async () => {
    if (!manualInput) return;

    setVerifying(true);
    
    try {
      // Simple lookup for manual input (without signature)
      const ticketInfo = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: 'getTicket',
        args: [BigInt(manualInput)],
      });

      onVerificationResult({
        valid: true,
        reason: 'Ticket Found (No Signature)',
        details: 'Manual lookup - signature not verified',
        type: 'manual',
        ticketInfo,
        ticketId: manualInput,
        warning: '⚠️ Gunakan QR scanner untuk verifikasi penuh'
      });
    } catch (error) {
      onVerificationResult({
        valid: false,
        reason: 'Ticket Not Found',
        details: error.message,
        type: 'not_found'
      });
    } finally {
      setVerifying(false);
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{scanError}</span>
        </div>
      )}

      {verifying && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <div>
              <p className="font-semibold text-blue-900">Memverifikasi...</p>
              <p className="text-sm text-blue-700">
                {isConfirming ? 'Menunggu konfirmasi blockchain...' : 'Memeriksa signature ECDSA...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!scanning ? (
        <div className="space-y-4">
          <button
            onClick={() => setScanning(true)}
            disabled={verifying}
            className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center gap-2 transition disabled:bg-gray-400"
          >
            <Camera className="w-5 h-5" />
            Scan QR Code
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
              disabled={verifying}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
            />
            <button
              onClick={handleManualVerify}
              disabled={!manualInput || verifying}
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