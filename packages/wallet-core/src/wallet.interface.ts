import {
  GenerateAddressParams,
  GeneratedAddress,
} from "./types.js";

export interface WalletAdapter {
  generateAddress(params: GenerateAddressParams): Promise<GeneratedAddress>;
}
