// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Exam Score Log
/// @notice A system for users to store and retrieve their encrypted exam scores privately
/// @dev Uses FHE to encrypt scores so the platform cannot analyze or use them for recommendations
contract EncryptedExamScore is SepoliaConfig {
    // Mapping from user address to their encrypted score
    mapping(address => euint32) private userScores;

    // Mapping from user address to score count (for tracking multiple scores)
    mapping(address => uint256) public scoreCount;

    // Events
    event ScoreSubmitted(address indexed user, uint256 indexed scoreIndex);
    event ScoreUpdated(address indexed user, uint256 indexed scoreIndex);

    /// @notice Submit an encrypted exam score
    /// @param encryptedScore The encrypted score value
    /// @param inputProof The input proof for the encrypted input
    function submitScore(
        externalEuint32 encryptedScore,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted input to internal encrypted type
        euint32 score = FHE.fromExternal(encryptedScore, inputProof);

        // Store the encrypted score
        userScores[msg.sender] = score;

        // Increment score count
        scoreCount[msg.sender]++;

        // Grant access permissions
        FHE.allowThis(score);
        FHE.allow(score, msg.sender); // Only the user can decrypt their own score

        emit ScoreSubmitted(msg.sender, scoreCount[msg.sender] - 1);
    }

    /// @notice Update an existing encrypted exam score
    /// @param encryptedScore The new encrypted score value
    /// @param inputProof The input proof for the encrypted input
    function updateScore(
        externalEuint32 encryptedScore,
        bytes calldata inputProof
    ) external {
        require(scoreCount[msg.sender] > 0, "No score exists to update");

        // Convert external encrypted input to internal encrypted type
        euint32 score = FHE.fromExternal(encryptedScore, inputProof);

        // Update the encrypted score
        userScores[msg.sender] = score;

        // Grant access permissions
        FHE.allowThis(score);
        FHE.allow(score, msg.sender);

        emit ScoreUpdated(msg.sender, scoreCount[msg.sender] - 1);
    }

    /// @notice Get encrypted score for the caller
    /// @return The encrypted score
    function getMyScore() external view returns (euint32) {
        return userScores[msg.sender];
    }

    /// @notice Get the number of scores submitted by the caller
    /// @return The count of scores
    function getMyScoreCount() external view returns (uint256) {
        return scoreCount[msg.sender];
    }

    /// @notice Submit multiple encrypted exam scores in batch
    /// @param encryptedScores Array of encrypted score values
    /// @param inputProofs Array of input proofs corresponding to each score
    function submitBatchScores(
        externalEuint32[] calldata encryptedScores,
        bytes[] calldata inputProofs
    ) external {
        require(encryptedScores.length == inputProofs.length, "Mismatched input lengths");
        require(encryptedScores.length > 0, "No scores provided");
        require(encryptedScores.length <= 10, "Too many scores in batch");

        for (uint256 i = 0; i < encryptedScores.length; i++) {
            // Convert external encrypted input to internal encrypted type
            euint32 score = FHE.fromExternal(encryptedScores[i], inputProofs[i]);

            // Store the encrypted score (overwrite previous score)
            userScores[msg.sender] = score;

            // Increment score count
            scoreCount[msg.sender]++;

            // Grant access permissions
            FHE.allowThis(score);
            FHE.allow(score, msg.sender);

            emit ScoreSubmitted(msg.sender, scoreCount[msg.sender] - 1);
        }
    }
}

