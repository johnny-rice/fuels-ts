import { BigNumberCoder } from '@fuel-ts/abi-coder';
import { sha256 } from '@fuel-ts/hasher';
import { concat } from '@fuel-ts/utils';
import * as asm from '@fuels/vm-asm';

const BLOB_ID_SIZE = 32;
const REG_ADDRESS_OF_DATA_AFTER_CODE = 0x10;
const REG_START_OF_LOADED_CODE = 0x11;
const REG_GENERAL_USE = 0x12;
const WORD_SIZE = 8; // size in bytes

export const DATA_OFFSET_INDEX = 8;
export const CONFIGURABLE_OFFSET_INDEX = 16;

/**
 * Get the offset of the data section in the bytecode
 *
 * @param bytecode - The bytecode to get the offset from
 * @returns The offset of the data section
 */
export function getBytecodeDataOffset(bytecode: Uint8Array): number {
  const [offset] = new BigNumberCoder('u64').decode(bytecode, DATA_OFFSET_INDEX);
  return offset.toNumber();
}

/**
 * Get the offset of the configurable section in the bytecode
 *
 * @param bytecode - The bytecode to get the offset from
 * @returns The offset of the configurable section
 */
export function getBytecodeConfigurableOffset(bytecode: Uint8Array): number {
  const [offset] = new BigNumberCoder('u64').decode(bytecode, CONFIGURABLE_OFFSET_INDEX);
  return offset.toNumber();
}

/**
 * Takes bytecode and generates it's associated bytecode ID.
 *
 * The bytecode ID is a hash of the bytecode when sliced at the configurable offset. This
 * superseded legacy blob IDs when uploading blobs for scripts and predicates so that
 * the bytecode ID is equal to the legacy blob ID. Therefore blobs can be used for ABI verification.
 *
 * @param bytecode - The bytecode to get the id from
 * @returns The id of the bytecode
 */
export function getBytecodeId(bytecode: Uint8Array): string {
  const configurableOffset = getBytecodeConfigurableOffset(bytecode);
  const byteCodeWithoutConfigurableSection = bytecode.slice(0, configurableOffset);

  return sha256(byteCodeWithoutConfigurableSection);
}

/**
 * Takes bytecode and generates it's associated legacy blob ID.
 *
 * The legacy blob ID is a hash of the bytecode when sliced at the data section offset.
 *
 * @param bytecode - The bytecode to get the id from
 * @returns The id of the bytecode
 */
export function getLegacyBlobId(bytecode: Uint8Array): string {
  const dataOffset = getBytecodeDataOffset(bytecode);
  const byteCodeWithoutDataSection = bytecode.slice(0, dataOffset);

  return sha256(byteCodeWithoutDataSection);
}

export function getPredicateScriptLoaderInstructions(
  originalBinary: Uint8Array,
  blobId: Uint8Array
) {
  // The final code is going to have this structure:
  // 1. loader instructions
  // 2. blob id
  // 3. length_of_data_section
  // 4. the data_section (updated with configurables as needed)

  const { RegId, Instruction } = asm;

  const REG_PC = RegId.pc().to_u8();
  const REG_SP = RegId.sp().to_u8();
  const REG_IS = RegId.is().to_u8();

  const getInstructions = (numOfInstructions: number) => [
    // 1. Load the blob content into memory
    // Find the start of the hardcoded blob ID, which is located after the loader code ends.
    asm.move_(REG_ADDRESS_OF_DATA_AFTER_CODE, REG_PC),
    // hold the address of the blob ID.
    asm.addi(
      REG_ADDRESS_OF_DATA_AFTER_CODE,
      REG_ADDRESS_OF_DATA_AFTER_CODE,
      numOfInstructions * Instruction.size()
    ),
    // The code is going to be loaded from the current value of SP onwards, save
    // the location into REG_START_OF_LOADED_CODE so we can jump into it at the end.
    asm.move_(REG_START_OF_LOADED_CODE, REG_SP),
    // REG_GENERAL_USE to hold the size of the blob.
    asm.bsiz(REG_GENERAL_USE, REG_ADDRESS_OF_DATA_AFTER_CODE),
    // Push the blob contents onto the stack.
    asm.ldc(REG_ADDRESS_OF_DATA_AFTER_CODE, 0, REG_GENERAL_USE, 1),
    // Move on to the data section length
    asm.addi(REG_ADDRESS_OF_DATA_AFTER_CODE, REG_ADDRESS_OF_DATA_AFTER_CODE, BLOB_ID_SIZE),
    // load the size of the data section into REG_GENERAL_USE
    asm.lw(REG_GENERAL_USE, REG_ADDRESS_OF_DATA_AFTER_CODE, 0),
    // after we have read the length of the data section, we move the pointer to the actual
    // data by skipping WORD_SIZE bytes.
    asm.addi(REG_ADDRESS_OF_DATA_AFTER_CODE, REG_ADDRESS_OF_DATA_AFTER_CODE, WORD_SIZE),
    // load the data section of the executable
    asm.ldc(REG_ADDRESS_OF_DATA_AFTER_CODE, 0, REG_GENERAL_USE, 2),
    // Jump into the memory where the contract is loaded.
    // What follows is called _jmp_mem by the sway compiler.
    // Subtract the address contained in IS because jmp will add it back.
    asm.sub(REG_START_OF_LOADED_CODE, REG_START_OF_LOADED_CODE, REG_IS),
    // jmp will multiply by 4, so we need to divide to cancel that out.
    asm.divi(REG_START_OF_LOADED_CODE, REG_START_OF_LOADED_CODE, 4),
    // Jump to the start of the contract we loaded.
    asm.jmp(REG_START_OF_LOADED_CODE),
  ];

  const getInstructionsNoDataSection = (numOfInstructions: number) => [
    // 1. Load the blob content into memory
    // Find the start of the hardcoded blob ID, which is located after the loader code ends.
    // 1. Load the blob content into memory
    // Find the start of the hardcoded blob ID, which is located after the loader code ends.
    asm.move_(REG_ADDRESS_OF_DATA_AFTER_CODE, REG_PC),
    // hold the address of the blob ID.
    asm.addi(
      REG_ADDRESS_OF_DATA_AFTER_CODE,
      REG_ADDRESS_OF_DATA_AFTER_CODE,
      numOfInstructions * Instruction.size()
    ),
    // The code is going to be loaded from the current value of SP onwards, save
    // the location into REG_START_OF_LOADED_CODE so we can jump into it at the end.
    asm.move_(REG_START_OF_LOADED_CODE, REG_SP),
    // REG_GENERAL_USE to hold the size of the blob.
    asm.bsiz(REG_GENERAL_USE, REG_ADDRESS_OF_DATA_AFTER_CODE),
    // Push the blob contents onto the stack.
    asm.ldc(REG_ADDRESS_OF_DATA_AFTER_CODE, 0, REG_GENERAL_USE, 1),
    // Jump into the memory where the contract is loaded.
    // What follows is called _jmp_mem by the sway compiler.
    // Subtract the address contained in IS because jmp will add it back.
    asm.sub(REG_START_OF_LOADED_CODE, REG_START_OF_LOADED_CODE, REG_IS),
    // jmp will multiply by 4, so we need to divide to cancel that out.
    asm.divi(REG_START_OF_LOADED_CODE, REG_START_OF_LOADED_CODE, 4),
    // Jump to the start of the contract we loaded.
    asm.jmp(REG_START_OF_LOADED_CODE),
  ];

  const offset = getBytecodeConfigurableOffset(originalBinary);

  // if the binary length is smaller than the offset
  if (originalBinary.length < offset) {
    throw new Error(
      `Data section offset is out of bounds, offset: ${offset}, binary length: ${originalBinary.length}`
    );
  }

  // Extract the configurable section from the binary (slice from the configurable offset onwards)
  const configurableSection = originalBinary.slice(offset);

  // Check if the configurable section is non-empty
  if (configurableSection.length > 0) {
    // Get the number of instructions (assuming it won't exceed u16::MAX)
    const numOfInstructions = getInstructions(0).length;
    if (numOfInstructions > 65535) {
      throw new Error('Too many instructions, exceeding u16::MAX.');
    }

    // Convert instructions to bytes
    const instructionBytes = new Uint8Array(
      getInstructions(numOfInstructions).flatMap((instruction) =>
        Array.from(instruction.to_bytes())
      )
    );

    // Convert blobId to bytes
    const blobBytes = new Uint8Array(blobId);

    // Convert data section length to big-endian 8-byte array
    const dataSectionLenBytes = new Uint8Array(8);
    const dataView = new DataView(dataSectionLenBytes.buffer);
    dataView.setBigUint64(0, BigInt(configurableSection.length), false); // false for big-endian

    // Combine the instruction bytes, blob bytes, data section length, and the data section
    const loaderBytecode = new Uint8Array([
      ...instructionBytes,
      ...blobBytes,
      ...dataSectionLenBytes,
    ]);

    return {
      loaderBytecode: concat([loaderBytecode, configurableSection]),
      blobOffset: loaderBytecode.length,
    };
  }
  // Handle case where there is no configurable section
  const numOfInstructions = getInstructionsNoDataSection(0).length;
  if (numOfInstructions > 65535) {
    throw new Error('Too many instructions, exceeding u16::MAX.');
  }

  // Convert instructions to bytes
  const instructionBytes = new Uint8Array(
    getInstructionsNoDataSection(numOfInstructions).flatMap((instruction) =>
      Array.from(instruction.to_bytes())
    )
  );

  // Convert blobId to bytes
  const blobBytes = new Uint8Array(blobId);

  // Combine the instruction bytes and blob bytes
  const loaderBytecode = new Uint8Array([...instructionBytes, ...blobBytes]);

  return { loaderBytecode };
}
