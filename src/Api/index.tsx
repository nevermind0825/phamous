import { ethers } from 'ethers';
import { gql } from '@apollo/client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

import OrderBook from '../abis/OrderBook.json';
import PositionManager from '../abis/PositionManager.json';
import Vault from '../abis/Vault.json';
import Router from '../abis/Router.json';
import PhamousUiDataProvider from '../abis/PhamousUiDataProvider.json';

import { getContract } from '../config/Addresses';
import { PLS_TESTNET_V2, getConstant } from '../config/Constants';
import {
  UI_VERSION,
  // DEFAULT_GAS_LIMIT,
  bigNumberify,
  getExplorerUrl,
  // getServerBaseUrl,
  // getServerUrl,
  setGasPrice,
  getGasLimit,
  replaceNativeTokenAddress,
  getProvider,
  getOrderKey,
  fetcher,
  expandDecimals,
  getInfoTokens,
  helperToast,
  SWAP,
  INCREASE,
} from '../utils/Helpers';
import { getTokens, getWhitelistedTokens } from '../data/Tokens';

import { phamousGraphClient } from './common';
import { groupBy } from 'lodash';
import { ChainId, IPosition } from '../utils/types';
export * from './prices';

const { AddressZero } = ethers.constants;

function getGraphClient(chainId: ChainId) {
  if (chainId === PLS_TESTNET_V2) {
    return phamousGraphClient;
  }
  throw new Error(`Unsupported chain ${chainId}`);
}

export function useAllOrdersStats(chainId: ChainId) {
  const query = gql(`{
    orderStat(id: "total") {
      openSwap
      openIncrease
      openDecrease
      executedSwap
      executedIncrease
      executedDecrease
      cancelledSwap
      cancelledIncrease
      cancelledDecrease
    }
  }`);

  const [res, setRes] = useState<any>();

  useEffect(() => {
    getGraphClient(chainId).query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query, chainId]);

  return res ? res.data.orderStat : null;
}

export function useInfoTokens(
  library: any,
  chainId: ChainId,
  active: boolean,
  tokenBalances: ethers.BigNumber[] | undefined,
  fundingRateInfo?: any,
  vaultPropsLength?: number,
) {
  const tokens = getTokens(chainId);
  const uiDataProviderAddress = getContract(chainId, 'PhamousUiDataProvider');
  const addressesProviderAddress = getContract(chainId, 'AddressesProvider');
  const nativeTokenAddress = getContract(chainId, 'NATIVE_TOKEN');

  const whitelistedTokens = getWhitelistedTokens(chainId);
  const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);

  const { data: vaultTokenInfo } = useSWR(
    [`useInfoTokens:${active}`, chainId, uiDataProviderAddress, 'getVaultTokenInfoV4'],
    {
      fetcher: fetcher(library, PhamousUiDataProvider, [
        addressesProviderAddress,
        nativeTokenAddress,
        expandDecimals(1, 18),
        whitelistedTokenAddresses,
      ]),
    },
  );

  // const indexPricesUrl = getServerUrl(chainId, "/prices");
  // const { data: indexPrices } = useSWR([indexPricesUrl], {
  //   fetcher: (...args) => fetch(...args).then((res) => res.json()),
  //   refreshInterval: 500,
  //   refreshWhenHidden: true,
  // });
  const indexPrices = undefined;

  return {
    infoTokens: getInfoTokens(
      tokens,
      tokenBalances,
      whitelistedTokens,
      vaultTokenInfo,
      fundingRateInfo,
      vaultPropsLength,
      indexPrices,
      nativeTokenAddress,
    ),
  };
}

export function useUserStat(chainId: ChainId) {
  const query = gql(`{
    userStat(id: "total") {
      id
      uniqueCount
    }
  }`);

  const [res, setRes] = useState<any>();

  useEffect(() => {
    getGraphClient(chainId).query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query, chainId]);

  return res ? res.data.userStat : null;
}

export function useLiquidationsData(chainId: ChainId, account: string) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (account) {
      const query = gql(`{
         liquidatedPositions(
           where: {account: "${account.toLowerCase()}"}
           first: 100
           orderBy: timestamp
           orderDirection: desc
         ) {
           key
           timestamp
           borrowFee
           loss
           collateral
           size
           markPrice
           type
         }
      }`);
      const graphClient = getGraphClient(chainId);
      graphClient
        .query({ query })
        .then((res) => {
          const _data = res.data.liquidatedPositions.map((item: any) => {
            return {
              ...item,
              size: bigNumberify(item.size),
              collateral: bigNumberify(item.collateral),
              markPrice: bigNumberify(item.markPrice),
            };
          });
          setData(_data);
        })
        .catch(console.warn);
    }
  }, [setData, chainId, account]);

  return data;
}

export function useAllPositions(chainId: ChainId, library: any) {
  const count = 1000;
  const query = gql(`{
    aggregatedTradeOpens(
      first: ${count}
    ) {
      account
      initialPosition{
        indexToken
        collateralToken
        isLong
        sizeDelta
      }
      increaseList {
        sizeDelta
      }
      decreaseList {
        sizeDelta
      }
    }
  }`);

  const [res, setRes] = useState<any>();

  useEffect(() => {
    const graphClient = getGraphClient(chainId);
    graphClient.query({ query }).then(setRes).catch(console.warn);
  }, [chainId, setRes, query]);

  const key = res ? `allPositions${count}__` : '';
  const { data: positions = [] } = useSWR(key, async () => {
    const provider = getProvider(library, chainId);
    const vaultAddress = getContract(chainId, 'Vault');
    const contract = new ethers.Contract(vaultAddress, Vault.abi, provider);
    const ret = await Promise.all(
      res.data.aggregatedTradeOpens.map(async (dataItem: any) => {
        try {
          const { indexToken, collateralToken, isLong } = dataItem.initialPosition;
          const positionData = await contract.getPosition(dataItem.account, collateralToken, indexToken, isLong);
          const position: IPosition = {
            size: bigNumberify(positionData[0]),
            collateral: bigNumberify(positionData[1]),
            entryFundingRate: bigNumberify(positionData[3]),
            account: dataItem.account,
            fundingFee: ethers.BigNumber.from(0),
            marginFee: ethers.BigNumber.from(0),
            fee: ethers.BigNumber.from(0),
            danger: false,
          };
          position.fundingFee = await contract.getFundingFee(collateralToken, position.size, position.entryFundingRate);
          position.marginFee = position.size.div(1000);
          position.fee = position.fundingFee.add(position.marginFee);

          const THRESHOLD = 5000;
          const collateralDiffPercent = position.fee.mul(10000).div(position.collateral);
          position.danger = collateralDiffPercent.gt(THRESHOLD);

          return position;
        } catch (ex) {
          console.error(ex);
        }
      }),
    );

    return ret.filter(Boolean);
  });

  return positions;
}

export function useAllOrders(chainId: ChainId, library: any) {
  const query = gql(`{
    orders(
      first: 1000,
      orderBy: createdTimestamp,
      orderDirection: desc,
      where: {status: "open"}
    ) {
      type
      account
      index
      status
      createdTimestamp
    }
  }`);

  const [res, setRes] = useState<any>();

  useEffect(() => {
    getGraphClient(chainId).query({ query }).then(setRes);
  }, [setRes, query, chainId]);

  const key = res ? res.data.orders.map((order: any) => `${order.type}-${order.account}-${order.index}`) : null;
  const { data: orders = [] } = useSWR(key, () => {
    const provider = getProvider(library, chainId);
    const orderBookAddress = getContract(chainId, 'OrderBook');
    const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, provider);
    return Promise.all(
      res.data.orders.map(async (order: any) => {
        try {
          const type = order.type.charAt(0).toUpperCase() + order.type.substring(1);
          const method = `get${type}Order`;
          const orderFromChain = await contract[method](order.account, order.index);
          const ret: any = {};
          for (const [key, val] of Object.entries(orderFromChain)) {
            ret[key] = val;
          }
          if (order.type === 'swap') {
            ret.path = [ret.path0, ret.path1, ret.path2].filter((address) => address !== AddressZero);
          }
          ret.type = type;
          ret.index = order.index;
          ret.account = order.account;
          ret.createdTimestamp = order.createdTimestamp;
          return ret;
        } catch (ex) {
          console.error(ex);
        }
      }),
    );
  });

  return orders.filter(Boolean);
}

export function usePositionsForOrders(chainId: ChainId, library: any, orders: any) {
  const key = orders ? orders.map((order: any) => getOrderKey(order) + '____') : null;
  const { data: positions = {} } = useSWR(key, async () => {
    const provider = getProvider(library, chainId);
    const vaultAddress = getContract(chainId, 'Vault');
    const contract = new ethers.Contract(vaultAddress, Vault.abi, provider);
    const data = await Promise.all(
      orders.map(async (order: any) => {
        try {
          const position = await contract.getPosition(
            order.account,
            order.collateralToken,
            order.indexToken,
            order.isLong,
          );
          if (position[0].eq(0)) {
            return [null, order];
          }
          return [position, order];
        } catch (ex) {
          console.error(ex);
        }
      }),
    );
    return data.reduce((memo, [position, order]) => {
      memo[getOrderKey(order)] = position;
      return memo;
    }, {});
  });

  return positions;
}

function invariant(condition: any, errorMsg: string) {
  if (!condition) {
    throw new Error(errorMsg);
  }
}

export function useTrades(chainId: ChainId, account: string, forSingleAccount: string) {
  // const url =
  //   account && account.length > 0
  //     ? `${getServerBaseUrl(chainId)}/actions?account=${account}`
  //     : !forSingleAccount && `${getServerBaseUrl(chainId)}/actions`;
  const url = '';

  const { data: trades, mutate: updateTrades } = useSWR(url && url, {
    dedupingInterval: 10000,
    fetcher: (url) => fetch(url).then((res) => res.json()),
  });

  if (trades) {
    trades.sort((item0: any, item1: any) => {
      const data0 = item0.data;
      const data1 = item1.data;
      const time0 = parseInt(data0.timestamp);
      const time1 = parseInt(data1.timestamp);
      if (time1 > time0) {
        return 1;
      }
      if (time1 < time0) {
        return -1;
      }

      const block0 = parseInt(data0.blockNumber);
      const block1 = parseInt(data1.blockNumber);

      if (isNaN(block0) && isNaN(block1)) {
        return 0;
      }

      if (isNaN(block0)) {
        return 1;
      }

      if (isNaN(block1)) {
        return -1;
      }

      if (block1 > block0) {
        return 1;
      }

      if (block1 < block0) {
        return -1;
      }

      return 0;
    });
  }

  return { trades, updateTrades };
}

export function useHasOutdatedUi() {
  // const url = getServerUrl(PLS_TESTNET_V2, "/ui_version");
  const url = '';
  const { data, mutate } = useSWR([url], {
    fetcher: (url) => fetch(url).then((res) => res.text()),
  });

  let hasOutdatedUi = false;

  if (data && parseFloat(data) > parseFloat(UI_VERSION)) {
    hasOutdatedUi = true;
  }

  return { data: hasOutdatedUi, mutate };
}

export async function callContract(chainId: ChainId, contract: any, method: any, params: any, opts: any) {
  try {
    if (!Array.isArray(params) && typeof params === 'object' && opts === undefined) {
      opts = params;
      params = [];
    }
    if (!opts) {
      opts = {};
    }

    const txnOpts: any = {};

    if (opts.value) {
      txnOpts.value = opts.value;
    }

    txnOpts.gasLimit = opts.gasLimit ? opts.gasLimit : await getGasLimit(contract, method, params, opts.value);

    await setGasPrice(txnOpts, contract.provider, chainId);

    const res = await contract[method](...params, txnOpts);
    const txUrl = getExplorerUrl(chainId) + 'tx/' + res.hash;
    const sentMsg = opts.sentMsg || 'Transaction sent.';
    helperToast.success(
      <div>
        {sentMsg}{' '}
        <a href={txUrl} target="_blank" rel="noopener noreferrer">
          View status.
        </a>
        <br />
      </div>
    );
    if (opts.setPendingTxns) {
      const pendingTxn = {
        hash: res.hash,
        message: opts.successMsg || 'Transaction completed!',
      };
      opts.setPendingTxns((pendingTxns: any) => [...pendingTxns, pendingTxn]);
    }
    return res;
  } catch (e) {
    let failMsg;
    const [message, type] = extractError(e);
    switch (type) {
      case NOT_ENOUGH_FUNDS:
        failMsg = (
          <div>
            There is not enough ETH in your account on Arbitrum to send this transaction.
            <br />
            <br />
            <a href={'https://arbitrum.io/bridge-tutorial/'} target="_blank" rel="noopener noreferrer">
              Bridge ETH to Arbitrum
            </a>
          </div>
        );
        break;
      case USER_DENIED:
        failMsg = 'Transaction was cancelled.';
        break;
      case SLIPPAGE:
        failMsg =
          'The mark price has changed, consider increasing your Allowed Slippage by clicking on the "..." icon next to your address.';
        break;
      default:
        failMsg = (
          <div>
            {opts.failMsg || 'Transaction failed'}
            <br />
            {message && <ToastifyDebug>{message}</ToastifyDebug>}
          </div>
        );
    }
    helperToast.error(failMsg);
    throw e;
  }
}

export async function approvePlugin(
  chainId: ChainId,
  pluginAddress: string,
  { library, pendingTxns, setPendingTxns, sentMsg, failMsg }: { library: any; pendingTxns: any; setPendingTxns: any; sentMsg: any; failMsg: any; },
) {
  const routerAddress = getContract(chainId , 'Router');
  const contract = new ethers.Contract(routerAddress, Router.abi, library.getSigner());
  return callContract(chainId, contract, 'approvePlugin', [pluginAddress], {
    sentMsg,
    failMsg,
    pendingTxns,
    setPendingTxns,
  });
}

export async function createSwapOrder(
  chainId: ChainId,
  library: any,
  path: any,
  amountIn: ethers.BigNumber | undefined,
  minOut: ethers.BigNumber | undefined,
  triggerRatio: ethers.BigNumber | undefined,
  nativeTokenAddress: string,
  opts: any = {},
) {
  const executionFee = getConstant(chainId, 'SWAP_ORDER_EXECUTION_GAS_FEE');
  const triggerAboveThreshold = false;
  let shouldWrap = false;
  let shouldUnwrap = false;
  opts.value = executionFee;

  if (path[0] === AddressZero) {
    shouldWrap = true;
    opts.value = opts.value.add(amountIn);
  }
  if (path[path.length - 1] === AddressZero) {
    shouldUnwrap = true;
  }
  path = replaceNativeTokenAddress(path, nativeTokenAddress);

  const params = [path, amountIn, minOut, triggerRatio, triggerAboveThreshold, executionFee, shouldWrap, shouldUnwrap];

  const orderBookAddress = getContract(chainId, 'OrderBook');
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, 'createSwapOrder', params, opts);
}

export async function createIncreaseOrder(
  chainId: ChainId,
  library: any,
  nativeTokenAddress: string,
  path: any,
  amountIn: ethers.BigNumber | undefined,
  indexTokenAddress: string,
  minOut: number,
  sizeDelta: ethers.BigNumber | undefined,
  collateralTokenAddress: string,
  isLong: boolean,
  triggerPrice: number | ethers.BigNumber | undefined,
  opts: any = {},
) {
  invariant(!isLong || indexTokenAddress === collateralTokenAddress, 'invalid token addresses');
  invariant(indexTokenAddress !== AddressZero, 'indexToken is 0');
  invariant(collateralTokenAddress !== AddressZero, 'collateralToken is 0');

  const fromETH = path[0] === AddressZero;

  path = replaceNativeTokenAddress(path, nativeTokenAddress);
  const shouldWrap = fromETH;
  const triggerAboveThreshold = !isLong;
  const executionFee = getConstant<ethers.BigNumber>(chainId, 'INCREASE_ORDER_EXECUTION_GAS_FEE');

  const params = [
    path,
    amountIn,
    indexTokenAddress,
    minOut,
    sizeDelta,
    collateralTokenAddress,
    isLong,
    triggerPrice,
    triggerAboveThreshold,
    executionFee,
    shouldWrap,
  ];

  if (!opts.value) {
    opts.value = fromETH ? amountIn?.add(executionFee) : executionFee;
  }

  const orderBookAddress = getContract(chainId, 'OrderBook');
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, 'createIncreaseOrder', params, opts);
}

export async function createDecreaseOrder(
  chainId: ChainId,
  library: any,
  indexTokenAddress: string,
  sizeDelta: any,
  collateralTokenAddress: string,
  collateralDelta: ethers.BigNumber,
  isLong: any,
  triggerPrice: number | ethers.BigNumber | undefined,
  triggerAboveThreshold: any,
  opts: any = {},
) {
  invariant(!isLong || indexTokenAddress === collateralTokenAddress, 'invalid token addresses');
  invariant(indexTokenAddress !== AddressZero, 'indexToken is 0');
  invariant(collateralTokenAddress !== AddressZero, 'collateralToken is 0');

  const executionFee = getConstant<ethers.BigNumber>(chainId, 'DECREASE_ORDER_EXECUTION_GAS_FEE');

  const params = [
    indexTokenAddress,
    sizeDelta,
    collateralTokenAddress,
    collateralDelta,
    isLong,
    triggerPrice,
    triggerAboveThreshold,
  ];
  opts.value = executionFee;
  const orderBookAddress = getContract(chainId, 'OrderBook');
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, 'createDecreaseOrder', params, opts);
}

export async function cancelSwapOrder(chainId: ChainId, library: any, index: any, opts: any) {
  const params = [index];
  const method = 'cancelSwapOrder';
  const orderBookAddress = getContract(chainId, 'OrderBook');
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function cancelDecreaseOrder(chainId: ChainId, library: any, index: any, opts: { successMsg: string; failMsg: string; sentMsg: string; pendingTxns: any; setPendingTxns: any; }) {
  const params = [index];
  const method = 'cancelDecreaseOrder';
  const orderBookAddress = getContract(chainId, 'OrderBook');
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function cancelIncreaseOrder(chainId: ChainId, library: any, index: any, opts: any) {
  const params = [index];
  const method = 'cancelIncreaseOrder';
  const orderBookAddress = getContract(chainId, 'OrderBook');
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export function handleCancelOrder(chainId: any, library: any, order: { type: string; index: any; }, opts: { pendingTxns: any; setPendingTxns: any; }) {
  let func;
  if (order.type === SWAP) {
    func = cancelSwapOrder;
  } else if (order.type === INCREASE) {
    func = cancelIncreaseOrder;
  } else {
    func = cancelDecreaseOrder;
  }

  return func(chainId, library, order.index, {
    successMsg: 'Order cancelled.',
    failMsg: 'Cancel failed.',
    sentMsg: 'Cancel submitted.',
    pendingTxns: opts.pendingTxns,
    setPendingTxns: opts.setPendingTxns,
  });
}

export async function cancelMultipleOrders(chainId: ChainId, library: any, allIndexes = [], opts: { successMsg: string; failMsg: string; sentMsg: string; pendingTxns: any; setPendingTxns: any; }) {
  const ordersWithTypes = groupBy(allIndexes, (v: string) => v.split('-')[0]);
  function getIndexes(key: string) {
    if (!ordersWithTypes[key]) return;
    return ordersWithTypes[key].map((d) => d.split('-')[1]);
  }
  // params order => swap, increase, decrease
  const params = ['Swap', 'Increase', 'Decrease'].map((key) => getIndexes(key) || []);
  const method = 'cancelMultiple';
  const orderBookAddress = getContract(chainId, 'OrderBook');
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());
  return callContract(chainId, contract, method, params, opts);
}

export async function updateDecreaseOrder(
  chainId: ChainId,
  library: any,
  index: any,
  collateralDelta: any,
  sizeDelta: any,
  triggerPrice: any,
  triggerAboveThreshold: any,
  opts: any,
) {
  const params = [index, collateralDelta, sizeDelta, triggerPrice, triggerAboveThreshold];
  const method = 'updateDecreaseOrder';
  const orderBookAddress = getContract(chainId, 'OrderBook');
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function updateIncreaseOrder(
  chainId: ChainId,
  library: any,
  index: any,
  sizeDelta: any,
  triggerPrice: any,
  triggerAboveThreshold: any,
  opts: any,
) {
  const params = [index, sizeDelta, triggerPrice, triggerAboveThreshold];
  const method = 'updateIncreaseOrder';
  const orderBookAddress = getContract(chainId, 'OrderBook');
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function updateSwapOrder(chainId: ChainId, library: any, index: any, minOut: any, triggerRatio: any, triggerAboveThreshold: any, opts: any) {
  const params = [index, minOut, triggerRatio, triggerAboveThreshold];
  const method = 'updateSwapOrder';
  const orderBookAddress = getContract(chainId, 'OrderBook');
  const contract = new ethers.Contract(orderBookAddress, OrderBook.abi, library.getSigner());

  return callContract(chainId, contract, method, params, opts);
}

export async function _executeOrder(chainId: ChainId, library: any, method: string, account: any, index: any, feeReceiver: any, opts: any) {
  const params = [account, index, feeReceiver];
  const positionManagerAddress = getContract(chainId, 'PositionManager');
  const contract = new ethers.Contract(positionManagerAddress, PositionManager.abi, library.getSigner());
  return callContract(chainId, contract, method, params, opts);
}

export function executeSwapOrder(chainId: any, library: any, account: any, index: any, feeReceiver: any, opts: any) {
  return _executeOrder(chainId, library, 'executeSwapOrder', account, index, feeReceiver, opts);
}

export function executeIncreaseOrder(chainId: any, library: any, account: any, index: any, feeReceiver: any, opts: any) {
  return _executeOrder(chainId, library, 'executeIncreaseOrder', account, index, feeReceiver, opts);
}

export function executeDecreaseOrder(chainId: any, library: any, account: any, index: any, feeReceiver: any, opts: any) {
  return _executeOrder(chainId, library, 'executeDecreaseOrder', account, index, feeReceiver, opts);
}

const NOT_ENOUGH_FUNDS = 'NOT_ENOUGH_FUNDS';
const USER_DENIED = 'USER_DENIED';
const SLIPPAGE = 'SLIPPAGE';
const TX_ERROR_PATTERNS = {
  [NOT_ENOUGH_FUNDS]: ['not enough funds for gas', 'failed to execute call with revert code InsufficientGasFunds'],
  [USER_DENIED]: ['User denied transaction signature'],
  [SLIPPAGE]: ['Router: mark price lower than limit', 'Router: mark price higher than limit'],
};
export function extractError(ex: any) {
  if (!ex) {
    return [];
  }
  const message = ex.data?.message || ex.message;
  if (!message) {
    return [];
  }
  for (const [type, patterns] of Object.entries(TX_ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      if (message.includes(pattern)) {
        return [message, type];
      }
    }
  }
  return [message];
}

function ToastifyDebug(props: { children: any; }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="Toastify-debug">
      {!open && (
        <span className="Toastify-debug-button" onClick={() => setOpen(true)}>
          Show error
        </span>
      )}
      {open && props.children}
    </div>
  );
}
