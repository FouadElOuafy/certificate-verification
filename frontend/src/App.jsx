import { useState } from "react";
import { ethers } from "ethers";
import QRCode from "qrcode";
import { CONTRACT_ADDRESS, CHAIN_ID, ABI } from "./contract";
import Verify from "./Verify";

const card = {
  background: "white",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  marginBottom: 20,
};
const input = { width: "100%", padding: 10, marginBottom: 12, boxSizing: "border-box" };
const button = {
  padding: "10px 18px",
  border: "none",
  borderRadius: 8,
  background: "#4f46e5",
  color: "white",
  cursor: "pointer",
  fontSize: 15,
};

function AdminPage() {
  const [account, setAccount] = useState(null);
  const [isIssuer, setIsIssuer] = useState(false);
  const [certRef, setCertRef] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);

  async function connect() {
    try {
      if (!window.ethereum) {
        setStatus("MetaMask n'est pas détecté.");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        setStatus("Sélectionne le réseau Hardhat Local dans MetaMask.");
        return;
      }
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      setAccount(address);
      setIsIssuer(await contract.isIssuer(address));
      setStatus("");
    } catch (e) {
      setStatus(
        e?.error?.code === -32002
          ? "Une demande est déjà en attente : ouvre MetaMask et valide-la."
          : "Erreur de connexion : " + (e.shortMessage || e.message)
      );
    }
  }

  async function issue() {
    try {
      setResult(null);
      if (!certRef || !file) {
        setStatus("Renseigne la référence et choisis un PDF.");
        return;
      }
      setStatus("Calcul du hash...");
      const pdfBytes = new Uint8Array(await file.arrayBuffer());
      const salt = ethers.hexlify(ethers.randomBytes(16));
      const hash = ethers.sha256(ethers.concat([pdfBytes, salt]));
      const certId = ethers.id(certRef);

      setStatus("Confirme la transaction dans MetaMask...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.issueCertificate(certId, hash);
      setStatus("Transaction envoyée, attente de confirmation...");
      await tx.wait();

      const url =
        window.location.origin +
        "/?verify=" + encodeURIComponent(certRef) +
        "&salt=" + salt;
      const qr = await QRCode.toDataURL(url, { width: 280 });
      setResult({ certRef, certId, hash, salt, url, qr, txHash: tx.hash });
      setStatus("Certificat enregistré sur la blockchain.");
    } catch (e) {
      setStatus("Erreur : " + (e.reason || e.shortMessage || e.message));
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>Certificate Verification</h1>
      <p>Espace administrateur : émission de certificats</p>

      <div style={card}>
        {!account ? (
          <button style={button} onClick={connect}>Connecter MetaMask</button>
        ) : (
          <>
            <p><b>Compte :</b> {account}</p>
            <p>
              <b>Droit d'émission :</b>{" "}
              {isIssuer ? "✅ émetteur autorisé" : "❌ non autorisé"}
            </p>
          </>
        )}
      </div>

      {account && isIssuer && (
        <div style={card}>
          <h3>Nouveau certificat</h3>
          <input
            style={input}
            placeholder="Référence (ex : CERT-2026-001)"
            value={certRef}
            onChange={(e) => setCertRef(e.target.value)}
          />
          <input
            style={input}
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button style={button} onClick={issue}>Émettre le certificat</button>
        </div>
      )}

      {status && <p><b>{status}</b></p>}

      {result && (
        <div style={card}>
          <h3>Certificat émis</h3>
          <img src={result.qr} alt="QR code" />
          <p style={{ wordBreak: "break-all" }}><b>Lien :</b> {result.url}</p>
          <p style={{ wordBreak: "break-all" }}><b>Hash (sur la blockchain) :</b> {result.hash}</p>
          <p style={{ wordBreak: "break-all" }}><b>Transaction :</b> {result.txHash}</p>
          <p style={{ color: "#b45309" }}>
            Le sel est inclus dans le lien. Sans lui, le PDF ne peut pas être
            vérifié. Remets-le à l'étudiant avec le PDF.
          </p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const certRef = params.get("verify");
  const salt = params.get("salt");
  if (certRef && salt) return <Verify certRef={certRef} salt={salt} />;
  return <AdminPage />;
}