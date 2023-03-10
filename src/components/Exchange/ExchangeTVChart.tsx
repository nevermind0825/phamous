import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import cx from 'classnames';

import {
  createChart,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  LineStyle,
  MouseEventParams,
  Time,
} from 'krasulya-lightweight-charts';

import {
  USD_DECIMALS,
  SWAP,
  CHART_PERIODS,
  getTokenInfo,
  formatAmount,
  formatDateTime,
  formatNumber,
  usePrevious,
  getLiquidationPrice,
  useLocalStorageSerializeKey,
  toBigNumber,
} from '../../utils/Helpers';
import { useChartPrices } from '../../Api';
import Tab from '../Tab/Tab';

import ChartTokenSelector from './ChartTokenSelector';
import { ChainId, IOrder, IPosition, ITokenInfo, Period, SwapType } from '../../utils/types';

const PRICE_LINE_TEXT_WIDTH = 15;

const timezoneOffset = -new Date().getTimezoneOffset() * 60;

export function getChartToken(
  swapOption: SwapType,
  fromToken: ITokenInfo,
  toToken: ITokenInfo
): ITokenInfo | undefined {
  if (!fromToken || !toToken) {
    return;
  }

  if (swapOption !== SWAP) {
    return toToken;
  }

  if (fromToken.isStable && toToken.isStable) {
    return toToken;
  }
  if (fromToken.isStable) {
    return toToken;
  }
  if (toToken.isStable) {
    return fromToken;
  }

  return toToken;
}

const DEFAULT_PERIOD = '4h';

const getSeriesOptions = () => ({
  // https://github.com/tradingview/lightweight-charts/blob/master/docs/area-series.md
  lineColor: '#5472cc',
  topColor: 'rgba(49, 69, 131, 0.4)',
  bottomColor: 'rgba(42, 64, 103, 0.0)',
  lineWidth: 2,
  priceLineColor: '#3a3e5e',
  downColor: '#fa3c58',
  wickDownColor: '#fa3c58',
  upColor: '#0ecc83',
  wickUpColor: '#0ecc83',
  borderVisible: false,
});

const getChartOptions = (width: number, height: number) => ({
  width,
  height,
  layout: {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    textColor: '#ccc',
    fontFamily: 'Relative',
  },
  localization: {
    // https://github.com/tradingview/lightweight-charts/blob/master/docs/customization.md#time-format
    timeFormatter: (businessDayOrTimestamp: number) => {
      return formatDateTime(businessDayOrTimestamp - timezoneOffset);
    },
  },
  grid: {
    vertLines: {
      visible: true,
      color: 'rgba(35, 38, 59, 1)',
      style: 2,
    },
    horzLines: {
      visible: true,
      color: 'rgba(35, 38, 59, 1)',
      style: 2,
    },
  },
  // https://github.com/tradingview/lightweight-charts/blob/master/docs/time-scale.md#time-scale
  timeScale: {
    rightOffset: 5,
    borderVisible: false,
    barSpacing: 5,
    timeVisible: true,
    fixLeftEdge: true,
  },
  // https://github.com/tradingview/lightweight-charts/blob/master/docs/customization.md#price-axis
  priceScale: {
    borderVisible: false,
  },
  crosshair: {
    horzLine: {
      color: '#aaa',
    },
    vertLine: {
      color: '#aaa',
    },
    mode: 0,
  },
});

interface IProps {
  swapOption: SwapType;
  fromTokenAddress: string;
  toTokenAddress: string;
  infoTokens: { [x: string]: ITokenInfo };
  chainId: ChainId;
  positions: IPosition[];
  savedShouldShowPositionLines?: boolean;
  orders: IOrder[];
  setToTokenAddress: (x: SwapType, y: string) => void;
}

export default function ExchangeTVChart(props: IProps) {
  const {
    swapOption,
    fromTokenAddress,
    toTokenAddress,
    infoTokens,
    chainId,
    positions,
    savedShouldShowPositionLines,
    // orders,
    setToTokenAddress,
  } = props;
  const [currentChart, setCurrentChart] = useState<IChartApi>();
  const [currentSeries, setCurrentSeries] = useState<ISeriesApi<'Candlestick'>>();

  let [period, setPeriod] = useLocalStorageSerializeKey<Period>([chainId, 'Chart-period'], DEFAULT_PERIOD);
  if (period && !(period in CHART_PERIODS)) {
    period = DEFAULT_PERIOD;
  }

  const [hoveredCandlestick, setHoveredCandlestick] = useState<any>();

  const fromToken = getTokenInfo(infoTokens, fromTokenAddress);
  const toToken = getTokenInfo(infoTokens, toTokenAddress);

  const [chartToken, setChartToken] = useState<ITokenInfo>();
  useEffect(() => {
    const tmp = getChartToken(swapOption, fromToken, toToken);
    setChartToken(tmp);
  }, [swapOption, fromToken, toToken]);

  const symbol = chartToken ? (chartToken.isWrapped ? chartToken.baseSymbol : chartToken.symbol) : undefined;
  const marketName = chartToken ? symbol + '_USD' : undefined;
  const previousMarketName = usePrevious(marketName);

  // const currentOrders = useMemo(() => {
  //   if (swapOption === SWAP || !chartToken) {
  //     return [];
  //   }

  //   return orders.filter((order) => {
  //     if (order.type === SWAP) {
  //       // we can't show non-stable to non-stable swap orders with existing charts
  //       // so to avoid users confusion we'll show only long/short orders
  //       return false;
  //     }

  //     const indexToken = getToken(chainId, order.indexToken);
  //     return order.indexToken === chartToken.address || (chartToken.isNative && indexToken.isWrapped);
  //   });
  // }, [orders, chartToken, swapOption, chainId]);

  const ref = useRef(null);
  const chartRef = useRef<any>();

  const currentAveragePrice =
    chartToken && chartToken.maxPrice && chartToken.minPrice
      ? chartToken.maxPrice.add(chartToken.minPrice).div(2)
      : null;
  const [priceData, updatePriceData] = useChartPrices(
    chainId,
    chartToken?.symbol,
    chartToken?.isStable,
    period,
    currentAveragePrice,
  );

  const [chartInited, setChartInited] = useState(false);
  useEffect(() => {
    if (marketName !== previousMarketName) {
      setChartInited(false);
    }
  }, [marketName, previousMarketName]);

  const scaleChart = useCallback(() => {
    const from = (Date.now() / 1000 - (7 * 24 * CHART_PERIODS[period as Period]) / 2 + timezoneOffset) as Time;
    const to = (Date.now() / 1000 + timezoneOffset) as Time;
    currentChart?.timeScale().setVisibleRange({ from, to });
  }, [currentChart, period]);

  const onCrosshairMove = useCallback(
    (evt: MouseEventParams) => {
      if (!evt.time) {
        setHoveredCandlestick(undefined);
        return;
      }
      const point = evt.seriesPrices.values();
      setHoveredCandlestick((hoveredCandlestick: any) => {
        if (hoveredCandlestick && hoveredCandlestick.time === evt.time) {
          // rerender optimisations
          return hoveredCandlestick;
        }
        return {
          time: evt.time,
          ...point,
        };
      });
    },
    [setHoveredCandlestick],
  );

  console.log({ hoveredCandlestick });

  useEffect(() => {
    if (!ref.current || !priceData || !priceData.length || currentChart) {
      return;
    }
    if (!chartRef.current) return;

    const chart = createChart(
      chartRef.current,
      getChartOptions(chartRef.current.offsetWidth, chartRef.current.offsetHeight),
    );

    chart.subscribeCrosshairMove(onCrosshairMove);

    const series = chart.addCandlestickSeries(getSeriesOptions());

    setCurrentChart(chart);
    setCurrentSeries(series);
  }, [ref, priceData, currentChart, onCrosshairMove]);

  useEffect(() => {
    const interval = setInterval(async () => {
      updatePriceData(undefined, true);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [updatePriceData]);

  useEffect(() => {
    if (!currentChart) {
      return;
    }
    const resizeChart = () => {
      currentChart.resize(chartRef.current.offsetWidth, chartRef.current.offsetHeight);
    };
    window.addEventListener('resize', resizeChart);
    return () => window.removeEventListener('resize', resizeChart);
  }, [currentChart]);

  useEffect(() => {
    if (currentSeries && priceData && priceData.length) {
      currentSeries.setData(priceData);

      if (!chartInited) {
        scaleChart();
        setChartInited(true);
      }
    }
  }, [priceData, currentSeries, chartInited, scaleChart]);

  useEffect(() => {
    const lines: IPriceLine[] = [];
    if (currentSeries && savedShouldShowPositionLines) {
      // if (currentOrders && currentOrders.length > 0) {
      //   currentOrders.forEach((order) => {
      //     const indexToken = getToken(chainId, order.indexToken);
      //     let tokenSymbol;
      //     if (indexToken && indexToken.symbol) {
      //       tokenSymbol = indexToken.isWrapped ? indexToken.baseSymbol : indexToken.symbol;
      //     }
      //     const title = `${order.type === INCREASE ? 'Inc.' : 'Dec.'} ${tokenSymbol} ${
      //       order.isLong ? 'Long' : 'Short'
      //     }`;
      //     const color = '#3a3e5e';
      //     lines.push(
      //       currentSeries.createPriceLine({
      //         price: parseFloat(formatAmount(order.triggerPrice, USD_DECIMALS, 4)),
      //         color,
      //         title: title.padEnd(PRICE_LINE_TEXT_WIDTH, ' '),
      //       }),
      //     );
      //   });
      // }
      if (positions && positions.length > 0) {
        const color = '#3a3e5e';

        positions.forEach((position) => {
          lines.push(
            currentSeries.createPriceLine({
              price: parseFloat(formatAmount(position.averagePrice, USD_DECIMALS, 4)),
              color,
              title: `Open ${position?.indexToken?.symbol} ${position.isLong ? 'Long' : 'Short'}`.padEnd(
                PRICE_LINE_TEXT_WIDTH,
                ' ',
              ),
              lineWidth: 1,
              lineStyle: LineStyle.Solid,
              axisLabelVisible: true,
            }),
          );

          const liquidationPrice = getLiquidationPrice(position);
          lines.push(
            currentSeries.createPriceLine({
              price: parseFloat(formatAmount(liquidationPrice, USD_DECIMALS, 4)),
              color,
              title: `Liq. ${position?.indexToken?.symbol} ${position.isLong ? 'Long' : 'Short'}`.padEnd(
                PRICE_LINE_TEXT_WIDTH,
                ' ',
              ),
              lineWidth: 1,
              lineStyle: LineStyle.Solid,
              axisLabelVisible: true,
            }),
          );
        });
      }
    }
    return () => {
      lines.length > 0 && lines.forEach((line) => currentSeries?.removePriceLine(line));
    };
  }, [positions, currentSeries, chainId, savedShouldShowPositionLines]);

  const candleStatsHtml = useMemo(() => {
    if (!priceData) {
      return null;
    }
    const candlestick = hoveredCandlestick || priceData[priceData.length - 1];
    if (!candlestick) {
      return null;
    }

    const smartClose = formatAmount(
      toBigNumber(candlestick.close).multipliedBy(toBigNumber(10).exponentiatedBy(USD_DECIMALS)).toFixed(0),
      USD_DECIMALS,
      4,
      true,
    );
    const fullLength = smartClose.length;
    const className = cx({
      'ExchangeChart-bottom-stats': true,
      positive: candlestick.open <= candlestick.close,
      negative: candlestick.open > candlestick.close,
      // [`length-${fullLength}`]: true,
    });

    const toFixedNumbers = fullLength - String(parseInt(candlestick.close)).length - 1;

    return (
      <div className={className}>
        <span className="ExchangeChart-bottom-stats-label">O</span>
        <span className="ExchangeChart-bottom-stats-value">{candlestick.open.toFixed(toFixedNumbers)}</span>
        <span className="ExchangeChart-bottom-stats-label">H</span>
        <span className="ExchangeChart-bottom-stats-value">{candlestick.high.toFixed(toFixedNumbers)}</span>
        <span className="ExchangeChart-bottom-stats-label">L</span>
        <span className="ExchangeChart-bottom-stats-value">{candlestick.low.toFixed(toFixedNumbers)}</span>
        <span className="ExchangeChart-bottom-stats-label">C</span>
        <span className="ExchangeChart-bottom-stats-value">{candlestick.close.toFixed(toFixedNumbers)}</span>
      </div>
    );
  }, [hoveredCandlestick, priceData]);

  let high;
  let low;
  let deltaPrice;
  let delta;
  let deltaPercentage;
  let deltaPercentageStr;

  const now = Math.floor(Date.now() / 1000);
  const timeThreshold = now - 24 * 60 * 60;

  if (priceData) {
    for (let i = priceData.length - 1; i > 0; i--) {
      const price = priceData[i];
      if (price.time < timeThreshold) {
        break;
      }
      if (!low) {
        low = price.low;
      }
      if (!high) {
        high = price.high;
      }

      if (price.high > high) {
        high = price.high;
      }
      if (price.low < low) {
        low = price.low;
      }

      deltaPrice = price.open;
    }
  }

  if (deltaPrice && currentAveragePrice) {
    const average = parseFloat(formatAmount(currentAveragePrice, USD_DECIMALS, 10));
    delta = average - deltaPrice;
    deltaPercentage = (delta * 100) / average;
    if (deltaPercentage > 0) {
      deltaPercentageStr = `+${deltaPercentage.toFixed(2)}%`;
    } else {
      deltaPercentageStr = `${deltaPercentage.toFixed(2)}%`;
    }
    if (deltaPercentage === 0) {
      deltaPercentageStr = '0.00';
    }
  }

  if (!chartToken) {
    return null;
  }

  const onSelectToken = (token: ITokenInfo) => {
    const tmp = getTokenInfo(infoTokens, token.address);
    setChartToken(tmp);
    setToTokenAddress(swapOption, token.address);
  };

  return (
    <div className="ExchangeChart tv" ref={ref}>
      <div className="ExchangeChart-top App-box App-box-border">
        <div className="ExchangeChart-top-inner">
          <div>
            <div className="ExchangeChart-title">
              <ChartTokenSelector
                chainId={chainId}
                selectedToken={chartToken}
                swapOption={swapOption}
                infoTokens={infoTokens}
                onSelectToken={onSelectToken}
                className="chart-token-selector"
              />
            </div>
          </div>
          <div>
            <div className="ExchangeChart-main-price">
              {chartToken.maxPrice && formatAmount(chartToken.maxPrice, USD_DECIMALS, 4)}
            </div>
            <div className="ExchangeChart-info-label">
              ${chartToken.minPrice && formatAmount(chartToken.minPrice, USD_DECIMALS, 4)}
            </div>
          </div>
          <div>
            <div className="ExchangeChart-info-label">24h Change</div>
            <div
              className={cx(
                deltaPercentage && {
                  positive: deltaPercentage > 0,
                  negative: deltaPercentage < 0,
                },
              )}
            >
              {!deltaPercentageStr && '-'}
              {deltaPercentageStr && deltaPercentageStr}
            </div>
          </div>
          <div className="ExchangeChart-additional-info">
            <div className="ExchangeChart-info-label">24h High</div>
            <div>
              {!high && '-'}
              {high && formatNumber(high, 4)}
            </div>
          </div>
          <div className="ExchangeChart-additional-info">
            <div className="ExchangeChart-info-label">24h Low</div>
            <div>
              {!low && '-'}
              {low && formatNumber(low, 4)}
            </div>
          </div>
        </div>
      </div>
      <div className="ExchangeChart-bottom App-box App-box-border">
        <div className="ExchangeChart-bottom-header">
          <div className="ExchangeChart-bottom-controls">
            <Tab options={Object.keys(CHART_PERIODS)} option={period} setOption={setPeriod} />
          </div>
          {candleStatsHtml}
        </div>
        <div className="ExchangeChart-bottom-content" ref={chartRef}></div>
      </div>
    </div>
  );
}
