/**
 * MonForm contract — Monad Testnet
 *
 * Deployed: 2026-07-18
 * Address:  0xd24613b9a864408b0b358945EaC35371D11302bC
 *
 * Key change from v1: the Form struct now stores the Irys transaction ID
 * (metadataId, a plain string) instead of a bytes32 keccak256 hash.
 * This makes the form schema fetchable by any device given only the formId —
 * no localStorage registry required.
 */

export const MONFORM_CONTRACT_ADDRESS =
  "0xd24613b9a864408b0b358945EaC35371D11302bC" as const;

export const monformAbi = [
  // ─── Write functions ────────────────────────────────────────────────────
  {
    inputs: [
      { internalType: "string", name: "metadataId", type: "string" },
      { internalType: "string", name: "ownerPubKey", type: "string" },
    ],
    name: "createForm",
    outputs: [{ internalType: "uint256", name: "formId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "formId",  type: "uint256" },
      { internalType: "string",  name: "ipfsCID", type: "string"  },
    ],
    name: "submitResponse",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ─── View functions ──────────────────────────────────────────────────────
  {
    inputs: [],
    name: "formCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "formId", type: "uint256" }],
    name: "getSubmitters",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "formId",    type: "uint256" },
      { internalType: "address", name: "submitter", type: "address" },
    ],
    name: "hasSubmitted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "formId",    type: "uint256" },
      { internalType: "address", name: "submitter", type: "address" },
    ],
    name: "getSubmission",
    outputs: [
      { internalType: "string",  name: "ipfsCID",   type: "string"  },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "formId", type: "uint256" }],
    name: "getForm",
    outputs: [
      {
        components: [
          { internalType: "address", name: "owner",      type: "address" },
          { internalType: "string",  name: "metadataId", type: "string"  },
          { internalType: "string",  name: "ownerPubKey",type: "string"  },
          { internalType: "uint256", name: "createdAt",  type: "uint256" },
        ],
        internalType: "struct MonForm.Form",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  // ─── Events ─────────────────────────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "uint256", name: "formId",     type: "uint256" },
      { indexed: true,  internalType: "address", name: "owner",      type: "address" },
      { indexed: false, internalType: "string",  name: "metadataId", type: "string"  },
    ],
    name: "FormCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "uint256", name: "formId",    type: "uint256" },
      { indexed: true,  internalType: "address", name: "submitter", type: "address" },
      { indexed: false, internalType: "string",  name: "ipfsCID",   type: "string"  },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ResponseSubmitted",
    type: "event",
  },
] as const;
