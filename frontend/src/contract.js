export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const CHAIN_ID = 31337;

export const ABI = [
  "function isIssuer(address) view returns (bool)",
  "function issueCertificate(bytes32 certId, bytes32 hash)",
  "function revokeCertificate(bytes32 certId)",
  "function verifyCertificate(bytes32 certId, bytes32 hash) view returns (bool exists, bool revoked, bool hashMatches)",
  "function getCertificate(bytes32 certId) view returns (address issuer, uint64 issuedAt, bool revoked)",
];
export const RPC_URL = "http://127.0.0.1:8545";