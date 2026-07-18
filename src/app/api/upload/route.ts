/**
 * POST /api/upload
 * Receives a JSON payload from the client, uploads it to Arweave via Irys
 * (free tier — payloads under 100 KiB require no funded wallet), and returns
 * the real Irys transaction ID.
 *
 * This route runs server-side so the @irys/upload Node.js SDK can use
 * readline, fs, node:crypto etc. without hitting webpack browser-bundle limits.
 */
import { NextRequest, NextResponse } from "next/server";
import { Uploader } from "@irys/upload";
import { Ethereum } from "@irys/upload-ethereum";
import { ethers } from "ethers";

async function getIrysUploader() {
  // A throwaway keypair — never holds funds. Free uploads < 100 KiB don't
  // require a funded account on Irys mainnet.
  const wallet = ethers.Wallet.createRandom();
  const rpcURL = "https://rpc.ankr.com/eth";
  return Uploader(Ethereum).withWallet(wallet.privateKey).withRpc(rpcURL);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const serialized = JSON.stringify(body);

    // Guard: reject payloads over 100 KiB to stay within the free tier.
    if (Buffer.byteLength(serialized, "utf8") > 100 * 1024) {
      return NextResponse.json(
        { error: "Payload exceeds 100 KiB free-tier limit." },
        { status: 413 }
      );
    }

    const uploader = await getIrysUploader();
    const tags = [{ name: "Content-Type", value: "application/json" }];
    const receipt = await uploader.upload(serialized, { tags });

    return NextResponse.json({ id: receipt.id });
  } catch (err) {
    console.error("[/api/upload] Irys upload failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 }
    );
  }
}
