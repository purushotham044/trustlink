// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DocumentRegistry
 * @dev TrustLink Decentralized Document Integrity & Timestamp Registry
 * Anchors document SHA-256 cryptographic hashes onto the Ethereum blockchain.
 */
contract DocumentRegistry {
    struct DocumentProof {
        address owner;
        uint256 timestamp;
        uint256 blockNumber;
        bool exists;
    }

    // Mapping from document SHA-256 hash (bytes32) to proof record
    mapping(bytes32 => DocumentProof) private _proofs;

    // Events
    event DocumentAnchored(
        bytes32 indexed documentHash,
        address indexed owner,
        uint256 timestamp,
        uint256 blockNumber
    );

    // Errors
    error DocumentAlreadyAnchored(bytes32 documentHash, address originalOwner, uint256 timestamp);
    error InvalidHash();

    /**
     * @notice Anchors a new document SHA-256 hash onto the blockchain.
     * @param documentHash The 32-byte SHA-256 digest of the document.
     */
    function anchorDocument(bytes32 documentHash) external {
        if (documentHash == bytes32(0)) {
            revert InvalidHash();
        }

        DocumentProof memory existing = _proofs[documentHash];
        if (existing.exists) {
            revert DocumentAlreadyAnchored(documentHash, existing.owner, existing.timestamp);
        }

        _proofs[documentHash] = DocumentProof({
            owner: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number,
            exists: true
        });

        emit DocumentAnchored(documentHash, msg.sender, block.timestamp, block.number);
    }

    /**
     * @notice Verifies if a document hash exists on-chain and retrieves proof details.
     * @param documentHash The 32-byte SHA-256 digest to verify.
     * @return exists True if the hash has been anchored.
     * @return owner The address that anchored the document.
     * @return timestamp The block timestamp when anchored.
     * @return blockNumber The block number where the transaction was mined.
     */
    function verifyDocument(bytes32 documentHash)
        external
        view
        returns (
            bool exists,
            address owner,
            uint256 timestamp,
            uint256 blockNumber
        )
    {
        DocumentProof memory proof = _proofs[documentHash];
        return (proof.exists, proof.owner, proof.timestamp, proof.blockNumber);
    }
}
