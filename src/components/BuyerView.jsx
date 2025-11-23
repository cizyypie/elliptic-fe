// src/components/BuyerView.jsx
import { Calendar, MapPin, DollarSign, Ticket } from 'lucide-react';
import { useGetEvents, useMintTicket, useMyTickets, useEventTicketCount } from '../hooks/useContracts';

// Event Card Component
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

// My Ticket Component
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
          {ticket.isUsed ? 'Digunakan' : 'Aktif'}
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

// Main Buyer View
export default function BuyerView({ address, isConnected, onShowQR }) {
  const { events } = useGetEvents();
  const { tickets } = useMyTickets(address);
  const { mintTicket, isPending: isMinting } = useMintTicket();

  const handleBuyTicket = async (eventId, event) => {
    if (!isConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      const priceInWei = event.price.toString();
      await mintTicket(eventId, priceInWei, address);
      alert('Ticket purchase transaction sent! Tunggu konfirmasi...');
    } catch (error) {
      console.error('Error buying ticket:', error);
      alert('Gagal membeli tiket: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="space-y-8">
      {/* My Tickets Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Tiket Saya</h2>
        {!isConnected ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">Connect wallet untuk melihat tiket Anda</p>
          </div>
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
                onShowQR={onShowQR}
              />
            ))}
          </div>
        )}
      </section>

      {/* Available Events Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Event Tersedia</h2>
        {events.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">Belum ada event tersedia saat ini.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event}
                eventId={event.id}
                onBuyTicket={handleBuyTicket}
                isPending={isMinting}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}