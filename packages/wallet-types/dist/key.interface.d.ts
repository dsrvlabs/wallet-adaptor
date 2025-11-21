export interface MnemonicContext {
    organizationId: string;
    chainId: number;
}
export interface MnemonicProvider {
    getMnemonic(ctx: MnemonicContext): Promise<string>;
}
