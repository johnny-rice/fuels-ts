import { ZeroBytes32 } from '@fuel-ts/address/configs';
import { ErrorCode, FuelError } from '@fuel-ts/errors';
import { bn } from '@fuel-ts/math';
import type {
  ReceiptBurn,
  ReceiptCall,
  ReceiptLog,
  ReceiptLogData,
  ReceiptMessageOut,
  ReceiptMint,
  ReceiptPanic,
  ReceiptReturn,
  ReceiptReturnData,
  ReceiptRevert,
  ReceiptScriptResult,
  ReceiptTransfer,
  ReceiptTransferOut,
} from '@fuel-ts/transactions';
import { getMintedAssetId, InputMessageCoder, ReceiptType } from '@fuel-ts/transactions';
import { hexlify, arrayify } from '@fuel-ts/utils';

import { GqlReceiptType } from '../__generated__/operations';
import type {
  ChainInfo,
  NodeInfo,
  ChainInfoJson,
  NodeInfoJson,
  TransactionReceiptJson,
} from '../provider';
import type Provider from '../provider';
import type { TransactionResultReceipt } from '../transaction-response';

export interface ProviderCache {
  consensusParametersTimestamp?: number;
  chain: ChainInfo;
  nodeInfo: NodeInfo;
}

export interface ProviderCacheJson {
  consensusParametersTimestamp?: number;
  chain: ChainInfoJson;
  nodeInfo: NodeInfoJson;
}

export interface TransactionSummaryJson {
  id: string;
  transactionBytes: string;
  receipts: TransactionReceiptJson[];
  gasPrice: string;
}

export type TransactionSummaryJsonPartial = Omit<TransactionSummaryJson, 'id' | 'transactionBytes'>;

/** @hidden */
export const deserializeChain = (chain: ChainInfoJson): ChainInfo => {
  const { name, daHeight, consensusParameters } = chain;

  const {
    contractParams,
    feeParams,
    predicateParams,
    scriptParams,
    txParams,
    gasCosts,
    baseAssetId,
    chainId,
    version,
  } = consensusParameters;

  return {
    name,
    baseChainHeight: bn(daHeight),
    consensusParameters: {
      version,
      chainId: bn(chainId),
      baseAssetId,
      feeParameters: {
        version: feeParams.version,
        gasPerByte: bn(feeParams.gasPerByte),
        gasPriceFactor: bn(feeParams.gasPriceFactor),
      },
      contractParameters: {
        version: contractParams.version,
        contractMaxSize: bn(contractParams.contractMaxSize),
        maxStorageSlots: bn(contractParams.maxStorageSlots),
      },
      txParameters: {
        version: txParams.version,
        maxInputs: bn(txParams.maxInputs),
        maxOutputs: bn(txParams.maxOutputs),
        maxWitnesses: bn(txParams.maxWitnesses),
        maxGasPerTx: bn(txParams.maxGasPerTx),
        maxSize: bn(txParams.maxSize),
        maxBytecodeSubsections: bn(txParams.maxBytecodeSubsections),
      },
      predicateParameters: {
        version: predicateParams.version,
        maxPredicateLength: bn(predicateParams.maxPredicateLength),
        maxPredicateDataLength: bn(predicateParams.maxPredicateDataLength),
        maxGasPerPredicate: bn(predicateParams.maxGasPerPredicate),
        maxMessageDataLength: bn(predicateParams.maxMessageDataLength),
      },
      scriptParameters: {
        version: scriptParams.version,
        maxScriptLength: bn(scriptParams.maxScriptLength),
        maxScriptDataLength: bn(scriptParams.maxScriptDataLength),
      },
      gasCosts,
    },
  };
};

/** @hidden */
export const serializeChain = (chain: ChainInfo): ChainInfoJson => {
  const { name, baseChainHeight, consensusParameters } = chain;

  const {
    contractParameters,
    feeParameters,
    predicateParameters,
    scriptParameters,
    txParameters,
    gasCosts,
    baseAssetId,
    chainId,
    version,
  } = consensusParameters;

  return {
    name,
    daHeight: baseChainHeight.toString(),
    consensusParameters: {
      version,
      chainId: chainId.toString(),
      baseAssetId,
      feeParams: {
        version: feeParameters.version,
        gasPerByte: feeParameters.gasPerByte.toString(),
        gasPriceFactor: feeParameters.gasPriceFactor.toString(),
      },
      contractParams: {
        version: contractParameters.version,
        contractMaxSize: contractParameters.contractMaxSize.toString(),
        maxStorageSlots: contractParameters.maxStorageSlots.toString(),
      },
      txParams: {
        version: txParameters.version,
        maxInputs: txParameters.maxInputs.toString(),
        maxOutputs: txParameters.maxOutputs.toString(),
        maxWitnesses: txParameters.maxWitnesses.toString(),
        maxGasPerTx: txParameters.maxGasPerTx.toString(),
        maxSize: txParameters.maxSize.toString(),
        maxBytecodeSubsections: txParameters.maxBytecodeSubsections.toString(),
      },
      predicateParams: {
        version: predicateParameters.version,
        maxPredicateLength: predicateParameters.maxPredicateLength.toString(),
        maxPredicateDataLength: predicateParameters.maxPredicateDataLength.toString(),
        maxGasPerPredicate: predicateParameters.maxGasPerPredicate.toString(),
        maxMessageDataLength: predicateParameters.maxMessageDataLength.toString(),
      },
      scriptParams: {
        version: scriptParameters.version,
        maxScriptLength: scriptParameters.maxScriptLength.toString(),
        maxScriptDataLength: scriptParameters.maxScriptDataLength.toString(),
      },
      gasCosts,
    },
  };
};

/** @hidden */
export const deserializeNodeInfo = (nodeInfo: NodeInfoJson): NodeInfo => {
  const { maxDepth, maxTx, nodeVersion, utxoValidation, vmBacktrace, indexation } = nodeInfo;

  return {
    maxDepth: bn(maxDepth),
    maxTx: bn(maxTx),
    nodeVersion,
    utxoValidation,
    vmBacktrace,
    indexation,
  };
};

/** @hidden */
export const serializeNodeInfo = (nodeInfo: NodeInfo): NodeInfoJson => {
  const { maxDepth, maxTx, nodeVersion, utxoValidation, vmBacktrace, indexation } = nodeInfo;

  return {
    maxDepth: maxDepth.toString(),
    maxTx: maxTx.toString(),
    nodeVersion,
    utxoValidation,
    vmBacktrace,
    indexation,
  };
};

/** @hidden */
export const deserializeProviderCache = (cache: ProviderCacheJson): ProviderCache => ({
  consensusParametersTimestamp: cache.consensusParametersTimestamp,
  chain: deserializeChain(cache.chain),
  nodeInfo: deserializeNodeInfo(cache.nodeInfo),
});

/** @hidden */
export const serializeProviderCache = async (provider: Provider): Promise<ProviderCacheJson> => ({
  consensusParametersTimestamp: provider.consensusParametersTimestamp,
  chain: serializeChain(await provider.getChain()),
  nodeInfo: serializeNodeInfo(await provider.getNode()),
});

const hexOrZero = (hex?: string | null) => hex || ZeroBytes32;

/** @hidden */
export const deserializeReceipt = (receipt: TransactionReceiptJson): TransactionResultReceipt => {
  const { receiptType } = receipt;

  switch (receiptType) {
    case GqlReceiptType.Call: {
      const id = hexOrZero(receipt.id || receipt.contractId);
      const callReceipt: ReceiptCall = {
        type: ReceiptType.Call,
        id,
        to: hexOrZero(receipt?.to),
        amount: bn(receipt.amount),
        assetId: hexOrZero(receipt.assetId),
        gas: bn(receipt.gas),
        param1: bn(receipt.param1),
        param2: bn(receipt.param2),
        pc: bn(receipt.pc),
        is: bn(receipt.is),
      };

      return callReceipt;
    }

    case GqlReceiptType.Return: {
      const returnReceipt: ReceiptReturn = {
        type: ReceiptType.Return,
        id: hexOrZero(receipt.id || receipt.contractId),
        val: bn(receipt.val),
        pc: bn(receipt.pc),
        is: bn(receipt.is),
      };

      return returnReceipt;
    }

    case GqlReceiptType.ReturnData: {
      const returnDataReceipt: ReceiptReturnData = {
        type: ReceiptType.ReturnData,
        id: hexOrZero(receipt.id || receipt.contractId),
        ptr: bn(receipt.ptr),
        len: bn(receipt.len),
        digest: hexOrZero(receipt.digest),
        pc: bn(receipt.pc),
        data: hexOrZero(receipt.data),
        is: bn(receipt.is),
      };

      return returnDataReceipt;
    }

    case GqlReceiptType.Panic: {
      const panicReceipt: ReceiptPanic = {
        type: ReceiptType.Panic,
        id: hexOrZero(receipt.id),
        reason: bn(receipt.reason),
        pc: bn(receipt.pc),
        is: bn(receipt.is),
        contractId: hexOrZero(receipt.contractId),
      };

      return panicReceipt;
    }

    case GqlReceiptType.Revert: {
      const revertReceipt: ReceiptRevert = {
        type: ReceiptType.Revert,
        id: hexOrZero(receipt.id || receipt.contractId),
        val: bn(receipt.ra),
        pc: bn(receipt.pc),
        is: bn(receipt.is),
      };
      return revertReceipt;
    }

    case GqlReceiptType.Log: {
      const ra = bn(receipt.ra);
      const rb = bn(receipt.rb);
      const rc = bn(receipt.rc);
      const rd = bn(receipt.rd);

      const logReceipt: ReceiptLog = {
        type: ReceiptType.Log,
        id: hexOrZero(receipt.id || receipt.contractId),
        ra,
        rb,
        rc,
        rd,
        pc: bn(receipt.pc),
        is: bn(receipt.is),
      };

      return logReceipt;
    }

    case GqlReceiptType.LogData: {
      const ra = bn(receipt.ra);
      const rb = bn(receipt.rb);
      const logDataReceipt: ReceiptLogData = {
        type: ReceiptType.LogData,
        id: hexOrZero(receipt.id || receipt.contractId),
        ra,
        rb,
        ptr: bn(receipt.ptr),
        len: bn(receipt.len),
        digest: hexOrZero(receipt.digest),
        pc: bn(receipt.pc),
        data: hexOrZero(receipt.data),
        is: bn(receipt.is),
      };
      return logDataReceipt;
    }

    case GqlReceiptType.Transfer: {
      const id = hexOrZero(receipt.id || receipt.contractId);
      const transferReceipt: ReceiptTransfer = {
        type: ReceiptType.Transfer,
        id,
        to: hexOrZero(receipt.toAddress || receipt?.to),
        amount: bn(receipt.amount),
        assetId: hexOrZero(receipt.assetId),
        pc: bn(receipt.pc),
        is: bn(receipt.is),
      };

      return transferReceipt;
    }

    case GqlReceiptType.TransferOut: {
      const id = hexOrZero(receipt.id || receipt.contractId);
      const transferOutReceipt: ReceiptTransferOut = {
        type: ReceiptType.TransferOut,
        id,
        to: hexOrZero(receipt.toAddress || receipt.to),
        amount: bn(receipt.amount),
        assetId: hexOrZero(receipt.assetId),
        pc: bn(receipt.pc),
        is: bn(receipt.is),
      };
      return transferOutReceipt;
    }

    case GqlReceiptType.ScriptResult: {
      const scriptResultReceipt: ReceiptScriptResult = {
        type: ReceiptType.ScriptResult,
        result: bn(receipt.result),
        gasUsed: bn(receipt.gasUsed),
      };

      return scriptResultReceipt;
    }

    case GqlReceiptType.MessageOut: {
      const sender = hexOrZero(receipt.sender);
      const recipient = hexOrZero(receipt.recipient);
      const nonce = hexOrZero(receipt.nonce);
      const amount = bn(receipt.amount);
      const data = receipt.data ? arrayify(receipt.data) : Uint8Array.from([]);
      const digest = hexOrZero(receipt.digest);
      const len = bn(receipt.len).toNumber();

      const messageId = InputMessageCoder.getMessageId({
        sender,
        recipient,
        nonce,
        amount,
        data: hexlify(data),
      });

      const receiptMessageOut: ReceiptMessageOut = {
        type: ReceiptType.MessageOut,
        sender,
        recipient,
        amount,
        nonce,
        len,
        data,
        digest,
        messageId,
      };

      return receiptMessageOut;
    }

    case GqlReceiptType.Mint: {
      const contractId = hexOrZero(receipt.id || receipt.contractId);
      const subId = hexOrZero(receipt.subId);
      const assetId = getMintedAssetId(contractId, subId);

      const mintReceipt: ReceiptMint = {
        type: ReceiptType.Mint,
        subId,
        contractId,
        assetId,
        val: bn(receipt.val),
        pc: bn(receipt.pc),
        is: bn(receipt.is),
      };

      return mintReceipt;
    }

    case GqlReceiptType.Burn: {
      const contractId = hexOrZero(receipt.id || receipt.contractId);
      const subId = hexOrZero(receipt.subId);
      const assetId = getMintedAssetId(contractId, subId);

      const burnReceipt: ReceiptBurn = {
        type: ReceiptType.Burn,
        subId,
        contractId,
        assetId,
        val: bn(receipt.val),
        pc: bn(receipt.pc),
        is: bn(receipt.is),
      };

      return burnReceipt;
    }

    default:
      throw new FuelError(ErrorCode.INVALID_RECEIPT_TYPE, `Invalid receipt type: ${receiptType}.`);
  }
};
