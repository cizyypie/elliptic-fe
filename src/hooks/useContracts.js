// src/hooks/useContracts.js
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useState, useEffect } from 'react';
import { CONTRACTS } from '../contracts/addresses';
import TicketNFTABI from '../contracts/TicketNFT.abi.json';
import TicketVerifierABI from '../contracts/TicketVerifier.abi.json';

// ========================================
// HOOK: Get All Events
// ========================================
export function useGetEvents() {
  const [events, setEvents] = useState([]);
  
  // Try to fetch first 5 events
  const event1 = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'getEvent',
    args: [BigInt(1)],
  });

  const event2 = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'getEvent',
    args: [BigInt(2)],
  });

  const event3 = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'getEvent',
    args: [BigInt(3)],
  });

  useEffect(() => {
    const allEvents = [];
    if (event1.data) allEvents.push(event1.data);
    if (event2.data) allEvents.push(event2.data);
    if (event3.data) allEvents.push(event3.data);
    setEvents(allEvents);
  }, [event1.data, event2.data, event3.data]);

  return {
    events,
    isLoading: event1.isLoading || event2.isLoading || event3.isLoading,
    error: event1.error || event2.error || event3.error
  };
}

// ========================================
// HOOK: Create Event (Organizer only)
// ========================================
export function useCreateEvent() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash 
  });

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

// ========================================
// HOOK: Mint Ticket (Buy ticket)
// ========================================
export function useMintTicket() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash 
  });

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

// ========================================
// HOOK: Get User's Tickets
// ========================================
export function useMyTickets(address) {
  const [tickets, setTickets] = useState([]);
  
  const { data: balance } = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  });

  // Try to fetch tickets (simplified - in production use events/indexer)
  const ticket1 = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'getTicket',
    args: [BigInt(1)],
    enabled: !!address && balance > 0,
  });

  const ticket2 = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'getTicket',
    args: [BigInt(2)],
    enabled: !!address && balance > 1,
  });

  useEffect(() => {
    const allTickets = [];
    if (ticket1.data) allTickets.push({ ...ticket1.data, tokenId: 1 });
    if (ticket2.data) allTickets.push({ ...ticket2.data, tokenId: 2 });
    setTickets(allTickets);
  }, [ticket1.data, ticket2.data]);

  return {
    tickets,
    isLoading: ticket1.isLoading || ticket2.isLoading,
    balance: balance ? Number(balance) : 0
  };
}

// ========================================
// HOOK: Get Ticket Details
// ========================================
export function useTicketDetails(tokenId) {
  const { data: ticket, isLoading, error } = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'getTicket',
    args: [BigInt(tokenId)],
    enabled: !!tokenId,
  });

  return { ticket, isLoading, error };
}

// ========================================
// HOOK: Verify Ticket Access
// ========================================
export function useVerifyAccess() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash 
  });

  const verifyAccess = async (verificationData) => {
    writeContract({
      address: CONTRACTS.TICKET_VERIFIER,
      abi: TicketVerifierABI,
      functionName: 'verifyAccess',
      args: [
        BigInt(verificationData.ticketId),
        verificationData.owner,
        BigInt(verificationData.nonce),
        BigInt(verificationData.deadline),
        verificationData.metadataHash,
        BigInt(verificationData.r),
        BigInt(verificationData.s),
        BigInt(verificationData.Qx),
        BigInt(verificationData.Qy)
      ],
    });
  };

  return {
    verifyAccess,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash
  };
}

// ========================================
// HOOK: Get Nonce
// ========================================
export function useGetNonce(address) {
  const { data: nonce, isLoading } = useReadContract({
    address: CONTRACTS.TICKET_VERIFIER,
    abi: TicketVerifierABI,
    functionName: 'getNonce',
    args: [address],
    enabled: !!address,
  });

  return { nonce: nonce ? Number(nonce) : 0, isLoading };
}

// ========================================
// HOOK: Check if Ticket is Used
// ========================================
export function useIsTicketUsed(tokenId) {
  const { data: isUsed, isLoading } = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'isTicketUsed',
    args: [BigInt(tokenId)],
    enabled: !!tokenId,
  });

  return { isUsed: !!isUsed, isLoading };
}

// ========================================
// HOOK: Get Event Ticket Count
// ========================================
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