// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SkillBlockProofOfWorkNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event ProofMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string tokenURI
    );

    constructor(address initialOwner) ERC721("SkillBlock Proof Of Work", "SBPOW") Ownable(initialOwner) {}

    function safeMint(address recipient, string memory metadataURI) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(msg.sender == owner() || msg.sender == recipient, "Not authorized to mint for recipient");

        _nextTokenId += 1;
        uint256 tokenId = _nextTokenId;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit ProofMinted(tokenId, recipient, metadataURI);
        return tokenId;
    }
}
