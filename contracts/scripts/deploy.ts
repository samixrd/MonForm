import { ethers } from "hardhat";

async function main() {
  console.log("Deploying MonForm...");

  const MonForm = await ethers.getContractFactory("MonForm");
  const monForm = await MonForm.deploy();
  await monForm.waitForDeployment();

  const address = await monForm.getAddress();
  console.log(`MonForm deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
