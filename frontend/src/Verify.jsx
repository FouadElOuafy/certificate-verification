import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI, RPC_URL } from "./contract";

const card = {
  background: "white",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  marginBottom: 20,
};

const COLORS = {
  valid: "#15803d",
  revoked: "#b91c1c",
  notfound: "#b91c1c",
  modified: "#b91c1c",
  pending: "#b45309",
};

export default function Verify({ certRef, salt }) {
  const [onChain, setOnChain] = useState(null); // {exists, revoked, issuer, issuedAt}
  const [error, setError] = useState("");
  const [docResult, setDocResult] = useState(null); // true / false
  const [fileName, setFileName] = useState("");

  const certId = ethers.id(certRef);
  const getContract = () =>
    new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      new ethers.JsonRpcProvider(RPC_URL)
    );

  useEffect(() => {
    async function load() {
      try {
        const contract = getContract();
        const [exists, revoked] = await contract.verifyCertificate(
          certId,
          ethers.ZeroHash
        );
        if (!exists) {
          setOnChain({ exists: false });
          return;
        }
        const [issuer, issuedAt] = await contract.getCertificate(certId);
        setOnChain({
          exists: true,
          revoked,
          issuer,
          issuedAt: new Date(Number(issuedAt) * 1000).toLocaleString(),
        });
      } catch (e) {
        setError("Impossible de lire la blockchain : " + (e.shortMessage || e.message));
      }
    }
    load();
  }, []);

  async function checkFile(e) {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setFileName(file.name);
      const pdfBytes = new Uint8Array(await file.arrayBuffer());
      const hash = ethers.sha256(ethers.concat([pdfBytes, salt]));
      const [, , hashMatches] = await getContract().verifyCertificate(certId, hash);
      setDocResult(hashMatches);
    } catch (err) {
      setError("Erreur : " + (err.shortMessage || err.message));
    }
  }

  let state = "pending";
  let label = "Vérification en cours...";
  if (onChain) {
    if (!onChain.exists) {
      state = "notfound";
      label = "❌ CERTIFICAT INTROUVABLE";
    } else if (onChain.revoked) {
      state = "revoked";
      label = "⛔ CERTIFICAT RÉVOQUÉ";
    } else if (docResult === false) {
      state = "modified";
      label = "❌ DOCUMENT MODIFIÉ OU NON CORRESPONDANT";
    } else {
      state = "valid";
      label = docResult === true
        ? "✅ VALIDE : le document est authentique"
        : "✅ ENREGISTRÉ : dépose le PDF pour confirmer son authenticité";
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>Vérification de certificat</h1>

      {error && <p style={{ color: "#b91c1c" }}><b>{error}</b></p>}

      <div style={card}>
        <h2 style={{ color: COLORS[state], marginTop: 0 }}>{label}</h2>
        <p><b>Référence :</b> {certRef}</p>
        {onChain?.exists && (
          <>
            <p style={{ wordBreak: "break-all" }}><b>Émetteur :</b> {onChain.issuer}</p>
            <p><b>Date d'émission :</b> {onChain.issuedAt}</p>
          </>
        )}
      </div>

      {onChain?.exists && !onChain.revoked && (
        <div style={card}>
          <h3>Vérifier le document PDF</h3>
          <p>
            Dépose le PDF reçu. Le calcul du hash se fait dans ton navigateur :
            le fichier n'est envoyé nulle part.
          </p>
          <input type="file" accept="application/pdf" onChange={checkFile} />
          {fileName && <p>Fichier analysé : {fileName}</p>}
        </div>
      )}
    </div>
  );
}