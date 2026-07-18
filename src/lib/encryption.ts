/**
 * Client-side, wallet-native encryption.
 *
 * MonForm never sends plaintext applicant data anywhere. Every field value
 * is encrypted in the browser to the *form owner's* wallet public key
 * before it's pinned to Irys and its ID recorded onchain. Only a signature
 * from the owner's wallet can decrypt it (via `eth_decrypt`), so no server —
 * including MonForm's own — ever sees the plaintext.
 *
 * This uses the same x25519-xsalsa20-poly1305 scheme MetaMask exposes
 * through `eth_getEncryptionPublicKey` / `eth_decrypt`, via
 * @metamask/eth-sig-util. Swapping in a different wallet's equivalent API
 * later is a matter of changing the two functions that touch `window.ethereum`.
 */

import { encrypt, type EthEncryptedData } from "@metamask/eth-sig-util";

export type EncryptedPayload = EthEncryptedData;

/**
 * Reads the form owner's encryption public key directly from their
 * connected wallet. Called once, when the owner creates a form — the key
 * is then stored on the Form record (`ownerPubKey`) so applicants can
 * encrypt to it without the owner needing to be online.
 */
export async function getWalletEncryptionPublicKey(address: string): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet found. Connect a wallet to generate an encryption key.");
  }

  try {
    const publicKey: string = await window.ethereum.request({
      method: "eth_getEncryptionPublicKey",
      params: [address],
    });
    return publicKey;
  } catch (error: any) {
    if (error?.code === 4200 || error?.message?.includes("not supported")) {
      throw new Error(
        "Your wallet does not support encryption (eth_getEncryptionPublicKey). " +
          "Please use MetaMask to create forms.",
      );
    }
    throw error;
  }
}

/**
 * Encrypts a submitter's form values to the owner's public key. Runs
 * entirely client-side — the returned payload is what gets pinned to Irys;
 * the plaintext `values` object never leaves this function call.
 */
export function encryptFormValues(
  ownerPubKey: string,
  values: Record<string, string>,
): EncryptedPayload {
  return encrypt({
    publicKey: ownerPubKey,
    data: JSON.stringify(values),
    version: "x25519-xsalsa20-poly1305",
  });
}

/**
 * Prompts the owner's connected wallet to decrypt a submission's payload.
 * Triggers a wallet approval prompt — this is the "unseal" moment the
 * SealAnimation + UnsealButton components are built around.
 *
 * The payload must be a genuine EthEncryptedData object (produced by
 * encryptFormValues). Any other shape will be rejected with a clear error.
 */
export async function decryptFormValues(
  ownerAddress: string,
  payload: EncryptedPayload,
): Promise<Record<string, string>> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet found. Connect the form owner's wallet to decrypt.");
  }

  // Validate it's a real encrypted payload before calling eth_decrypt.
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("version" in payload) ||
    !("nonce" in payload) ||
    !("ephemPublicKey" in payload) ||
    !("ciphertext" in payload)
  ) {
    throw new Error(
      "Cannot decrypt: payload is not a valid EthEncryptedData object. " +
        "It may be corrupted or was not encrypted with encryptFormValues().",
    );
  }

  const hexPayload = `0x${utf8ToHex(JSON.stringify(payload))}`;

  const decrypted: string = await window.ethereum.request({
    method: "eth_decrypt",
    params: [hexPayload, ownerAddress],
  });

  return JSON.parse(decrypted) as Record<string, string>;
}

/** Browser-native utf8-to-hex, no Buffer polyfill required. */
function utf8ToHex(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
