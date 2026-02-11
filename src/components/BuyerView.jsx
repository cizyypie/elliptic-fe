import { useState, useEffect } from "react";
import { Calendar, MapPin, DollarSign, Ticket } from "lucide-react";
import {
  useWalletClient,
  usePublicClient,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  useGetEvents,
  useMintTicket,
  useMyTickets,
  useEventTicketCount,
} from "../hooks/useContracts";
import { generateSignedQRData } from "../utils/signatureUtils";
import { CONTRACTS } from "../contracts/addresses";
import { useToast } from "./Toast";

function EventCard({ event, eventId, onBuyTicket, isPending }) {
  const { count: soldCount } = useEventTicketCount(eventId);
  const totalSupply = Number(event.totalSupply);
  const sold = soldCount || 0;
  const availability =
    totalSupply > 0 ? ((totalSupply - sold) / totalSupply) * 100 : 0;
  const isSoldOut = sold >= totalSupply;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
      <div className="h-40 bg-blue-300 flex items-center justify-center">
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
            <span className="font-semibold">
              {totalSupply - sold}/{totalSupply}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all"
              style={{ width: `${availability}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => onBuyTicket(eventId, event)}
          disabled={isSoldOut || isPending || !event.isActive}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            isSoldOut || isPending || !event.isActive
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isPending
            ? "Processing..."
            : isSoldOut
              ? "Sold Out"
              : !event.isActive
                ? "Event Inactive"
                : "Beli Tiket"}
        </button>
      </div>
    </div>
  );
}

function MyTicket({ ticket, tokenId, eventData, onShowQR, isGenerating }) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 border-blue-500">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {eventData?.eventName || "Loading..."}
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span>{eventData?.eventDate || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{eventData?.eventLocation || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🎫</span>
                <span>Ticket #{tokenId}</span>
              </div>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
              ticket.isUsed
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {ticket.isUsed ? "✓ Digunakan" : "✓ Aktif"}
          </span>
        </div>

        <button
          onClick={onShowQR}
          disabled={ticket.isUsed || isGenerating}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            ticket.isUsed || isGenerating
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              Generating QR...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>📱</span>
              Show QR Code
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function BuyerView({ address, isConnected, onShowQR }) {
  const [generatingQR, setGeneratingQR] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState(null);
  const [loadingToastId, setLoadingToastId] = useState(null);
  const toast = useToast();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { events } = useGetEvents();
  const { tickets, refetch: refetchTickets } = useMyTickets(address);
  const {
    mintTicket,
    isPending: isMinting,
    isSuccess: mintSuccess,
    hash: mintHash,
    error: mintError,
  } = useMintTicket();

  // Monitor transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: pendingTxHash,
    });

  // Handle mint transaction sent (user confirmed in wallet)
  useEffect(() => {
    if (mintSuccess && mintHash) {
      console.log("Transaction sent, hash:", mintHash);
      setPendingTxHash(mintHash);

      if (loadingToastId) {
        toast.removeToast(loadingToastId);
      }

      const confirmingId = toast.loading(
        "Waiting for Confirmation ⏳",
        "Your transaction is being confirmed on the blockchain...",
      );
      setLoadingToastId(confirmingId);
    }
  }, [mintSuccess, mintHash]);

  // Handle transaction confirmed on blockchain
  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      console.log("Transaction confirmed!");

      if (loadingToastId) {
        toast.removeToast(loadingToastId);
        setLoadingToastId(null);
      }

      toast.success(
        "Ticket Confirmed! 🎉",
        "Your ticket purchase has been confirmed on the blockchain",
        { duration: 5000 },
      );

      // Refresh tickets after a short delay
      setTimeout(() => {
        refetchTickets();
        toast.info(
          "Ticket Available ✓",
          "Your new ticket is now visible in 'My Tickets' section",
          { duration: 6000 },
        );
      }, 2000);

      setPendingTxHash(null);
      setIsProcessing(false); // Reset processing state on success
    }
  }, [isConfirmed, pendingTxHash]);

  // Handle mint errors (user rejection or transaction failure)
  useEffect(() => {
    if (mintError) {
      console.error("Mint error:", mintError);

      // Clear loading toast
      if (loadingToastId) {
        toast.removeToast(loadingToastId);
        setLoadingToastId(null);
      }

      let errorTitle = "Purchase Failed";
      let errorMessage = "An error occurred while purchasing the ticket";

      // Check for user rejection
      if (
        mintError.message?.includes("User rejected") ||
        mintError.message?.includes("user rejected") ||
        mintError.message?.includes("User denied")
      ) {
        errorTitle = "Transaction Cancelled";
        errorMessage = "You cancelled the transaction in your wallet";
      }
      // Check for insufficient funds
      else if (mintError.message?.includes("insufficient funds")) {
        errorTitle = "Insufficient Funds";
        errorMessage = "You don't have enough ETH to complete this purchase";
      }
      // Check for gas errors
      else if (mintError.message?.includes("gas")) {
        errorTitle = "Gas Error";
        errorMessage =
          "Transaction failed due to gas estimation error. Please try again.";
      }
      // Other errors
      else if (mintError.shortMessage) {
        errorMessage = mintError.shortMessage;
      } else if (mintError.message) {
        errorMessage = mintError.message;
      }

      // Show error toast only once
      toast.error(errorTitle, errorMessage, {
        duration: 5000,
      });

      // Reset states
      setPendingTxHash(null);
      setIsProcessing(false); // Reset processing state on error
    }
  }, [mintError]); // Only depend on mintError to prevent loops

  const getEventDataForTicket = (ticket) => {
    const eventId = Number(ticket.eventId);
    const event = events.find((e) => Number(e.id) === eventId);

    if (!event) {
      return {
        eventName: "Event #" + eventId,
        eventDate: "Unknown",
        eventLocation: "Unknown",
      };
    }

    return event;
  };

  const sortedEvents = [...events].sort((a, b) => Number(b.id) - Number(a.id));

  const handleBuyTicket = async (eventId, event) => {
    if (!isConnected) {
      toast.error(
        "Wallet Not Connected",
        "Please connect your wallet to purchase tickets",
      );
      return;
    }

    if (isProcessing) return; // Prevent multiple simultaneous purchases

    setIsProcessing(true);
    const processingId = toast.loading(
      "Preparing Transaction",
      `Please confirm the purchase in your wallet...`,
    );
    setLoadingToastId(processingId);

    try {
      const priceInWei = event.price.toString();
      await mintTicket(eventId, priceInWei, address);

      // Transaction sent successfully - the useEffect hooks will handle the rest
      console.log("📤 Transaction request sent to wallet");
    } catch (error) {
      // This catch block handles errors before the transaction is sent
      // (e.g., contract reverts during simulation)
      console.error("Error initiating purchase:", error);

      if (loadingToastId) {
        toast.removeToast(loadingToastId);
        setLoadingToastId(null);
      }

      let errorMessage = "Failed to initiate purchase";

      if (error.message?.includes("SoldOut")) {
        errorMessage = "This event is sold out";
      } else if (error.message?.includes("EventNotActive")) {
        errorMessage = "This event is not active";
      } else if (error.message?.includes("InsufficientPayment")) {
        errorMessage = "Insufficient payment amount";
      } else if (
        error.message?.includes("User rejected") ||
        error.message?.includes("user rejected") ||
        error.message?.includes("User denied")
      ) {
        errorMessage = "Transaction was cancelled";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error("Cannot Purchase", errorMessage, {
        duration: 5000,
      });

      setIsProcessing(false); // Reset on error
    }
  };

  const handleShowQR = async (ticket) => {
    if (!walletClient || !address) {
      toast.error(
        "Wallet Not Connected",
        "Please connect your wallet to generate QR code",
      );
      return;
    }

    setGeneratingQR(ticket.tokenId);

    const loadingToastId = toast.loading(
      "Generating QR Code",
      "Creating secure ticket QR code...",
    );

    try {
      const eventData = getEventDataForTicket(ticket);

      if (!eventData || eventData.eventName.startsWith("Event #")) {
        toast.removeToast(loadingToastId);
        toast.error(
          "Event Data Missing",
          "Could not load event information. Please refresh the page.",
        );
        setGeneratingQR(null);
        return;
      }

      console.log("🔐 Generating signature for ticket:", {
        tokenId: ticket.tokenId,
        eventId: ticket.eventId,
        owner: address,
        eventData,
      });

      const signedData = await generateSignedQRData(
        walletClient,
        { address },
        {
          tokenId: ticket.tokenId,
          eventId: ticket.eventId,
          ticketNumber: ticket.ticketNumber,
        },
        {
          eventName: eventData.eventName,
          eventDate: eventData.eventDate,
        },
        CONTRACTS.TICKET_VERIFIER,
        31337,
      );

      console.log("Signature generated successfully");

      const qrPayload = {
        t: signedData.ticketId,
        o: signedData.owner,
        d: signedData.deadline,
        m: signedData.metadataHash,
        r: signedData.r,
        s: signedData.s,
        x: signedData.Qx,
        y: signedData.Qy,
      };

      const displayInfo = {
        tokenId: ticket.tokenId,
        eventId: ticket.eventId,
        eventName: eventData.eventName,
        eventDate: eventData.eventDate,
        eventLocation: eventData.eventLocation,
        ticketNumber: ticket.ticketNumber,
        deadline: signedData.deadline,
      };

      console.log("📊 QR Size:", JSON.stringify(qrPayload).length, "bytes");

      toast.removeToast(loadingToastId);
      toast.success(
        "QR Code Generated! ✓",
        "Your secure ticket QR code is ready",
        { duration: 3000 },
      );

      onShowQR({ qrPayload, displayInfo });
    } catch (error) {
      console.error("Signature generation failed:", error);
      toast.removeToast(loadingToastId);

      let errorMessage = "Failed to generate QR code";

      if (error.message?.includes("User rejected")) {
        errorMessage = "Signature request was cancelled";
      } else if (error.message?.includes("wallet")) {
        errorMessage = "Wallet connection issue. Please try reconnecting.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error("QR Generation Failed", errorMessage, {
        duration: 8000,
      });
    } finally {
      setGeneratingQR(null);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Tiket Saya</h2>
        {!isConnected ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              Connect wallet untuk melihat tiket Anda
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              Anda belum memiliki tiket. Beli tiket di event yang tersedia!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((ticket) => {
              const eventData = getEventDataForTicket(ticket.data);

              return (
                <MyTicket
                  key={ticket.tokenId}
                  ticket={ticket.data}
                  tokenId={ticket.tokenId}
                  eventData={eventData}
                  onShowQR={() =>
                    handleShowQR({ ...ticket.data, tokenId: ticket.tokenId })
                  }
                  isGenerating={generatingQR === ticket.tokenId}
                />
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Event Tersedia</h2>
        {sortedEvents.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">Belum ada event tersedia saat ini.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map((event) => (
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
