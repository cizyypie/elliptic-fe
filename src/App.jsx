import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Ticket } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import BuyerView from "./components/BuyerView";
import OrganizerView from "./components/OrganizerView";
import VerifierView from "./components/VerifierView";
import { ToastProvider, useToast } from "./components/Toast";

import { useGetContractOwner } from "./hooks/useContracts";

// HEADER COMPONENT
function Header({ role, setRole, address, owner, isOrganizer, toast }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
      <div className="container mx-auto">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/image.png"
              alt="Ellipticheck logo"
              className="w-15 h-10"
            />
            <div>
              <h1 className="text-2xl font-bold">elliptiCheck</h1>
              <p className="text-xs text-white/80">
                Ticket Verification System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Role Selector */}
            <div className="flex gap-2 bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setRole("buyer")}
                className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                  role === "buyer"
                    ? "bg-white text-blue-600"
                    : "text-white hover:bg-white/10"
                }`}
              >
                🎫 Pembeli
              </button>

              <button
                onClick={() => {
                  if (isOrganizer) {
                    setRole("organizer");
                  } else {
                    toast.error(
                      "Access Denied",
                      "You are not the organizer. Only the organizer can access this section.",
                      { duration: 3000 },
                    );
                  }
                }}
                className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                  role === "organizer"
                    ? "bg-white text-blue-600"
                    : "text-white hover:bg-white/10"
                }`}
              >
                🎪 Organizer
                {!isOrganizer && <span className="ml-1">🔒</span>}
              </button>

              <button
                onClick={() => {
                  if (isOrganizer) {
                    setRole("verifier");
                  } else {
                    toast.error(
                      "Access Denied",
                      "You are not the organizer. Only the organizer can access the verifier section.",
                      { duration: 3000 },
                    );
                  }
                }}
                className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                  role === "verifier"
                    ? "bg-white text-blue-600"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Verifier
                {!isOrganizer && <span className="ml-1">🔒</span>}
              </button>
            </div>

            {/* Wallet Connect Button */}
            <ConnectButton />
          </div>
        </div>

        {/* Owner Badge */}
        {address && isOrganizer && (
          <div className="text-center mt-3">
            <span className="inline-block bg-yellow-400 text-blue-900 px-4 py-1 rounded-full text-xs font-bold">
              👑 Organizer - Full Access Granted
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// QR CODE MODAL WITH DOWNLOAD FEATURE
function QRCodeModal({ ticket, onClose }) {
  if (!ticket) return null;

  // ticket is expected to be: { qrPayload, displayInfo }
  const { qrPayload, displayInfo } = ticket || {};
  const isSigned = !!(qrPayload && qrPayload.r && qrPayload.s);

  // QR only contains the short payload
  const qrData = JSON.stringify(qrPayload || {});

  // Download QR Code as PNG
  const handleDownloadQR = () => {
    const svg = document.getElementById("ticket-qr-code");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Set canvas size to match QR size (1000x1000 for high quality)
    canvas.width = 1000;
    canvas.height = 1000;

    img.onload = () => {
      // Fill white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code centered
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to PNG and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ticket-${displayInfo?.tokenId || "qr"}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isSigned ? "🔐 Signed QR Code" : "⚠️ Unsigned QR Code"}
        </h2>

        <div className="bg-white p-4 rounded-xl mb-4 flex justify-center">
          <QRCodeSVG
            id="ticket-qr-code"
            value={qrData}
            size={400}
            level="L"
            bgColor="#FFFFFF"
            fgColor="#000000"
            includeMargin={true}
            marginSize={4}
          />
        </div>

        {isSigned ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-800">
              Cryptographically signed and secure
            </p>
            {displayInfo?.deadline && (
              <p className="text-xs text-green-600 mt-1">
                Valid until:{" "}
                {new Date(Number(displayInfo.deadline) * 1000).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Not cryptographically signed - for display only
            </p>
          </div>
        )}

        <div className="text-center mb-4">
          <p className="font-semibold text-lg">
            Token #{displayInfo?.tokenId ?? "-"}
          </p>
          <p className="text-gray-600">Event #{displayInfo?.eventId ?? "-"}</p>
          <p className="text-gray-600">
            Tiket #{displayInfo?.ticketNumber ?? "-"}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleDownloadQR}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download QR Code
          </button>

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

// MAIN APP COMPONENT
function AppContent() {
  const [role, setRole] = useState("buyer");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const toast = useToast(); // Add toast hook

  const { address, isConnected } = useAccount();

  const {
    owner,
    isLoading: ownerLoading,
    error: ownerError,
  } = useGetContractOwner();

  // Organizer = connected address === contract owner and owner has finished loading
  const isOrganizer =
    !!address &&
    !!owner &&
    !ownerLoading &&
    address.toLowerCase() === owner.toLowerCase();

  // Debug logging
  useEffect(() => {
    console.log("=== DEBUG INFO ===");
    console.log("Connected:", isConnected);
    console.log("Your Address:", address);
    console.log("Contract Owner:", owner);
    console.log("Owner Loading:", ownerLoading);
    console.log("Owner Error:", ownerError);
    console.log("Is Organizer:", isOrganizer);
    console.log("================");
  }, [address, owner, isConnected, ownerLoading, ownerError, isOrganizer]);

  // Auto-reset role if user is not organizer
  useEffect(() => {
    if (!isOrganizer && (role === "organizer" || role === "verifier")) {
      console.log("Auto-resetting to buyer role (not organizer)");
      setRole("buyer");
    }
  }, [isOrganizer, role]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        role={role}
        setRole={setRole}
        address={address}
        owner={owner}
        isOrganizer={isOrganizer}
        toast={toast}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Connection Warning */}
        {!isConnected && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⚠️</div>
              <div>
                <p className="font-semibold text-yellow-800">
                  Wallet Belum Terkoneksi
                </p>
                <p className="text-yellow-700 text-sm">
                  Silakan connect wallet Anda untuk menggunakan aplikasi
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Owner Check Loading */}
        {ownerLoading && isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-blue-800">Checking Address...</p>
          </div>
        )}

        {/* Owner Check Error */}
        {ownerError && isConnected && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error checking owner:</p>
            <p className="text-red-700 text-sm">
              {String(ownerError.message || ownerError)}
            </p>
          </div>
        )}

        {/* Views */}
        {role === "buyer" && (
          <BuyerView
            address={address}
            isConnected={isConnected}
            onShowQR={setSelectedTicket}
          />
        )}

        {role === "organizer" &&
          (isOrganizer ? (
            <OrganizerView />
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">
                Access Denied
              </h2>
              <p className="text-red-700 mb-4">
                Only contract organizer can access organizer panel
              </p>
            </div>
          ))}

        {role === "verifier" &&
          (isOrganizer ? (
            <VerifierView />
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">
                Access Denied
              </h2>
              <p className="text-red-700 mb-4">
                Only organizer can verify tickets
              </p>
            </div>
          ))}
      </main>

      {/* QR Code Modal */}
      {selectedTicket && (
        <QRCodeModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}

// Wrap AppContent with ToastProvider
export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
