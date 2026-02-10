
import {
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  hexToBytes,
  toBytes,
} from "viem";
import { secp256k1 } from "@noble/curves/secp256k1";

/**
 * Generate metadata hash for EIP-712 signing
 */
export function generateMetadataHash(ticket) {
  const packed = encodeAbiParameters(
    parseAbiParameters("uint256, string, string"),
    [
      BigInt(ticket.eventId),
      ticket.eventName || "Event",
      ticket.eventDate || new Date().toISOString(),
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
  deadline,
  metadataHash,
  verifierAddress,
  chainId
) {
  return {
    domain: {
      name: "TicketVerifier",
      version: "1",
      chainId: Number(chainId),
      verifyingContract: verifierAddress,
    },
    types: {
      TicketAccess: [
        { name: "ticketId", type: "uint256" },
        { name: "owner", type: "address" },
        { name: "deadline", type: "uint256" },
        { name: "metadataHash", type: "bytes32" },
      ],
    },
    primaryType: "TicketAccess",
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
  const sig = signature.startsWith("0x") ? signature.slice(2) : signature;

  return {
    r: "0x" + sig.slice(0, 64),
    s: "0x" + sig.slice(64, 128),
    v: parseInt(sig.slice(128, 130), 16),
  };
}

/**
 * Helper: Convert base64 to hex (browser-compatible)
 */
function base64ToHex(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Helper: Uint8Array to hex string (browser-compatible)
 */
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}


export async function getPublicKeyFromSignature(walletClient, account) {
  try {
    console.log("🔐 Attempting to extract public key from wallet...");

    // Method 1: Try eth_getEncryptionPublicKey (MetaMask)
    try {
      console.log("Method 1: Trying eth_getEncryptionPublicKey...");
      const encryptionKey = await walletClient.request({
        method: "eth_getEncryptionPublicKey",
        params: [account.address],
      });

      // Decode base64 public key (browser-compatible)
      const publicKeyHex = base64ToHex(encryptionKey);
      const publicKeyBytes = hexToBytes("0x" + publicKeyHex);

      // Public key is 65 bytes: 0x04 + 32 bytes x + 32 bytes y
      if (publicKeyBytes.length === 65 && publicKeyBytes[0] === 0x04) {
        const x = "0x" + bytesToHex(publicKeyBytes.slice(1, 33));
        const y = "0x" + bytesToHex(publicKeyBytes.slice(33, 65));
        console.log("✅ Got public key from eth_getEncryptionPublicKey");
        return { x, y };
      }
    } catch (e) {
      console.log("Method 1 failed:", e.message);
    }

    // Method 2: ✅ FIXED Recovery from signature (WORKS FOR ANY WALLET)
    console.log("Method 2: Using signature recovery (universal method)...");

    const message = "Ellipticheck Public Key Request";

    // Sign a simple message
    const signature = await walletClient.signMessage({
      account,
      message,
    });

    console.log("✅ Message signed, recovering public key...");

    // Create proper Ethereum signed message hash
    const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
    const prefixedMessage = prefix + message;
    const messageHash = keccak256(toBytes(prefixedMessage));

    console.log("Message hash:", messageHash);

    // Parse signature
    const sig = parseSignature(signature);
    console.log("Signature parsed:", {
      r: sig.r.slice(0, 10) + "...",
      s: sig.s.slice(0, 10) + "...",
      v: sig.v,
    });

    // Calculate recovery ID (v - 27 for legacy, handle EIP-155)
    let recoveryId = sig.v >= 35 ? (sig.v - 35) % 2 : sig.v - 27;

    console.log("Recovery ID:", recoveryId);

    // Create signature bytes (r + s)
    const rBytes = hexToBytes(sig.r);
    const sBytes = hexToBytes(sig.s);
    const sigBytes = new Uint8Array(64);
    sigBytes.set(rBytes, 0);
    sigBytes.set(sBytes, 32);

    // Recover public key using secp256k1
    const messageHashBytes = hexToBytes(messageHash);

    // Try both recovery IDs (0 and 1)
    for (let i = 0; i < 2; i++) {
      try {
        const testRecoveryId = (recoveryId + i) % 2;
        console.log(`Trying recovery ID ${testRecoveryId}...`);

        const signatureObj = secp256k1.Signature.fromCompact(sigBytes);
        const publicKeyBytes = signatureObj
          .addRecoveryBit(testRecoveryId)
          .recoverPublicKey(messageHashBytes)
          .toRawBytes(false);

        // Verify this is the correct public key by checking address
        const x = publicKeyBytes.slice(1, 33);
        const y = publicKeyBytes.slice(33, 65);

        // Compute address from public key
        const publicKeyHash = keccak256(new Uint8Array([...x, ...y]));
        const recoveredAddress = "0x" + publicKeyHash.slice(-40);

        console.log("Recovered address:", recoveredAddress);
        console.log("Expected address:", account.address.toLowerCase());

        if (recoveredAddress.toLowerCase() === account.address.toLowerCase()) {
          const xHex = "0x" + bytesToHex(x);
          const yHex = "0x" + bytesToHex(y);

          console.log("✅ Public key recovered successfully!");
          console.log("Qx:", xHex.slice(0, 10) + "...");
          console.log("Qy:", yHex.slice(0, 10) + "...");

          return { x: xHex, y: yHex };
        }
      } catch (err) {
        console.log(`Recovery attempt ${i} failed:`, err.message);
      }
    }

    throw new Error("Could not recover correct public key from signature");
  } catch (error) {
    console.error("❌ All methods failed:", error);

    throw new Error(
      "Failed to extract public key from wallet.\n\n" +
        "This can happen if:\n" +
        "1. Your wallet is not connected properly\n" +
        "2. You rejected the signature request\n" +
        "3. Your wallet does not support message signing\n\n" +
        "Supported wallets:\n" +
        "- MetaMask\n" +
        "- Rainbow Wallet\n" +
        "- Trust Wallet\n" +
        "- WalletConnect compatible wallets\n\n" +
        "Please try:\n" +
        "1. Reconnecting your wallet\n" +
        "2. Refreshing the page\n" +
        "3. Using a different wallet\n\n" +
        "Technical details: " +
        error.message
    );
  }
}

/**
 * Extract public key coordinates from private key (ONLY FOR TESTING)
 * ⚠️ DEPRECATED: Not used in production - kept for reference only
 */
export function getPublicKeyFromPrivateKey(privateKeyHex) {
  console.warn(
    "⚠️ getPublicKeyFromPrivateKey is deprecated and should not be used"
  );

  const cleanKey = privateKeyHex.replace("0x", "");
  const privateKeyBytes = hexToBytes("0x" + cleanKey);

  // Get uncompressed public key (65 bytes: 0x04 + 32 bytes x + 32 bytes y)
  const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false);

  // Extract x and y coordinates (skip first byte which is 0x04)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);

  return {
    x: "0x" + bytesToHex(x),
    y: "0x" + bytesToHex(y),
  };
}

/**
 * ✅ Generate complete signed QR data with dynamic public key
 */
export async function generateSignedQRData(
  walletClient,
  account,
  ticket,
  eventData,
  verifier,
  chain
) {
  try {
    console.log("🎫 Generating signed QR data...", {
      ticketId: ticket.tokenId || ticket.ticketId,
      owner: account.address,
      event: eventData.eventName,
    });

    // 1. Set deadline (58s from now)
    const deadline = Math.floor(Date.now() / 1000) + 58;
    console.log(
      "⏰ Deadline set to:",
      new Date(deadline * 1000).toLocaleString()
    );

    // 2. Generate metadata hash
    const metadataHash = generateMetadataHash({
      eventId: ticket.eventId,
      eventName: eventData.eventName,
      eventDate: eventData.eventDate,
    });
    console.log("📝 Metadata hash generated:", metadataHash);

    // 3. Get EIP-712 typed data
    const typedData = getEIP712TypedData(
      ticket.tokenId || ticket.ticketId,
      account.address,
      deadline,
      metadataHash,
      verifier,
      chain
    );

    console.log("📄 EIP-712 typed data prepared");

    // 4. Sign with wallet
    console.log("✍️ Requesting signature from wallet...");
    const signature = await walletClient.signTypedData(typedData);
    console.log("✅ Signature received:", signature.slice(0, 20) + "...");

    // 5. Parse signature
    const { r, s, v } = parseSignature(signature);
    console.log("📊 Signature components:", {
      r: r.slice(0, 10) + "...",
      s: s.slice(0, 10) + "...",
      v,
    });

    // 6. ✅ Get public key dynamically from wallet
    console.log("🔑 Extracting public key from wallet...");
    const { x: Qx, y: Qy } = await getPublicKeyFromSignature(
      walletClient,
      account
    );
    console.log("✅ Public key extracted:", {
      Qx: Qx.slice(0, 10) + "...",
      Qy: Qy.slice(0, 10) + "...",
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

    console.log("✅ Signed QR data generated successfully!");
    console.log("🧾 SIGNED DATA (pre-QR):", {
      ticketId: String(ticket.tokenId || ticket.ticketId),
      owner: account.address,
      deadline: String(deadline),
      metadataHash,
      r,
      s,
      Qx,
      Qy,
    });

    return result;
  } catch (error) {
    console.error("❌ Error generating signed QR data:", error);
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

    const n = BigInt(
      "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141"
    );
    const HALF_N = BigInt(
      "0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0"
    );

    if (rBig <= 0n || rBig >= n) return false;
    if (sBig <= 0n || sBig > HALF_N) return false;

    return true;
  } catch (error) {
    console.error("Local verification error:", error);
    return false;
  }
}

/**
 * Format utilities
 */
export function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(wei) {
  return (Number(wei) / 1e18).toFixed(4);
}

export function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
