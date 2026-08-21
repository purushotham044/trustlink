// ============================================================
// TrustLink — TypeScript Type Definitions
// ============================================================

export type IntegrityStatus = 'VERIFIED' | 'PENDING' | 'FAILED';

export type BlockchainStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export type SharePermission = 'VIEW' | 'DOWNLOAD';

export type AuditAction =
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DOWNLOADED'
  | 'DOCUMENT_VIEWED'
  | 'DOCUMENT_RENAMED'
  | 'DOCUMENT_MOVED'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENT_SHARED'
  | 'SHARE_REVOKED'
  | 'DOCUMENT_VERIFIED'
  | 'HASH_CREATED'
  | 'BLOCKCHAIN_ANCHORED'
  | 'BLOCKCHAIN_ANCHOR_FAILED';

// ── Database Entities ────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type UserProfile = Profile;

export interface Folder {
  id: string;
  owner_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  owner_id: string;
  folder_id: string | null;
  name: string;
  mime_type: string;
  size: number;
  storage_path: string;
  current_hash: string | null;
  integrity_status: IntegrityStatus;
  created_at: string;
  updated_at: string;
}

export interface IntegrityRecord {
  id: string;
  document_id: string;
  sha256_hash: string;
  generated_at: string;
  generated_by: string;
  version_reference: number;
}

export interface BlockchainProof {
  id: string;
  document_id: string;
  document_hash: string;
  blockchain_network: string;
  transaction_hash: string | null;
  block_number: number | null;
  contract_address: string | null;
  anchored_at: string | null;
  status: BlockchainStatus;
  created_at: string;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  owner_id: string;
  shared_with_id: string;
  permission: SharePermission;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  document?: Document;
}

export interface AuditLog {
  id: string;
  user_id: string;
  document_id: string | null;
  action: AuditAction;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ── UI State ─────────────────────────────────────────────────

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ── Verification ─────────────────────────────────────────────

export type VerificationLevel = 'TRUSTLINK' | 'BLOCKCHAIN' | 'BOTH';

export interface VerificationResult {
  documentName: string;
  currentHash?: string;
  localHash?: string;
  storedHash?: string | null;
  databaseHash?: string | null;
  blockchainHash?: string | null;
  trustlinkMatch?: boolean;
  dbMatch?: boolean;
  blockchainMatch: boolean | null;
  blockchainProof?: BlockchainProof | null;
  blockchainNetwork?: string | null;
  transactionHash?: string | null;
  blockNumber?: number | null;
  overallVerified: boolean;
  verifiedAt: string;
}
