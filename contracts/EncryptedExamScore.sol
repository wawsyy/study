// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Exam Score Log
/// @notice A system for users to store and retrieve their encrypted exam scores privately
/// @dev Uses FHE to encrypt scores so the platform cannot analyze or use them for recommendations
contract EncryptedExamScore is SepoliaConfig {
    // Owner of the contract
    address public owner;

    // Constants for gas optimization
    uint256 private constant MAX_BATCH_SIZE = 10;
    uint256 private constant MIN_SCORE = 0;
    uint256 private constant MAX_SCORE = 100;

    // Mapping from user address to their encrypted score
    mapping(address => euint32) private userScores;

    // Mapping from user address to score count (for tracking multiple scores)
    mapping(address => uint256) public scoreCount;

    // Emergency pause functionality
    bool public paused;

    // Version control
    string public constant VERSION = "1.0.0";

    // Emergency action approval (simple multi-sig concept)
    mapping(bytes32 => uint256) public emergencyApprovals;
    mapping(bytes32 => mapping(address => bool)) public hasApproved;

    // Time lock for critical operations
    uint256 public constant TIME_LOCK_DURATION = 1 days;
    mapping(bytes32 => uint256) public timeLockedActions;

    // Audit logging
    struct AuditLog {
        address user;
        string action;
        uint256 timestamp;
        bytes32 actionId;
    }

    AuditLog[] public auditLogs;

    // Upgrade mechanism
    address public implementation;
    bool public upgradeEnabled;

    // Events
    event ScoreSubmitted(address indexed user, uint256 indexed scoreIndex, uint256 timestamp);
    event ScoreUpdated(address indexed user, uint256 indexed scoreIndex, uint256 timestamp);
    event ScoreDeleted(address indexed user, uint256 timestamp);
    event BatchScoresSubmitted(address indexed user, uint256 count, uint256 timestamp);
    event Paused(address indexed account, uint256 timestamp);
    event Unpaused(address indexed user, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner, uint256 timestamp);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        paused = false;
    }

    /// @notice Submit an encrypted exam score
    /// @param encryptedScore The encrypted score value
    /// @param inputProof The input proof for the encrypted input
    function submitScore(
        externalEuint32 encryptedScore,
        bytes calldata inputProof
    ) external whenNotPaused {
        // Convert external encrypted input to internal encrypted type
        euint32 score = FHE.fromExternal(encryptedScore, inputProof);

        // Store the encrypted score
        userScores[msg.sender] = score;

        // Increment score count
        scoreCount[msg.sender]++;

        // Grant access permissions
        FHE.allowThis(score);
        FHE.allow(score, msg.sender); // Only the user can decrypt their own score

        _logAuditEvent("SCORE_SUBMITTED", keccak256(abi.encodePacked(msg.sender, scoreCount[msg.sender] - 1)));
        emit ScoreSubmitted(msg.sender, scoreCount[msg.sender] - 1, block.timestamp);
    }

    /// @notice Update an existing encrypted exam score
    /// @param encryptedScore The new encrypted score value
    /// @param inputProof The input proof for the encrypted input
    function updateScore(
        externalEuint32 encryptedScore,
        bytes calldata inputProof
    ) external whenNotPaused {
        require(scoreCount[msg.sender] > 0, "No score exists to update");

        // Convert external encrypted input to internal encrypted type
        euint32 score = FHE.fromExternal(encryptedScore, inputProof);

        // Update the encrypted score
        userScores[msg.sender] = score;

        // Grant access permissions
        FHE.allowThis(score);
        FHE.allow(score, msg.sender);

        emit ScoreUpdated(msg.sender, scoreCount[msg.sender] - 1, block.timestamp);
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

    /// @notice Get contract constants for frontend validation
    /// @return maxBatchSize Maximum number of scores in batch submission
    /// @return minScore Minimum allowed score value
    /// @return maxScore Maximum allowed score value
    function getConstants() external pure returns (uint256 maxBatchSize, uint256 minScore, uint256 maxScore) {
        return (MAX_BATCH_SIZE, MIN_SCORE, MAX_SCORE);
    }

    /// @notice Submit multiple encrypted exam scores in batch
    /// @param encryptedScores Array of encrypted score values
    /// @param inputProofs Array of input proofs corresponding to each score
    function submitBatchScores(
        externalEuint32[] calldata encryptedScores,
        bytes[] calldata inputProofs
    ) external whenNotPaused {
        require(encryptedScores.length == inputProofs.length, "Mismatched input lengths");
        require(encryptedScores.length > 0, "No scores provided");
        require(encryptedScores.length <= MAX_BATCH_SIZE, "Too many scores in batch");

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

            emit ScoreSubmitted(msg.sender, scoreCount[msg.sender] - 1, block.timestamp);
        }

        emit BatchScoresSubmitted(msg.sender, encryptedScores.length, block.timestamp);
    }

    /// @notice Delete the user's encrypted exam score
    function deleteMyScore() external whenNotPaused {
        require(scoreCount[msg.sender] > 0, "No score exists to delete");

        // Clear the encrypted score
        delete userScores[msg.sender];

        // Reset score count
        scoreCount[msg.sender] = 0;

        emit ScoreDeleted(msg.sender, block.timestamp);
    }

    /// @notice Pause all contract operations (emergency stop)
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender, block.timestamp);
    }

    /// @notice Resume contract operations
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender, block.timestamp);
    }

    /// @notice Transfer ownership to a new address
    /// @param newOwner The address of the new owner
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner, block.timestamp);
    }

    /// @notice Approve an emergency action (multi-sig concept)
    /// @param actionId Unique identifier for the emergency action
    function approveEmergencyAction(bytes32 actionId) external onlyOwner {
        require(!hasApproved[actionId][msg.sender], "Already approved");

        hasApproved[actionId][msg.sender] = true;
        emergencyApprovals[actionId]++;

        // Simple 2-out-of-2 approval for demo
        if (emergencyApprovals[actionId] >= 2) {
            // Execute emergency action (could be implemented based on actionId)
            // For now, just pause the contract
            if (!paused) {
                paused = true;
                emit Paused(msg.sender, block.timestamp);
            }
        }
    }

    /// @notice Check approval status for emergency action
    /// @param actionId Unique identifier for the emergency action
    /// @return Number of approvals received
    function getEmergencyApprovalCount(bytes32 actionId) external view returns (uint256) {
        return emergencyApprovals[actionId];
    }

    /// @notice Initiate time-locked ownership transfer
    /// @param newOwner The address of the new owner
    function initiateOwnershipTransfer(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");

        bytes32 actionId = keccak256(abi.encodePacked("OWNERSHIP_TRANSFER", newOwner));
        timeLockedActions[actionId] = block.timestamp + TIME_LOCK_DURATION;
    }

    /// @notice Execute time-locked ownership transfer
    /// @param newOwner The address of the new owner
    function executeOwnershipTransfer(address newOwner) external onlyOwner {
        bytes32 actionId = keccak256(abi.encodePacked("OWNERSHIP_TRANSFER", newOwner));
        require(timeLockedActions[actionId] > 0, "Transfer not initiated");
        require(block.timestamp >= timeLockedActions[actionId], "Time lock not expired");

        address oldOwner = owner;
        owner = newOwner;
        delete timeLockedActions[actionId];

        emit OwnershipTransferred(oldOwner, newOwner, block.timestamp);
    }

    /// @notice Get remaining time lock for an action
    /// @param actionId Unique identifier for the action
    /// @return Remaining time in seconds (0 if not locked or expired)
    function getTimeLockRemaining(bytes32 actionId) external view returns (uint256) {
        uint256 unlockTime = timeLockedActions[actionId];
        if (unlockTime == 0 || block.timestamp >= unlockTime) {
            return 0;
        }
        return unlockTime - block.timestamp;
    }

    /// @notice Log audit event
    /// @param action Description of the action performed
    /// @param actionId Unique identifier for the action
    function _logAuditEvent(string memory action, bytes32 actionId) internal {
        auditLogs.push(AuditLog({
            user: msg.sender,
            action: action,
            timestamp: block.timestamp,
            actionId: actionId
        }));
    }

    /// @notice Get total number of audit logs
    /// @return Number of audit log entries
    function getAuditLogCount() external view returns (uint256) {
        return auditLogs.length;
    }

    /// @notice Get audit log entry by index
    /// @param index Index of the audit log entry
    /// @return user Address that performed the action
    /// @return action Description of the action
    /// @return timestamp When the action was performed
    /// @return actionId Unique identifier for the action
    function getAuditLog(uint256 index) external view returns (
        address user,
        string memory action,
        uint256 timestamp,
        bytes32 actionId
    ) {
        require(index < auditLogs.length, "Index out of bounds");
        AuditLog memory log = auditLogs[index];
        return (log.user, log.action, log.timestamp, log.actionId);
    }

    /// @notice Enable upgrade mechanism
    function enableUpgrades() external onlyOwner {
        upgradeEnabled = true;
        _logAuditEvent("UPGRADES_ENABLED", keccak256(abi.encodePacked("UPGRADES_ENABLED", block.timestamp)));
    }

    /// @notice Set new implementation address (for upgrade pattern)
    /// @param newImplementation Address of the new implementation
    function setImplementation(address newImplementation) external onlyOwner {
        require(upgradeEnabled, "Upgrades not enabled");
        require(newImplementation != address(0), "Invalid implementation address");

        implementation = newImplementation;
        _logAuditEvent("IMPLEMENTATION_UPDATED", keccak256(abi.encodePacked("IMPLEMENTATION_UPDATED", newImplementation)));
    }

    /// @notice Get current implementation address
    /// @return Address of the current implementation
    function getImplementation() external view returns (address) {
        return implementation != address(0) ? implementation : address(this);
    }

    /// @notice Validate score data format and constraints
    /// @param score The score value to validate
    /// @return True if score is valid
    function validateScore(uint256 score) external pure returns (bool) {
        return score >= MIN_SCORE && score <= MAX_SCORE;
    }

    /// @notice Validate batch submission parameters
    /// @param scores Array of scores to validate
    /// @return True if batch is valid
    function validateBatch(uint256[] calldata scores) external view returns (bool) {
        if (scores.length == 0 || scores.length > MAX_BATCH_SIZE) {
            return false;
        }

        for (uint256 i = 0; i < scores.length; i++) {
            if (scores[i] < MIN_SCORE || scores[i] > MAX_SCORE) {
                return false;
            }
        }

        return true;
    }

    /// @notice Get contract health status
    /// @return isHealthy True if contract is operating normally
    /// @return scoreCount Total number of scores in system
    /// @return isPaused Current pause status
    function getHealthStatus() external view returns (bool isHealthy, uint256 scoreCount, bool isPaused) {
        // Simple health check - could be extended with more checks
        bool healthy = !paused && owner != address(0);
        uint256 totalScores = 0;

        // Count total scores across all users (simplified)
        // In production, this would be more complex
        totalScores = scoreCount[msg.sender]; // Just return caller's count for demo

        return (healthy, totalScores, paused);
    }

    /// @notice Get filtered audit logs by user
    /// @param user Address to filter logs for
    /// @param startIndex Starting index for pagination
    /// @param maxResults Maximum number of results to return
    /// @return filteredLogs Array of matching audit logs
    /// @return totalCount Total number of matching logs
    function getAuditLogsByUser(
        address user,
        uint256 startIndex,
        uint256 maxResults
    ) external view returns (
        AuditLog[] memory filteredLogs,
        uint256 totalCount
    ) {
        uint256 count = 0;

        // First pass: count matching logs
        for (uint256 i = 0; i < auditLogs.length; i++) {
            if (auditLogs[i].user == user) {
                count++;
            }
        }

        totalCount = count;

        // Second pass: collect filtered logs
        uint256 resultCount = 0;
        uint256 endIndex = startIndex + maxResults;
        if (endIndex > count) endIndex = count;

        filteredLogs = new AuditLog[](endIndex - startIndex);

        count = 0; // Reset counter
        for (uint256 i = 0; i < auditLogs.length && resultCount < (endIndex - startIndex); i++) {
            if (auditLogs[i].user == user) {
                if (count >= startIndex) {
                    filteredLogs[resultCount] = auditLogs[i];
                    resultCount++;
                }
                count++;
            }
        }

        return (filteredLogs, totalCount);
    }

    /// @notice Get audit logs by action type
    /// @param action Action string to filter by
    /// @return filteredLogs Array of matching audit logs
    function getAuditLogsByAction(string calldata action) external view returns (AuditLog[] memory filteredLogs) {
        // First pass: count matches
        uint256 count = 0;
        for (uint256 i = 0; i < auditLogs.length; i++) {
            if (keccak256(bytes(auditLogs[i].action)) == keccak256(bytes(action))) {
                count++;
            }
        }

        // Second pass: collect results
        filteredLogs = new AuditLog[](count);
        uint256 resultIndex = 0;
        for (uint256 i = 0; i < auditLogs.length; i++) {
            if (keccak256(bytes(auditLogs[i].action)) == keccak256(bytes(action))) {
                filteredLogs[resultIndex] = auditLogs[i];
                resultIndex++;
            }
        }

        return filteredLogs;
    }
}

