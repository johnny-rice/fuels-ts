import { readFileSync } from 'fs';
import { ContractFactory, Predicate, Provider, Wallet, hexlify } from 'fuels';
import { launchTestNode } from 'fuels/test-utils';
import { join } from 'path';

import { ConfigurablePin as TypegenPredicate } from '../../../test/typegen';

/**
 * @group browser
 * @group node
 *
 * TODO: enable the test and reintroduce the docs
 */
describe.skip('Deploying Predicates', () => {
  it('deploys a predicate via loader and calls', async () => {
    using launched = await launchTestNode();

    const {
      provider: testProvider,
      wallets: [testWallet, receiver],
    } = launched;

    const recieverInitialBalance = await receiver.getBalance();

    const providerUrl = testProvider.url;
    const WALLET_PVT_KEY = hexlify(testWallet.privateKey);

    const factory = new ContractFactory(
      TypegenPredicate.bytecode,
      TypegenPredicate.abi,
      testWallet
    );
    const { waitForResult: waitForDeploy } = await factory.deployAsBlobTxForScript();
    await waitForDeploy();

    const loaderBytecode = hexlify(
      readFileSync(
        join(
          __dirname,
          '../../../test/fixtures/forc-projects/configurable-pin/out/release/configurable-pin.deployed.bin'
        )
      )
    );

    // #region deploying-predicates
    // #import { Provider, Wallet, hexlify };
    // #context import { readFileSync } from 'fs';
    // #context import { WALLET_PVT_KEY } from 'path/to/my/env/file';
    // #context import { TypegenPredicate } from 'path/to/typegen/outputs';

    // First, we will need the loader bytecode that is generated by `fuels deploy`
    // #context const loaderBytecode = hexlify(readFileSync('path/to/forc/build/outputs')));

    const provider = await Provider.create(providerUrl);
    const wallet = Wallet.fromPrivateKey(WALLET_PVT_KEY, provider);

    // Then we will instantiate the predicate using both the scripts bytecode and it's loader bytecode,
    // now we are free to interact with the predicate as we would normally, such as overriding the configurables
    const predicate = new Predicate({
      bytecode: loaderBytecode,
      abi: TypegenPredicate.abi,
      data: [1337],
      provider,
    });

    // First, let's fund the predicate
    const { waitForResult: waitForFund } = await wallet.transfer(predicate.address, 100_000);
    await waitForFund();

    const { waitForResult: waitForTransfer } = await predicate.transfer(receiver.address, 1000);
    const { gasUsed } = await waitForTransfer();
    // #endregion deploying-predicates

    const anotherPredicate = new Predicate({
      bytecode: TypegenPredicate.bytecode,
      abi: TypegenPredicate.abi,
      data: [1337],
      provider,
    });

    const { waitForResult: waitForAnotherFund } = await wallet.transfer(
      anotherPredicate.address,
      100_000
    );
    await waitForAnotherFund();

    const { waitForResult: waitForAnotherTransfer } = await anotherPredicate.transfer(
      receiver.address,
      1000
    );
    const { gasUsed: anotherGasUsed } = await waitForAnotherTransfer();

    expect(recieverInitialBalance.toNumber()).toBeLessThan(recieverInitialBalance.toNumber());
    expect(gasUsed.toNumber()).toBeLessThan(anotherGasUsed.toNumber());
  });
});