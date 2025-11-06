import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EncryptedExamScore, EncryptedExamScore__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedExamScore")) as EncryptedExamScore__factory;
  const encryptedExamScoreContract = (await factory.deploy()) as EncryptedExamScore;
  const encryptedExamScoreContractAddress = await encryptedExamScoreContract.getAddress();

  return { encryptedExamScoreContract, encryptedExamScoreContractAddress };
}

describe("EncryptedExamScore", function () {
  let signers: Signers;
  let encryptedExamScoreContract: EncryptedExamScore;
  let encryptedExamScoreContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ encryptedExamScoreContract, encryptedExamScoreContractAddress } = await deployFixture());
  });

  it("should have zero score count after deployment", async function () {
    const scoreCount = await encryptedExamScoreContract.connect(signers.alice).getMyScoreCount();
    expect(scoreCount).to.eq(0);
  });

  it("should return zero hash for score when no score is submitted", async function () {
    const encryptedScore = await encryptedExamScoreContract.connect(signers.alice).getMyScore();
    expect(encryptedScore).to.eq(ethers.ZeroHash);
  });

  it("should submit and retrieve an encrypted score", async function () {
    const clearScore = 85;

    // Encrypt the score
    const encryptedScore = await fhevm
      .createEncryptedInput(encryptedExamScoreContractAddress, signers.alice.address)
      .add32(clearScore)
      .encrypt();

    // Submit the encrypted score
    const tx = await encryptedExamScoreContract
      .connect(signers.alice)
      .submitScore(encryptedScore.handles[0], encryptedScore.inputProof);
    await tx.wait();

    // Check score count
    const scoreCount = await encryptedExamScoreContract.connect(signers.alice).getMyScoreCount();
    expect(scoreCount).to.eq(1);

    // Get the encrypted score
    const storedEncryptedScore = await encryptedExamScoreContract.connect(signers.alice).getMyScore();
    expect(storedEncryptedScore).to.not.eq(ethers.ZeroHash);

    // Decrypt the score
    const decryptedScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      storedEncryptedScore,
      encryptedExamScoreContractAddress,
      signers.alice,
    );

    expect(decryptedScore).to.eq(clearScore);
  });

  it("should update an existing score", async function () {
    const initialScore = 75;
    const updatedScore = 90;

    // Submit initial score
    const initialEncrypted = await fhevm
      .createEncryptedInput(encryptedExamScoreContractAddress, signers.alice.address)
      .add32(initialScore)
      .encrypt();

    let tx = await encryptedExamScoreContract
      .connect(signers.alice)
      .submitScore(initialEncrypted.handles[0], initialEncrypted.inputProof);
    await tx.wait();

    // Update the score
    const updatedEncrypted = await fhevm
      .createEncryptedInput(encryptedExamScoreContractAddress, signers.alice.address)
      .add32(updatedScore)
      .encrypt();

    tx = await encryptedExamScoreContract
      .connect(signers.alice)
      .updateScore(updatedEncrypted.handles[0], updatedEncrypted.inputProof);
    await tx.wait();

    // Verify the updated score
    const storedEncryptedScore = await encryptedExamScoreContract.connect(signers.alice).getMyScore();
    const decryptedScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      storedEncryptedScore,
      encryptedExamScoreContractAddress,
      signers.alice,
    );

    expect(decryptedScore).to.eq(updatedScore);
  });

  it("should prevent updating score when no score exists", async function () {
    const score = 80;
    const encryptedScore = await fhevm
      .createEncryptedInput(encryptedExamScoreContractAddress, signers.bob.address)
      .add32(score)
      .encrypt();

    await expect(
      encryptedExamScoreContract.connect(signers.bob).updateScore(encryptedScore.handles[0], encryptedScore.inputProof),
    ).to.be.revertedWith("No score exists to update");
  });

  it("should allow different users to have different scores", async function () {
    const aliceScore = 85;
    const bobScore = 92;

    // Alice submits her score
    const aliceEncrypted = await fhevm
      .createEncryptedInput(encryptedExamScoreContractAddress, signers.alice.address)
      .add32(aliceScore)
      .encrypt();

    let tx = await encryptedExamScoreContract
      .connect(signers.alice)
      .submitScore(aliceEncrypted.handles[0], aliceEncrypted.inputProof);
    await tx.wait();

    // Bob submits his score
    const bobEncrypted = await fhevm
      .createEncryptedInput(encryptedExamScoreContractAddress, signers.bob.address)
      .add32(bobScore)
      .encrypt();

    tx = await encryptedExamScoreContract
      .connect(signers.bob)
      .submitScore(bobEncrypted.handles[0], bobEncrypted.inputProof);
    await tx.wait();

    // Verify Alice's score
    const aliceEncryptedScore = await encryptedExamScoreContract.connect(signers.alice).getMyScore();
    const aliceDecrypted = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      aliceEncryptedScore,
      encryptedExamScoreContractAddress,
      signers.alice,
    );
    expect(aliceDecrypted).to.eq(aliceScore);

    // Verify Bob's score
    const bobEncryptedScore = await encryptedExamScoreContract.connect(signers.bob).getMyScore();
    const bobDecrypted = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      bobEncryptedScore,
      encryptedExamScoreContractAddress,
      signers.bob,
    );
    expect(bobDecrypted).to.eq(bobScore);
  });
});

