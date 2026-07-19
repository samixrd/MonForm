import { createPublicClient, createWalletClient, custom, http, decodeEventLog } from "viem";
import { monadTestnet } from "./wagmi";
import { MONFORM_CONTRACT_ADDRESS, monformAbi } from "./contract";
import { uploadToStorage, fetchFromStorage } from "./storage";
import type { DecryptedResponse, Form, FormField, Submission } from "./types";

const RPC_URL = "https://testnet-rpc.monad.xyz";

let publicClientInstance: ReturnType<typeof createPublicClient> | null = null;
export function getPublicClient() {
  if (!publicClientInstance) {
    publicClientInstance = createPublicClient({
      chain: monadTestnet,
      transport: http(RPC_URL),
    });
  }
  return publicClientInstance;
}

let walletClientInstance: ReturnType<typeof createWalletClient> | null = null;
export function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Wallet not connected");
  }
  if (!walletClientInstance) {
    walletClientInstance = createWalletClient({
      chain: monadTestnet,
      transport: custom(window.ethereum),
    });
  }
  return walletClientInstance;
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

/**
 * Fetch all forms by querying formCount and fetching each form by ID.
 * Returns only the forms owned by the specified address.
 * 
 * @param ownerAddress  Wallet address whose forms to fetch.
 */
export async function getForms(ownerAddress: string): Promise<Form[]> {
  const publicClient = getPublicClient();

  const count = await publicClient.readContract({
    address: MONFORM_CONTRACT_ADDRESS,
    abi: monformAbi,
    functionName: "formCount",
  });

  const formCount = Number(count);
  if (formCount === 0) return [];

  // Fetch all forms by ID in parallel
  const formPromises = [];
  for (let i = 0; i < formCount; i++) {
    formPromises.push(getForm(i));
  }

  const forms = await Promise.all(formPromises);

  // Filter out any nulls (non-existent forms) and forms not owned by this address
  return forms.filter(
    (f): f is Form => 
      f !== null && f.ownerAddress.toLowerCase() === ownerAddress.toLowerCase()
  );
}

/**
 * Load a single form by ID.
 * Reads the Form struct from the contract (gets metadataId, ownerPubKey, etc.),
 * then fetches the schema JSON from Irys to get the real name and fields.
 * Works on any device — no localStorage needed.
 */
export async function getForm(id: number): Promise<Form | null> {
  try {
    const publicClient = getPublicClient();
    const form = await publicClient.readContract({
      address: MONFORM_CONTRACT_ADDRESS,
      abi: monformAbi,
      functionName: "getForm",
      args: [BigInt(id)],
    });

    if (form.owner === "0x0000000000000000000000000000000000000000") {
      return null; // Form doesn't exist.
    }

    // Fetch the schema JSON from Irys using the onchain metadataId.
    const schema = await fetchFromStorage(form.metadataId) as {
      name: string;
      fields: FormField[];
    };

    return {
      id,
      name: schema.name,
      ownerAddress: form.owner,
      ownerPubKey: form.ownerPubKey,
      fields: schema.fields,
      createdAt: Number(form.createdAt),
    };
  } catch (err) {
    console.error("getForm error:", err);
    return null;
  }
}

/**
 * Create a form:
 *  1. Upload the schema JSON (name + fields) to Irys — get a real Irys tx ID back.
 *  2. Call createForm(metadataId, ownerPubKey) on the contract.
 *  3. Decode the real formId from the FormCreated event in the receipt.
 */
export async function createForm(input: {
  name: string;
  ownerAddress: string;
  ownerPubKey: string;
  fields: FormField[];
}): Promise<Form> {
  // 1. Upload schema to Irys and get the real ID back.
  const metadataId = await uploadToStorage({
    name: input.name,
    fields: input.fields,
  });

  // 2. Write to contract — store the Irys ID onchain directly.
  const walletClient = getWalletClient();
  const publicClient = getPublicClient();
  const [account] = await walletClient.getAddresses();

  const { request } = await publicClient.simulateContract({
    address: MONFORM_CONTRACT_ADDRESS,
    abi: monformAbi,
    functionName: "createForm",
    args: [metadataId, input.ownerPubKey],
    account,
  });

  const txHash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  // 3. Decode the real formId from the FormCreated event.
  let formId: number | null = null;
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: monformAbi,
        data: log.data,
        topics: log.topics,
        eventName: "FormCreated",
      });
      formId = Number(decoded.args.formId);
      break;
    } catch {
      // Not a FormCreated log — skip.
    }
  }

  if (formId === null) {
    throw new Error(
      "createForm tx confirmed but FormCreated event not found in receipt. " +
        `tx: ${txHash}`
    );
  }

  return {
    id: formId,
    name: input.name,
    ownerAddress: input.ownerAddress,
    ownerPubKey: input.ownerPubKey,
    fields: input.fields,
    createdAt: Math.floor(Date.now() / 1000),
  };
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export async function submitForm(input: {
  formId: number;
  submitterAddress: string;
  encryptedCID: string;
}): Promise<Submission> {
  const walletClient = getWalletClient();
  const publicClient = getPublicClient();
  const [account] = await walletClient.getAddresses();

  const { request } = await publicClient.simulateContract({
    address: MONFORM_CONTRACT_ADDRESS,
    abi: monformAbi,
    functionName: "submitResponse",
    args: [BigInt(input.formId), input.encryptedCID],
    account,
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    formId: input.formId,
    submitterAddress: input.submitterAddress,
    ipfsCID: input.encryptedCID,
    txHash,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

export async function getSubmitters(formId: number): Promise<Submission[]> {
  const publicClient = getPublicClient();
  const addresses = await publicClient.readContract({
    address: MONFORM_CONTRACT_ADDRESS,
    abi: monformAbi,
    functionName: "getSubmitters",
    args: [BigInt(formId)],
  });

  return Promise.all(
    addresses.map(async (address) => {
      const submission = await publicClient.readContract({
        address: MONFORM_CONTRACT_ADDRESS,
        abi: monformAbi,
        functionName: "getSubmission",
        args: [BigInt(formId), address],
      });
      return {
        formId,
        submitterAddress: address,
        ipfsCID: submission[0],
        // txHash is not stored onchain; left empty — the real hash is shown
        // immediately after submission in SubmissionForm's confirmation card.
        txHash: "",
        timestamp: Number(submission[1]),
      };
    }),
  );
}

export async function getSubmission(
  formId: number,
  submitterAddress: string,
): Promise<{ ipfsCID: string; ciphertext: unknown } | null> {
  const publicClient = getPublicClient();
  const [ipfsCID] = await publicClient.readContract({
    address: MONFORM_CONTRACT_ADDRESS,
    abi: monformAbi,
    functionName: "getSubmission",
    args: [BigInt(formId), submitterAddress as `0x${string}`],
  });

  if (!ipfsCID) return null;

  const ciphertext = await fetchFromStorage(ipfsCID);
  return { ipfsCID, ciphertext };
}

export async function recordDecryption(
  submitterAddress: string,
  values: Record<string, string>,
): Promise<DecryptedResponse> {
  return {
    submitterAddress,
    values,
    decryptedAt: Math.floor(Date.now() / 1000),
  };
}
