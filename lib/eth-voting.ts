import { ethers } from "ethers";
import voting from "../voting.json";

export const CONTRACT_ADDRESS = "0x384E50ABA4EEaC706DBfbCA5d1C89B51fa634A98";
export const CONTRACT_ABI = voting.abi;

// Daftar RPC Sepolia fallback — dicoba satu per satu kalau gagal
const RPC_URLS = [
  process.env.NEXT_PUBLIC_RPC_URL,
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://sepolia.drpc.org",
  "https://rpc2.sepolia.org",
].filter(Boolean) as string[];

async function getProvider(): Promise<ethers.providers.JsonRpcProvider> {
  for (const url of RPC_URLS) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(url);
      await provider.getNetwork(); // test koneksi
      return provider;
    } catch {
      continue;
    }
  }
  throw new Error("Semua RPC Sepolia tidak dapat dijangkau. Cek koneksi internet.");
}

async function getSigner(): Promise<ethers.Wallet> {
  // NEXT_PUBLIC_ prefix agar terbaca di browser (client-side)
  const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY belum diisi di file .env");
  }
  const provider = await getProvider();
  return new ethers.Wallet(privateKey, provider);
}

// Fungsi untuk mengirim vote ke smart contract
export async function sendVoteToBlockchain({
  electionId,
  candidateId,
  voterPublicKey,
  schnorrSignature,
  zkpProof,
}: {
  electionId: number;
  candidateId: number;
  voterPublicKey: string;
  schnorrSignature: string;
  zkpProof: string;
}) {
  const signer = await getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  const tx = await contract.vote(
    electionId,
    candidateId,
    voterPublicKey,
    schnorrSignature,
    zkpProof
  );
  await tx.wait();
  return tx.hash;
}

// Fungsi untuk mengambil jumlah suara dari smart contract
export async function getVotesCountFromBlockchain(
  electionId: number,
  candidateId: number
): Promise<number> {
  const provider = await getProvider();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const count = await contract.getVotesCount(electionId, candidateId);
  return Number(count);
}