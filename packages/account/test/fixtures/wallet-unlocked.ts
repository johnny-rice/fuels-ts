import { ScriptTransactionRequest } from '../../src/providers';

export const SCRIPT_TX_REQUEST = new ScriptTransactionRequest({
  gasLimit: 5_000,
  script: '0x',
  scriptData: Uint8Array.from([]),
  tip: 5,
  maxFee: 20_000,
  maturity: 0,
  witnessLimit: 5000,
  inputs: [
    {
      type: 0,
      id: '0x000000000000000000000000000000000000000000000000000000000000000000',
      assetId: '0x0000000000000000000000000000000000000000000000000000000000000000',
      amount: '0x989680',
      owner: '0xf1e92c42b90934aa6372e30bc568a326f6e66a1a0288595e6e3fbd392a4f3e6e',
      txPointer: '0x00000000000000000000000000000000',
      witnessIndex: 0,
      predicate: '0x',
      predicateData: '0x',
      predicateGasUsed: '0x20',
    },
  ],
  outputs: [
    {
      type: 0,
      to: '0xc7862855b418ba8f58878db434b21053a61a2025209889cc115989e8040ff077',
      assetId: '0x0000000000000000000000000000000000000000000000000000000000000000',
      amount: 1,
    },
    {
      type: 2,
      to: '0xc7862855b418ba8f58878db434b21053a61a2025209889cc115989e8040ff077',
      assetId: '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
  ],
  witnesses: ['0x'],
});

export const PRIVATE_KEY = '0x5f70feeff1f229e4a95e1056e8b4d80d0b24b565674860cc213bdb07127ce1b1';
export const PUBLIC_KEY =
  '0x2f34bc0df4db0ec391792cedb05768832b49b1aa3a2dd8c30054d1af00f67d00b74b7acbbf3087c8e0b1a4c343db50aa471d21f278ff5ce09f07795d541fb47e';
export const ADDRESS = '0xf1e92c42b90934aa6372e30bc568a326f6e66a1a0288595e6e3fbd392a4f3e6e';
export const HASHED_TX = '0x48ee795d94ea9562a3dbb9979cb44bb3dfd341eb755c378b14a3cd6886189980';
export const SIGNED_TX =
  '0x77d03430d2d68853da9b1ebeb1be84a08ea3ea54a55a374b40063181ff8a3b502ca00b15becc1621f4f250e80a5cfb596647c2ef2d50296ff2b8e4f1120b9c9f';
