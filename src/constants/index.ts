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
  surfaceHighlight: '#F1F5F9',
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

  // Nested fontSize compatibility
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 36,
  },

  // Nested fontFamily / fontWeight compatibility
  fontFamily: {
    regular: undefined,
    medium: undefined,
    semibold: undefined,
    bold: undefined,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
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
  xxl: 24,
  full: 9999,
} as const;

// ── App Configuration ────────────────────────────────────────

export const APP_CONFIG = {
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
  ],
  SIGNED_URL_EXPIRY_SECONDS: 60, // 60-second time-limited download links
  AUTO_VERIFY_ON_DETAIL: true,
} as const;

export const ALLOWED_MIME_TYPES = APP_CONFIG.ALLOWED_MIME_TYPES;
export const MAX_FILE_SIZE_BYTES = APP_CONFIG.MAX_FILE_SIZE_BYTES;

// ── Smart Contract & Blockchain Configuration ────────────────

export const BLOCKCHAIN_CONFIG = {
  NETWORK_NAME: 'Ethereum Sepolia',
  CHAIN_ID: 11155111,
  CONTRACT_ADDRESS: '0x1b9A1FBD6FC714B1aC443d00a555529567bd8D0E',
  RPC_URL: 'https://ethereum-sepolia.publicnode.com',
  EXPLORER_BASE_URL: 'https://sepolia.etherscan.io/tx/',
  CONTRACT_EXPLORER_URL: 'https://sepolia.etherscan.io/address/0x1b9A1FBD6FC714B1aC443d00a555529567bd8D0E',
} as const;

export const BLOCKCHAIN_EXPLORER_BASE = BLOCKCHAIN_CONFIG.EXPLORER_BASE_URL;
export const CONTRACT_EXPLORER_BASE = BLOCKCHAIN_CONFIG.CONTRACT_EXPLORER_URL;
export const BLOCKCHAIN_NETWORK = BLOCKCHAIN_CONFIG.NETWORK_NAME;
export const CONTRACT_ADDRESS = BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS;

// ── Audit Trail Action Labels & Icons ────────────────────────

export const AUDIT_ACTIONS = {
  DOCUMENT_UPLOADED: {
    label: 'Document Uploaded',
    icon: 'upload',
    color: COLORS.primary,
  },
  HASH_CREATED: {
    label: 'SHA-256 Fingerprint Generated',
    icon: 'shield',
    color: COLORS.primary,
  },
  DOCUMENT_VERIFIED: {
    label: 'Integrity Verified',
    icon: 'shield-check',
    color: COLORS.success,
  },
  DOCUMENT_DOWNLOADED: {
    label: 'Document Downloaded',
    icon: 'download',
    color: COLORS.textSecondary,
  },
  DOCUMENT_DELETED: {
    label: 'Document Deleted',
    icon: 'trash-2',
    color: COLORS.danger,
  },
  DOCUMENT_SHARED: {
    label: 'Document Shared',
    icon: 'share-2',
    color: COLORS.warning,
  },
  SHARE_REVOKED: {
    label: 'Share Revoked',
    icon: 'slash',
    color: COLORS.danger,
  },
  BLOCKCHAIN_ANCHORED: {
    label: 'Anchored to Blockchain',
    icon: 'link',
    color: COLORS.blockchain,
  },
  BLOCKCHAIN_ANCHOR_FAILED: {
    label: 'Blockchain Anchoring Failed',
    icon: 'alert-triangle',
    color: COLORS.danger,
  },
  USER_LOGIN: {
    label: 'User Signed In',
    icon: 'log-in',
    color: COLORS.primary,
  },
  USER_LOGOUT: {
    label: 'User Signed Out',
    icon: 'log-out',
    color: COLORS.textMuted,
  },
  USER_REGISTERED: {
    label: 'Account Created',
    icon: 'user-plus',
    color: COLORS.success,
  },
  FOLDER_CREATED: {
    label: 'Folder Created',
    icon: 'folder-plus',
    color: COLORS.warning,
  },
  FOLDER_RENAMED: {
    label: 'Folder Renamed',
    icon: 'edit-2',
    color: COLORS.warning,
  },
  FOLDER_DELETED: {
    label: 'Folder Deleted',
    icon: 'folder-minus',
    color: COLORS.danger,
  },
} as const;

export const AUDIT_ACTION_LABELS = {
  DOCUMENT_UPLOADED: 'Document uploaded',
  HASH_CREATED: 'SHA-256 fingerprint generated',
  DOCUMENT_VERIFIED: 'Document verified',
  DOCUMENT_DOWNLOADED: 'Document downloaded',
  DOCUMENT_DELETED: 'Document deleted',
  DOCUMENT_SHARED: 'Document shared',
  SHARE_REVOKED: 'Share access revoked',
  BLOCKCHAIN_ANCHORED: 'Hash anchored to blockchain',
  BLOCKCHAIN_ANCHOR_FAILED: 'Blockchain anchoring failed',
  USER_LOGIN: 'User signed in',
  USER_LOGOUT: 'User signed out',
  USER_REGISTERED: 'Account created',
  FOLDER_CREATED: 'Folder created',
  FOLDER_RENAMED: 'Folder renamed',
  FOLDER_DELETED: 'Folder deleted',
} as const;

export const SHARE_DURATIONS = {
  '1_HOUR': 3600,
  '24_HOURS': 86400,
  '7_DAYS': 604800,
  'NEVER': null,
} as const;

export const FILE_ICONS = {
  'application/pdf': 'file-text',
  'image/jpeg': 'image',
  'image/png': 'image',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file-text',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'grid',
  'default': 'file',
} as const;
