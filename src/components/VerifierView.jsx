import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  Shield,
  AlertTriangle,
  X,
} from "lucide-react";
import { useWriteContract, usePublicClient } from "wagmi";
import { CONTRACTS } from "../contracts/addresses";
import QrScanner from "qr-scanner";
import { useToast } from "./Toast";

import TicketNFTABIRaw from "../contracts/TicketNFT.abi.json";
import TicketVerifierABIRaw from "../contracts/TicketVerifier.abi.json";

const TicketNFTABI = Array.isArray(TicketNFTABIRaw)
  ? TicketNFTABIRaw
  : TicketNFTABIRaw.abi || [];

const TicketVerifierABI = Array.isArray(TicketVerifierABIRaw)
  ? TicketVerifierABIRaw
  : TicketVerifierABIRaw.abi || [];

//  Normalize short keys → full keys
function normalizeQRData(raw) {
  if (!raw) return null;

  // Short key format (from QR)
  if (raw.t && raw.o) {
    return {
      ticketId: String(raw.t),
      owner: raw.o,
      deadline: String(raw.d),
      metadataHash: raw.m,
      r: raw.r,
      s: raw.s,
      Qx: raw.x,
      Qy: raw.y,
    };
  }

  // Already full format
  return raw;
}

// ================= IMPROVED QR SCANNER =================
function QRScanner({
  onScanSuccess,
  scanning,
  setScanning,
  scanError,
  setScanError,
}) {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const toast = useToast();

  // Initialize QR Scanner when camera starts
  useEffect(() => {
    if (scanning && videoRef.current) {
      console.log("📷 Starting camera...");
      
      // Create QR Scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log("✅ QR Code detected:", result.data);
          try {
            const raw = JSON.parse(result.data);
            const qrData = normalizeQRData(raw);
            console.log("📱 QR from camera:", qrData);
            
            toast.success(
              "QR Code Detected ✓",
              "Processing ticket verification...",
              { duration: 2000 }
            );
            
            onScanSuccess(qrData);
            setScanning(false);
            setScanError(null);
          } catch (error) {
            console.error("❌ Parse error:", error);
            setScanError("QR Code tidak valid");
            toast.error(
              "Invalid QR Code",
              "Could not read QR code data",
              { duration: 4000 }
            );
            setTimeout(() => setScanError(null), 3000);
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera on mobile
          maxScansPerSecond: 5, // Scan more frequently
        }
      );

      // Start scanning
      qrScannerRef.current
        .start()
        .then(() => {
          console.log("✅ Camera started successfully");
          setCameraReady(true);
          toast.info("Camera Active", "Point camera at QR code", {
            duration: 3000,
          });
        })
        .catch((err) => {
          console.error("❌ Camera error:", err);
          setScanError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
          toast.error(
            "Camera Error",
            "Could not access camera. Please check permissions.",
            { duration: 5000 }
          );
        });

      // Cleanup
      return () => {
        if (qrScannerRef.current) {
          console.log("🛑 Stopping camera...");
          qrScannerRef.current.stop();
          qrScannerRef.current.destroy();
          qrScannerRef.current = null;
          setCameraReady(false);
        }
      };
    }
  }, [scanning]);

  // Handle image upload with qr-scanner library
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setScanError(null);

    const loadingToastId = toast.loading(
      "Processing Image",
      "Reading QR code from image..."
    );

    try {
      console.log("📸 Processing image...");

      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });

      console.log("✅ QR decoded from image:", result.data);

      const raw = JSON.parse(result.data);
      const qrData = normalizeQRData(raw);

      toast.removeToast(loadingToastId);
      toast.success(
        "Image Processed ✓",
        "QR code detected from image",
        { duration: 2000 }
      );

      onScanSuccess(qrData);
    } catch (error) {
      console.error("Image decode error:", error);
      toast.removeToast(loadingToastId);
      
      setScanError("Gagal membaca QR dari gambar. Pastikan gambar jelas.");
      toast.error(
        "Image Read Failed",
        "Could not detect QR code in image. Please try a clearer photo.",
        { duration: 5000 }
      );
      setTimeout(() => setScanError(null), 4000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold">Verifikasi Tiket</h2>
      </div>

      {scanError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{scanError}</span>
        </div>
      )}

      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
            <p className="text-blue-800">Memproses gambar QR...</p>
          </div>
        </div>
      )}

      {!scanning ? (
        <div className="space-y-4">
          <button
            onClick={() => setScanning(true)}
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 transition disabled:bg-gray-400"
          >
            <Camera className="w-5 h-5" />
            Scan dengan Kamera
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Atau</span>
            </div>
          </div>

          {/* Image Upload */}
          <label
            className={`w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 transition cursor-pointer ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Upload className="w-5 h-5" />
            Upload Gambar QR Code
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 font-semibold mb-1">
              💡 Tips untuk Scanning:
            </p>
            <p className="text-xs text-blue-700">
              • Pastikan QR code terlihat jelas dan tidak blur
              <br />
              • Gunakan pencahayaan yang cukup
              <br />
              • Tahan kamera tetap stabil
              <br />
              • Jarak ideal: 15-30cm dari QR code
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-black rounded-lg overflow-hidden relative" style={{ aspectRatio: '4/3' }}>
            {/* Video element for camera feed */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Scanning overlay */}
            {cameraReady && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative">
                  {/* Scanning frame */}
                  <div className="w-64 h-64 border-4 border-green-500 rounded-lg relative">
                    {/* Corner markers */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-8 border-l-8 border-green-400"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-8 border-r-8 border-green-400"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-8 border-l-8 border-green-400"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-8 border-r-8 border-green-400"></div>
                  </div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-400 animate-scan"></div>
                </div>
              </div>
            )}

            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-3" />
                  <p className="text-white font-semibold">Starting Camera...</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p>📷 Posisikan QR code di dalam kotak hijau</p>
          </div>

          <button
            onClick={() => setScanning(false)}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Tutup Kamera
          </button>
        </div>
      )}

      {/* Add scanning animation CSS */}
      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0;
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// ================= VERIFICATION RESULT =================
function VerificationResult({ result, onClose }) {
  if (!result) return null;

  const isSuccess = result.valid;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          {isSuccess ? (
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />
          ) : (
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4 animate-pulse" />
          )}
          <h2
            className={`text-3xl font-bold mb-2 ${
              isSuccess ? "text-green-600" : "text-red-600"
            }`}
          >
            {isSuccess
              ? "✅ Tiket Valid & Terverifikasi!"
              : "❌ Verifikasi Gagal"}
          </h2>
        </div>

        {isSuccess && result.ticketInfo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket ID:</span>
              <span className="font-semibold">#{result.qrData.ticketId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Event ID:</span>
              <span className="font-semibold">
                #{Number(result.ticketInfo[0])}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nomor Tiket:</span>
              <span className="font-semibold">
                #{Number(result.ticketInfo[1])}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Owner:</span>
              <span className="font-mono text-xs">
                {result.qrData.owner
                  ? `${result.qrData.owner.slice(
                      0,
                      6
                    )}...${result.qrData.owner.slice(-4)}`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-semibold text-green-600">✅ Verified</span>
            </div>
            {result.hash && (
              <div className="mt-2 pt-2 border-t border-green-300">
                <p className="text-xs text-green-700">
                  Tx: {result.hash.slice(0, 10)}...
                </p>
              </div>
            )}
          </div>
        )}

        {!isSuccess && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
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
                <p className="text-xs text-red-600">Error: {result.type}</p>
              </div>
            )}
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

// ================= MAIN VIEW =================
export default function VerifierView() {
  const [verificationResult, setVerificationResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const toast = useToast();

  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const handleVerifyQR = async (qrData) => {
    console.log("🔍 Verifying QR:", qrData);

    if (!qrData || !qrData.r || !qrData.s || !qrData.Qx || !qrData.Qy) {
      console.error("❌ Missing signature components:", {
        hasR: !!qrData?.r,
        hasS: !!qrData?.s,
        hasQx: !!qrData?.Qx,
        hasQy: !!qrData?.Qy,
      });
      
      toast.error(
        "Invalid QR Data",
        "QR code is missing signature components",
        { duration: 5000 }
      );
      
      setVerificationResult({
        valid: false,
        reason: "❌ QR tidak valid",
        details: "Data signature tidak lengkap",
        type: "invalid_qr",
      });
      return;
    }

    setVerifying(true);

    const loadingToastId = toast.loading(
      "Verifying Ticket",
      "Checking ticket authenticity..."
    );

    try {
      const now = Math.floor(Date.now() / 1000);
      if (now > parseInt(qrData.deadline)) {
        toast.removeToast(loadingToastId);
        toast.error(
          "Ticket Expired",
          "This QR code has expired. Please request a new one.",
          { duration: 6000 }
        );
        
        setVerificationResult({
          valid: false,
          reason: "⏰ Kedaluwarsa",
          details: `Berlaku sampai: ${new Date(
            parseInt(qrData.deadline) * 1000
          ).toLocaleString()}`,
          type: "expired",
        });
        return;
      }

      const ticketInfo = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: "tickets",
        args: [BigInt(qrData.ticketId)],
      });

      const ticketOwner = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: "ownerOf",
        args: [BigInt(qrData.ticketId)],
      });

      if (ticketOwner.toLowerCase() !== qrData.owner.toLowerCase()) {
        toast.removeToast(loadingToastId);
        toast.error(
          "Ownership Mismatch",
          "This ticket does not belong to the QR code holder",
          { duration: 6000 }
        );
        
        setVerificationResult({
          valid: false,
          reason: "🚫 Bukan pemilik",
          details: "Alamat tidak cocok",
          type: "not_owner",
        });
        return;
      }

      if (ticketInfo[3]) {
        toast.removeToast(loadingToastId);
        toast.warning(
          "Already Used",
          "This ticket has already been used",
          { duration: 6000 }
        );
        
        setVerificationResult({
          valid: false,
          reason: "♻️ Sudah digunakan",
          details: "Tiket sudah pernah dipakai",
          type: "already_used",
        });
        return;
      }

      console.log("▶️ verifyAccess req:", {
        ticketId: String(qrData.ticketId),
        owner: qrData.owner,
        deadline: String(qrData.deadline),
        metadataHash: qrData.metadataHash,
      });

      const hash = await writeContractAsync({
        address: CONTRACTS.TICKET_VERIFIER,
        abi: TicketVerifierABI,
        functionName: "verifyAccess",
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
          },
        ],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      toast.removeToast(loadingToastId);

      if (receipt.status === "success") {
        toast.success(
          "Verification Successful! ✅",
          "Ticket is valid and has been marked as used",
          { duration: 6000 }
        );
        
        setVerificationResult({
          valid: true,
          reason: "✅ Valid",
          details: "Signature terverifikasi",
          type: "success",
          hash,
          qrData,
          ticketInfo,
        });
      } else {
        toast.error(
          "Transaction Failed",
          "Verification transaction did not complete successfully",
          { duration: 6000 }
        );
        
        setVerificationResult({
          valid: false,
          reason: "❌ Tx gagal",
          details: "Transaction failed",
          type: "tx_failed",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.removeToast(loadingToastId);

      let errorMsg = "Verifikasi gagal";
      let errorType = "unknown";
      const raw = (error.shortMessage || error.message || "").toString();
      console.error("RAW ERROR:", raw);

      if (raw.includes("Expired")) {
        errorType = "expired";
        errorMsg = "⏰ Kedaluwarsa";
      } else if (raw.includes("Replayed")) {
        errorType = "replay";
        errorMsg = "🔁 Replay attack";
      } else if (raw.includes("InvalidSignature")) {
        errorType = "invalid_sig";
        errorMsg = "❌ Signature invalid";
      } else if (raw.includes("InvalidPublicKey")) {
        errorType = "invalid_pubkey";
        errorMsg = "🔑 Public key invalid";
      } else if (raw.includes("NotOwner")) {
        errorType = "not_owner";
        errorMsg = "🚫 Bukan pemilik";
      }

      toast.error("Verification Failed", errorMsg, { duration: 7000 });

      setVerificationResult({
        valid: false,
        reason: errorMsg,
        details: raw,
        type: errorType,
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {verifying && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
              <div>
                <p className="font-semibold text-lg">Memverifikasi...</p>
                <p className="text-sm text-gray-600">Memeriksa signature...</p>
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