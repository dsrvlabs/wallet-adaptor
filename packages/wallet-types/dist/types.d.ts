export type HdChange = 0 | 1 | 2 | 3;
export interface GenerateAddressParams {
    mnemonic: string;
    hdpath: string;
}
export interface GeneratedAddress {
    address: string;
    publicKey?: string;
}
