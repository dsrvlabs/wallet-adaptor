/**
 * Example usage of the wallet SDK from an external MQ consumer project.
 * 
 * This demonstrates how to use @dsrvlabs/wallet-eth to generate Ethereum addresses
 * by providing the mnemonic directly.
 */

import { EthWalletAdapter } from '@dsrvlabs/wallet-eth';
import {
  GenerateAddressParams,
  UnsignedTx,
  CoinType,
} from '@dsrvlabs/wallet-core';
import { TransactionRequest } from 'ethers';

/**
 * Example 1: Basic setup and address generation
 * 
 * This example shows how to initialize the SDK and generate an Ethereum address.
 */
export async function exampleGenerateAddress() {
  // Step 1: Provide the mnemonic directly
  // In production, this should be securely retrieved from your storage (e.g., AWS Secrets Manager)
  const mnemonic = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';

  // Step 2: Initialize the ETH wallet adapter with the mnemonic
  const ethAdapter = new EthWalletAdapter(mnemonic);

  // Step 3: Prepare address generation parameters
  const params: GenerateAddressParams = {
    organizationId: 'org-1234',      // Your organization ID (not used for address generation, but required by interface)
    chainId: 1,                       // Ethereum mainnet (1) or Sepolia (11155111)
    coinType: 60,                     // ETH coin type (SLIP-0044)
    accountId: 0,                     // Account identifier
    change: 0,                        // 0=deposit, 1=sender, 2=feePayer, 3=user
    index: 0,                         // Address index
  };

  // Step 4: Generate the address
  const result = await ethAdapter.generateAddress(params);

  console.log('Generated Ethereum Address:');
  console.log('  Address:', result.address);
  console.log('  Public Key:', result.publicKey);
  console.log('  Derivation Path:', result.path);
  // Example output:
  //   Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
  //   Public Key: 0x04...
  //   Derivation Path: m/44'/60'/0'/0/0

  return result;
}

/**
 * Example 2: Generate multiple addresses for different purposes
 * 
 * This example shows how to generate addresses for different use cases
 * (deposit, sender, feePayer, user) using the same account.
 */
export async function exampleGenerateMultipleAddresses() {
  // Provide the mnemonic
  const mnemonic = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
  const ethAdapter = new EthWalletAdapter(mnemonic);

  const organizationId = 'org-1234';
  const chainId = 1; // Ethereum mainnet
  const accountId = 0;

  // Generate addresses for different purposes
  const addresses = {
    deposit: await ethAdapter.generateAddress({
      organizationId,
      chainId,
      coinType: 60,
      accountId,
      change: 0, // deposit
      index: 0,
    }),
    sender: await ethAdapter.generateAddress({
      organizationId,
      chainId,
      coinType: 60,
      accountId,
      change: 1, // sender
      index: 0,
    }),
    feePayer: await ethAdapter.generateAddress({
      organizationId,
      chainId,
      coinType: 60,
      accountId,
      change: 2, // feePayer
      index: 0,
    }),
    user: await ethAdapter.generateAddress({
      organizationId,
      chainId,
      coinType: 60,
      accountId,
      change: 3, // user
      index: 0,
    }),
  };

  console.log('Generated Addresses:');
  console.log('  Deposit:', addresses.deposit.address);
  console.log('  Sender:', addresses.sender.address);
  console.log('  Fee Payer:', addresses.feePayer.address);
  console.log('  User:', addresses.user.address);

  return addresses;
}

/**
 * Example 3: MQ Consumer integration
 * 
 * This example shows how to integrate the SDK with a message queue consumer.
 * The consumer receives jobs and processes them using the wallet SDK.
 */
export async function handleGenerateAddressJob(
  mnemonic: string,
  params: {
    organizationId: string;
    chainId: number;
    accountId: number;
    change: 0 | 1 | 2 | 3;
    index: number;
  }
) {
  // Initialize adapter with the provided mnemonic
  const ethAdapter = new EthWalletAdapter(mnemonic);

  // Generate address based on job parameters
  const generateParams: GenerateAddressParams = {
    organizationId: params.organizationId,
    chainId: params.chainId,
    coinType: 60, // ETH
    accountId: params.accountId,
    change: params.change,
    index: params.index,
  };

  const result = await ethAdapter.generateAddress(generateParams);

  // Return the result (can be sent back to the queue or stored in database)
  return {
    success: true,
    address: result.address,
    publicKey: result.publicKey,
    path: result.path,
  };
}

/**
 * Example 4: Sign transaction (placeholder for future implementation)
 * 
 * This example shows how to sign a transaction once signTransaction is implemented.
 */
export async function handleSignTxJob(
  mnemonic: string,
  params: {
    organizationId: string;
    chainId: number;
    rawTx: TransactionRequest;
  }
) {
  const ethAdapter = new EthWalletAdapter(mnemonic);

  const unsignedTx: UnsignedTx = {
    organizationId: params.organizationId,
    chainId: params.chainId,
    coinType: 60, // ETH
    rawTx: params.rawTx,
  };

  // Note: signTransaction is not yet implemented
  // const signedTx = await ethAdapter.signTransaction(unsignedTx);
  // return signedTx;

  throw new Error('signTransaction is not yet implemented');
}

/**
 * Example 5: Wallet service factory
 * 
 * This example shows how to create a reusable wallet service
 * that can be used across your application.
 */
export function createWalletService(mnemonic: string) {
  const ethAdapter = new EthWalletAdapter(mnemonic);

  return {
    /**
     * Generate an Ethereum address
     */
    async generateAddress(params: GenerateAddressParams) {
      return ethAdapter.generateAddress(params);
    },

    /**
     * Sign an Ethereum transaction
     */
    async signTransaction(tx: UnsignedTx) {
      // Note: signTransaction is not yet implemented
      return ethAdapter.signTransaction(tx);
    },
  };
}

/**
 * Example 6: Complete MQ consumer job processor
 * 
 * This example shows a complete job processor that handles different job types.
 */
export async function processWalletJob(
  mnemonic: string,
  job: {
    type: 'GENERATE_ADDRESS' | 'SIGN_TX';
    organizationId: string;
    chainId: number;
    coinType: CoinType;
    // For GENERATE_ADDRESS
    accountId?: number;
    change?: 0 | 1 | 2 | 3;
    index?: number;
    // For SIGN_TX
    rawTx?: TransactionRequest;
  }
) {
  const service = createWalletService(mnemonic);

  switch (job.type) {
    case 'GENERATE_ADDRESS':
      if (
        job.accountId === undefined ||
        job.change === undefined ||
        job.index === undefined
      ) {
        throw new Error('Missing required parameters for GENERATE_ADDRESS');
      }
      return service.generateAddress({
        organizationId: job.organizationId,
        chainId: job.chainId,
        coinType: job.coinType,
        accountId: job.accountId,
        change: job.change,
        index: job.index,
      });

    case 'SIGN_TX':
      if (!job.rawTx) {
        throw new Error('Missing rawTx for SIGN_TX');
      }
      return service.signTransaction({
        organizationId: job.organizationId,
        chainId: job.chainId,
        coinType: job.coinType,
        rawTx: job.rawTx,
      });

    default:
      throw new Error(`Unknown job type: ${(job as { type: string }).type}`);
  }
}

// Example usage:
// 
// // Generate a single address
// await exampleGenerateAddress();
//
// // Generate multiple addresses
// await exampleGenerateMultipleAddresses();
//
// // Process a job from MQ
// const mnemonic = 'your mnemonic phrase here';
// await processWalletJob(mnemonic, {
//   type: 'GENERATE_ADDRESS',
//   organizationId: 'org-1234',
//   chainId: 1,
//   coinType: 60,
//   accountId: 0,
//   change: 0,
//   index: 0,
// });
