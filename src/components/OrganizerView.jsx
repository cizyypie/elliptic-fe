// src/components/OrganizerView.jsx - CLEAN VERSION
import { useState, useEffect } from "react";
import { Plus, X, RefreshCw, CheckCircle } from "lucide-react";
import {
  useGetEvents,
  useCreateEvent,
  useEventTicketCount,
} from "../hooks/useContracts";

// Toast Notification Component
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}

// Event Summary Card
function EventSummaryCard({ event, eventId }) {
  const { count: soldCount } = useEventTicketCount(eventId);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-2">{event.eventName}</h3>
          <p className="text-gray-600 text-sm mb-1">📅 {event.eventDate}</p>
          <p className="text-gray-600 text-sm">📍 {event.eventLocation}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            event.isActive
              ? "bg-green-100 text-green-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {event.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>
      <div className="pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-gray-600 text-sm">Harga</p>
          <p className="font-bold">
            {(Number(event.price) / 1e18).toFixed(4)} ETH
          </p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Terjual</p>
          <p className="font-bold">
            {soldCount}/{Number(event.totalSupply)}
          </p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Revenue</p>
          <p className="font-bold text-green-600">
            {((soldCount * Number(event.price)) / 1e18).toFixed(4)} ETH
          </p>
        </div>
      </div>
    </div>
  );
}

// Create Event Form
function CreateEventForm({ onClose, onCreate, isPending }) {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    location: "",
    price: "",
    totalSupply: "",
  });

  const handleSubmit = () => {
    if (
      formData.name &&
      formData.date &&
      formData.location &&
      formData.price &&
      formData.totalSupply
    ) {
      onCreate(formData);
    } else {
      alert("Harap isi semua field");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Form Event Baru</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Event *
          </label>
          <input
            type="text"
            placeholder="Contoh: Konser Musik Rock 2025"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Event *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lokasi Event *
          </label>
          <input
            type="text"
            placeholder="Contoh: Jakarta Convention Center"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Harga Tiket (ETH) *
          </label>
          <input
            type="text"
            placeholder="Contoh: 0.1"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Tiket *
          </label>
          <input
            type="number"
            placeholder="Contoh: 100"
            value={formData.totalSupply}
            onChange={(e) =>
              setFormData({ ...formData, totalSupply: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isPending ? "Membuat..." : "Buat Event"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-gray-500 transition"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Organizer View
export default function OrganizerView() {
  const [showForm, setShowForm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { events, isLoading, refetch } = useGetEvents();
  const { createEvent, isPending, isSuccess, hash } = useCreateEvent();

  useEffect(() => {
    if (isSuccess && hash) {
      console.log("✅ Event created successfully! Hash:", hash);

      const timer = setTimeout(() => {
        console.log("🔄 Refetching events...");
        refetch();
        setShowForm(false);
        setShowToast(true); 
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, hash, refetch]);

  const handleCreateEvent = (formData) => {
    console.log("📝 Creating event with data:", formData);
    createEvent(formData);
  };

  const handleManualRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    refetch();
  };
  const sortedEvents = [...events].sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message="Event berhasil dibuat!"
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Event Management</h2>
          <p className="text-gray-600 text-sm mt-1">
            Kelola event dan monitor penjualan tiket
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleManualRefresh}
            className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 flex items-center gap-2 transition"
            title="Refresh events"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" />
              Buat Event Baru
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <CreateEventForm
          onClose={() => setShowForm(false)}
          onCreate={handleCreateEvent}
          isPending={isPending}
        />
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading events...</p>
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">🎪</div>
          <p className="text-gray-600 text-lg font-medium">Belum ada event</p>
          <p className="text-gray-500 text-sm mt-2">
            Buat event pertama Anda untuk memulai!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedEvents.map((event) => (
            <EventSummaryCard key={event.id} event={event} eventId={event.id} />
          ))}
        </div>
      )}
    </div>
  );
}