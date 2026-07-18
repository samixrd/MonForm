# MonForm Smart Contract

This directory contains the `MonForm.sol` smart contract and deployment scripts for the MonForm application.

## Contract Overview
`MonForm` is a minimal, focused smart contract that tracks form creation and response submissions on-chain. It acts as a private notary for on-chain identity.

Key Features:
- **`createForm`**: Stores the metadata hash (schema definition) and the owner's public key (for encryption), returning a unique `formId`.
- **`submitResponse`**: Allows users to submit a response containing the IPFS CID of their encrypted data, guaranteeing a single response per wallet per form.
- **`getSubmitters`**, **`getSubmission`**: Fetch submission references easily for decryption.

No admin logic or upgradeability exist by design to keep the contract maximally secure and simple.

## Deployment Details (Monad Testnet)
The contract has been officially deployed and verified on the **Monad Testnet**.

- **Network Name:** Monad Testnet
- **Chain ID:** 10143
- **RPC URL:** `https://testnet-rpc.monad.xyz`
- **Contract Address:** `0xec8a065D0EB95e3E2B3B739eC8C3FA4858390f39`
- **Verified On:** [MonadVision](https://testnet.monadvision.com/contracts/full_match/10143/0xec8a065D0EB95e3E2B3B739eC8C3FA4858390f39/)

## Local Development & Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run Hardhat tests:
   ```bash
   npx hardhat test
   ```

3. Deploy to Monad Testnet:
   Ensure `.env` contains your `PRIVATE_KEY` with Monad testnet funds.
   ```bash
   npx hardhat run scripts/deploy.ts --network monadTestnet
   ```

4. Verify on Monad Testnet (Sourcify):
   ```bash
   npx hardhat verify --network monadTestnet <CONTRACT_ADDRESS>
   ```
