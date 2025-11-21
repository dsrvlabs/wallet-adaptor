export type HdChange = 0 | 1 | 2 | 3;
// 0 = deposit, 1 = sender, 2 = feePayer, 3 = user

export interface GenerateAddressParams {
  mnemonic: string;
  hdpath: string;
}

export interface GeneratedAddress {
  address: string;
  publicKey?: string;
}
