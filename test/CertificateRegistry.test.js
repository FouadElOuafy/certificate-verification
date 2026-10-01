const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", () => {
  let registry, owner, issuer, stranger;
  const certId = ethers.id("CERT-2026-001");
  const hash = ethers.sha256(ethers.toUtf8Bytes("pdf-content+salt"));

  beforeEach(async () => {
    [owner, issuer, stranger] = await ethers.getSigners();
    const F = await ethers.getContractFactory("CertificateRegistry");
    registry = await F.deploy();
    await registry.setIssuer(issuer.address, true);
  });

  it("un émetteur peut créer un certificat valide", async () => {
    await registry.connect(issuer).issueCertificate(certId, hash);
    const [exists, revoked, match] = await registry.verifyCertificate(certId, hash);
    expect(exists).to.be.true;
    expect(revoked).to.be.false;
    expect(match).to.be.true;
  });

  it("refuse un non-émetteur", async () => {
    await expect(registry.connect(stranger).issueCertificate(certId, hash))
      .to.be.revertedWithCustomError(registry, "NotIssuer");
  });

  it("détecte un document modifié", async () => {
    await registry.connect(issuer).issueCertificate(certId, hash);
    const fake = ethers.sha256(ethers.toUtf8Bytes("pdf-modifié"));
    const [, , match] = await registry.verifyCertificate(certId, fake);
    expect(match).to.be.false;
  });

  it("refuse un doublon", async () => {
    await registry.connect(issuer).issueCertificate(certId, hash);
    await expect(registry.connect(issuer).issueCertificate(certId, hash))
      .to.be.revertedWithCustomError(registry, "AlreadyExists");
  });

  it("gère la révocation", async () => {
    await registry.connect(issuer).issueCertificate(certId, hash);
    await registry.connect(issuer).revokeCertificate(certId);
    const [, revoked] = await registry.verifyCertificate(certId, hash);
    expect(revoked).to.be.true;
  });
});