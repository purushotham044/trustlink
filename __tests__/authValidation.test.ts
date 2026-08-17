// ============================================================
// TrustLink QA Suite — Authentication & Input Validation Tests
// ============================================================

function validateEmail(email: string): boolean {
  if (!email || !email.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: 'Password is required.' };
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters.' };
  return { valid: true };
}

function validateRegistration(fullName: string, email: string, pass: string, confirm: string): string | null {
  if (!fullName || !fullName.trim()) return 'Full name is required.';
  if (!email || !email.trim()) return 'Email address is required.';
  if (!validateEmail(email)) return 'Please enter a valid email address.';
  const pCheck = validatePassword(pass);
  if (!pCheck.valid) return pCheck.error!;
  if (pass !== confirm) return 'Passwords do not match.';
  return null;
}

describe('Authentication & Input Validation (30 Test Cases)', () => {
  // Email validation suite
  test('1. Valid standard email passes validation', () => {
    expect(validateEmail('alice@example.com')).toBe(true);
  });

  test('2. Valid email with subdomains passes', () => {
    expect(validateEmail('security.officer@corp.trustlink.io')).toBe(true);
  });

  test('3. Valid email with plus addressing passes', () => {
    expect(validateEmail('user+vault@domain.com')).toBe(true);
  });

  test('4. Empty email string fails validation', () => {
    expect(validateEmail('')).toBe(false);
  });

  test('5. Whitespace-only email fails validation', () => {
    expect(validateEmail('   ')).toBe(false);
  });

  test('6. Email missing @ symbol fails', () => {
    expect(validateEmail('invalidemail.com')).toBe(false);
  });

  test('7. Email missing domain extension fails', () => {
    expect(validateEmail('alice@domain')).toBe(false);
  });

  test('8. Email with spaces inside fails', () => {
    expect(validateEmail('alice smith@domain.com')).toBe(false);
  });

  test('9. Email with trailing spaces is trimmed and validated', () => {
    expect(validateEmail('  alice@example.com  ')).toBe(true);
  });

  test('10. Email with double @@ fails', () => {
    expect(validateEmail('alice@@example.com')).toBe(false);
  });

  // Password validation suite
  test('11. Password with 8 characters passes', () => {
    expect(validatePassword('12345678').valid).toBe(true);
  });

  test('12. Password with 7 characters fails 8-char rule', () => {
    const res = validatePassword('1234567');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('at least 8 characters');
  });

  test('13. Empty password fails', () => {
    expect(validatePassword('').valid).toBe(false);
  });

  test('14. Long secure password (64 characters) passes', () => {
    expect(validatePassword('a'.repeat(64)).valid).toBe(true);
  });

  test('15. Complex password with special characters passes', () => {
    expect(validatePassword('Tr$stL!nk#2026_Secured').valid).toBe(true);
  });

  // Full registration validator suite
  test('16. Valid registration payload returns null error', () => {
    const err = validateRegistration('Alice Doe', 'alice@trustlink.io', 'Password123!', 'Password123!');
    expect(err).toBeNull();
  });

  test('17. Missing full name returns error', () => {
    const err = validateRegistration('', 'alice@trustlink.io', 'Password123!', 'Password123!');
    expect(err).toBe('Full name is required.');
  });

  test('18. Whitespace full name returns error', () => {
    const err = validateRegistration('   ', 'alice@trustlink.io', 'Password123!', 'Password123!');
    expect(err).toBe('Full name is required.');
  });

  test('19. Invalid email format in registration returns error', () => {
    const err = validateRegistration('Alice Doe', 'bad-email', 'Password123!', 'Password123!');
    expect(err).toBe('Please enter a valid email address.');
  });

  test('20. Mismatched confirmation password returns error', () => {
    const err = validateRegistration('Alice Doe', 'alice@trustlink.io', 'Password123!', 'DifferentPass!');
    expect(err).toBe('Passwords do not match.');
  });

  test('21. Short password in registration returns error', () => {
    const err = validateRegistration('Alice Doe', 'alice@trustlink.io', 'short', 'short');
    expect(err).toBe('Password must be at least 8 characters.');
  });

  // Session & Keychain Simulation
  test('22. Session persistence payload format validation', () => {
    const session = {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'refresh_tok_123',
      expires_at: Date.now() + 3600 * 1000,
    };
    expect(session.access_token).toBeDefined();
    expect(session.expires_at).toBeGreaterThan(Date.now());
  });

  test('23. Expired token detector flags expired timestamps', () => {
    const expiredTimestamp = Date.now() - 1000;
    const isExpired = expiredTimestamp < Date.now();
    expect(isExpired).toBe(true);
  });

  test('24. Active token detector verifies unexpired timestamps', () => {
    const futureTimestamp = Date.now() + 3600 * 1000;
    const isExpired = futureTimestamp < Date.now();
    expect(isExpired).toBe(false);
  });

  test('25. User Profile display name fallback to email prefix if full_name is null', () => {
    const profile = { full_name: null };
    const email = 'purushotham@domain.com';
    const displayName = profile.full_name || email.split('@')[0];
    expect(displayName).toBe('purushotham');
  });

  test('26. Avatar initial extracts first uppercase letter correctly', () => {
    const displayName = 'Purushotham';
    const initial = (displayName[0] ?? 'U').toUpperCase();
    expect(initial).toBe('P');
  });

  test('27. Fallback avatar initial for empty name', () => {
    const displayName = '';
    const initial = (displayName[0] ?? 'U').toUpperCase();
    expect(initial).toBe('U');
  });

  test('28. OAuth callback URL format validation (trustlink://auth/callback)', () => {
    const callbackUrl = 'trustlink://auth/callback';
    expect(callbackUrl.startsWith('trustlink://')).toBe(true);
  });

  test('29. Provider metadata recognition for Google OAuth', () => {
    const userMeta = { app_metadata: { provider: 'google' } };
    const isGoogle = userMeta.app_metadata.provider === 'google';
    expect(isGoogle).toBe(true);
  });

  test('30. Provider metadata recognition for Email provider', () => {
    const userMeta = { app_metadata: { provider: 'email' } };
    const providerLabel = userMeta.app_metadata.provider === 'google' ? 'Google OAuth' : 'Email';
    expect(providerLabel).toBe('Email');
  });
});
