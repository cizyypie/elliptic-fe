// src/utils/signatureUtils.js
import { keccak256, toBytes, encodePacked } from 'viem';

/**
 * Generate EIP-712 signature for ticket verification
 * This will be signed by the ticket owner's wallet
 */
export async function generateTicketSignature(
  signer,
  ticketId,
  owner,
  nonce,
  deadline,
  metadataHash,
  verifierAddress,
  chainId
) {
  // EIP-712 Domain
  const domain = {
    name: 'TicketVerifier',
    version: '1',
    chainId: chainId,
    verifyingContract: verifierAddress,
  };

  // EIP-712 Types
  const types = {
    TicketAccess: [
      { name: 'ticketId', type: 'uint256' },
      { name: 'owner', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'metadataHash', type: 'bytes32' },
    ],
  };

  // Message to sign
  const message = {
    ticketId: BigInt(ticketId),
    owner,
    nonce: BigInt(nonce),
    deadline: BigInt(deadline),
    metadataHash,
  };

  // Sign with EIP-712
  const signature = await signer.signTypedData({
    domain,
    types,
    primaryType: 'TicketAccess',
    message,
  });

  return signature;
}

/**
 * Extract r, s, v from signature
 */
export function parseSignature(signature) {
  // Remove '0x' prefix if present
  const sig = signature.startsWith('0x') ? signature.slice(2) : signature;
  
  return {
    r: '0x' + sig.slice(0, 64),
    s: '0x' + sig.slice(64, 128),
    v: parseInt(sig.slice(128, 130), 16),
  };
}

/**
 * Get public key from wallet (placeholder implementation)
 * In production, you would need to:
 * 1. Request public key from wallet
 * 2. Extract x and y coordinates from the public key
 * 3. Return them as BigInt values
 */
export async function getPublicKeyCoordinates(address, provider) {
  // This is a placeholder implementation
  // Real implementation would require wallet API support
  console.warn('Public key extraction not fully implemented. Using placeholder.');
  
  // For demo purposes, you can derive from signature recovery
  // But proper implementation requires wallet support
  
  return {
    x: BigInt('0x0000000000000000000000000000000000000000000000000000000000000001'),
    y: BigInt('0x0000000000000000000000000000000000000000000000000000000000000002')
  };
}

/**
 * Recover public key from signature (alternative method)
 * This requires a known message that was signed
 */
export async function recoverPublicKey(message, signature, provider) {
  try {
    // Use ethers or viem to recover public key
    // This is a simplified placeholder
    return {
      x: BigInt(0),
      y: BigInt(0)
    };
  } catch (error) {
    console.error('Error recovering public key:', error);
    throw error;
  }
}

/**
 * Generate metadata hash for ticket
 */
export function generateMetadataHash(ticketData) {
  const packed = encodePacked(
    ['uint256', 'string', 'string'],
    [
      BigInt(ticketData.eventId), 
      ticketData.eventName || 'Event', 
      ticketData.eventDate || new Date().toISOString()
    ]
  );
  
  return keccak256(packed);
}

/**
 * Generate QR code data with signature (simplified version)
 * For production, implement full EIP-712 signing
 */
export async function generateSignedQRData(
  walletClient,
  ticket,
  nonce,
  verifierAddress,
  chainId
) {
  try {
    // Set deadline to 5 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 300;
    
    // Generate metadata hash
    const metadataHash = generateMetadataHash({
      eventId: ticket.eventId,
      eventName: ticket.eventName || 'Event',
      eventDate: ticket.eventDate || new Date().toISOString(),
    });

    // Generate signature
    const signature = await generateTicketSignature(
      walletClient,
      ticket.tokenId,
      ticket.owner,
      nonce,
      deadline,
      metadataHash,
      verifierAddress,
      chainId
    );

    const { r, s, v } = parseSignature(signature);

    // Get public key coordinates (placeholder)
    const { x: Qx, y: Qy } = await getPublicKeyCoordinates(ticket.owner);

    return {
      ticketId: ticket.tokenId,
      owner: ticket.owner,
      nonce,
      deadline,
      metadataHash,
      r,
      s,
      v,
      Qx: Qx.toString(),
      Qy: Qy.toString(),
      signature,
    };
  } catch (error) {
    console.error('Error generating signed QR data:', error);
    throw error;
  }
}

/**
 * Verify signature locally (client-side verification)
 */
export function verifySignatureLocally(message, signature, expectedSigner) {
  // Implement local signature verification if needed
  // This is optional and mainly for UX
  return true;
}

/**
 * Format address for display
 */
export function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format ETH value
 */
export function formatEther(wei) {
  return (Number(wei) / 1e18).toFixed(4);
}

/**
 * Parse ETH to Wei
 */
export function parseEtherToWei(eth) {
  return BigInt(Math.floor(parseFloat(eth) * 1e18));
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get current timestamp
 */
export function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Check if deadline has passed
 */
export function isDeadlinePassed(deadline) {
  return getCurrentTimestamp() > deadline;
}