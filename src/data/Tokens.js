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
      name: "PulseX",
      symbol: "PLSX",
      decimals: 18,
      address: "0x07895912f3AB0E33aB3a4CEFbdf7a3e121eb9942",
      isShortable: true,
      imageUrl: "https://pulsex.com/brand/downloads/logo/PulseX_X.png",
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
      name: "Maximus",
      symbol: "MAXI",
      decimals: 8,
      address: "0xE0d1bd019665956945043c96499c6414Cfc300a9",
      isShortable: true,
      imageUrl:
        "https://nomics.com/imgpr/https%3A%2F%2Fs3.us-east-2.amazonaws.com%2Fnomics-api%2Fstatic%2Fimages%2Fcurrencies%2FMAXI5.jpg?width=48",
    },
    {
      name: "XEN Crypto",
      symbol: "XEN",
      decimals: 18,
      address: "0xca41f293A32d25c2216bC4B30f5b0Ab61b6ed2CB",
      isShortable: true,
      imageUrl:
        "https://assets.coingecko.com/coins/images/27713/small/Xen.jpeg?1665453190",
    },
    {
      name: "LOAN",
      symbol: "LOAN",
      decimals: 18,
      address: "0x4F7fCdb511a25099F870EE57c77f7DB2561EC9B6",
      imageUrl:
        "https://llprod-resource.s3.ap-southeast-2.amazonaws.com/loan-token-assets/loan.svg",
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
