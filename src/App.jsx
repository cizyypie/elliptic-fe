// src/App.jsx
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Ticket, Calendar, MapPin, DollarSign, Plus, CheckCircle, XCircle, Search, Camera, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BarcodeScannerComponent } from 'react-qr-barcode-scanner';

// Import hooks
import { 
  useGetEvents, 
  useCreateEvent, 
  useMintTicket, 
  useMyTickets,
  useVerifyTicket,
  useGetContractOwner,
  useEventTicketCount
} from './hooks/useContracts';

// ========================================
// HEADER COMPONENT
// ========================================
function Header({ role, setRole }) {
  const { address, isConnected } = useAccount();
  const { owner } = useGetContractOwner();
  
  const isOrganizer = address && owner && address.toLowerCase() === owner.toLowerCase();
  
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Ticket className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Ticket NFT System</h1>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2 bg-white/20 rounded-lg p-1">
            <button
              onClick={() => setRole('buyer')}
              className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                role === 'buyer' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/10'
              }`}
            >
              🎫 Pembeli
            </button>
            <button
              onClick={() => setRole('organizer')}
              disabled={!isOrganizer}
              className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                role === 'organizer' ? 'bg-white text-purple-600' : 
                !isOrganizer ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'text-white hover:bg-white/10'
              }`}
              title={!isOrganizer ? 'Only contract owner can be organizer' : ''}
            >
              🎪 Organizer {!isOrganizer && '🔒'}
            </button>
            <button
              onClick={() => setRole('verifier')}
              disabled={!isOrganizer}
              className={`px-4 py-2 rounded-md transition text-sm font-medium ${
                role === 'verifier' ? 'bg-white text-purple-600' : 
                !isOrganizer ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'text-white hover:bg-white/10'
              }`}
              title={!isOrganizer ? 'Only contract owner can verify tickets' : ''}
            >
              ✅ Verifier {!isOrganizer && '🔒'}
            </button>
          </div>

          <ConnectButton />
        </div>
      </div>
      
      {isConnected && isOrganizer && (
        <div className="text-center mt-2">
          <span className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-xs font-bold">
            👑 Contract Owner (Organizer)
          </span>
        </div>
      )}
    </div>
  );
}

// ========================================
// EVENT CARD COMPONENT
// ========================================
function EventCard({ event, eventId, onBuyTicket, isPending }) {
  const { count: soldCount } = useEventTicketCount(eventId);
  const totalSupply = Number(event.totalSupply);
  const sold = soldCount || 0;
  const availability = totalSupply > 0 ? ((totalSupply - sold) / totalSupply) * 100 : 0;
  const isSoldOut = sold >= totalSupply;
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
      <div className="h-40 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <Ticket className="w-20 h-20 text-white opacity-80" />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold mb-3">{event.eventName}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{event.eventDate}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{event.eventLocation}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {(Number(event.price) / 1e18).toFixed(4)} ETH
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Ketersediaan</span>
            <span className="font-semibold">{totalSupply - sold}/{totalSupply}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${availability}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => onBuyTicket(eventId, event)}
          disabled={isSoldOut || isPending || !event.isActive}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            isSoldOut || isPending || !event.isActive
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isPending ? 'Processing...' : 
           isSoldOut ? 'Sold Out' : 
           !event.isActive ? 'Event Inactive' : 'Beli Tiket'}
        </button>
      </div>
    </div>
  );
}

// ========================================
// MY TICKET COMPONENT
// ========================================
function MyTicket({ ticket, tokenId, onShowQR }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-lg">Token #{tokenId}</h4>
          <p className="text-gray-600 text-sm">Event #{Number(ticket.eventId)}</p>
          <p className="text-gray-600 text-sm">Tiket #{Number(ticket.ticketNumber)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          ticket.isUsed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
        }`}>
          {ticket.isUsed ? 'Sudah Digunakan' : 'Aktif'}
        </span>
      </div>
      
      <button
        onClick={() => onShowQR({ ...ticket, tokenId })}
        disabled={ticket.isUsed}
        className={`w-full py-2 rounded-lg font-semibold transition ${
          ticket.isUsed
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        Tampilkan QR Code
      </button>
    </div>
  );
}

// ========================================
// QR CODE MODAL
// ========================================
function QRCodeModal({ ticket, onClose }) {
  if (!ticket) return null;

  const qrData = JSON.stringify({
    ticketId: Number(ticket.tokenId),
    eventId: Number(ticket.eventId),
    ticketNumber: Number(ticket.ticketNumber),
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
          <p className="font-semibold text-lg">Token #{ticket.tokenId}</p>
          <p className="text-gray-600">Event #{Number(ticket.eventId)}</p>
          <p className="text-gray-600">Tiket #{Number(ticket.ticketNumber)}</p>
          <p className="text-sm text-gray-500 mt-2">
            Tunjukkan QR code ini saat masuk venue
          </p>
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

// ========================================
// QR SCANNER
// ========================================
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
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <BarcodeScannerComponent
              width="100%"
              height={400}
              onUpdate={handleScan}
              stopStream={!scanning}
            />
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

// ========================================
// VERIFICATION RESULT MODAL
// ========================================
function VerificationResult({ result, onClose, onMarkUsed }) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          {result.valid ? (
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
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
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${result.ticket.isUsed ? 'text-red-600' : 'text-green-600'}`}>
                {result.ticket.isUsed ? 'Sudah Digunakan' : 'Belum Digunakan'}
              </span>
            </div>
          </div>
        )}

        {!result.valid && (
          <p className="text-center text-gray-600 mb-6">{result.reason}</p>
        )}

        <div className="space-y-2">
          {result.valid && !result.ticket?.isUsed && (
            <button
              onClick={() => onMarkUsed(result.ticketId)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              ✅ Tandai Sudah Digunakan
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// ORGANIZER DASHBOARD
// ========================================
function OrganizerDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    price: '',
    totalSupply: ''
  });

  const { events, isLoading } = useGetEvents();
  const { createEvent, isPending, isSuccess } = useCreateEvent();

  useEffect(() => {
    if (isSuccess) {
      setShowForm(false);
      setFormData({ name: '', date: '', location: '', price: '', totalSupply: '' });
      alert('Event berhasil dibuat!');
    }
  }, [isSuccess]);

  const handleSubmit = () => {
    if (formData.name && formData.date && formData.location && formData.price && formData.totalSupply) {
      createEvent(formData);
    } else {
      alert('Please fill all fields');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Event Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Buat Event Baru
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Form Event Baru</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nama Event"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Lokasi Event"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Harga (ETH)"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="number"
              placeholder="Total Tiket"
              value={formData.totalSupply}
              onChange={(e) => setFormData({...formData, totalSupply: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
              >
                {isPending ? 'Creating...' : 'Buat Event'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-gray-500"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Belum ada event. Buat event pertama Anda!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event, idx) => (
            <EventSummaryCard key={idx} event={event} eventId={idx + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventSummaryCard({ event, eventId }) {
  const { count: soldCount } = useEventTicketCount(eventId);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-2">{event.eventName}</h3>
          <p className="text-gray-600 text-sm mb-1">📅 {event.eventDate}</p>
          <p className="text-gray-600 text-sm">📍 {event.eventLocation}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          event.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {event.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>
      <div className="pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-gray-600 text-sm">Harga</p>
          <p className="font-bold">{(Number(event.price) / 1e18).toFixed(4)} ETH</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Terjual</p>
          <p className="font-bold">{soldCount}/{Number(event.totalSupply)}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Revenue</p>
          <p className="font-bold">{((soldCount * Number(event.price)) / 1e18).toFixed(4)} ETH</p>
        </div>
      </div>
    </div>
  );
}

// ========================================
// MAIN APP
// ========================================
export default function App() {
  const [role, setRole] = useState('buyer');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const { address, isConnected } = useAccount();
  const { owner } = useGetContractOwner();
  const { events } = useGetEvents();
  const { tickets } = useMyTickets(address);
  const { mintTicket, isPending: isMinting } = useMintTicket();
  const { verifyTicket, markAsUsed } = useVerifyTicket();

  const isOrganizer = address && owner && address.toLowerCase() === owner.toLowerCase();

  useEffect(() => {
    if (!isOrganizer && (role === 'organizer' || role === 'verifier')) {
      setRole('buyer');
    }
  }, [isOrganizer, role]);

  const handleBuyTicket = async (eventId, event) => {
    if (!isConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      const priceInWei = event.price.toString();
      await mintTicket(eventId, priceInWei, address);
      alert('Ticket purchase transaction sent! Please wait for confirmation.');
    } catch (error) {
      console.error('Error buying ticket:', error);
      alert('Failed to buy ticket: ' + (error.message || 'Unknown error'));
    }
  };

  const handleVerifyTicket = async (ticketId) => {
    try {
      const result = await verifyTicket(ticketId);
      setVerificationResult(result);
    } catch (error) {
      console.error('Error verifying ticket:', error);
      setVerificationResult({
        valid: false,
        ticketId,
        reason: 'Error verifying ticket: ' + error.message
      });
    }
  };

  const handleMarkUsed = async (ticketId) => {
    try {
      await markAsUsed(ticketId);
      setVerificationResult(null);
      alert('Ticket marked as used!');
    } catch (error) {
      console.error('Error marking ticket:', error);
      alert('Failed to mark ticket as used: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header role={role} setRole={setRole} />

      <main className="container mx-auto px-4 py-8">
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-yellow-800">
              ⚠️ Please connect your wallet to use the application
            </p>
          </div>
        )}

        {role === 'buyer' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Tiket Saya</h2>
              {!isConnected ? (
                <p className="text-gray-600">Connect wallet to view your tickets</p>
              ) : tickets.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">Anda belum memiliki tiket. Beli tiket di event yang tersedia!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tickets.map((ticket) => (
                    <MyTicket 
                      key={ticket.tokenId} 
                      ticket={ticket.data}
                      tokenId={ticket.tokenId}
                      onShowQR={setSelectedTicket}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Event Tersedia</h2>
              {events.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">Belum ada event tersedia saat ini.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event, idx) => (
                    <EventCard 
                      key={idx} 
                      event={event}
                      eventId={idx + 1}
                      onBuyTicket={handleBuyTicket}
                      isPending={isMinting}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {role === 'organizer' && isOrganizer && <OrganizerDashboard />}

        {role === 'verifier' && isOrganizer && (
          <div className="max-w-2xl mx-auto">
            <QRScanner onScanSuccess={handleVerifyTicket} />
          </div>
        )}
      </main>

      {selectedTicket && (
        <QRCodeModal 
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {verificationResult && (
        <VerificationResult 
          result={verificationResult}
          onClose={() => setVerificationResult(null)}
          onMarkUsed={handleMarkUsed}
        />
      )}
    </div>
  );
}