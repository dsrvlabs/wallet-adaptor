import { GenerateAddressParams, GeneratedAddress, WalletAdapter } from "@dsrvlabs/wallet-types";
export declare class EthWalletAdapter implements WalletAdapter {
    constructor();
    generateAddress(params: GenerateAddressParams): Promise<GeneratedAddress>;
    signTransaction(tx: any): Promise<any>;
}
