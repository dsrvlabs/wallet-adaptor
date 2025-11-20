import {
  CoinType,
  GenerateAddressParams,
  GeneratedAddress,
  UnsignedTx,
  SignedTx,
  MnemonicProvider,
  WalletAdapter,
} from "@dsrvlabs/wallet-core";

export class EthWalletAdapter implements WalletAdapter {
  readonly supportedCoinTypes: CoinType[] = [60];

  constructor(
    private readonly mnemonicProvider: MnemonicProvider,
  ) {}

  async generateAddress(params: GenerateAddressParams): Promise<GeneratedAddress> {
    // TODO: use ethers HDNodeWallet.fromPhrase(mnemonic)
    // and derive path: m/44'/60'/{accountId}'/{change}/{index}
    throw new Error("EthWalletAdapter.generateAddress is not implemented yet.");
  }

  async signTransaction(tx: UnsignedTx): Promise<SignedTx> {
    // TODO: use mnemonicProvider and ethers Wallet to sign tx.rawTx
    throw new Error("EthWalletAdapter.signTransaction is not implemented yet.");
  }
}
