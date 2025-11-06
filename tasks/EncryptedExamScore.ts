import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the EncryptedExamScore contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the EncryptedExamScore contract
 *
 *   npx hardhat --network localhost task:submit-score --score 85
 *   npx hardhat --network localhost task:get-my-score
 *   npx hardhat --network localhost task:decrypt-score
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the EncryptedExamScore contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the EncryptedExamScore contract
 *
 *   npx hardhat --network sepolia task:submit-score --score 85
 *   npx hardhat --network sepolia task:get-my-score
 *   npx hardhat --network sepolia task:decrypt-score
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:address
 *   - npx hardhat --network sepolia task:address
 */
task("task:address", "Prints the EncryptedExamScore address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const encryptedExamScore = await deployments.get("EncryptedExamScore");

  console.log("EncryptedExamScore address is " + encryptedExamScore.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:submit-score --score 85
 *   - npx hardhat --network sepolia task:submit-score --score 85
 */
task("task:submit-score", "Submits an encrypted exam score")
  .addOptionalParam("address", "Optionally specify the EncryptedExamScore contract address")
  .addParam("score", "The score value to submit (0-100)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const score = parseInt(taskArguments.score);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      throw new Error(`Argument --score must be an integer between 0 and 100`);
    }

    await fhevm.initializeCLIApi();

    const EncryptedExamScoreDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedExamScore");
    console.log(`EncryptedExamScore: ${EncryptedExamScoreDeployment.address}`);

    const signers = await ethers.getSigners();

    const encryptedExamScoreContract = await ethers.getContractAt("EncryptedExamScore", EncryptedExamScoreDeployment.address);

    // Encrypt the score value
    const encryptedScore = await fhevm
      .createEncryptedInput(EncryptedExamScoreDeployment.address, signers[0].address)
      .add32(score)
      .encrypt();

    const tx = await encryptedExamScoreContract
      .connect(signers[0])
      .submitScore(encryptedScore.handles[0], encryptedScore.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const scoreCount = await encryptedExamScoreContract.getMyScoreCount();
    console.log(`Score count after submission: ${scoreCount}`);

    console.log(`EncryptedExamScore submitScore(${score}) succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-my-score
 *   - npx hardhat --network sepolia task:get-my-score
 */
task("task:get-my-score", "Gets the encrypted score for the caller")
  .addOptionalParam("address", "Optionally specify the EncryptedExamScore contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const EncryptedExamScoreDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedExamScore");
    console.log(`EncryptedExamScore: ${EncryptedExamScoreDeployment.address}`);

    const signers = await ethers.getSigners();

    const encryptedExamScoreContract = await ethers.getContractAt("EncryptedExamScore", EncryptedExamScoreDeployment.address);

    const encryptedScore = await encryptedExamScoreContract.connect(signers[0]).getMyScore();
    const scoreCount = await encryptedExamScoreContract.connect(signers[0]).getMyScoreCount();

    if (encryptedScore === ethers.ZeroHash) {
      console.log(`Encrypted score: ${encryptedScore}`);
      console.log(`Score count: ${scoreCount}`);
      console.log("Clear score: No score submitted yet");
      return;
    }

    console.log(`Encrypted score: ${encryptedScore}`);
    console.log(`Score count: ${scoreCount}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-score
 *   - npx hardhat --network sepolia task:decrypt-score
 */
task("task:decrypt-score", "Decrypts the caller's exam score")
  .addOptionalParam("address", "Optionally specify the EncryptedExamScore contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const EncryptedExamScoreDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedExamScore");
    console.log(`EncryptedExamScore: ${EncryptedExamScoreDeployment.address}`);

    const signers = await ethers.getSigners();

    const encryptedExamScoreContract = await ethers.getContractAt("EncryptedExamScore", EncryptedExamScoreDeployment.address);

    const encryptedScore = await encryptedExamScoreContract.connect(signers[0]).getMyScore();

    if (encryptedScore === ethers.ZeroHash) {
      console.log("No score submitted yet");
      return;
    }

    const clearScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedScore,
      EncryptedExamScoreDeployment.address,
      signers[0],
    );

    console.log(`Encrypted score: ${encryptedScore}`);
    console.log(`Clear score: ${clearScore}`);
  });

