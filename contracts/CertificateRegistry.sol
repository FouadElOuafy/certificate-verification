// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateRegistry is Ownable {
    struct Certificate {
        bytes32 hash;
        address issuer;
        uint64 issuedAt;
        bool revoked;
    }

    mapping(bytes32 => Certificate) private certificates;
    mapping(address => bool) public isIssuer;

    event IssuerUpdated(address indexed issuer, bool allowed);
    event CertificateIssued(bytes32 indexed certId, bytes32 hash, address indexed issuer);
    event CertificateRevoked(bytes32 indexed certId, address indexed by);

    error NotIssuer();
    error AlreadyExists();
    error NotFound();
    error AlreadyRevoked();

    modifier onlyIssuer() {
        if (!isIssuer[msg.sender]) revert NotIssuer();
        _;
    }

    constructor() Ownable(msg.sender) {
        isIssuer[msg.sender] = true;
        emit IssuerUpdated(msg.sender, true);
    }

    function setIssuer(address issuer, bool allowed) external onlyOwner {
        isIssuer[issuer] = allowed;
        emit IssuerUpdated(issuer, allowed);
    }

    function issueCertificate(bytes32 certId, bytes32 hash) external onlyIssuer {
        if (certificates[certId].issuedAt != 0) revert AlreadyExists();
        certificates[certId] = Certificate(hash, msg.sender, uint64(block.timestamp), false);
        emit CertificateIssued(certId, hash, msg.sender);
    }

    function revokeCertificate(bytes32 certId) external onlyIssuer {
        Certificate storage c = certificates[certId];
        if (c.issuedAt == 0) revert NotFound();
        if (c.revoked) revert AlreadyRevoked();
        c.revoked = true;
        emit CertificateRevoked(certId, msg.sender);
    }

    function verifyCertificate(bytes32 certId, bytes32 hash)
        external
        view
        returns (bool exists, bool revoked, bool hashMatches)
    {
        Certificate memory c = certificates[certId];
        exists = c.issuedAt != 0;
        revoked = c.revoked;
        hashMatches = exists && c.hash == hash;
    }

    function getCertificate(bytes32 certId)
        external
        view
        returns (address issuer, uint64 issuedAt, bool revoked)
    {
        Certificate memory c = certificates[certId];
        if (c.issuedAt == 0) revert NotFound();
        return (c.issuer, c.issuedAt, c.revoked);
    }
}