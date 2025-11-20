import {
  CoinType,
  GenerateAddressParams,
  GeneratedAddress,
  UnsignedTx,
  SignedTx,
} from "./types.js";

export interface WalletAdapter {
  /**
   * Coin types supported by this adapter.
   * For ETH, this will be [60].
   */
  readonly supportedCoinTypes: CoinType[];

  generateAddress(params: GenerateAddressParams): Promise<GeneratedAddress>;

  signTransaction(
    tx: UnsignedTx,
    options?: Record<string, unknown>,
  ): Promise<SignedTx>;
}
