// #region custom-transactions-contract-calls
import { bn, buildFunctionResult, Contract, Provider, Wallet } from 'fuels';

import { LOCAL_NETWORK_URL, WALLET_PVT_KEY } from '../../../env';
import { CounterFactory } from '../../../typegend';

const provider = new Provider(LOCAL_NETWORK_URL);
const baseAssetId = await provider.getBaseAssetId();

const wallet = Wallet.fromPrivateKey(WALLET_PVT_KEY, provider);
const deploy = await CounterFactory.deploy(wallet);
const { contract } = await deploy.waitForResult();

const receiverWallet = Wallet.generate({ provider });

const amountToRecipient = bn(10_000); // 0x2710
// Connect to the contract
const contractInstance = new Contract(contract.id, contract.interface, wallet);
// Create an invocation scope for the contract function you'd like to call in the transaction
const scope = contractInstance.functions
  .increment_count(amountToRecipient)
  .addTransfer({
    amount: amountToRecipient,
    destination: receiverWallet.address,
    assetId: baseAssetId,
  });

// Build a transaction request from the invocation scope
const transactionRequest = await scope.getTransactionRequest();
// Add coin output for the recipient
transactionRequest.addCoinOutput(
  receiverWallet.address,
  amountToRecipient,
  baseAssetId
);

// Estimate and fund the transaction
await transactionRequest.estimateAndFund(wallet);

// Submit the transaction
const response = await wallet.sendTransaction(transactionRequest);
await response.waitForResult();
// Get result of contract call
const { value } = await buildFunctionResult({
  funcScope: scope,
  isMultiCall: false,
  program: contract,
  transactionResponse: response,
});

console.log('value', value);
// <BN: 0x2710>
// #endregion custom-transactions-contract-calls

const receiverBalance = await receiverWallet.getBalance(baseAssetId);

console.log('balance', receiverBalance.toNumber());
