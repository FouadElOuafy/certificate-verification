export const CONTRACT_ADDRESS = "0x40A96a24DBfF9e9C1141d3EF3Cbe5Cf9EfdB9A91";
export const CHAIN_ID = 11155111;
export const CHAIN_NAME = "Sepolia";
export const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

export const ABI = [
  "function isIssuer(address) view returns (bool)",
  "function issueCertificate(bytes32 certId, bytes32 hash)",
  "function revokeCertificate(bytes32 certId)",
  "function verifyCertificate(bytes32 certId, bytes32 hash) view returns (bool exists, bool revoked, bool hashMatches)",
  "function getCertificate(bytes32 certId) view returns (address issuer, uint64 issuedAt, bool revoked)",
];