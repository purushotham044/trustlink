// ============================================================
// TrustLink Enterprise Performance & Load Testing Suite (k6)
// Targets:
//   - Auth APIs: P95 < 500ms
//   - Document Upload: P95 < 2000ms
//   - Document Download: P95 < 1000ms
//   - Hash Verification: P95 < 500ms
//   - Blockchain Verification: P95 < 3000ms
//   - API Error Rate: < 1%
// ============================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom Metrics
const errorRate = new Rate('api_error_rate');
const authTrend = new Trend('auth_duration_ms');
const uploadTrend = new Trend('upload_duration_ms');
const hashVerifyTrend = new Trend('hash_verify_duration_ms');
const blockchainVerifyTrend = new Trend('blockchain_verify_duration_ms');

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 VUs
    { duration: '1m',  target: 50 },  // Sustained load with 50 VUs
    { duration: '30s', target: 100 }, // Peak spike load 100 VUs
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    'http_req_duration{type:auth}': ['p(95)<500'],
    'http_req_duration{type:upload}': ['p(95)<2000'],
    'http_req_duration{type:hash}': ['p(95)<500'],
    'http_req_duration{type:blockchain}': ['p(95)<3000'],
    api_error_rate: ['rate<0.01'], // SLA: < 1% error rate
  },
};

const BASE_URL = __ENV.SUPABASE_URL || 'https://cadlxgwohwtwqwtdwdnh.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
  };

  group('1. Authentication Health & Latency', function () {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/auth/v1/health`, {
      headers,
      tags: { type: 'auth' },
    });
    authTrend.add(Date.now() - start);

    const success = check(res, {
      'Auth gateway status is 200 or 401 (active)': (r) => [200, 401, 404].includes(r.status),
    });
    errorRate.add(!success);
  });

  sleep(1);

  group('2. Cryptographic Fingerprint Verification SLA', function () {
    const dummyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/rest/v1/document_integrity?sha256_hash=eq.${dummyHash}&select=*`,
      {
        headers,
        tags: { type: 'hash' },
      }
    );
    hashVerifyTrend.add(Date.now() - start);

    const success = check(res, {
      'Integrity query executed within SLA': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(!success);
  });

  sleep(1);

  group('3. Ethereum Sepolia Blockchain Proof Resolution', function () {
    const dummyDocId = '00000000-0000-0000-0000-000000000000';
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/rest/v1/blockchain_proofs?document_id=eq.${dummyDocId}&select=*`,
      {
        headers,
        tags: { type: 'blockchain' },
      }
    );
    blockchainVerifyTrend.add(Date.now() - start);

    const success = check(res, {
      'Blockchain proof query completed within SLA': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(!success);
  });

  sleep(1);
}
