export type CoinType = 60; // ETH (SLIP-0044)

export type HdChange = 0 | 1 | 2 | 3;
// 0 = deposit, 1 = sender, 2 = feePayer, 3 = user

export interface GenerateAddressParams {
  organizationId: string;
  chainId: number;       // e.g. 1(mainnet), 11155111(sepolia)
  coinType: CoinType;
  accountId: number;
  change: HdChange;
  index: number;
}

export interface GeneratedAddress {
  address: string;
  publicKey?: string;
  path?: string;
}

export interface UnsignedTx {
  organizationId: string;
  chainId: number;
  coinType: CoinType;
  rawTx: unknown;        // will be ethers.TransactionRequest for ETH
}

export interface SignedTx {
  organizationId: string;
  chainId: number;
  coinType: CoinType;
  signedRawTx: string;   // serialized tx (hex)
  txHash?: string;
}
