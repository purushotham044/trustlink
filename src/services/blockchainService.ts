// ============================================================
// TrustLink — Blockchain Service (Ethereum Sepolia Integration)
// ============================================================

import { supabase } from '@/lib/supabase';
import { BlockchainProof, VerificationResult } from '@/types';
import { BLOCKCHAIN_EXPLORER_BASE } from '@/constants';
import { ethers } from 'ethers';

const DOCUMENT_REGISTRY_ABI = [
  'function verifyDocument(bytes32 documentHash) external view returns (bool exists, address owner, uint256 timestamp, uint256 blockNumber)',
];

const SEPOLIA_RPC_ENDPOINT = 'https://ethereum-sepolia.publicnode.com';
const DOCUMENT_REGISTRY_CONTRACT_ADDRESS = '0x1b9A1FBD6FC714B1aC443d00a555529567bd8D0E';

export const blockchainService = {
  /**
   * Fetches the authoritative blockchain proof record for a document from PostgreSQL.
   */
  async getBlockchainProof(documentId: string): Promise<BlockchainProof | null> {
    const { data, error } = await supabase
      .from('blockchain_proofs')
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching blockchain proof:', error);
      return null;
    }

    return data as BlockchainProof | null;
  },

  /**
   * Anchors a document's authoritative SHA-256 hash to Ethereum Sepolia.
   * Invokes the authenticated Supabase Edge Function where the server-side signer
   * validates ownership, reads authoritative current_hash from database, and broadcasts
   * the real transaction to Ethereum Sepolia.
   *
   * NO FAKE CLIENT SIMULATION: Fails honestly if the backend or Ethereum network is unavailable.
   */
  async anchorDocument(documentId: string): Promise<BlockchainProof> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('anchor-document', {
      body: { documentId },
    });

    if (error) {
      const errorMsg = data?.error || error.message || 'Blockchain anchoring service unavailable';
      throw new Error(errorMsg);
    }

    if (!data?.proof) {
      throw new Error(data?.error || 'Blockchain anchoring is currently unavailable. No blockchain proof was created.');
    }

    return data.proof as BlockchainProof;
  },

  /**
   * Queries the Ethereum Sepolia smart contract directly via public JSON-RPC.
   * Confirms live on-chain existence of the 32-byte SHA-256 hash independently.
   */
  async verifyOnChain(documentHash: string): Promise<{ exists: boolean; owner: string; timestamp: number; blockNumber: number } | null> {
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_ENDPOINT);
      const contract = new ethers.Contract(DOCUMENT_REGISTRY_CONTRACT_ADDRESS, DOCUMENT_REGISTRY_ABI, provider);
      const formattedHash = documentHash.startsWith('0x') ? documentHash : `0x${documentHash}`;
      
      const [exists, owner, timestamp, blockNumber] = await contract.verifyDocument(formattedHash);
      
      return {
        exists: Boolean(exists),
        owner: String(owner),
        timestamp: Number(timestamp),
        blockNumber: Number(blockNumber),
      };
    } catch (err) {
      console.log('Direct Sepolia RPC query note:', err);
      return null;
    }
  },

  /**
   * Generates a link to view the transaction on Sepolia Etherscan.
   */
  getExplorerUrl(txHash: string | null): string | null {
    if (!txHash) return null;
    return `${BLOCKCHAIN_EXPLORER_BASE}${txHash}`;
  },

  /**
   * Verifies document integrity against Database record and Ethereum Sepolia on-chain proof.
   * Distinguishes local cryptographic integrity from blockchain anchoring confirmation.
   */
  async verifyDualIntegrity(
    documentName: string,
    currentHash: string,
    storedHash: string | null,
    proof: BlockchainProof | null
  ): Promise<VerificationResult> {
    const trustlinkMatch = Boolean(storedHash && currentHash.toLowerCase() === storedHash.toLowerCase());
    
    // Check local proof status
    let blockchainMatch: boolean | null = null;
    if (proof && proof.status === 'CONFIRMED') {
      blockchainMatch = currentHash.toLowerCase() === proof.document_hash.toLowerCase();
    }

    // Direct on-chain query validation against Sepolia
    const onChainResult = await this.verifyOnChain(currentHash);
    if (onChainResult && onChainResult.exists) {
      blockchainMatch = true;
    }

    const overallVerified = trustlinkMatch && (blockchainMatch !== false);

    return {
      documentName,
      currentHash,
      storedHash,
      blockchainHash: proof ? proof.document_hash : (onChainResult?.exists ? currentHash : null),
      trustlinkMatch,
      blockchainMatch,
      blockchainProof: proof,
      overallVerified,
      verifiedAt: new Date().toISOString(),
    };
  }
};
