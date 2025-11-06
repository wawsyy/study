import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { EncryptedExamScore } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("EncryptedExamScoreSepolia", function () {
  let signers: Signers;
  let encryptedExamScoreContract: EncryptedExamScore;
  let encryptedExamScoreContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const EncryptedExamScoreDeployment = await deployments.get("EncryptedExamScore");
      encryptedExamScoreContractAddress = EncryptedExamScoreDeployment.address;
      encryptedExamScoreContract = await ethers.getContractAt("EncryptedExamScore", EncryptedExamScoreDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should submit and decrypt a score on Sepolia", async function () {
    steps = 8;

    this.timeout(4 * 40000);

    const clearScore = 85;

    progress(`Encrypting score ${clearScore}...`);
    const encryptedScore = await fhevm
      .createEncryptedInput(encryptedExamScoreContractAddress, signers.alice.address)
      .add32(clearScore)
      .encrypt();

    progress(
      `Call submitScore() EncryptedExamScore=${encryptedExamScoreContractAddress} handle=${ethers.hexlify(encryptedScore.handles[0])} signer=${signers.alice.address}...`,
    );
    const tx = await encryptedExamScoreContract
      .connect(signers.alice)
      .submitScore(encryptedScore.handles[0], encryptedScore.inputProof);
    await tx.wait();

    progress(`Call getMyScore()...`);
    const storedEncryptedScore = await encryptedExamScoreContract.connect(signers.alice).getMyScore();
    expect(storedEncryptedScore).to.not.eq(ethers.ZeroHash);

    progress(`Decrypting getMyScore()=${storedEncryptedScore}...`);
    const decryptedScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      storedEncryptedScore,
      encryptedExamScoreContractAddress,
      signers.alice,
    );
    progress(`Clear score=${decryptedScore}`);

    expect(decryptedScore).to.eq(clearScore);

    progress(`Check score count...`);
    const scoreCount = await encryptedExamScoreContract.connect(signers.alice).getMyScoreCount();
    expect(scoreCount).to.eq(1);
    progress(`Score count=${scoreCount}`);
  });
});

