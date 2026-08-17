// ============================================================
// TrustLink QA Suite — Master Test Orchestrator
// ============================================================

const { execSync } = require('child_process');
const path = require('path');

console.log('========================================================');
console.log('🚀 TRUSTLINK MASTER TEST ORCHESTRATOR (300+ TEST CASES)');
console.log('========================================================\n');

function run(cmd, desc) {
  console.log(`\n▶️  Running: ${desc}...`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    console.log(`✅ ${desc} Passed!`);
  } catch (err) {
    console.error(`❌ ${desc} Failed!`);
    process.exit(1);
  }
}

// 1. Run Jest Suite (370+ Unit, Integration & Validation Tests)
run('npx jest --colors', 'Jest Unit & Integration Test Suite');

// 2. Run Load & Latency Benchmarks
run('node scripts/load-test.js', 'Load & Latency Performance Benchmarking');

// 3. Run Security Assessment & Static Audit
run('node scripts/security-audit.js', 'Security Assessment & SAST Audit');

// 4. Run Appium Mobile E2E Simulation
run('node scripts/appium-test.js', 'Appium Mobile E2E Suite');

// 5. Run Selenium Web E2E Simulation
run('node scripts/selenium-test.js', 'Selenium Web Automation Suite');

// 6. Generate Summary Artifacts
run('node scripts/generate-summary-report.js', 'Consolidated QA Summary Report');

console.log('\n========================================================');
console.log('🎉 ALL 300+ TEST CASES & ASSESSMENTS PASSED WITH 100% SUCCESS!');
console.log('========================================================\n');
