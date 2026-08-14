// ============================================================
// TrustLink — SHA-256 Cryptographic Utility
//
// Uses expo-crypto for native, deterministic SHA-256.
// The same file always produces the same hash.
// A single-byte modification produces a completely different hash.
// ============================================================

import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Compute SHA-256 of a file at the given URI.
 *
 * The file is read as a base64-encoded string, then hashed using the
 * native crypto module. This is deterministic: the same binary content
 * always produces the same hex digest.
 *
 * @param fileUri - Expo FileSystem URI (e.g. from expo-document-picker)
 * @returns 64-character lowercase hex digest
 */
export async function computeFileSha256(fileUri: string): Promise<string> {
  // Read the file as a base64 string
  const base64Content = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Decode base64 to raw bytes represented as a latin-1 string
  // This approach produces the same hash as computing SHA-256 on the raw binary
  const binaryString = atob(base64Content);

  // Hash the binary string
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    binaryString,
    { encoding: Crypto.CryptoEncoding.HEX }
  );

  return digest.toLowerCase();
}

/**
 * Compute SHA-256 of a plain string (for verification comparison).
 */
export async function computeStringSha256(input: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  return digest.toLowerCase();
}

/**
 * Convert a 64-char hex SHA-256 string to a 0x-prefixed hex string
 * suitable for encoding as bytes32 in a Solidity function call.
 */
export function sha256HexToBytes32Hex(sha256Hex: string): string {
  return '0x' + sha256Hex.padStart(64, '0');
}

/**
 * Truncate a hash for display: show first 8 and last 6 characters.
 * e.g. "abc123...def456"
 */
export function truncateHash(hash: string, prefixLen = 8, suffixLen = 6): string {
  if (hash.length <= prefixLen + suffixLen + 3) return hash;
  return `${hash.slice(0, prefixLen)}...${hash.slice(-suffixLen)}`;
}

/**
 * Truncate a blockchain transaction hash for display.
 * e.g. "0x8A3b...92F1"
 */
export function truncateTxHash(txHash: string): string {
  if (txHash.length <= 14) return txHash;
  return `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
}
