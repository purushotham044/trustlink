// ============================================================
// TrustLink — SHA-256 Cryptographic Utility
//
// Uses ethers.sha256 & base64 decoding for robust, deterministic
// binary file hashing across Android, iOS & Web.
// ============================================================

import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { ethers } from 'ethers';

/**
 * Compute SHA-256 of a file at the given URI.
 *
 * Reads file bytes into an ArrayBuffer and computes exact NIST SHA-256.
 * Completely immune to `atob` binary decoding crashes.
 *
 * @param fileUri - Expo FileSystem URI (e.g. from expo-document-picker)
 * @returns 64-character lowercase hex digest
 */
export async function computeFileSha256(fileUri: string): Promise<string> {
  try {
    const base64Content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = decode(base64Content);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Compute deterministic SHA-256 via ethers.js binary hasher
    const hashWith0x = ethers.sha256(uint8Array);
    return hashWith0x.replace('0x', '').toLowerCase();
  } catch (err) {
    // Fallback: direct expo-crypto digest if string
    try {
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        content,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      return digest.toLowerCase();
    } catch (e) {
      throw new Error(`Failed to compute cryptographic hash: ${(err as Error).message}`);
    }
  }
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
