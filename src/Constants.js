import { ethers } from "ethers";

const { parseEther } = ethers.utils;

export const PLS_TESTNET_V2 = 941;

const constants = {
  [PLS_TESTNET_V2]: {
    nativeTokenSymbol: "tPLS",
    wrappedTokenSymbol: "PLS",
    defaultCollateralSymbol: "USDC",
    defaultFlagOrdersEnabled: false,
    positionReaderPropsLength: 9,
    v2: true,

    SWAP_ORDER_EXECUTION_GAS_FEE: parseEther("50"),
    INCREASE_ORDER_EXECUTION_GAS_FEE: parseEther("50"),
    // contract requires that execution fee be strictly greater than instead of gte
    DECREASE_ORDER_EXECUTION_GAS_FEE: parseEther("50.1"),
  },
};

export const getConstant = (chainId, key) => {
  if (!constants[chainId]) {
    throw new Error(`Unsupported chainId ${chainId}`);
  }
  if (!(key in constants[chainId])) {
    throw new Error(`Key ${key} does not exist for chainId ${chainId}`);
  }
  return constants[chainId][key];
};
