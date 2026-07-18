/**
 * MonForm core domain types.
 *
 * These mirror the onchain + IPFS data model:
 *  - Form / FormField describe an allowlist form an owner creates.
 *  - Submission is the public, onchain record of an applicant's entry —
 *    it points at an encrypted payload (ipfsCID) but carries no plaintext.
 *  - DecryptedResponse only ever exists client-side, after the owner's
 *    wallet has decrypted a submission's payload. It is never persisted
 *    onchain or sent to any server.
 */

export type FieldType = "text" | "email" | "url";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
}

export interface Form {
  id: number;
  name: string;
  ownerAddress: string;
  ownerPubKey: string;
  fields: FormField[];
  createdAt: number;
}

export interface Submission {
  formId: number;
  submitterAddress: string;
  ipfsCID: string;
  txHash: string;
  timestamp: number;
}

export interface DecryptedResponse {
  submitterAddress: string;
  values: Record<string, string>;
  decryptedAt: number;
}
