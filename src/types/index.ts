// ============================================================
// TrustLink — Shared TypeScript Types
// ============================================================

// ── Auth ────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── Folders ─────────────────────────────────────────────────

export interface Folder {
  id: string;
  owner_id: string;
  parent_folder_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

// ── Documents ────────────────────────────────────────────────

export type IntegrityStatus = 'PENDING' | 'VERIFIED' | 'FAILED';

export interface Document {
  id: string;
  owner_id: string;
  folder_id: string | null;
  name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  current_hash: string | null;
  integrity_status: IntegrityStatus;
  created_at: string;
  updated_at: string;
}

// ── Integrity Records ────────────────────────────────────────

export interface IntegrityRecord {
  id: string;
  document_id: string;
  sha256_hash: string;
  generated_at: string;
  generated_by: string;
  version_reference: number;
}

// ── Blockchain Proofs ────────────────────────────────────────

export type BlockchainProofStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface BlockchainProof {
  id: string;
  document_id: string;
  document_hash: string;
  blockchain_network: string;
  transaction_hash: string | null;
  block_number: number | null;
  contract_address: string | null;
  anchored_at: string | null;
  status: BlockchainProofStatus;
  created_at: string;
}

// ── Document Shares ──────────────────────────────────────────

export type SharePermission = 'VIEW' | 'DOWNLOAD';

export interface DocumentShare {
  id: string;
  document_id: string;
  owner_id: string;
  shared_with_id: string;
  permission: SharePermission;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

// ── Audit Logs ───────────────────────────────────────────────

export type AuditAction =
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_VIEWED'
  | 'DOCUMENT_DOWNLOADED'
  | 'DOCUMENT_RENAMED'
  | 'DOCUMENT_MOVED'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENT_SHARED'
  | 'SHARE_REVOKED'
  | 'DOCUMENT_VERIFIED'
  | 'HASH_CREATED'
  | 'BLOCKCHAIN_ANCHORED'
  | 'BLOCKCHAIN_ANCHOR_FAILED';

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
  currentHash: string;
  storedHash: string | null;
  blockchainHash: string | null;
  trustlinkMatch: boolean;
  blockchainMatch: boolean | null;
  blockchainProof: BlockchainProof | null;
  overallVerified: boolean;
  verifiedAt: string;
}
