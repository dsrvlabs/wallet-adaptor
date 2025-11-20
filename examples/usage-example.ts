/**
 * Example usage of the wallet SDK from an external MQ consumer project.
 * 
 * This demonstrates how to wire together the packages:
 * - @dsrv/wallet-keys-aws: AWS Secrets Manager mnemonic provider
 * - @dsrv/wallet-eth: Ethereum wallet adapter
 * - @dsrv/wallet-core: Core types and interfaces
 */

import { AwsMnemonicProvider } from '@dsrv/wallet-keys-aws';
import {
  GenerateAddressParams,
  UnsignedTx,
  CoinType,
} from '@dsrv/wallet-core';
import { EthWalletAdapter } from '@dsrv/wallet-eth';
import { TransactionRequest } from 'ethers';

// Initialize the mnemonic provider (AWS Secrets Manager)
const mnemonicProvider = new AwsMnemonicProvider('us-east-1'); // or undefined for default region

// Initialize the ETH wallet adapter
const ethAdapter = new EthWalletAdapter(mnemonicProvider);

/**
 * Handle a job to generate an Ethereum address.
 * 
 * This would typically be called from your MQ consumer when processing
 * a message like: { type: 'GENERATE_ADDRESS', organizationId, chainId, ... }
 */
export async function handleGenerateAddressJob(params: {
  organizationId: string;
  chainId: number;
  accountId: number;
  change: 0 | 1 | 2 | 3;
  index: number;
}) {
  const generateParams: GenerateAddressParams = {
    organizationId: params.organizationId,
    chainId: params.chainId,
    coinType: 60, // ETH
    accountId: params.accountId,
    change: params.change,
    index: params.index,
  };

  const result = await ethAdapter.generateAddress(generateParams);

  console.log('Generated address:', {
    address: result.address,
    publicKey: result.publicKey,
    path: result.path,
  });

  return result;
}

/**
 * Handle a job to sign an Ethereum transaction.
 * 
 * This would typically be called from your MQ consumer when processing
 * a message like: { type: 'SIGN_TX', organizationId, chainId, rawTx, ... }
 */
export async function handleSignTxJob(params: {
  organizationId: string;
  chainId: number;
  rawTx: TransactionRequest;
}) {
  const unsignedTx: UnsignedTx = {
    organizationId: params.organizationId,
    chainId: params.chainId,
    coinType: 60, // ETH
    rawTx: params.rawTx,
  };

  const signedTx = await ethAdapter.signTransaction(unsignedTx);

  console.log('Signed transaction:', {
    txHash: signedTx.txHash,
    signedRawTx: signedTx.signedRawTx,
  });

  return signedTx;
}

/**
 * Example: Wallet adapter registry pattern (optional)
 * 
 * This allows you to support multiple chains in the future.
 */
export class WalletAdapterRegistry {
  private adapters = new Map<CoinType, EthWalletAdapter>();

  constructor(mnemonicProvider: AwsMnemonicProvider) {
    // Register ETH adapter
    this.adapters.set(60, new EthWalletAdapter(mnemonicProvider));
  }

  getAdapter(coinType: CoinType): EthWalletAdapter {
    const adapter = this.adapters.get(coinType);
    if (!adapter) {
      throw new Error(`No adapter found for coinType ${coinType}`);
    }
    return adapter;
  }
}

// Example usage of the registry:
export function createWalletService(awsRegion?: string) {
  const mnemonicProvider = new AwsMnemonicProvider(awsRegion);
  const registry = new WalletAdapterRegistry(mnemonicProvider);

  return {
    async generateAddress(params: GenerateAddressParams) {
      const adapter = registry.getAdapter(params.coinType);
      return adapter.generateAddress(params);
    },

    async signTransaction(tx: UnsignedTx) {
      const adapter = registry.getAdapter(tx.coinType);
      return adapter.signTransaction(tx);
    },
  };
}

// Example: How you might use this in an MQ consumer
export async function processWalletJob(job: {
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
}) {
  const service = createWalletService();

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

