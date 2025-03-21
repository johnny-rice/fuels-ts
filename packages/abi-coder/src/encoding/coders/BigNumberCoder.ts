import { ErrorCode, FuelError } from '@fuel-ts/errors';
import { type BNInput, type BN, toBytes, bn } from '@fuel-ts/math';

import { WORD_SIZE } from '../../utils/constants';

import { Coder } from './AbstractCoder';

type BigNumberCoderType = 'u64' | 'u256';

const encodedLengths: { [key in BigNumberCoderType]: number } = {
  u64: WORD_SIZE,
  u256: WORD_SIZE * 4,
};

export class BigNumberCoder extends Coder<BNInput, BN> {
  constructor(baseType: BigNumberCoderType) {
    super('bigNumber', baseType, encodedLengths[baseType]);
  }

  encode(value: BNInput): Uint8Array {
    let bytes;

    // We throw an error if the value is a number and it's more than the max safe integer
    // This is because we can experience some odd behavior with integers more than the max safe integer
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER#description
    if (typeof value === 'number' && value > Number.MAX_SAFE_INTEGER) {
      throw new FuelError(
        ErrorCode.ENCODE_ERROR,
        `Invalid ${this.type} type - number value is too large. Number can only safely handle up to 53 bits.`
      );
    }

    try {
      bytes = toBytes(value, this.encodedLength);
    } catch (error) {
      throw new FuelError(ErrorCode.ENCODE_ERROR, `Invalid ${this.type}.`);
    }

    return bytes;
  }

  decode(data: Uint8Array, offset: number): [BN, number] {
    if (data.length < this.encodedLength) {
      throw new FuelError(ErrorCode.DECODE_ERROR, `Invalid ${this.type} data size.`);
    }

    let bytes = data.slice(offset, offset + this.encodedLength);
    bytes = bytes.slice(0, this.encodedLength);

    if (bytes.length !== this.encodedLength) {
      throw new FuelError(ErrorCode.DECODE_ERROR, `Invalid ${this.type} byte data size.`);
    }

    return [bn(bytes), offset + this.encodedLength];
  }
}
