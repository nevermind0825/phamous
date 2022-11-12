import { PLS_TESTNET_V2 } from "../Constants";
import { ethers } from "ethers";
import { getContract } from "../Addresses";

export const TOKENS = {
  [PLS_TESTNET_V2]: [
    {
      name: "Pulse",
      symbol: "tPLS",
      decimals: 18,
      address: ethers.constants.AddressZero,
      isNative: true,
      isShortable: true,
      imageUrl:
        "https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880",
    },
    {
      name: "Wrapped Pulse",
      symbol: "PLS",
      decimals: 18,
      address: "0x8a810ea8B121d08342E9e7696f4a9915cBE494B7",
      isWrapped: true,
      baseSymbol: "tPLS",
      imageUrl:
        "https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1628852295",
    },
    {
      name: "HEX",
      symbol: "HEX",
      decimals: 8,
      address: "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39",
      isShortable: true,
      imageUrl:
        "https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png?1548822744",
    },
    {
      name: "Hedron",
      symbol: "HDRN",
      decimals: 9,
      address: "0x3819f64f282bf135d62168C1e513280dAF905e06",
      isShortable: true,
      imageUrl:
        "https://assets.coingecko.com/coins/images/24208/small/hdrn.png?1647079428",
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      isStable: true,
      imageUrl:
        "https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png?1547042389",
    },
  ],
};

const ADDITIONAL_TOKENS = {
  [PLS_TESTNET_V2]: [
    {
      name: "PHAME",
      symbol: "PHAME",
      address: getContract(PLS_TESTNET_V2, "PHAME"),
      decimals: 18,
    },
    {
      name: "Phamous LP",
      symbol: "PHLP",
      address: getContract(PLS_TESTNET_V2, "PHLP"),
      decimals: 18,
    },
  ],
};

const CHAIN_IDS = [PLS_TESTNET_V2];

const TOKENS_MAP = {};
const TOKENS_BY_SYMBOL_MAP = {};

for (let j = 0; j < CHAIN_IDS.length; j++) {
  const chainId = CHAIN_IDS[j];
  TOKENS_MAP[chainId] = {};
  TOKENS_BY_SYMBOL_MAP[chainId] = {};
  let tokens = TOKENS[chainId];
  if (ADDITIONAL_TOKENS[chainId]) {
    tokens = tokens.concat(ADDITIONAL_TOKENS[chainId]);
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    TOKENS_MAP[chainId][token.address] = token;
    TOKENS_BY_SYMBOL_MAP[chainId][token.symbol] = token;
  }
}

const WRAPPED_TOKENS_MAP = {};
const NATIVE_TOKENS_MAP = {};
for (const chainId of CHAIN_IDS) {
  for (const token of TOKENS[chainId]) {
    if (token.isWrapped) {
      WRAPPED_TOKENS_MAP[chainId] = token;
    } else if (token.isNative) {
      NATIVE_TOKENS_MAP[chainId] = token;
    }
  }
}

export function getWrappedToken(chainId) {
  return WRAPPED_TOKENS_MAP[chainId];
}

export function getNativeToken(chainId) {
  return NATIVE_TOKENS_MAP[chainId];
}

export function getTokens(chainId) {
  return TOKENS[chainId];
}

export function isValidToken(chainId, address) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  return address in TOKENS_MAP[chainId];
}

export function getToken(chainId, address) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  if (!TOKENS_MAP[chainId][address]) {
    throw new Error(`Incorrect address "${address}" for chainId ${chainId}`);
  }
  return TOKENS_MAP[chainId][address];
}

export function getTokenBySymbol(chainId, symbol) {
  const token = TOKENS_BY_SYMBOL_MAP[chainId][symbol];
  if (!token) {
    throw new Error(`Incorrect symbol "${symbol}" for chainId ${chainId}`);
  }
  return token;
}

export function getWhitelistedTokens(chainId) {
  return TOKENS[chainId].filter((token) => token.symbol !== "USDPH");
}
