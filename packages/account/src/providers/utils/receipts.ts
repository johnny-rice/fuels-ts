import type { ReceiptPanic, ReceiptRevert } from '@fuel-ts/transactions';
import { ReceiptType } from '@fuel-ts/transactions';
import { FAILED_TRANSFER_TO_ADDRESS_SIGNAL } from '@fuel-ts/transactions/configs';

import type { TransactionReceiptJson } from '../provider';
import type { TransactionResultReceipt } from '../transaction-response';

import { deserializeReceipt } from './serialization';

/** @hidden */
const doesReceiptHaveMissingOutputVariables = (
  receipt: TransactionResultReceipt
): receipt is ReceiptRevert =>
  receipt.type === ReceiptType.Revert &&
  receipt.val.toString('hex') === FAILED_TRANSFER_TO_ADDRESS_SIGNAL;

/** @hidden */
const doesReceiptHaveMissingContractId = (
  receipt: TransactionResultReceipt
): receipt is ReceiptPanic =>
  receipt.type === ReceiptType.Panic &&
  receipt.contractId !== '0x0000000000000000000000000000000000000000000000000000000000000000';

/** @hidden */
export const getReceiptsWithMissingData = (receipts: Array<TransactionResultReceipt>) =>
  receipts.reduce<{
    missingOutputVariables: Array<ReceiptRevert>;
    missingOutputContractIds: Array<ReceiptPanic>;
  }>(
    (memo, receipt) => {
      if (doesReceiptHaveMissingOutputVariables(receipt)) {
        memo.missingOutputVariables.push(receipt);
      }
      if (doesReceiptHaveMissingContractId(receipt)) {
        memo.missingOutputContractIds.push(receipt);
      }
      return memo;
    },
    {
      missingOutputVariables: [],
      missingOutputContractIds: [],
    }
  );

/** @deprecated Use `deserializeReceipt` instead. */
export const assembleReceiptByType = (
  gqlReceipt: TransactionReceiptJson
): TransactionResultReceipt => deserializeReceipt(gqlReceipt);
