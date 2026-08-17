// ============================================================
// TrustLink — Application Constants
// No secrets here — public configuration only
// ============================================================

// ── Design System ────────────────────────────────────────────

export const COLORS = {
  // Primary backgrounds
  background: '#0A0E1A',
  surface: '#111827',
  surfaceElevated: '#1A2235',
  surfaceBorder: '#1E293B',

  // Accent — cyan/teal for cybersecurity aesthetic
  primary: '#00D4FF',
  primaryDim: '#0099BB',
  primaryMuted: 'rgba(0, 212, 255, 0.12)',

  // Status colors
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.12)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.12)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.12)',

  // Blockchain accent — purple
  blockchain: '#8B5CF6',
  blockchainMuted: 'rgba(139, 92, 246, 0.12)',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  textInverse: '#0A0E1A',

  // Borders
  border: '#1E293B',
  borderLight: '#2D3748',
} as const;

export const TYPOGRAPHY = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 36,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

// ── App Configuration ────────────────────────────────────────

export const APP_NAME = 'TrustLink';
export const APP_SCHEME = 'trustlink';

// ── Document Configuration ───────────────────────────────────

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
];

export const FILE_ICONS: Record<string, string> = {
  'application/pdf': 'file-pdf-box',
  'application/msword': 'file-word-box',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file-word-box',
  'application/vnd.ms-excel': 'file-excel-box',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'file-excel-box',
  'image/jpeg': 'file-image',
  'image/png': 'file-image',
  'image/webp': 'file-image',
  'text/plain': 'file-document-outline',
};

// ── Blockchain Configuration ─────────────────────────────────

export const BLOCKCHAIN_NETWORK = 'Ethereum Sepolia';
export const BLOCKCHAIN_EXPLORER_BASE = 'https://sepolia.etherscan.io/tx/';

// ── Storage ──────────────────────────────────────────────────

export const STORAGE_BUCKET = 'documents';

// ── Sharing Configuration ────────────────────────────────────

export const SHARE_DURATIONS: Record<string, number | null> = {
  '1_HOUR': 3600,
  '24_HOURS': 86400,
  '7_DAYS': 604800,
  'NEVER': null,
};

// ── Audit Actions ────────────────────────────────────────────

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  DOCUMENT_UPLOADED: 'Document uploaded',
  DOCUMENT_VIEWED: 'Document viewed',
  DOCUMENT_DOWNLOADED: 'Document downloaded',
  DOCUMENT_RENAMED: 'Document renamed',
  DOCUMENT_MOVED: 'Document moved',
  DOCUMENT_DELETED: 'Document deleted',
  DOCUMENT_SHARED: 'Document shared',
  SHARE_REVOKED: 'Share access revoked',
  DOCUMENT_VERIFIED: 'Document verified',
  HASH_CREATED: 'SHA-256 proof created',
  BLOCKCHAIN_ANCHORED: 'Hash anchored to blockchain',
  BLOCKCHAIN_ANCHOR_FAILED: 'Blockchain anchoring failed',
};


