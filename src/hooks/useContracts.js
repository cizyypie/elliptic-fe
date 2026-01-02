import { usePublicClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useState, useEffect } from 'react';
import { CONTRACTS } from '../contracts/addresses';

import TicketNFTABIRaw from '../contracts/TicketNFT.abi.json';
import TicketVerifierABIRaw from '../contracts/TicketVerifier.abi.json';

const TicketNFTABI = Array.isArray(TicketNFTABIRaw) ? TicketNFTABIRaw : TicketNFTABIRaw.abi || [];
const TicketVerifierABI = Array.isArray(TicketVerifierABIRaw) ? TicketVerifierABIRaw : TicketVerifierABIRaw.abi || [];

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

// HOOK: Get All Events
export function useGetEvents() {
  const { data: eventsData, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'getAllEvents',
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

// HOOK: Mint Ticket (with direct payment to owner)
export function useMintTicket() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mintTicket = (eventId, price, to) => {
    console.log('🎫 Minting ticket:', { eventId, price, to });
    console.log('💰 Payment will go directly to organizer');
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

// Get User's Tickets
export function useMyTickets(address) {
  const publicClient = usePublicClient();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  });

  const { data: totalTokens } = useReadContract({
    address: CONTRACTS.TICKET_NFT,
    abi: TicketNFTABI,
    functionName: 'tokenCounter',
    enabled: !!address,
  });

  useEffect(() => {
    async function fetchTickets() {
      if (!address || !publicClient || !balance || balance === 0n) {
        setTickets([]);
        return;
      }

      setIsLoading(true);
      const userTickets = [];

      try {
        const maxTokenId = totalTokens ? Number(totalTokens) : 100;
        
        console.log(`🔍 Scanning for tickets owned by ${address}...`);
        console.log(`   Total minted tokens: ${maxTokenId}`);
        console.log(`   User balance: ${balance}`);

        // Scan all minted tokens
        for (let tokenId = 1; tokenId <= maxTokenId; tokenId++) {
          try {
            // Check owner
            const owner = await publicClient.readContract({
              address: CONTRACTS.TICKET_NFT,
              abi: TicketNFTABI,
              functionName: 'ownerOf',
              args: [BigInt(tokenId)],
            });

            // If this user owns it, fetch ticket data
            if (owner.toLowerCase() === address.toLowerCase()) {
              const ticketData = await publicClient.readContract({
                address: CONTRACTS.TICKET_NFT,
                abi: TicketNFTABI,
                functionName: 'getTicket',
                args: [BigInt(tokenId)],
              });

              userTickets.push({
                tokenId: tokenId,
                data: ticketData,
              });

              console.log(`✅ Found ticket #${tokenId} owned by user`);
            }
          } catch (err) {
            // Token doesn't exist or other error, skip
            if (!err.message?.includes('ERC721NonexistentToken')) {
              console.log(`Token ${tokenId} check failed:`, err.message);
            }
          }

          // Stop if we've found all user's tickets
          if (userTickets.length === Number(balance)) {
            break;
          }
        }

        console.log(`✅ Found ${userTickets.length} tickets for user`);
        setTickets(userTickets);
      } catch (error) {
        console.error('❌ Error fetching tickets:', error);
        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTickets();
  }, [address, balance, totalTokens, publicClient]);

  return {
    tickets,
    isLoading: isLoading || balanceLoading,
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
      const ticket = await publicClient.readContract({
        address: CONTRACTS.TICKET_NFT,
        abi: TicketNFTABI,
        functionName: 'getTicket',
        args: [BigInt(ticketId)],
      });

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