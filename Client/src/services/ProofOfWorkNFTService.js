import { ethers } from 'ethers';
import { proofNftAbi } from '../../../contracts/proofNftAbi';

const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_PROOF_NFT_CONTRACT_ADDRESS || '';

class ProofOfWorkNFTService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  getInjectedProvider() {
    if (!window.ethereum) return null;
    if (Array.isArray(window.ethereum.providers) && window.ethereum.providers.length) {
      return (
        window.ethereum.providers.find((p) => p.isMetaMask) ||
        window.ethereum.providers.find((p) => typeof p.request === 'function') ||
        window.ethereum
      );
    }
    return window.ethereum;
  }

  async init() {
    if (!NFT_CONTRACT_ADDRESS) {
      throw new Error('Missing VITE_PROOF_NFT_CONTRACT_ADDRESS in client environment');
    }

    const injected = this.getInjectedProvider();
    if (!injected) {
      throw new Error('No injected wallet provider found');
    }

    await injected.request({ method: 'eth_requestAccounts' });
    this.provider = new ethers.BrowserProvider(injected);
    this.signer = await this.provider.getSigner();
    this.contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, proofNftAbi, this.signer);
  }

  async mintProof(recipientAddress, metadataUri) {
    if (!this.contract) {
      await this.init();
    }

    const tx = await this.contract.safeMint(recipientAddress, metadataUri);
    const receipt = await tx.wait();

    let tokenId = null;
    if (receipt?.logs?.length) {
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog(log);
          if (parsed?.name === 'ProofMinted') {
            tokenId = parsed.args.tokenId.toString();
            break;
          }
        } catch (_err) {
          // Ignore logs from other contracts in the transaction.
        }
      }
    }

    return {
      txHash: receipt.hash,
      tokenId,
      nftContractAddress: NFT_CONTRACT_ADDRESS,
    };
  }
}

export default new ProofOfWorkNFTService();
