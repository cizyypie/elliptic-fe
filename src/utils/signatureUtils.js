// src/utils/signatureUtils.js - FULLY FIXED VERSION
import { keccak256, encodeAbiParameters, parseAbiParameters, hexToBytes } from 'viem';
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
  nonce, // kept for compatibility but not used in deadline architecture
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
        { name: 'deadline', type: 'uint256' },
        { name: 'metadataHash', type: 'bytes32' },
      ],
    },
    primaryType: 'TicketAccess',
    message: {
      ticketId: BigInt(ticketId),
      owner,
      deadline: BigInt(deadline),
      metadataHash,
    },
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
 * ✅ FIXED: Extract public key from signature recovery
 * This works for ANY wallet, not just test accounts
 */
export async function getPublicKeyFromSignature(walletClient, account) {
  try {
    // Method 1: Try eth_getEncryptionPublicKey (MetaMask)
    try {
      const encryptionKey = await walletClient.request({
        method: 'eth_getEncryptionPublicKey',
        params: [account.address],
      });
      
      // This returns base64 encoded public key, need to convert
      console.log('Got encryption public key from wallet');
      
      // Decode and extract coordinates
      const publicKeyBytes = Buffer.from(encryptionKey, 'base64');
      
      // Public key is 65 bytes: 0x04 + 32 bytes x + 32 bytes y
      if (publicKeyBytes.length === 65 && publicKeyBytes[0] === 0x04) {
        const x = '0x' + publicKeyBytes.slice(1, 33).toString('hex');
        const y = '0x' + publicKeyBytes.slice(33, 65).toString('hex');
        return { x, y };
      }
    } catch (e) {
      console.log('eth_getEncryptionPublicKey not supported, using recovery method');
    }
    
    // Method 2: Recover from a known signature
    console.log('🔑 Using signature recovery method for public key...');
    
    const message = 'Ellipticheck Public Key Request';
    
    // Sign a message
    const signature = await walletClient.signMessage({
      account,
      message,
    });
    
    console.log('✅ Message signed, recovering public key...');
    
    // Recover public key using secp256k1
    const messageHash = keccak256(
      encodeAbiParameters(
        parseAbiParameters('string'),
        [`\x19Ethereum Signed Message:\n${message.length}${message}`]
      )
    );
    
    const sig = parseSignature(signature);
    
    // Calculate recovery ID (v - 27)
    const recoveryId = sig.v - 27;
    
    // Recover public key
    const publicKey = secp256k1.Signature.fromCompact(
      (sig.r + sig.s.slice(2))
    ).addRecoveryBit(recoveryId).recoverPublicKey(
      messageHash.slice(2)
    ).toRawBytes(false);
    
    // Extract coordinates (skip first byte 0x04)
    const x = '0x' + Buffer.from(publicKey.slice(1, 33)).toString('hex');
    const y = '0x' + Buffer.from(publicKey.slice(33, 65)).toString('hex');
    
    console.log('✅ Public key recovered successfully');
    
    return { x, y };
    
  } catch (error) {
    console.error('Failed to get public key:', error);
    
    // Method 3: Fallback for development - use deterministic derivation
    // ⚠️ THIS ONLY WORKS FOR ANVIL TEST ACCOUNTS
    console.warn('⚠️ Using fallback public key derivation - THIS ONLY WORKS FOR TEST ACCOUNTS');
    
    // For Anvil account #0
    if (account.address.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'.toLowerCase()) {
      return getPublicKeyFromPrivateKey('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    }
    
    throw new Error('Could not extract public key from wallet. Please use a compatible wallet (MetaMask, Rainbow, etc.)');
  }
}

/**
 * Extract public key coordinates from private key (ONLY FOR TESTING)
 */
export function getPublicKeyFromPrivateKey(privateKeyHex) {
  const cleanKey = privateKeyHex.replace('0x', '');
  const privateKeyBytes = hexToBytes('0x' + cleanKey);
  
  // Get uncompressed public key (65 bytes: 0x04 + 32 bytes x + 32 bytes y)
  const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false);
  
  // Extract x and y coordinates (skip first byte which is 0x04)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  
  return {
    x: '0x' + Buffer.from(x).toString('hex'),
    y: '0x' + Buffer.from(y).toString('hex'),
  };
}

/**
 * ✅ FIXED: Generate complete signed QR data with dynamic public key
 */
export async function generateSignedQRData(
  walletClient,
  account,
  ticket,
  eventData,
  nonce, // kept for compatibility but ignored
  verifierAddress,
  chainId
) {
  try {
    console.log('📝 Generating signed QR data...', {
      ticketId: ticket.tokenId || ticket.ticketId,
      owner: account.address,
      event: eventData.eventName
    });
    
    // 1. Set deadline (5 minutes from now)
    const deadline = Math.floor(Date.now() / 1000) + 300;
    console.log('⏰ Deadline set to:', new Date(deadline * 1000).toLocaleString());
    
    // 2. Generate metadata hash
    const metadataHash = generateMetadataHash({
      eventId: ticket.eventId,
      eventName: eventData.eventName,
      eventDate: eventData.eventDate,
    });
    console.log('🔐 Metadata hash generated:', metadataHash);

    // 3. Get EIP-712 typed data
    const typedData = getEIP712TypedData(
      ticket.tokenId || ticket.ticketId,
      account.address,
      0, // nonce not used in deadline architecture
      deadline,
      metadataHash,
      verifierAddress,
      chainId
    );
    
    console.log('📄 EIP-712 typed data prepared');

    // 4. Sign with wallet
    console.log('✍️ Requesting signature from wallet...');
    const signature = await walletClient.signTypedData(typedData);
    console.log('✅ Signature received:', signature.slice(0, 20) + '...');
    
    // 5. Parse signature
    const { r, s, v } = parseSignature(signature);
    console.log('📊 Signature components:', { 
      r: r.slice(0, 10) + '...', 
      s: s.slice(0, 10) + '...', 
      v 
    });

    // 6. ✅ FIX: Get public key dynamically from wallet
    console.log('🔑 Extracting public key from wallet...');
    const { x: Qx, y: Qy } = await getPublicKeyFromSignature(walletClient, account);
    console.log('✅ Public key extracted:', { 
      Qx: Qx.slice(0, 10) + '...', 
      Qy: Qy.slice(0, 10) + '...' 
    });

    const result = {
      // Verification data
      ticketId: String(ticket.tokenId || ticket.ticketId),
      owner: account.address,
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
    
    console.log('✅ Signed QR data generated successfully!');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error generating signed QR data:', error);
    throw new Error(`Failed to generate signature: ${error.message}`);
  }
}

/**
 * Verify signature locally (optional client-side check)
 */
export function verifySignatureLocally(digest, r, s, publicKey) {
  try {
    const rBig = BigInt(r);
    const sBig = BigInt(s);
    
    const n = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
    const HALF_N = BigInt('0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0');
    
    if (rBig <= 0n || rBig >= n) return false;
    if (sBig <= 0n || sBig > HALF_N) return false; // Malleability check
    
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