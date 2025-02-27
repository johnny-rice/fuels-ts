contract;

abi MyContract {
    fn compute_bytecode_root(bytecode_input: Vec<u8>) -> b256;
}

// #region b512-1
pub struct B512 {
    /// The two `B256`s that make up the `B512`.
    bits: [b256; 2],
}
// #endregion b512-1

impl MyContract for Contract {
    // #region vector-bytecode-input-sway
    fn compute_bytecode_root(bytecode_input: Vec<u8>) -> b256 {
        //simply return a fixed b256 value created from a hexadecimal string from testing purposes
        return 0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20;
    }
    // #endregion vector-bytecode-input-sway
}
