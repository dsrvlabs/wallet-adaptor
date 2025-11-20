export type HdChange = 0 | 1 | 2 | 3;
// 0 = deposit, 1 = sender, 2 = feePayer, 3 = user

export interface GenerateAddressParams {
  organizationId: string;
  chainId: number;       // e.g. 1(mainnet), 11155111(sepolia)
  coinType: number;
  accountId: number;
  change: HdChange;
  index: number;
}

export interface GeneratedAddress {
  address: string;
  publicKey?: string;
  path?: string;
}
