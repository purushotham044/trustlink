# TrustLink

> **Blockchain-backed document vault** — store documents like Google Drive, prove they haven't been altered.

---

## What is TrustLink?

TrustLink is a **secure cloud document management platform** with a core innovation:

> Every important document can have its SHA-256 hash **permanently anchored to a blockchain**, creating an immutable timestamped proof that the document has not been modified.

```
STORE → HASH → ANCHOR → VERIFY → SHARE → AUDIT
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native + Expo |
| Auth | Supabase Auth (Email + Google OAuth) |
| Database | Supabase PostgreSQL with RLS |
| Storage | Supabase Storage (private bucket) |
| Backend Logic | Supabase Edge Functions (Deno) |
| Cryptography | SHA-256 via expo-crypto |
| Blockchain | EVM-compatible (Sepolia testnet → Polygon/Ethereum) |
| Smart Contract | Minimal Solidity anchor contract |

---

## Setup Guide

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A [Supabase](https://supabase.com) account
- An Android device or emulator

### 1. Clone & Install

```bash
git clone <repo>
cd trustlink
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> ⚠️ **Never commit `.env`** — it is in `.gitignore`

### 3. Supabase Database Setup

In your Supabase dashboard → **SQL Editor**, run:

1. `supabase/migrations/001_schema.sql` — creates all tables
2. `supabase/migrations/002_rls.sql` — enables Row Level Security

### 4. Supabase Storage Setup

In Supabase dashboard → **Storage**:

1. Create a **new bucket** named `documents`
2. Set it to **Private** (not public)
3. Add storage policies:
   - Authenticated users can upload to `{user_id}/*`
   - Authenticated users can read from `{user_id}/*`

### 5. Google OAuth Setup

#### In Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Android**
6. Package name: `com.trustlink.app`
7. SHA-1 fingerprint: (for Expo Go dev, use the Expo fingerprint)
8. Also create a **Web** OAuth client ID

#### In Supabase Dashboard:

1. Go to **Authentication → Providers → Google**
2. Enable Google provider
3. Paste your **Client ID** and **Client Secret**
4. Add redirect URL: `trustlink://auth/callback`

### 6. Run

```bash
npm run android
```

---

## Security Architecture

```
React Native (anon key only)
         │
         │ Supabase Auth JWT
         ↓
    Supabase RLS
         │
    PostgreSQL
         │
    Edge Functions ──── BLOCKCHAIN_PRIVATE_KEY (secret, never in app)
         │                       │
         │               Blockchain RPC
         ↓                       ↓
    Storage                Smart Contract
   (private)            (hash anchoring)
```

**Security rules:**
- `BLOCKCHAIN_PRIVATE_KEY` → Supabase Edge Function backend secret only
- `SUPABASE_SERVICE_ROLE_KEY` → Supabase Edge Functions / Backend only
- Session tokens → Platform-secure credential storage using Expo SecureStore
- Storage → Private bucket with temporary HMAC-signed URLs only
- Authorization → Strictly enforced by PostgreSQL Row Level Security (RLS) policies
- Cryptographic Proof → Deterministic SHA-256 binary hashing verified against Ethereum Sepolia blockchain anchor

---

## Implementation Phases

| Phase | Status | Description |
|---|---|---|
| **1** | ✅ Complete | Foundation: Expo + Auth + Navigation |
| **2** | ✅ Complete | Document Vault: Upload/Download/CRUD + Folders |
| **3** | ✅ Complete | Cryptographic Integrity: SHA-256 |
| **4** | ✅ Complete | Blockchain: Anchoring + Verification |
| **5** | ✅ Complete | Secure Sharing: Granular Permissions + Revocation |
| **6** | ✅ Complete | Audit Trail: Security Event Timeline + Filtering |
| **7** | ✅ Complete | Production Hardening: Security Audit + Zero-Error Bundle |

---

## Verification Principle

TrustLink verification is **real cryptographic verification**, not a badge:

```
SHA256(current_file)
        ==
stored_hash          ← from PostgreSQL
        ==
blockchain_hash      ← from on-chain proof
```

All three must match for VERIFIED status.
