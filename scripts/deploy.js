// ============================================================
// TrustLink — 100% Free Automated Sepolia Deployment Script
// No Remix or Paid Tools Required!
// ============================================================
// Usage:
//   node scripts/deploy.js <YOUR_SEPOLIA_PRIVATE_KEY>
//
// Example:
//   node scripts/deploy.js 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
// ============================================================

const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { ethers } = require('ethers');

async function main() {
  console.log('\n🛡️  TrustLink — Smart Contract Deployment to Ethereum Sepolia\n');

  // 1. Get Private Key
  const privateKey = process.argv[2] || process.env.BLOCKCHAIN_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Error: Please provide your Sepolia wallet private key.');
    console.log('\nUsage:');
    console.log('  node scripts/deploy.js <YOUR_PRIVATE_KEY>\n');
    process.exit(1);
  }

  // 2. Read Solidity Source
  const contractPath = path.resolve(__dirname, '../contracts/DocumentRegistry.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  console.log('📦 1. Compiling DocumentRegistry.sol with solc 0.8.20...');
  
  const input = {
    language: 'Solidity',
    sources: {
      'DocumentRegistry.sol': {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasFatal = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        console.error('Compilation error:', error.formattedMessage);
        hasFatal = true;
      }
    }
    if (hasFatal) process.exit(1);
  }

  const contractOutput = output.contracts['DocumentRegistry.sol']['DocumentRegistry'];
  const abi = contractOutput.abi;
  const bytecode = '0x' + contractOutput.evm.bytecode.object;

  console.log('✅ Compilation successful!\n');

  // 3. Connect to Ethereum Sepolia RPC
  const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com';
  console.log(`🌐 2. Connecting to Sepolia RPC: ${rpcUrl}...`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const wallet = new ethers.Wallet(formattedKey, provider);

  const address = await wallet.getAddress();
  console.log(`🔑 Deployer Account: ${address}`);

  const balance = await provider.getBalance(address);
  console.log(`💰 Sepolia ETH Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error('\n❌ Error: Your wallet has 0 Sepolia ETH for gas.');
    console.log('👉 Get free Sepolia testnet ETH from any free faucet:');
    console.log('   - https://sepoliafaucet.com');
    console.log('   - https://cloud.google.com/application/web3/faucet/ethereum/sepolia');
    console.log('   - https://faucets.chain.link/sepolia\n');
    process.exit(1);
  }

  // 4. Deploy Contract
  console.log('\n🚀 3. Broadcasting deployment transaction...');
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();

  console.log(`⏳ Transaction sent (tx: ${contract.deploymentTransaction().hash})`);
  console.log('⏳ Waiting for block confirmation on Sepolia...');

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log('\n========================================================');
  console.log('🎉 CONTRACT DEPLOYED SUCCESSFULLY TO ETHEREUM SEPOLIA!');
  console.log('========================================================');
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Etherscan:        https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log('========================================================\n');
  console.log('💡 Next Step: Update this contract address in:');
  console.log(`   - supabase/functions/anchor-document/index.ts`);
  console.log(`   - src/services/blockchainService.ts`);
  console.log(`   - 001_schema.sql anchor_document_secure function\n`);
}

main().catch((err) => {
  console.error('\n❌ Deployment failed:', err.message || err);
  process.exit(1);
});
