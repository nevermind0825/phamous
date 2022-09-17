import { PLS_TESTNET_V2 } from "./Constants";

const CONTRACTS = {
  [PLS_TESTNET_V2]: {
    PHAME: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a",

    Vault: "0xEd1F6B606f3CA09c1DBC22eb32481Bcd932793dF",
    Router: "0x001388024e1b35288EDC38E9bb5724d631400B94",
    PhamousUiDataProvider: "0x3C8695801f3Bde652c30a7AAecE955c3763424CC",
    PhlpManager: "0xB4B69444fCc0b10AB79561dE751edC276CFcBC38",
    NATIVE_TOKEN: "0x8a810ea8B121d08342E9e7696f4a9915cBE494B7",
    PHLP: "0x46555dE76806e4f16928A0aDe050e827C5c7ec64",
    USDPH: "0xE98Fb151266394b007BFEbe4A7A48fB7F6Cdd8C4",

    OrderBook: "0x054Cc3BEF3968D2edd6e9D26b46923e93E9dC0d0",
    // OrderExecutor: "0x7257ac5D0a0aaC04AA7bA2AC0A6Eb742E332c3fB",
    // OrderBookReader: "0xa27C20A7CF0e1C68C0460706bB674f98F362Bc21",

    PositionRouter: "0x0ec76D0CB9B1891bB8b9d8c6834743e948c89840",
    PositionManager: "0xBA503a8C689aaD6eA046DB9f37148d78CDbbe07c",
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
