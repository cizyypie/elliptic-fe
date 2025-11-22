// src/components/EventCard.jsx
import { Calendar, MapPin, DollarSign, Ticket } from 'lucide-react';

export default function EventCard({ event, onBuyTicket, isPending }) {
  const availability = ((event.totalSupply - event.sold) / event.totalSupply) * 100;
  const isSoldOut = event.sold >= event.totalSupply;
  
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
              {Number(event.price) / 1e18} ETH
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Ketersediaan</span>
            <span className="font-semibold">
              {event.totalSupply - event.sold}/{event.totalSupply}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${availability}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => onBuyTicket(event)}
          disabled={isSoldOut || isPending}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            isSoldOut || isPending
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isPending ? 'Processing...' : isSoldOut ? 'Sold Out' : 'Beli Tiket'}
        </button>
      </div>
    </div>
  );
}