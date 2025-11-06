import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedEncryptedExamScore = await deploy("EncryptedExamScore", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedExamScore contract: `, deployedEncryptedExamScore.address);
};
export default func;
func.id = "deploy_encryptedExamScore"; // id required to prevent reexecution
func.tags = ["EncryptedExamScore"];

