const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte :", deployer.address);

  const Registry = await ethers.getContractFactory("CertificateRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  console.log("CertificateRegistry déployé à l'adresse :", await registry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});