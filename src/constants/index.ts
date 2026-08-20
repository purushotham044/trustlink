// ============================================================
// TrustLink — Application Constants (Executive White & Dark Navy)
// No secrets here — public configuration only
// ============================================================

// ── Executive Design System ──────────────────────────────────

export const COLORS = {
  // Primary backgrounds (Crisp White & Off-White Dominated)
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceBorder: '#E2E8F0',

  // Accent — Deep Executive Navy & Royal Blue
  primary: '#0F2744',
  primaryDim: '#172554',
  primaryMuted: 'rgba(15, 39, 68, 0.08)',

  // Status colors
  success: '#059669',
  successMuted: 'rgba(5, 150, 105, 0.10)',
  warning: '#D97706',
  warningMuted: 'rgba(217, 119, 6, 0.10)',
  danger: '#DC2626',
  dangerMuted: 'rgba(220, 38, 38, 0.10)',

  // Blockchain accent — Deep Indigo
  blockchain: '#4F46E5',
  blockchainMuted: 'rgba(79, 70, 229, 0.10)',

  // High-Contrast Professional Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  // Crisp Light Borders
  border: '#E2E8F0',
  borderLight: '#CBD5E1',
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
  USER_LOGIN: 'User signed in',
  USER_LOGOUT: 'User signed out',
  USER_REGISTERED: 'User account created',
  FOLDER_CREATED: 'Folder created',
  FOLDER_RENAMED: 'Folder renamed',
  FOLDER_DELETED: 'Folder deleted',
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
