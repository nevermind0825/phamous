import { useMemo } from "react";
import { gql } from "@apollo/client";
import useSWR from "swr";
import { ethers } from "ethers";
import { TOKENS } from "../data/Tokens";

import {
  USD_DECIMALS,
  CHART_PERIODS,
  formatAmount,
  // sleep
} from "../Helpers";
import { phamousGraphClient } from "./common";
import { PLS_TESTNET_V2 } from "../Constants";

const BigNumber = ethers.BigNumber;

const timezoneOffset = -new Date().getTimezoneOffset() * 60;

function fillGaps(prices, periodSeconds) {
  if (prices.length < 2) {
    return prices;
  }

  const newPrices = [prices[0]];
  let prevTime = prices[0].time;
  for (let i = 1; i < prices.length; i++) {
    const { time, open } = prices[i];
    if (prevTime) {
      let j = (time - prevTime) / periodSeconds - 1;
      while (j > 0) {
        newPrices.push({
          time: time - j * periodSeconds,
          open,
          close: open,
          high: open, // * 1.0003,
          low: open, // * 0.9996,
        });
        j--;
      }
    }

    prevTime = time;
    newPrices.push(prices[i]);
  }

  return newPrices;
}

function getCandlesFromPrices(prices, period) {
  const periodTime = CHART_PERIODS[period];

  if (prices.length < 2) {
    return [];
  }

  const candles = [];
  const first = prices[0];
  let prevTsGroup = Math.floor(first[0] / periodTime) * periodTime;
  let prevPrice = first[1];
  let o = prevPrice;
  let h = prevPrice;
  let l = prevPrice;
  let c = prevPrice;
  for (let i = 1; i < prices.length; i++) {
    const [ts, price] = prices[i];
    const tsGroup = Math.floor(ts / periodTime) * periodTime;
    if (prevTsGroup !== tsGroup) {
      candles.push({ t: prevTsGroup + timezoneOffset, o, h, l, c });
      o = c;
      h = Math.max(o, c);
      l = Math.min(o, c);
    }
    c = price;
    h = Math.max(h, price);
    l = Math.min(l, price);
    prevTsGroup = tsGroup;
  }

  return candles.map(({ t: time, o: open, c: close, h: high, l: low }) => ({
    time,
    open,
    close,
    high,
    low,
  }));
}

function getChartPricesFromGraph(tokenSymbol, chainId, period) {
  if (chainId === PLS_TESTNET_V2 && tokenSymbol === "tPLS") {
    tokenSymbol = "PLS";
  }
  let network;
  if (chainId === PLS_TESTNET_V2) {
    network = "plstestv2";
  }
  let tokenAddress;
  if (TOKENS[chainId]) {
    for (const token of TOKENS[chainId]) {
      if (token.symbol === tokenSymbol) {
        tokenAddress = token.address;
      }
    }
  }
  if (!tokenAddress) {
    return [];
  }

  const PER_CHUNK = 1000;
  const CHUNKS_TOTAL = 6;
  const requests = [];
  for (let i = 0; i < CHUNKS_TOTAL; i++) {
    const query = gql(`query {
      phamousPriceUpdates(
        first: ${PER_CHUNK},
        skip: ${i * PER_CHUNK},
        order: timestamp_DESC,
        where: {
          token: {
            equalTo: "${tokenAddress}"
          },
          network: {
            equalTo: "${network}"
          }
        }
      ) {
        edges {
          node {
            timestamp
            price
          }
        }
      }
    }`);
    requests.push(phamousGraphClient.query({ query }));
  }

  return Promise.all(requests)
    .then((chunks) => {
      let prices = [];
      const uniqTs = new Set();
      chunks.forEach((chunk) => {
        chunk.data.phamousPriceUpdates.edges.forEach((item) => {
          if (uniqTs.has(item.node.timestamp)) {
            return;
          }

          uniqTs.add(item.node.timestamp);
          prices.push([
            Math.floor(new Date(item.node.timestamp) / 1000),
            Number(item.node.price),
          ]);
        });
      });

      prices.sort(([timeA], [timeB]) => timeA - timeB);
      prices = getCandlesFromPrices(prices, period);
      return prices;
    })
    .catch((err) => {
      console.error(err);
    });
}

function appendCurrentAveragePrice(prices, currentAveragePrice, period) {
  const periodSeconds = CHART_PERIODS[period];
  const currentCandleTime =
    Math.floor(Date.now() / 1000 / periodSeconds) * periodSeconds +
    timezoneOffset;
  const last = prices[prices.length - 1];
  const averagePriceValue = parseFloat(
    formatAmount(currentAveragePrice, USD_DECIMALS, 10)
  );
  if (currentCandleTime === last.time) {
    last.close = averagePriceValue;
    last.high = Math.max(last.high, averagePriceValue);
    last.low = Math.max(last.low, averagePriceValue);
    return prices;
  } else {
    const newCandle = {
      time: currentCandleTime,
      open: last.close,
      close: averagePriceValue,
      high: averagePriceValue,
      low: averagePriceValue,
    };
    return [...prices, newCandle];
  }
}

function getStablePriceData(period) {
  const periodSeconds = CHART_PERIODS[period];
  const now = Math.floor(Date.now() / 1000 / periodSeconds) * periodSeconds;
  const priceData = [];
  for (let i = 100; i > 0; i--) {
    priceData.push({
      time: now - i * periodSeconds,
      open: 1,
      close: 1,
      high: 1,
      low: 1,
    });
  }
  return priceData;
}

export function useChartPrices(
  chainId,
  symbol,
  isStable,
  period,
  currentAveragePrice
) {
  const swrKey =
    !isStable && symbol ? ["getChartCandles", chainId, symbol, period] : null;
  const { data: prices, mutate: updatePrices } = useSWR(swrKey, {
    fetcher: async (...args) => {
      try {
        return await getChartPricesFromGraph(symbol, chainId, period);
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    dedupingInterval: 60000,
    focusThrottleInterval: 60000 * 10,
  });

  const currentAveragePriceString =
    currentAveragePrice && currentAveragePrice.toString();
  const retPrices = useMemo(() => {
    if (isStable) {
      return getStablePriceData(period);
    }

    if (!prices) {
      return [];
    }

    let _prices = [...prices];
    if (currentAveragePriceString && prices.length) {
      _prices = appendCurrentAveragePrice(
        _prices,
        BigNumber.from(currentAveragePriceString),
        period
      );
    }

    return fillGaps(_prices, CHART_PERIODS[period]);
  }, [prices, isStable, currentAveragePriceString, period]);

  return [retPrices, updatePrices];
}
