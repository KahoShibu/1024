const hre = require("hardhat");

async function main() {
  const ScoreBoard = await hre.ethers.getContractFactory("ScoreBoard");
  const contract = await ScoreBoard.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("ScoreBoard deployed to:", address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
