import { PLS_TESTNET_V2 } from "./Constants";

const CONTRACTS = {
  [PLS_TESTNET_V2]: {
    NATIVE_TOKEN: "0x8a810ea8B121d08342E9e7696f4a9915cBE494B7",

    PHAME: "0xf120Dc7395FE6dDe218d72C9F5188FE280F6c458",
    PHLP: "0xbB5F9DC3454b02fE5eaF5070C62ad4C055e05F1f",
    USDPH: "0x536637512eBe495638C751F6B59D14774116aa55",

    AddressesProvider: "0x4bF99D5C9E83AD3c9bd8FeD8a90842D9800838c8",
    PhlpManager: "0x3D0c5290393B93a095915D6cBb71e238442369D5",
    Vault: "0xdd44c4953741B661485A120eD792f570c5F4Ee1B",
    Router: "0x25eC02Bb1130d00529690E1E64D66Fa298aC3372",
    PositionRouter: "0x3601c2E8833066DBE785044866e05183b1Ffa91c",
    PositionManager: "0x69f0AC5477Bc58f9D779BC241Db3c08b5180E379",

    OrderBook: "0xe9c9902c3C75F84DC93Bb3479aA6F6bd49792847",
    // OrderExecutor: "0x7257ac5D0a0aaC04AA7bA2AC0A6Eb742E332c3fB",
    // OrderBookReader: "0xa27C20A7CF0e1C68C0460706bB674f98F362Bc21",

    PhamousFeeDistribution: "0x0914C4Be2b2cBdaBA944E667d3c5244f4dd6b8bd",

    PhamousUiDataProvider: "0x005F821405fe84f8053417f9Af5a8E51e7f35CB1",
    PhamousUiStakeDataProvider: "0x9AB4531c0460dC8Ca3F8bef2342c5193c863BA3F",
  },
};

export function getContract(chainId, name) {
  if (!CONTRACTS[chainId]) {
    throw new Error(`Unknown chainId ${chainId}`);
  }
  if (!CONTRACTS[chainId][name]) {
    throw new Error(`Unknown contract "${name}" for chainId ${chainId}`);
  }
  return CONTRACTS[chainId][name];
}
