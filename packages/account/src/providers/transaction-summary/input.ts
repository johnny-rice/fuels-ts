import { ErrorCode, FuelError } from '@fuel-ts/errors';
import { BN } from '@fuel-ts/math';
import type { Input, InputCoin, InputContract, InputMessage } from '@fuel-ts/transactions';
import { InputType } from '@fuel-ts/transactions';

/** @hidden */
export function getInputsByTypes<T = Input>(inputs: Input[], types: Array<InputType>) {
  return inputs.filter((i) => types.includes(i.type)) as T[];
}

/** @hidden */
export function getInputsByType<T = Input>(inputs: Input[], type: InputType) {
  return inputs.filter((i) => i.type === type) as T[];
}

/** @hidden */
export function getInputsCoin(inputs: Input[]): InputCoin[] {
  return getInputsByType<InputCoin>(inputs, InputType.Coin);
}

/** @hidden */
export function getInputsMessage(inputs: Input[]) {
  return getInputsByType<InputMessage>(inputs, InputType.Message);
}

/** @hidden */
export function getInputsCoinAndMessage(inputs: Input[]) {
  return getInputsByTypes<InputCoin | InputMessage>(inputs, [InputType.Coin, InputType.Message]);
}

/** @hidden */
export function isInputCoin(input: Input): input is InputCoin {
  return input.type === InputType.Coin;
}

/** @hidden */
export function getInputsContract(inputs: Input[]) {
  return getInputsByType<InputContract>(inputs, InputType.Contract);
}

/** @hidden */
function findCoinInput(inputs: Input[], assetId: string): InputCoin | undefined {
  const coinInputs = getInputsCoin(inputs);
  return coinInputs.find((i) => i.assetId === assetId);
}

/** @hidden */
export function aggregateInputsAmountsByAssetAndOwner(
  inputs: Input[],
  baseAssetId: string
): Map<string, Map<string, BN>> {
  const aggregated = new Map<string, Map<string, BN>>();

  getInputsCoinAndMessage(inputs).forEach((input) => {
    const assetId = isInputCoin(input) ? input.assetId : baseAssetId;
    const owner = isInputCoin(input) ? input.owner : input.recipient;

    // Ensure that the map for the assetId exists
    let ownersMap = aggregated.get(assetId);
    if (!ownersMap) {
      ownersMap = new Map<string, BN>();
      aggregated.set(assetId, ownersMap);
    }

    // Ensure that the map for the owner exists
    let ownerBalance = ownersMap.get(owner);
    if (!ownerBalance) {
      ownerBalance = new BN(0);
      ownersMap.set(owner, ownerBalance);
    }

    // Update the balance
    ownersMap.set(owner, ownerBalance.add(input.amount));
  });

  return aggregated;
}

/** @hidden */
function findMessageInput(inputs: Input[]): InputMessage | undefined {
  return getInputsMessage(inputs)?.[0];
}
/** @hidden */
export function getInputFromAssetId(
  inputs: Input[],
  assetId: string,
  isBaseAsset = false
): InputCoin | InputMessage | undefined {
  const coinInput = findCoinInput(inputs, assetId);
  if (coinInput) {
    return coinInput;
  }

  if (isBaseAsset) {
    return findMessageInput(inputs);
  }

  // #TODO: we should throw an error here if we are unable to return a valid input
  return undefined;
}

/** @hidden */
export function getInputContractFromIndex(
  inputs: Input[],
  inputIndex: number
): InputContract | undefined {
  if (inputIndex == null) {
    return undefined;
  }

  const contractInput = inputs?.[inputIndex];

  if (!contractInput) {
    return undefined;
  }
  if (contractInput.type !== InputType.Contract) {
    throw new FuelError(
      ErrorCode.INVALID_TRANSACTION_INPUT,
      `Contract input should be of type 'contract'.`
    );
  }

  return contractInput as InputContract;
}

/** @hidden */
export function getInputAccountAddress(input: Input) {
  if (input.type === InputType.Coin) {
    return input.owner.toString();
  }

  if (input.type === InputType.Message) {
    return input.recipient.toString();
  }

  return '';
}
