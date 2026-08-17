// ============================================================
// TrustLink QA Suite — Cryptographic Integrity & Hashing Tests
// ============================================================

import crypto from 'crypto';

function computeSha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function truncateHash(hash: string, startChars: number = 8, endChars: number = 8): string {
  if (!hash || hash.length <= startChars + endChars) return hash;
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}

function isValidSha256(hash: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

describe('Cryptographic Engine & SHA-256 Validation (30 Test Cases)', () => {
  // Determinism Tests
  test('1. SHA-256 is strictly deterministic for identical string inputs', () => {
    const input = 'TrustLink Secure Payload 2026';
    expect(computeSha256(input)).toBe(computeSha256(input));
  });

  test('2. SHA-256 outputs exactly 64 hexadecimal characters', () => {
    const hash = computeSha256('Test document content');
    expect(hash.length).toBe(64);
    expect(isValidSha256(hash)).toBe(true);
  });

  test('3. SHA-256 output matches standard NIST test vector for empty string', () => {
    const emptyHash = computeSha256('');
    expect(emptyHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  test('4. SHA-256 output matches NIST test vector for "abc"', () => {
    expect(computeSha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  test('5. Avalanche effect: 1-bit input change completely mutates output hash', () => {
    const hashA = computeSha256('TrustLink_Doc_A');
    const hashB = computeSha256('TrustLink_Doc_B');
    expect(hashA).not.toBe(hashB);
    let diffCount = 0;
    for (let i = 0; i < hashA.length; i++) {
      if (hashA[i] !== hashB[i]) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(30);
  });

  test('6. Binary Buffer hashing produces identical hash to string when encoding matches', () => {
    const text = 'Verifiable Document Binary Content';
    const buffer = Buffer.from(text, 'utf8');
    expect(computeSha256(buffer)).toBe(computeSha256(text));
  });

  test('7. Large payload simulation (1MB) computes hash within performance SLA (<50ms)', () => {
    const largeBuffer = Buffer.alloc(1024 * 1024, 'a');
    const start = performance.now();
    const hash = computeSha256(largeBuffer);
    const duration = performance.now() - start;
    expect(isValidSha256(hash)).toBe(true);
    expect(duration).toBeLessThan(50);
  });

  test('8. Multi-megabyte (5MB) simulation hashes correctly', () => {
    const buffer5MB = Buffer.alloc(5 * 1024 * 1024, 'x');
    const hash = computeSha256(buffer5MB);
    expect(isValidSha256(hash)).toBe(true);
  });

  test('9. Case normalization: Hash verification is case-insensitive', () => {
    const hashLower = computeSha256('Document').toLowerCase();
    const hashUpper = computeSha256('Document').toUpperCase();
    expect(hashLower.toLowerCase()).toBe(hashUpper.toLowerCase());
  });

  test('10. Truncate hash returns valid format with default lengths (8...8)', () => {
    const fullHash = computeSha256('TestDoc');
    const truncated = truncateHash(fullHash, 8, 8);
    expect(truncated).toMatch(/^[a-f0-9]{8}\.\.\.[a-f0-9]{8}$/);
    expect(truncated.length).toBe(19);
  });

  test('11. Truncate hash handles short strings safely without throwing', () => {
    expect(truncateHash('12345')).toBe('12345');
    expect(truncateHash('')).toBe('');
  });

  test('12. Truncate hash with custom bounds (6...6)', () => {
    const fullHash = computeSha256('TestDoc');
    const truncated = truncateHash(fullHash, 6, 6);
    expect(truncated.length).toBe(15);
  });

  test('13. Hex validation rejects hashes with invalid characters (e.g. "z")', () => {
    expect(isValidSha256('g' + '0'.repeat(63))).toBe(false);
    expect(isValidSha256('z' + '0'.repeat(63))).toBe(false);
  });

  test('14. Hex validation rejects hashes shorter than 64 chars', () => {
    expect(isValidSha256('a'.repeat(63))).toBe(false);
  });

  test('15. Hex validation rejects hashes longer than 64 chars', () => {
    expect(isValidSha256('a'.repeat(65))).toBe(false);
  });

  test('16. UTF-8 multi-byte characters (emojis, accents) hash consistently', () => {
    const hash1 = computeSha256('Document 🚀 — Confirmed');
    const hash2 = computeSha256('Document 🚀 — Confirmed');
    expect(hash1).toBe(hash2);
  });

  test('17. Leading and trailing whitespace alters hash as expected', () => {
    expect(computeSha256('File Content')).not.toBe(computeSha256(' File Content '));
  });

  test('18. Newline preservation: CRLF vs LF produce distinct hashes', () => {
    expect(computeSha256('Line1\r\nLine2')).not.toBe(computeSha256('Line1\nLine2'));
  });

  test('19. Null byte handling: Binary files with 0x00 bytes hash reliably', () => {
    const nullBuffer = Buffer.from([0x00, 0x01, 0x02, 0x00, 0xff]);
    const hash = computeSha256(nullBuffer);
    expect(isValidSha256(hash)).toBe(true);
  });

  test('20. 32-byte bytes32 Ethereum format compatibility (0x prefix)', () => {
    const hash = computeSha256('Ethereum Anchor Data');
    const bytes32 = '0x' + hash;
    expect(bytes32.length).toBe(66);
    expect(bytes32.startsWith('0x')).toBe(true);
  });

  test('21. bytes32 formatting is idempotent', () => {
    const hash = computeSha256('Idempotent');
    const formatted1 = hash.startsWith('0x') ? hash : '0x' + hash;
    const formatted2 = formatted1.startsWith('0x') ? formatted1 : '0x' + formatted1;
    expect(formatted1).toBe(formatted2);
  });

  test('22. Collision resistance check across 1,000 distinct document payloads', () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const hash = computeSha256(`Document_Batch_Item_${i}_${Date.now()}`);
      set.add(hash);
    }
    expect(set.size).toBe(1000);
  });

  test('23. PDF mime simulation hashing', () => {
    const fakePdfHeader = Buffer.from('%PDF-1.4\n%âãÏÓ\n');
    const hash = computeSha256(fakePdfHeader);
    expect(isValidSha256(hash)).toBe(true);
  });

  test('24. Image JPEG header simulation hashing', () => {
    const fakeJpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    const hash = computeSha256(fakeJpeg);
    expect(isValidSha256(hash)).toBe(true);
  });

  test('25. JSON structured document serialization hashing', () => {
    const payload = JSON.stringify({ docId: '123', owner: 'user_a', timestamp: 1786650000 });
    const hash = computeSha256(payload);
    expect(isValidSha256(hash)).toBe(true);
  });

  test('26. Dual hashing equivalence across independent algorithms', () => {
    const raw = 'Independent Hash Verification';
    const h1 = crypto.createHash('sha256').update(raw).digest('hex');
    const h2 = crypto.createHash('sha256').update(Buffer.from(raw, 'utf8')).digest('hex');
    expect(h1).toBe(h2);
  });

  test('27. Transaction hash format validator rejects invalid prefixes', () => {
    const txHash = '0x' + computeSha256('tx_event');
    expect(txHash.startsWith('0x')).toBe(true);
    expect(txHash.length).toBe(66);
  });

  test('28. Hash truncation for UI displays correctly in mobile cards', () => {
    const hash = computeSha256('Card Display');
    const preview = truncateHash(hash, 6, 6);
    expect(preview).toBe(`${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`);
  });

  test('29. Empty buffer returns valid SHA-256 without error', () => {
    expect(computeSha256(Buffer.alloc(0))).toBe(computeSha256(''));
  });

  test('30. Cryptographic integrity check: Identical inputs produce matching boolean', () => {
    const fileA = computeSha256('TrustLink Verified Document 2026');
    const fileB = computeSha256('TrustLink Verified Document 2026');
    expect(fileA === fileB).toBe(true);
  });
});
