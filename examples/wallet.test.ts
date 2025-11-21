/**
 * Test suite for @dsrvlabs/wallet-eth
 * 
 * Run with: pnpm test or node --test wallet.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { EthWalletAdapter } from '@dsrvlabs/wallet-eth';

// Type definition (matching GenerateAddressParams from @dsrvlabs/wallet-types)
interface GenerateAddressParams {
  mnemonic: string;
  hdpath: string;
}

// Test mnemonic (DO NOT use in production)
const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

test('should generate Ethereum address with valid mnemonic and hdpath', async () => {
  const adapter = new EthWalletAdapter();
  const params: GenerateAddressParams = {
    mnemonic: TEST_MNEMONIC,
    hdpath: "m/44'/60'/0'/0/0",
  };

  const result = await adapter.generateAddress(params);

  assert.ok(result.address, 'Address should be generated');
  assert.ok(result.address.startsWith('0x'), 'Address should start with 0x');
  assert.strictEqual(result.address.length, 42, 'Address should be 42 characters (0x + 40 hex)');
  assert.ok(result.publicKey, 'Public key should be present');
});

test('should generate different addresses for different HD paths', async () => {
  const adapter = new EthWalletAdapter();
  const accountId = 0;

  const addresses = {
    deposit: await adapter.generateAddress({
      mnemonic: TEST_MNEMONIC,
      hdpath: `m/44'/60'/${accountId}'/0/0`,
    }),
    sender: await adapter.generateAddress({
      mnemonic: TEST_MNEMONIC,
      hdpath: `m/44'/60'/${accountId}'/1/0`,
    }),
    feePayer: await adapter.generateAddress({
      mnemonic: TEST_MNEMONIC,
      hdpath: `m/44'/60'/${accountId}'/2/0`,
    }),
    user: await adapter.generateAddress({
      mnemonic: TEST_MNEMONIC,
      hdpath: `m/44'/60'/${accountId}'/3/0`,
    }),
  };

  // All addresses should be different
  const addressSet = new Set([
    addresses.deposit.address,
    addresses.sender.address,
    addresses.feePayer.address,
    addresses.user.address,
  ]);
  assert.strictEqual(addressSet.size, 4, 'All addresses should be unique');

  // All addresses should be valid Ethereum addresses
  for (const addr of addressSet) {
    assert.ok(addr.startsWith('0x'), 'Address should start with 0x');
    assert.strictEqual(addr.length, 42, 'Address should be 42 characters');
  }
});

test('should generate same address for same mnemonic and hdpath', async () => {
  const adapter = new EthWalletAdapter();
  const params: GenerateAddressParams = {
    mnemonic: TEST_MNEMONIC,
    hdpath: "m/44'/60'/0'/0/0",
  };

  const result1 = await adapter.generateAddress(params);
  const result2 = await adapter.generateAddress(params);

  assert.strictEqual(
    result1.address,
    result2.address,
    'Same mnemonic and hdpath should generate same address'
  );
  assert.strictEqual(
    result1.publicKey,
    result2.publicKey,
    'Same mnemonic and hdpath should generate same public key'
  );
});

test('should generate different addresses for different accounts', async () => {
  const adapter = new EthWalletAdapter();

  const account0 = await adapter.generateAddress({
    mnemonic: TEST_MNEMONIC,
    hdpath: "m/44'/60'/0'/0/0",
  });

  const account1 = await adapter.generateAddress({
    mnemonic: TEST_MNEMONIC,
    hdpath: "m/44'/60'/1'/0/0",
  });

  assert.notStrictEqual(
    account0.address,
    account1.address,
    'Different account IDs should generate different addresses'
  );
});

test('should generate different addresses for different indices', async () => {
  const adapter = new EthWalletAdapter();

  const index0 = await adapter.generateAddress({
    mnemonic: TEST_MNEMONIC,
    hdpath: "m/44'/60'/0'/0/0",
  });

  const index1 = await adapter.generateAddress({
    mnemonic: TEST_MNEMONIC,
    hdpath: "m/44'/60'/0'/0/1",
  });

  assert.notStrictEqual(
    index0.address,
    index1.address,
    'Different indices should generate different addresses'
  );
});

test('MQ Consumer: handleGenerateAddressJob', async () => {
  async function handleGenerateAddressJob(
    mnemonic: string,
    params: {
      accountId: number;
      change: 0 | 1 | 2 | 3;
      index: number;
    }
  ) {
    const adapter = new EthWalletAdapter();
    const hdpath = `m/44'/60'/${params.accountId}'/${params.change}/${params.index}`;
    const generateParams: GenerateAddressParams = {
      mnemonic,
      hdpath,
    };
    return await adapter.generateAddress(generateParams);
  }

  const result = await handleGenerateAddressJob(TEST_MNEMONIC, {
    accountId: 0,
    change: 0,
    index: 0,
  });

  assert.ok(result.address, 'Should generate address');
  assert.ok(result.address.startsWith('0x'), 'Address should be valid');
});

test('MQ Consumer: processWalletJob with GENERATE_ADDRESS', async () => {
  async function processWalletJob(
    mnemonic: string,
    job: {
      type: 'GENERATE_ADDRESS';
      accountId?: number;
      change?: 0 | 1 | 2 | 3;
      index?: number;
      hdpath?: string;
    }
  ) {
    const adapter = new EthWalletAdapter();
    let hdpath: string;

    if (job.hdpath) {
      hdpath = job.hdpath;
    } else if (
      job.accountId !== undefined &&
      job.change !== undefined &&
      job.index !== undefined
    ) {
      hdpath = `m/44'/60'/${job.accountId}'/${job.change}/${job.index}`;
    } else {
      throw new Error('Missing required parameters for GENERATE_ADDRESS');
    }

    return await adapter.generateAddress({ mnemonic, hdpath });
  }

  // Test with accountId/change/index
  const result1 = await processWalletJob(TEST_MNEMONIC, {
    type: 'GENERATE_ADDRESS',
    accountId: 0,
    change: 0,
    index: 0,
  });
  assert.ok(result1.address, 'Should generate address with accountId/change/index');

  // Test with hdpath
  const result2 = await processWalletJob(TEST_MNEMONIC, {
    type: 'GENERATE_ADDRESS',
    hdpath: "m/44'/60'/0'/0/0",
  });
  assert.ok(result2.address, 'Should generate address with hdpath');
  assert.strictEqual(result1.address, result2.address, 'Both methods should generate same address');
});

