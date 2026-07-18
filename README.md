# MonForm

> Onchain encrypted allowlist forms, built on Monad.

A form owner creates an allowlist form; every submission is recorded onchain (public, sybil-proof, tamper-proof), but the applicant's personal data is encrypted **client-side** to the owner's wallet public key before it ever leaves the browser. Only the owner's wallet can decrypt it — no server ever sees the plaintext.

---

## Live Contract — Monad Testnet

| | |
|---|---|
| **Contract** | `MonForm` |
| **Address** | [`0xd24613b9a864408b0b358945EaC35371D11302bC`](https://testnet.monadexplorer.com/address/0xd24613b9a864408b0b358945EaC35371D11302bC) |
| **Network** | Monad Testnet (chain ID `10143`) |
| **Verified** | ✅ [Full match on Sourcify](https://testnet.monadvision.com/contracts/full_match/10143/0xd24613b9a864408b0b358945EaC35371D11302bC/) |
| **RPC** | `https://testnet-rpc.monad.xyz` |
| **Explorer** | `https://testnet.monadexplorer.com` |

### Contract interface

```solidity
// Create a form — stores the Irys metadata ID onchain so any device can fetch the schema
function createForm(string calldata metadataId, string calldata ownerPubKey)
    external returns (uint256 formId);

// Submit an encrypted response (one per wallet, enforced onchain)
function submitResponse(uint256 formId, string calldata ipfsCID) external;

// Read
function getForm(uint256 formId) external view returns (Form memory);
function getSubmitters(uint256 formId) external view returns (address[] memory);
function getSubmission(uint256 formId, address submitter)
    external view returns (string memory ipfsCID, uint256 timestamp);
function hasSubmitted(uint256 formId, address submitter) external view returns (bool);
```

---

## How It Works

```
Owner creates form
  → eth_getEncryptionPublicKey  (MetaMask prompt)
  → upload schema JSON to Irys  (name + fields)
  → createForm(irysId, pubKey)  (Monad tx)
  → formId emitted in FormCreated event
  → share link: /form/{formId}

Applicant opens link (any device, any browser)
  → getForm(formId) reads metadataId from chain
  → fetch schema JSON from Irys gateway
  → fill out fields in browser
  → encryptFormValues(ownerPubKey, values)   (client-side, @metamask/eth-sig-util)
  → upload encrypted payload to Irys
  → submitResponse(formId, irysId)           (Monad tx)

Owner opens dashboard
  → getSubmitters(formId)  (onchain)
  → click Unseal → eth_decrypt prompt        (MetaMask)
  → plaintext displayed — never touched a server
```

---

## Storage

Encrypted submission payloads and form schema JSON are stored on **Arweave via Irys** (free tier, < 100 KiB per upload). The Irys transaction ID — not the encrypted content — is what gets recorded onchain. Payloads are fetched at read time from `https://gateway.irys.xyz/{id}`.

---

## Getting Started

```bash
# Frontend
npm install
npm run dev
```

```bash
# Contracts (redeploy / verify)
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network monadTestnet
npx hardhat verify --network monadTestnet <address>
```

Requires an injected wallet (MetaMask) for:
- `eth_getEncryptionPublicKey` — called once when creating a form
- `eth_decrypt` — called when the owner unseals a submission
- Standard `eth_sendTransaction` for `createForm` and `submitResponse`

Chain is Monad Testnet (chain ID `10143`) — add it to MetaMask via [docs.monad.xyz](https://docs.monad.xyz) or [faucet.monad.xyz](https://faucet.monad.xyz).

---

## Project Structure

```
src/
  app/
    page.tsx               # Landing page
    create/page.tsx        # Form builder (owner)
    form/[id]/page.tsx     # Submission page (applicant, public)
    dashboard/page.tsx     # Owner's form list
    dashboard/[id]/page.tsx# Individual form — submitter list + unseal
    api/upload/route.ts    # Server route: proxies Irys uploads (Node SDK)
  components/
    FormBuilder.tsx        # Create-form flow (wagmi + encryption)
    SubmissionForm.tsx     # Submit-response flow (encrypt → Irys → chain)
    SubmitterRow.tsx       # Per-row unseal animation + decrypted reveal
    SealAnimation.tsx      # Wax-seal crack-and-bloom animation
    WalletConnectButton.tsx# Connect / disconnect
  lib/
    api.ts                 # All contract + Irys reads/writes (viem)
    contract.ts            # ABI + deployed address
    encryption.ts          # encryptFormValues / decryptFormValues
    storage.ts             # uploadToStorage / fetchFromStorage (Irys)
    wagmi.ts               # Monad Testnet chain config + wagmi config
    types.ts               # Form, Submission, DecryptedResponse
contracts/
  contracts/MonForm.sol    # Live contract source
  scripts/deploy.ts        # Hardhat deploy script
```

---

## Design System

Deep ink background (`#14121F`), parchment text, brass (`#C9A24B`) reserved strictly for sealed/verified moments. Fraunces for display type, Inter for body, JetBrains Mono for onchain data (addresses, hashes, timestamps). Full token reference in `tailwind.config.ts` and `src/app/globals.css`.
