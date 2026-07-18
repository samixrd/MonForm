import { createPublicClient, createWalletClient, custom, http, decodeEventLog } from "viem";
import { monadTestnet } from "./wagmi";
import { MONFORM_CONTRACT_ADDRESS, monformAbi } from "./contract";
import { uploadToStorage, fetchFromStorage } from "./storage";
import type { DecryptedResponse, Form, FormField, Submission } from "./types";

const RPC_URL = "https://testnet-rpc.monad.xyz";

/**
 * Block at which the MonForm contract was deployed on Monad Testnet.
 * Hardcoded so we never query from block 0 — which the RPC rejects
 * (eth_getLogs is capped at a 100-block range per call).
 * Verified via binary-search of eth_getCode on 2026-07-18.
 */
const CONTRACT_DEPLOY_BLOCK =
  BigInt(process.env.NEXT_PUBLIC_CONTRACT_DEPLOY_BLOCK ?? "46037892");

/** Maximum blocks per eth_getLogs call (Monad cap is 100; use 90 for safety). */
const LOG_CHUNK_SIZE = 90n;

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
// Rate Limiting Helper
// ---------------------------------------------------------------------------

const MAX_REQUESTS_PER_SECOND = 15;
const DELAY_BETWEEN_REQUESTS = 1000 / MAX_REQUESTS_PER_SECOND;

/**
 * Runs a list of async tasks sequentially with a minimum delay between each,
 * ensuring we stay under the RPC rate limit (e.g. 25/sec).
 * Automatically retries with exponential backoff on 429 Too Many Requests.
 */
async function runWithRateLimit<T>(
  tasks: (() => Promise<T>)[],
  onProgress?: (done: number, total: number) => void
): Promise<T[]> {
  const results: T[] = [];
  const total = tasks.length;
  if (total === 0) return results;

  let index = 0;
  for (const task of tasks) {
    let retries = 0;
    while (true) {
      try {
        if (index > 0 || retries > 0) {
          await new Promise((r) => setTimeout(r, DELAY_BETWEEN_REQUESTS));
        }
        const result = await task();
        results.push(result);
        index++;
        onProgress?.(index, total);
        break;
      } catch (err: any) {
        const msg = err?.message?.toLowerCase() || "";
        if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("requests limited")) {
          retries++;
          if (retries > 3) throw err;
          // Backoff: 500ms, 1s, 2s
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, retries - 1)));
        } else {
          throw err;
        }
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

/** Shape of the FormCreated event for typed getLogs calls. */
const FORM_CREATED_EVENT = {
  type: "event",
  name: "FormCreated",
  inputs: [
    { indexed: true,  name: "formId",     type: "uint256" },
    { indexed: true,  name: "owner",      type: "address" },
    { indexed: false, name: "metadataId", type: "string"  },
  ],
} as const;

/**
 * Fetch all forms owned by the given address by scanning FormCreated events.
 *
 * This uses a local cache (localStorage) to avoid re-scanning the entire chain
 * history on every load. It only scans from (lastScannedBlock + 1) to the
 * latest block. It processes chunk requests through a rate-limited queue
 * to avoid 429 errors from the RPC.
 *
 * @param ownerAddress  Wallet address whose forms to fetch.
 * @param onProgress    Callback fired after each chunk: (chunksScanned, totalChunks).
 */
export async function getForms(
  ownerAddress: string,
  onProgress?: (scanned: number, total: number) => void,
): Promise<Form[]> {
  const publicClient = getPublicClient();

  const latestBlock = await publicClient.getBlockNumber();
  let fromBlock = CONTRACT_DEPLOY_BLOCK;
  let cachedForms: Form[] = [];
  
  const cacheKey = `monform_cache_${ownerAddress.toLowerCase()}`;

  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.lastScannedBlock && Array.isArray(parsed.forms)) {
          fromBlock = BigInt(parsed.lastScannedBlock) + 1n;
          cachedForms = parsed.forms;
        }
      }
    } catch (err) {
      console.warn("Failed to parse local cache", err);
    }
  }

  // If the cache is fully up to date
  if (fromBlock > latestBlock) {
    return cachedForms;
  }

  // Build all chunk ranges up front
  const ranges: Array<{ from: bigint; to: bigint }> = [];
  let cursor = fromBlock;
  while (cursor <= latestBlock) {
    const end =
      cursor + LOG_CHUNK_SIZE - 1n < latestBlock
        ? cursor + LOG_CHUNK_SIZE - 1n
        : latestBlock;
    ranges.push({ from: cursor, to: end });
    cursor = end + 1n;
  }

  const totalChunks = ranges.length;
  const showProgress = totalChunks > 5; // Revert threshold to 5 since ranges will be small with cache

  // Type the log accumulator from a concrete typed getLogs signature.
  type FormCreatedLog = Awaited<ReturnType<typeof publicClient.getLogs<typeof FORM_CREATED_EVENT>>>;

  // Create tasks for each chunk
  const chunkTasks = ranges.map(({ from, to }) => async () => {
    return publicClient.getLogs({
      address: MONFORM_CONTRACT_ADDRESS,
      event: FORM_CREATED_EVENT,
      args: { owner: ownerAddress as `0x${string}` },
      fromBlock: from,
      toBlock: to,
    });
  });

  // Run the chunk requests through our rate-limited queue
  const chunkResults = await runWithRateLimit(chunkTasks, (done, total) => {
    if (showProgress) {
      onProgress?.(done, total);
    }
  });

  const allLogs: FormCreatedLog = chunkResults.flat();

  // Fetch schemas for newly discovered forms (also rate-limited to protect RPC)
  const formTasks = allLogs.map((log) => async () => {
    const formId = Number(log.args.formId);
    return getForm(formId);
  });

  const newFormsRaw = await runWithRateLimit(formTasks);
  const newForms = newFormsRaw.filter((f): f is Form => f !== null);

  const finalForms = [...cachedForms, ...newForms];

  // Update the cache with the new latest block and combined forms
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          lastScannedBlock: latestBlock.toString(),
          forms: finalForms,
        })
      );
    } catch (err) {
      console.warn("Failed to write to local cache", err);
    }
  }

  return finalForms;
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
