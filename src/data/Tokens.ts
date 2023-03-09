import { chainIds } from '../config/Constants';
import { ethers } from 'ethers';
import { ChainId, ITokenInfo } from '../utils/types';

export const TOKENS: { [x in ChainId]: ITokenInfo[] } = {
  [chainIds.PLS_TESTNET_V2]: [
    {
      name: 'Pulse',
      symbol: 'tPLS',
      decimals: 18,
      address: ethers.constants.AddressZero,
      isNative: true,
      isShortable: true,
      color: '#9370db',
    },
    {
      name: 'Wrapped Pulse',
      symbol: 'PLS',
      decimals: 18,
      address: '0x8a810ea8B121d08342E9e7696f4a9915cBE494B7',
      isWrapped: true,
      baseSymbol: 'tPLS',
      plstestv2: 'https://scan.v2b.testnet.pulsechain.com/token/0x8a810ea8B121d08342E9e7696f4a9915cBE494B7',
    },
    {
      name: 'PulseX',
      symbol: 'PLSX',
      decimals: 18,
      address: '0x07895912f3AB0E33aB3a4CEFbdf7a3e121eb9942',
      color: '#00ff86',
      isShortable: true,
      imageUrl: 'https://pulsex.com/brand/downloads/logo/PulseX_X.png',
      plstestv2: 'https://scan.v2b.testnet.pulsechain.com/token/0x07895912f3AB0E33aB3a4CEFbdf7a3e121eb9942',
    },
    {
      name: 'HEX',
      symbol: 'HEX',
      decimals: 8,
      address: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
      color: '#df5656',
      isShortable: true,
      imageUrl: 'https://assets.coingecko.com/coins/images/10103/small/HEX-logo.png?1575942673',
      coingecko: 'https://www.coingecko.com/en/coins/hex',
      plstestv2: 'https://scan.v2b.testnet.pulsechain.com/token/0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
    },
    {
      name: 'Hedron',
      symbol: 'HDRN',
      decimals: 9,
      address: '0x3819f64f282bf135d62168C1e513280dAF905e06',
      color: '#708ac6',
      isShortable: true,
      imageUrl: 'https://assets.coingecko.com/coins/images/24208/small/hdrn.png?1647079428',
      coingecko: 'https://www.coingecko.com/en/coins/hedron',
      plstestv2: 'https://scan.v2b.testnet.pulsechain.com/token/0x3819f64f282bf135d62168C1e513280dAF905e06',
    },
    {
      name: 'Maximus',
      symbol: 'MAXI',
      decimals: 8,
      address: '0xE0d1bd019665956945043c96499c6414Cfc300a9',
      color: '#0f00b3',
      isShortable: true,
      imageUrl:
        'https://nomics.com/imgpr/https%3A%2F%2Fs3.us-east-2.amazonaws.com%2Fnomics-api%2Fstatic%2Fimages%2Fcurrencies%2FMAXI5.jpg?width=48',
      plstestv2: 'https://scan.v2b.testnet.pulsechain.com/token/0xE0d1bd019665956945043c96499c6414Cfc300a9',
    },
    {
      name: 'XEN Crypto',
      symbol: 'XEN',
      decimals: 18,
      address: '0xca41f293A32d25c2216bC4B30f5b0Ab61b6ed2CB',
      color: '#404040',
      isShortable: true,
      imageUrl: 'https://assets.coingecko.com/coins/images/27713/small/Xen.jpeg?1665453190',
      coingecko: 'https://www.coingecko.com/en/coins/xen-crypto',
      plstestv2: 'https://scan.v2b.testnet.pulsechain.com/token/0xca41f293A32d25c2216bC4B30f5b0Ab61b6ed2CB',
    },
    {
      name: 'LOAN',
      symbol: 'LOAN',
      decimals: 18,
      address: '0x4F7fCdb511a25099F870EE57c77f7DB2561EC9B6',
      color: '#733bad',
      imageUrl: 'https://llprod-resource.s3.ap-southeast-2.amazonaws.com/loan-token-assets/loan.svg',
      plstestv2: 'https://scan.v2b.testnet.pulsechain.com/token/0x4F7fCdb511a25099F870EE57c77f7DB2561EC9B6',
    },
    {
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      color: '#a1a4a6',
      isStable: true,
      imageUrl: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png?1547042389',
      coingecko: 'https://www.coingecko.com/en/coins/usd-coin',
      plstestv2: 'https://scan.v2b.testnet.pulsechain.com/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
  ],
};

const ADDITIONAL_TOKENS: { [x in ChainId]: ITokenInfo[] } = {
  [chainIds.PLS_TESTNET_V2]: [
    {
      name: 'PHAME',
      symbol: 'PHAME',
      address: '0xf120Dc7395FE6dDe218d72C9F5188FE280F6c458',
      decimals: 18,
    },
    {
      name: 'Phamous LP',
      symbol: 'PHLP',
      address: '0xbB5F9DC3454b02fE5eaF5070C62ad4C055e05F1f',
      decimals: 18,
    },
  ],
};

const TOKENS_MAP: { [x in ChainId]: { [key: string]: ITokenInfo } } = {
  [chainIds.PLS_TESTNET_V2]: {},
};
const TOKENS_BY_SYMBOL_MAP: { [x in ChainId]: { [key: string]: ITokenInfo } } = {
  [chainIds.PLS_TESTNET_V2]: {},
};

const CHAIN_IDS = Object.values(chainIds);

for (let j = 0; j < CHAIN_IDS.length; j++) {
  const chainId = CHAIN_IDS[j];
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

const WRAPPED_TOKENS_MAP: { [x in ChainId]: ITokenInfo[] } = {
  [chainIds.PLS_TESTNET_V2]: [],
};
const NATIVE_TOKENS_MAP: { [x in ChainId]: ITokenInfo[] } = {
  [chainIds.PLS_TESTNET_V2]: [],
};
for (const chainId of CHAIN_IDS) {
  for (const token of TOKENS[chainId]) {
    if (token.isWrapped) {
      WRAPPED_TOKENS_MAP[chainId].push(token);
    } else if (token.isNative) {
      NATIVE_TOKENS_MAP[chainId].push(token);
    }
  }
}

export function getWrappedToken(chainId: ChainId) {
  return WRAPPED_TOKENS_MAP[chainId];
}

export function getNativeToken(chainId: ChainId) {
  return NATIVE_TOKENS_MAP[chainId];
}

export function getTokens(chainId: ChainId) {
  return TOKENS[chainId];
}

export function isValidToken(chainId: ChainId, address: string) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  return address in TOKENS_MAP[chainId];
}

export function getToken(chainId: ChainId, address: string) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  if (!TOKENS_MAP[chainId][address]) {
    throw new Error(`Incorrect address "${address}" for chainId ${chainId}`);
  }
  return TOKENS_MAP[chainId][address];
}

export function getTokenBySymbol(chainId: ChainId, symbol: string) {
  const token = TOKENS_BY_SYMBOL_MAP[chainId][symbol];
  if (!token) {
    throw new Error(`Incorrect symbol "${symbol}" for chainId ${chainId}`);
  }
  return token;
}

export function getWhitelistedTokens(chainId: ChainId) {
  return TOKENS[chainId].filter((token) => token.symbol !== 'USDPH');
}
