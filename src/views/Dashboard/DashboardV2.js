import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import TooltipComponent from "../../components/Tooltip/Tooltip";

import hexToRgba from "hex-to-rgba";
import { ethers } from "ethers";

import {
  getWhitelistedTokens,
  // getTokenBySymbol
} from "../../data/Tokens";
// import { getFeeHistory } from "../../data/Fees";

import { PLS_TESTNET_V2 } from "../../Constants";
import {
  fetcher,
  formatAmount,
  formatKeyAmount,
  expandDecimals,
  bigNumberify,
  // numberWithCommas,
  // formatDate,
  // getServerUrl,
  getChainName,
  useChainId,
  USD_DECIMALS,
  PHLP_DECIMALS,
  BASIS_POINTS_DIVISOR,
  // getTotalVolumeSum,
  PHLPPOOLCOLORS,
  DEFAULT_MAX_USDPH_AMOUNT,
  getPageTitle,
  importImage,
} from "../../Helpers";
import { useInfoTokens } from "../../Api";

import { getContract } from "../../Addresses";

import Vault from "../../abis/Vault.json";
import PhamousUiDataProvider from "../../abis/PhamousUiDataProvider.json";
import PhlpManager from "../../abis/PhlpManager.json";
import Footer from "../../Footer";

import "./DashboardV2.css";

import phlp40Icon from "../../img/ic_phlp_40.svg";
import pls16Icon from "../../img/ic_pulsechain_16.svg";
import pls24Icon from "../../img/ic_pulsechain_24.svg";

import AssetDropdown from "./AssetDropdown";
import SEO from "../../components/Common/SEO";

const { AddressZero } = ethers.constants;

export default function DashboardV2() {
  const { active, library } = useWeb3React();
  const { chainId } = useChainId();

  const chainName = getChainName(chainId);
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const tokens = whitelistedTokens.filter((t) => !t.isWrapped);
  const tokenAddresses = tokens.map((token) => token.address);

  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const uiDataProviderAddress = getContract(chainId, "PhamousUiDataProvider");
  const vaultAddress = getContract(chainId, "Vault");
  const phlpManagerAddress = getContract(chainId, "PhlpManager");
  const phlpAddress = getContract(chainId, "PHLP");
  const usdphAddress = getContract(chainId, "USDPH");
  const tokensForSupplyQuery = [phlpAddress, usdphAddress];

  const { data: positionStats } = useSWR(
    [
      `Dashboard:positionStats:${active}`,
      chainId,
      uiDataProviderAddress,
      "getVaultPositionStats",
    ],
    {
      fetcher: fetcher(library, PhamousUiDataProvider, [
        vaultAddress,
        nativeTokenAddress,
        tokenAddresses,
      ]),
    }
  );

  let totalLongPositionSizes;
  let totalShortPositionSizes;
  if (positionStats) {
    totalLongPositionSizes = positionStats[0];
    totalShortPositionSizes = positionStats[1];
  }

  const { data: aums } = useSWR(
    [`Dashboard:getAums:${active}`, chainId, phlpManagerAddress, "getAums"],
    {
      fetcher: fetcher(library, PhlpManager),
    }
  );

  const { data: totalSupplies } = useSWR(
    [
      `Dashboard:totalSupplies:${active}`,
      chainId,
      uiDataProviderAddress,
      "getTokenBalancesWithSupplies",
      AddressZero,
    ],
    {
      fetcher: fetcher(library, PhamousUiDataProvider, [tokensForSupplyQuery]),
    }
  );

  const { data: totalTokenWeights } = useSWR(
    [
      `PhlpSwap:totalTokenWeights:${active}`,
      chainId,
      vaultAddress,
      "totalTokenWeights",
    ],
    {
      fetcher: fetcher(library, Vault),
    }
  );

  const { infoTokens } = useInfoTokens(
    library,
    chainId,
    active,
    undefined,
    undefined
  );

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  let phlpPrice;
  let phlpSupply;
  let phlpMarketCap;
  if (aum && totalSupplies && totalSupplies[1]) {
    phlpSupply = totalSupplies[1];
    phlpPrice =
      aum && aum.gt(0) && phlpSupply.gt(0)
        ? aum.mul(expandDecimals(1, PHLP_DECIMALS)).div(phlpSupply)
        : expandDecimals(1, USD_DECIMALS);
    phlpMarketCap = phlpPrice
      .mul(phlpSupply)
      .div(expandDecimals(1, PHLP_DECIMALS));
  }

  let adjustedUsdphSupply = bigNumberify(0);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tokenInfo = infoTokens[token.address];
    if (tokenInfo && tokenInfo.usdphAmount) {
      adjustedUsdphSupply = adjustedUsdphSupply.add(tokenInfo.usdphAmount);
    }
  }

  const getWeightText = (tokenInfo) => {
    if (
      !tokenInfo.weight ||
      !tokenInfo.usdphAmount ||
      !adjustedUsdphSupply ||
      adjustedUsdphSupply.eq(0) ||
      !totalTokenWeights
    ) {
      return "...";
    }

    const currentWeightBps = tokenInfo.usdphAmount
      .mul(BASIS_POINTS_DIVISOR)
      .div(adjustedUsdphSupply);
    const targetWeightBps = tokenInfo.weight
      .mul(BASIS_POINTS_DIVISOR)
      .div(totalTokenWeights);

    const weightText = `${formatAmount(
      currentWeightBps,
      2,
      2,
      false
    )}% / ${formatAmount(targetWeightBps, 2, 2, false)}%`;

    return (
      <TooltipComponent
        handle={weightText}
        position="right-bottom"
        renderContent={() => {
          return (
            <>
              Current Weight: {formatAmount(currentWeightBps, 2, 2, false)}%
              <br />
              Target Weight: {formatAmount(targetWeightBps, 2, 2, false)}%<br />
              <br />
              {currentWeightBps.lt(targetWeightBps) && (
                <div>
                  {tokenInfo.symbol} is below its target weight.
                  <br />
                  <br />
                  Get lower fees to{" "}
                  <Link
                    to="/buy_phlp"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    buy PHLP
                  </Link>{" "}
                  with {tokenInfo.symbol},&nbsp; and to{" "}
                  <Link to="/trade" target="_blank" rel="noopener noreferrer">
                    swap
                  </Link>{" "}
                  {tokenInfo.symbol} for other tokens.
                </div>
              )}
              {currentWeightBps.gt(targetWeightBps) && (
                <div>
                  {tokenInfo.symbol} is above its target weight.
                  <br />
                  <br />
                  Get lower fees to{" "}
                  <Link to="/trade" target="_blank" rel="noopener noreferrer">
                    swap
                  </Link>{" "}
                  tokens for {tokenInfo.symbol}.
                </div>
              )}
            </>
          );
        }}
      />
    );
  };

  let stablePhlp = 0;
  let totalPhlp = 0;

  let phlpPool = tokens.map((token) => {
    const tokenInfo = infoTokens[token.address];
    if (
      tokenInfo.usdphAmount &&
      adjustedUsdphSupply &&
      !adjustedUsdphSupply.eq(0)
    ) {
      const currentWeightBps = tokenInfo.usdphAmount
        .mul(BASIS_POINTS_DIVISOR)
        .div(adjustedUsdphSupply);
      if (tokenInfo.isStable) {
        stablePhlp += parseFloat(
          `${formatAmount(currentWeightBps, 2, 2, false)}`
        );
      }
      totalPhlp += parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`);
      return {
        fullname: token.name,
        name: token.symbol,
        value: parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`),
      };
    }
    return null;
  });

  const stablePercentage =
    totalPhlp > 0 ? ((stablePhlp * 100) / totalPhlp).toFixed(2) : "0.0";

  phlpPool = phlpPool.filter(function (element) {
    return element !== null;
  });

  phlpPool = phlpPool.sort(function (a, b) {
    if (a.value < b.value) return 1;
    else return -1;
  });

  const [phlpActiveIndex, setPHLPActiveIndex] = useState(null);

  const onPHLPPoolChartEnter = (_, index) => {
    setPHLPActiveIndex(index);
  };

  const onPHLPPoolChartLeave = (_, index) => {
    setPHLPActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="stats-label">
          <div
            className="stats-label-color"
            style={{ backgroundColor: payload[0].color }}
          ></div>
          {payload[0].value}% {payload[0].name}
        </div>
      );
    }

    return null;
  };

  return (
    <SEO title={getPageTitle("Dashboard")}>
      <div className="default-container DashboardV2 page-layout">
        <div className="section-title-block">
          <div className="section-title-icon"></div>
          <div className="section-title-content">
            <div className="Page-title">
              Stats{" "}
              {chainId === PLS_TESTNET_V2 && (
                <img src={pls24Icon} alt="pls24Icon" />
              )}
            </div>
          </div>
        </div>
        <div className="DashboardV2-content">
          <div className="DashboardV2-cards">
            <div className="App-card">
              <div className="App-card-title">Overview</div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                {/* <div className="App-card-row">
                  <div className="label">AUM</div>
                  <div>
                    <TooltipComponent
                      handle={`$${formatAmount(tvl, USD_DECIMALS, 0, true)}`}
                      position="right-bottom"
                      renderContent={() => `Assets Under Management: PHAME staked (All chains) + PHLP pool (${chainName})`}
                    />
                  </div>
                </div> */}
                <div className="App-card-row">
                  <div className="label">PHLP Pool</div>
                  <div>
                    <TooltipComponent
                      handle={`$${formatAmount(aum, USD_DECIMALS, 0, true)}`}
                      position="right-bottom"
                      renderContent={() =>
                        `Total value of tokens in PHLP pool (${chainName})`
                      }
                    />
                  </div>
                </div>
                {/* <div className="App-card-row">
                  <div className="label">24h Volume</div>
                  <div>${formatAmount(volumeInfo.totalVolume, USD_DECIMALS, 0, true)}</div>
                </div> */}
                <div className="App-card-row">
                  <div className="label">Long Positions</div>
                  <div>
                    $
                    {formatAmount(
                      totalLongPositionSizes,
                      USD_DECIMALS,
                      0,
                      true
                    )}
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">Short Positions</div>
                  <div>
                    $
                    {formatAmount(
                      totalShortPositionSizes,
                      USD_DECIMALS,
                      0,
                      true
                    )}
                  </div>
                </div>
                {/* {feeHistory.length ? (
                  <div className="App-card-row">
                    <div className="label">Fees since {formatDate(feeHistory[0].to)}</div>
                    <div>${formatAmount(currentFeesUsd, USD_DECIMALS, 2, true)}</div>
                  </div>
                ) : null} */}
              </div>
            </div>
            {/* <div className="App-card">
              <div className="App-card-title">Total Stats</div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">Total Fees</div>
                  <div>${numberWithCommas(totalFeesDistributed.toFixed(0))}</div>
                </div>
                <div className="App-card-row">
                  <div className="label">Total Volume</div>
                  <div>${formatAmount(totalVolumeSum, USD_DECIMALS, 0, true)}</div>
                </div>
              </div>
            </div> */}
          </div>
          <div className="Tab-title-section">
            <div className="Page-title">
              Tokens{" "}
              {chainId === PLS_TESTNET_V2 && (
                <img src={pls24Icon} alt="pls24Icon" />
              )}
            </div>
            <div className="Page-description">PHLP index tokens.</div>
          </div>
          <div className="DashboardV2-token-cards">
            <div className="stats-wrapper stats-wrapper--phamous">
              <div className="App-card">
                <div className="stats-block">
                  <div className="App-card-title">
                    <div className="App-card-title-mark">
                      <div className="App-card-title-mark-icon">
                        <img src={phlp40Icon} alt="phlp40Icon" />
                        {chainId === PLS_TESTNET_V2 ? (
                          <img
                            src={pls16Icon}
                            alt="pls16Icon"
                            className="selected-network-symbol"
                          />
                        ) : (
                          <img
                            src={pls16Icon}
                            alt="pls16Icon"
                            className="selected-network-symbol"
                          />
                        )}
                      </div>
                      <div className="App-card-title-mark-info">
                        <div className="App-card-title-mark-title">PHLP</div>
                        <div className="App-card-title-mark-subtitle">PHLP</div>
                      </div>
                      <div>
                        <AssetDropdown assetSymbol="PHLP" />
                      </div>
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">Price</div>
                      <div>
                        ${formatAmount(phlpPrice, USD_DECIMALS, 3, true)}
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Supply</div>
                      <div>
                        {formatAmount(phlpSupply, PHLP_DECIMALS, 0, true)} PHLP
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Market Cap</div>
                      <div>
                        ${formatAmount(phlpMarketCap, USD_DECIMALS, 0, true)}
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Stablecoin Percentage</div>
                      <div>{stablePercentage}%</div>
                    </div>
                  </div>
                </div>
                <div
                  className="stats-piechart"
                  onMouseOut={onPHLPPoolChartLeave}
                >
                  {phlpPool.length > 0 && (
                    <PieChart width={210} height={210}>
                      <Pie
                        data={phlpPool}
                        cx={100}
                        cy={100}
                        innerRadius={73}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        onMouseEnter={onPHLPPoolChartEnter}
                        onMouseOut={onPHLPPoolChartLeave}
                        onMouseLeave={onPHLPPoolChartLeave}
                        paddingAngle={2}
                      >
                        {phlpPool.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PHLPPOOLCOLORS[entry.name]}
                            style={{
                              filter:
                                phlpActiveIndex === index
                                  ? `drop-shadow(0px 0px 6px ${hexToRgba(
                                      PHLPPOOLCOLORS[entry.name],
                                      0.7
                                    )})`
                                  : "none",
                              cursor: "pointer",
                            }}
                            stroke={PHLPPOOLCOLORS[entry.name]}
                            strokeWidth={phlpActiveIndex === index ? 1 : 1}
                          />
                        ))}
                      </Pie>
                      <text
                        x={"50%"}
                        y={"50%"}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        PHLP Pool
                      </text>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  )}
                </div>
              </div>
            </div>
            <div className="token-table-wrapper App-card">
              <div className="App-card-title">
                PHLP Index Composition{" "}
                {chainId === PLS_TESTNET_V2 && (
                  <img src={pls16Icon} alt="pls16Icon" />
                )}
              </div>
              <div className="App-card-divider"></div>
              <table className="token-table">
                <thead>
                  <tr>
                    <th>TOKEN</th>
                    <th>PRICE</th>
                    <th>POOL</th>
                    <th>WEIGHT</th>
                    <th>UTILIZATION</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => {
                    const tokenInfo = infoTokens[token.address];
                    let utilization = bigNumberify(0);
                    if (
                      tokenInfo &&
                      tokenInfo.reservedAmount &&
                      tokenInfo.poolAmount &&
                      tokenInfo.poolAmount.gt(0)
                    ) {
                      utilization = tokenInfo.reservedAmount
                        .mul(BASIS_POINTS_DIVISOR)
                        .div(tokenInfo.poolAmount);
                    }
                    let maxUsdphAmount = DEFAULT_MAX_USDPH_AMOUNT;
                    if (
                      tokenInfo.maxUsdphAmount &&
                      tokenInfo.maxUsdphAmount.gt(0)
                    ) {
                      maxUsdphAmount = tokenInfo.maxUsdphAmount;
                    }
                    const tokenImage = importImage(
                      "ic_" + token.symbol.toLowerCase() + "_40.svg"
                    );

                    return (
                      <tr key={token.symbol}>
                        <td>
                          <div className="token-symbol-wrapper">
                            <div className="App-card-title-info">
                              <div className="App-card-title-info-icon">
                                <img
                                  src={tokenImage}
                                  alt={token.symbol}
                                  width="40px"
                                />
                              </div>
                              <div className="App-card-title-info-text">
                                <div className="App-card-info-title">
                                  {token.name}
                                </div>
                                <div className="App-card-info-subtitle">
                                  {token.symbol}
                                </div>
                              </div>
                              <div>
                                <AssetDropdown
                                  assetSymbol={token.symbol}
                                  assetInfo={token}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          $
                          {formatKeyAmount(
                            tokenInfo,
                            "minPrice",
                            USD_DECIMALS,
                            2,
                            true
                          )}
                        </td>
                        <td>
                          <TooltipComponent
                            handle={`$${formatKeyAmount(
                              tokenInfo,
                              "managedUsd",
                              USD_DECIMALS,
                              0,
                              true
                            )}`}
                            position="right-bottom"
                            renderContent={() => {
                              return (
                                <>
                                  Pool Amount:{" "}
                                  {formatKeyAmount(
                                    tokenInfo,
                                    "managedAmount",
                                    token.decimals,
                                    2,
                                    true
                                  )}{" "}
                                  {token.symbol}
                                  <br />
                                  <br />
                                  Target Min Amount:{" "}
                                  {formatKeyAmount(
                                    tokenInfo,
                                    "bufferAmount",
                                    token.decimals,
                                    2,
                                    true
                                  )}{" "}
                                  {token.symbol}
                                  <br />
                                  <br />
                                  Max {tokenInfo.symbol} Capacity: $
                                  {formatAmount(maxUsdphAmount, 18, 0, true)}
                                </>
                              );
                            }}
                          />
                        </td>
                        <td>{getWeightText(tokenInfo)}</td>
                        <td>{formatAmount(utilization, 2, 2, false)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="token-grid">
              {tokens.map((token) => {
                const tokenInfo = infoTokens[token.address];
                let utilization = bigNumberify(0);
                if (
                  tokenInfo &&
                  tokenInfo.reservedAmount &&
                  tokenInfo.poolAmount &&
                  tokenInfo.poolAmount.gt(0)
                ) {
                  utilization = tokenInfo.reservedAmount
                    .mul(BASIS_POINTS_DIVISOR)
                    .div(tokenInfo.poolAmount);
                }
                let maxUsdphAmount = DEFAULT_MAX_USDPH_AMOUNT;
                if (
                  tokenInfo.maxUsdphAmount &&
                  tokenInfo.maxUsdphAmount.gt(0)
                ) {
                  maxUsdphAmount = tokenInfo.maxUsdphAmount;
                }

                const tokenImage = importImage(
                  "ic_" + token.symbol.toLowerCase() + "_24.svg"
                );
                return (
                  <div className="App-card" key={token.symbol}>
                    <div className="App-card-title">
                      <div className="mobile-token-card">
                        <img src={tokenImage} alt={token.symbol} width="20px" />
                        <div className="token-symbol-text">{token.symbol}</div>
                        <div>
                          <AssetDropdown
                            assetSymbol={token.symbol}
                            assetInfo={token}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="App-card-divider"></div>
                    <div className="App-card-content">
                      <div className="App-card-row">
                        <div className="label">Price</div>
                        <div>
                          $
                          {formatKeyAmount(
                            tokenInfo,
                            "minPrice",
                            USD_DECIMALS,
                            2,
                            true
                          )}
                        </div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">Pool</div>
                        <div>
                          <TooltipComponent
                            handle={`$${formatKeyAmount(
                              tokenInfo,
                              "managedUsd",
                              USD_DECIMALS,
                              0,
                              true
                            )}`}
                            position="right-bottom"
                            renderContent={() => {
                              return (
                                <>
                                  Pool Amount:{" "}
                                  {formatKeyAmount(
                                    tokenInfo,
                                    "managedAmount",
                                    token.decimals,
                                    2,
                                    true
                                  )}{" "}
                                  {token.symbol}
                                  <br />
                                  <br />
                                  Target Min Amount:{" "}
                                  {formatKeyAmount(
                                    tokenInfo,
                                    "bufferAmount",
                                    token.decimals,
                                    2,
                                    true
                                  )}{" "}
                                  {token.symbol}
                                  <br />
                                  <br />
                                  Max {tokenInfo.symbol} Capacity: $
                                  {formatAmount(maxUsdphAmount, 18, 0, true)}
                                </>
                              );
                            }}
                          />
                        </div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">Weight</div>
                        <div>{getWeightText(tokenInfo)}</div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">Utilization</div>
                        <div>{formatAmount(utilization, 2, 2, false)}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </SEO>
  );
}
