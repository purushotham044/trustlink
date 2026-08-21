// ============================================================
// TrustLink — Live Ethereum Sepolia Contract Verifier Script
// Queries the Sepolia smart contract directly via JSON-RPC
// ============================================================

const { ethers } = require('ethers');

const CONTRACT_ADDRESS = '0x1b9A1FBD6FC714B1aC443d00a555529567bd8D0E';
const RPC_URL = 'https://ethereum-sepolia.publicnode.com';

const ABI = [
  'function anchorDocument(bytes32 documentHash) external',
  'function verifyDocument(bytes32 documentHash) external view returns (bool exists, address owner, uint256 timestamp, uint256 blockNumber)',
  'event DocumentAnchored(bytes32 indexed documentHash, address indexed owner, uint256 timestamp, uint256 blockNumber)'
];

async function verifyLiveContract() {
  console.log('----------------------------------------------------');
  console.log('⛓️ Connecting to Ethereum Sepolia Testnet RPC...');
  console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`RPC Node: ${RPC_URL}`);
  console.log('----------------------------------------------------');

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    const currentBlock = await provider.getBlockNumber();

    console.log(`✓ Connected to Network: Chain ID ${network.chainId} (Sepolia)`);
    console.log(`✓ Current Sepolia Block Height: #${currentBlock}`);

    // Check bytecode at contract address
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x' || code === '0x0') {
      console.error('❌ No bytecode found at address. Contract not deployed on this network.');
      return;
    }
    console.log(`✓ Bytecode Verified: Smart Contract is actively deployed on Sepolia (${code.length / 2} bytes)!`);

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    // Test a sample zero hash
    const sampleHash = '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    console.log(`\n🔍 Querying verifyDocument for SHA-256 hash:\n${sampleHash}...`);
    const [exists, owner, timestamp, blockNumber] = await contract.verifyDocument(sampleHash);

    console.log('----------------------------------------------------');
    console.log('📊 ON-CHAIN QUERY RESULT:');
    console.log(`Exists on Blockchain: ${exists ? 'YES (CONFIRMED)' : 'NO (UNANCHORED)'}`);
    console.log(`Owner Address:       ${owner}`);
    console.log(`Block Timestamp:     ${timestamp > 0 ? new Date(Number(timestamp) * 1000).toISOString() : 'N/A'}`);
    console.log(`Mined Block Number:  #${blockNumber}`);
    console.log('----------------------------------------------------');
    console.log('🎉 Live Ethereum Sepolia verification is 100% operational!');
  } catch (err) {
    console.error('❌ Error verifying live contract:', err);
  }
}

verifyLiveContract();
