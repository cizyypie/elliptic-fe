// src/hooks/useContracts.js
import { usePublicClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useState, useEffect } from 'react';
import { CONTRACTS } from '../contracts/addresses';

// Import ABIs dengan proper handling
import TicketNFTABIRaw from '../contracts/TicketNFT.abi.json';
import TicketVerifierABIRaw from '../contracts/TicketVerifier.abi.json';

// Ensure ABI is array
const TicketNFTABI = Array.isArray(TicketNFTABIRaw) ? TicketNFTABIRaw : TicketNFTABIRaw.abi || [];
const TicketVerifierABI = Array.isArray(TicketVerifierABIRaw) ? TicketVerifierABIRaw : TicketVerifierABIRaw.abi || [];

// Validate ABIs
if (!Array.isArray(TicketNFTABI) || TicketNFTABI.length === 0) {
  console.error('❌ TicketNFT ABI is invalid or empty!');
}
if (!Array.isArray(TicketVerifierABI) || TicketVerifierABI.length === 0) {
  console.error('❌ TicketVerifier ABI is invalid or empty!');
}

console.log('✅ ABIs loaded:', {
  TicketNFT: TicketNFTABI.length + ' functions',
  TicketVerifier: TicketVerifierABI.length + ' functions'
});

// HOOK: Get Contract Owner
export function useGetContractOwner() {
  const { data: owner, isLoading, error, isError } = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'owner',
  });

  // Debug log
  useEffect(() => {
    console.log('🔍 useGetContractOwner:', { 
      owner, 
      isLoading, 
      error: error?.message,
      isError,
      contractAddress: CONTRACTS.TICKET_NFT 
    });
  }, [owner, isLoading, error, isError]);

  return { 
    owner: owner || null, 
    isLoading, 
    error: isError ? error : null 
  };
}

// HOOK: Get All Events (Max 10)
export function useGetEvents() {
  const { data: eventsData, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'getAllEvents', // If this function exists in your contract
  });

  const events = eventsData?.map((event, index) => ({
    ...event,
    id: index + 1,
  })) || [];

  return {
    events,
    isLoading,
    error,
    refetch,
  };
}

// HOOK: Create Event (Organizer only)
export function useCreateEvent() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createEvent = (eventData) => {
    writeContract({
      address: CONTRACTS.TICKET_NFT,
      abi: TicketNFTABI,
      functionName: 'createEvent',
      args: [
        eventData.name,
        eventData.date,
        eventData.location,
        parseEther(eventData.price),
        BigInt(eventData.totalSupply)
      ],
    });
  };

  return {
    createEvent,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash
  };
}

// HOOK: Mint Ticket
export function useMintTicket() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mintTicket = (eventId, price, to) => {
    writeContract({
      address: CONTRACTS.TICKET_NFT,
      abi: TicketNFTABI,
      functionName: 'mintTicket',
      args: [BigInt(eventId), to],
      value: BigInt(price),
    });
  };

  return {
    mintTicket,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash
  };
}

// HOOK: Get User's Tickets
export function useMyTickets(address) {
  const [tickets, setTickets] = useState([]);
  
  const { data: balance } = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  });

  // Fetch up to 20 tickets
  const ticketQueries = Array.from({ length: 20 }, (_, i) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useReadContract({
      address: CONTRACTS.TICKET_NFT,
      abi: TicketNFTABI,
      functionName: 'getTicket',
      args: [BigInt(i + 1)],
      enabled: !!address && !!balance && balance > 0,
    });
  });

  const ownerQueries = Array.from({ length: 20 }, (_, i) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useReadContract({
      address: CONTRACTS.TICKET_NFT,
      abi: TicketNFTABI,
      functionName: 'ownerOf',
      args: [BigInt(i + 1)],
      enabled: !!address && !!balance && balance > 0,
    });
  });

  useEffect(() => {
    if (!address || !balance) {
      setTickets([]);
      return;
    }

    const userTickets = ticketQueries
      .map((query, index) => {
        const owner = ownerQueries[index]?.data;
        if (query.data && owner?.toLowerCase() === address.toLowerCase()) {
          return { data: query.data, tokenId: index + 1 };
        }
        return null;
      })
      .filter(Boolean);
    
    setTickets(userTickets);
  }, [address, balance, ticketQueries.map(q => q.data).join(','), ownerQueries.map(q => q.data).join(',')]);

  return {
    tickets,
    isLoading: ticketQueries.some(q => q.isLoading) || ownerQueries.some(q => q.isLoading),
    balance: balance ? Number(balance) : 0
  };
}

// HOOK: Verify Ticket & Mark as Used
export function useVerifyTicket() {
  const publicClient = usePublicClient();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const verifyTicket = async (ticketId) => {
    if (!publicClient) {
      return {
        valid: false,
        ticketId,
        reason: 'Blockchain client not available',
      };
    }

    try {
      // Get ticket data
      const ticket = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: 'getTicket',
        args: [BigInt(ticketId)],
      });

      // Get ticket owner
      const owner = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: 'ownerOf',
        args: [BigInt(ticketId)],
      });

      return {
        valid: true,
        ticketId,
        ticket,
        owner,
      };
    } catch (err) {
      return {
        valid: false,
        ticketId,
        reason: 'Ticket not found or invalid',
      };
    }
  };

  const markAsUsed = (ticketId) => {
    writeContract({
      address: CONTRACTS.TICKET_NFT,
      abi: TicketNFTABI,
      functionName: 'markTicketAsUsed',
      args: [BigInt(ticketId)],
    });
  };

  return {
    verifyTicket,
    markAsUsed,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// HOOK: Get Event Ticket Count
export function useEventTicketCount(eventId) {
  const { data: count, isLoading } = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'eventTicketCount',
    args: [BigInt(eventId)],
    enabled: !!eventId,
  });

  return { count: count ? Number(count) : 0, isLoading };
}