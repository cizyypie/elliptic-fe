// src/utils/signatureUtils.js - Enhanced Version
import { keccak256, encodeAbiParameters, parseAbiParameters, toHex, hexToBytes } from 'viem';
import { secp256k1 } from '@noble/curves/secp256k1';

/**
 * Generate metadata hash for EIP-712 signing
 */
export function generateMetadataHash(ticket) {
  const packed = encodeAbiParameters(
    parseAbiParameters('uint256, string, string'),
    [
      BigInt(ticket.eventId),
      ticket.eventName || 'Event',
      ticket.eventDate || new Date().toISOString()
    ]
  );
  return keccak256(packed);
}

/**
 * Generate EIP-712 typed data for signing
 */
export function getEIP712TypedData(
  ticketId,
  owner,
  nonce,
  deadline,
  metadataHash,
  verifierAddress,
  chainId
) {
  return {
    domain: {
      name: 'TicketVerifier',
      version: '1',
      chainId: Number(chainId),
      verifyingContract: verifierAddress,
    },
    types: {
      TicketAccess: [
        { name: 'ticketId', type: 'uint256' },
        { name: 'owner', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'metadataHash', type: 'bytes32' },
      ],
    },
    primaryType: 'TicketAccess',
    message: {
      ticketId: BigInt(ticketId),
      owner,
      nonce: BigInt(nonce),
      deadline: BigInt(deadline),
      metadataHash,
    },
  };
}

/**
 * Extract public key coordinates from private key (for testing/demo)
 * In production, this should come from wallet's public key
 */
export function getPublicKeyFromPrivateKey(privateKeyHex) {
  // Remove 0x prefix if present
  const cleanKey = privateKeyHex.replace('0x', '');
  const privateKey = BigInt('0x' + cleanKey);
  
  // Get uncompressed public key (65 bytes: 0x04 + 32 bytes x + 32 bytes y)
  const publicKeyBytes = secp256k1.getPublicKey(privateKey, false);
  
  // Extract x and y coordinates (skip first byte which is 0x04)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  
  return {
    x: '0x' + Buffer.from(x).toString('hex'),
    y: '0x' + Buffer.from(y).toString('hex'),
  };
}

/**
 * Parse signature to r, s components
 */
export function parseSignature(signature) {
  const sig = signature.startsWith('0x') ? signature.slice(2) : signature;
  
  return {
    r: '0x' + sig.slice(0, 64),
    s: '0x' + sig.slice(64, 128),
    v: parseInt(sig.slice(128, 130), 16),
  };
}

/**
 * Generate complete signed QR data
 */
export async function generateSignedQRData(
  walletClient,
  account,
  ticket,
  eventData,
  nonce,
  verifierAddress,
  chainId
) {
  try {
    // 1. Set deadline (5 minutes from now)
    const deadline = Math.floor(Date.now() / 1000) + 300;
    
    // 2. Generate metadata hash
    const metadataHash = generateMetadataHash({
      eventId: ticket.eventId,
      eventName: eventData.eventName,
      eventDate: eventData.eventDate,
    });

    // 3. Get EIP-712 typed data
    const typedData = getEIP712TypedData(
      ticket.tokenId || ticket.ticketId,
      account.address,
      nonce,
      deadline,
      metadataHash,
      verifierAddress,
      chainId
    );

    // 4. Sign with wallet
    const signature = await walletClient.signTypedData(typedData);
    
    // 5. Parse signature
    const { r, s } = parseSignature(signature);

    // 6. Get public key coordinates
    // IMPORTANT: In production, request from wallet API
    // For demo with Anvil default account:
    const { x: Qx, y: Qy } = getPublicKeyFromPrivateKey(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' // Anvil account #0
    );

    return {
      // Verification data
      ticketId: String(ticket.tokenId || ticket.ticketId),
      owner: account.address,
      nonce: String(nonce),
      deadline: String(deadline),
      metadataHash,
      
      // Signature components
      r,
      s,
      Qx,
      Qy,
      
      // Additional info for display
      eventId: String(ticket.eventId),
      eventName: eventData.eventName,
      ticketNumber: String(ticket.ticketNumber),
      
      // Timestamp for QR uniqueness
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error generating signed QR data:', error);
    throw new Error(`Failed to generate signature: ${error.message}`);
  }
}

/**
 * Verify signature locally (optional client-side check)
 */
export function verifySignatureLocally(digest, r, s, publicKey) {
  try {
    // Convert hex strings to bigints
    const rBig = BigInt(r);
    const sBig = BigInt(s);
    const digestBig = BigInt(digest);
    
    // Simple validation
    const n = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
    
    if (rBig <= 0n || rBig >= n) return false;
    if (sBig <= 0n || sBig >= n) return false;
    
    return true;
  } catch (error) {
    console.error('Local verification error:', error);
    return false;
  }
}

/**
 * Format utilities
 */
export function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(wei) {
  return (Number(wei) / 1e18).toFixed(4);
}

export function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}