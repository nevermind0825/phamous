import React, { useState, useEffect } from "react";
import { Title } from "react-head";
import { useHistory } from "react-router-dom";

import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import { ethers } from "ethers";

import Tab from "../Tab/Tab";
import cx from "classnames";

import { getToken, getTokens, getWhitelistedTokens } from "../../data/Tokens";
import { PLS_TESTNET_V2 } from "../../Constants";
import { getContract } from "../../Addresses";
import {
  helperToast,
  useLocalStorageByChainId,
  getTokenInfo,
  useChainId,
  expandDecimals,
  fetcher,
  bigNumberify,
  formatAmount,
  formatAmountFree,
  formatKeyAmount,
  getBuyPhlpToAmount,
  getBuyPhlpFromAmount,
  getSellPhlpFromAmount,
  getSellPhlpToAmount,
  parseValue,
  approveTokens,
  getUsd,
  adjustForDecimals,
  PHLP_DECIMALS,
  USD_DECIMALS,
  BASIS_POINTS_DIVISOR,
  PHLP_COOLDOWN_DURATION,
  USDPH_DECIMALS,
  PLACEHOLDER_ACCOUNT,
  importTokenImage,
  getPageTitle,
} from "../../Helpers";

import { callContract, useInfoTokens } from "../../Api";

import TokenSelector from "../Exchange/TokenSelector";
import BuyInputSection from "../BuyInputSection/BuyInputSection";
import Tooltip from "../Tooltip/Tooltip";

import PhamousUiDataProvider from "../../abis/PhamousUiDataProvider.json";
import Vault from "../../abis/Vault.json";
import PhlpManager from "../../abis/PhlpManager.json";
import IERC20Metadata from "../../abis/IERC20Metadata.json";

import phlp24Icon from "../../img/ic_phlp_24.svg";
import phlp40Icon from "../../img/ic_phlp_40.svg";
import arrowIcon from "../../img/ic_convert_down.svg";

import pls16Icon from "../../img/ic_pulsechain_16.svg";

import "./PhlpSwap.css";
import AssetDropdown from "../../views/Dashboard/AssetDropdown";

const { AddressZero } = ethers.constants;

export default function PhlpSwap(props) {
  const {
    savedSlippageAmount,
    isBuying,
    setPendingTxns,
    connectWallet,
    setIsBuying,
  } = props;
  const history = useHistory();
  const swapLabel = isBuying ? "BuyPhlp" : "SellPhlp";
  const tabLabel = isBuying ? "Buy PHLP" : "Sell PHLP";
  const { active, library, account } = useWeb3React();
  const { chainId } = useChainId();
  // const chainName = getChainName(chainId)
  const tokens = getTokens(chainId);
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);
  const [swapValue, setSwapValue] = useState("");
  const [phlpValue, setPhlpValue] = useState("");
  const [swapTokenAddress, setSwapTokenAddress] = useLocalStorageByChainId(
    chainId,
    `${swapLabel}-swap-token-address`,
    AddressZero
  );
  const [isApproving, setIsApproving] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anchorOnSwapAmount, setAnchorOnSwapAmount] = useState(true);
  const [feeBasisPoints, setFeeBasisPoints] = useState("");

  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const uiDataProviderAddress = getContract(chainId, "PhamousUiDataProvider");
  const vaultAddress = getContract(chainId, "Vault");
  const phlpAddress = getContract(chainId, "PHLP");
  const usdphAddress = getContract(chainId, "USDPH");
  const phlpManagerAddress = getContract(chainId, "PhlpManager");

  const tokensForBalanceAndSupplyQuery = [phlpAddress, usdphAddress];
  const tokenAddresses = tokens.map((token) => token.address);

  const { data: tokenBalances } = useSWR(
    [
      `PhlpSwap:getTokenBalances:${active}`,
      chainId,
      uiDataProviderAddress,
      "getTokenBalances",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, PhamousUiDataProvider, [tokenAddresses]),
    }
  );

  const { data: balancesAndSupplies } = useSWR(
    [
      `PhlpSwap:getTokenBalancesWithSupplies:${active}`,
      chainId,
      uiDataProviderAddress,
      "getTokenBalancesWithSupplies",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, PhamousUiDataProvider, [
        tokensForBalanceAndSupplyQuery,
      ]),
    }
  );

  const { data: aums } = useSWR(
    [`PhlpSwap:getAums:${active}`, chainId, phlpManagerAddress, "getAums"],
    {
      fetcher: fetcher(library, PhlpManager),
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

  const tokenAllowanceAddress =
    swapTokenAddress === AddressZero ? nativeTokenAddress : swapTokenAddress;
  const { data: tokenAllowance } = useSWR(
    [
      active,
      chainId,
      tokenAllowanceAddress,
      "allowance",
      account || PLACEHOLDER_ACCOUNT,
      phlpManagerAddress,
    ],
    {
      fetcher: fetcher(library, IERC20Metadata),
    }
  );

  const { data: lastPurchaseTime } = useSWR(
    [
      `PhlpSwap:lastPurchaseTime:${active}`,
      chainId,
      phlpManagerAddress,
      "lastAddedAt",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, PhlpManager),
    }
  );

  const { data: phlpBalance } = useSWR(
    [
      `PhlpSwap:phlpBalance:${active}`,
      chainId,
      phlpAddress,
      "balanceOf",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, IERC20Metadata),
    }
  );

  const redemptionTime = lastPurchaseTime
    ? lastPurchaseTime.add(PHLP_COOLDOWN_DURATION)
    : undefined;
  const inCooldownWindow =
    redemptionTime && parseInt(Date.now() / 1000) < redemptionTime;

  const phlpSupply = balancesAndSupplies
    ? balancesAndSupplies[1]
    : bigNumberify(0);
  let aum;
  if (aums && aums.length > 0) {
    aum = isBuying ? aums[0] : aums[1];
  }
  const usdphSupply = aum
    ? adjustForDecimals(aum, USD_DECIMALS, USDPH_DECIMALS)
    : bigNumberify(0);
  const phlpPrice =
    aum && aum.gt(0) && phlpSupply.gt(0)
      ? aum.mul(expandDecimals(1, PHLP_DECIMALS)).div(phlpSupply)
      : expandDecimals(1, USD_DECIMALS);
  let phlpBalanceUsd;
  if (phlpBalance) {
    phlpBalanceUsd = phlpBalance
      .mul(phlpPrice)
      .div(expandDecimals(1, PHLP_DECIMALS));
  }
  const phlpSupplyUsd = phlpSupply
    .mul(phlpPrice)
    .div(expandDecimals(1, PHLP_DECIMALS));

  const maxSellAmount = phlpBalance;

  const { infoTokens } = useInfoTokens(
    library,
    chainId,
    active,
    tokenBalances,
    undefined
  );
  const swapToken = getToken(chainId, swapTokenAddress);
  const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);

  const swapTokenBalance =
    swapTokenInfo && swapTokenInfo.balance
      ? swapTokenInfo.balance
      : bigNumberify(0);

  const swapAmount = parseValue(swapValue, swapToken && swapToken.decimals);
  const phlpAmount = parseValue(phlpValue, PHLP_DECIMALS);

  const needApproval =
    isBuying &&
    swapTokenAddress !== AddressZero &&
    tokenAllowance &&
    swapAmount &&
    swapAmount.gt(tokenAllowance);

  const swapUsdMin = getUsd(swapAmount, swapTokenAddress, false, infoTokens);
  const phlpUsdMax =
    phlpAmount && phlpPrice
      ? phlpAmount.mul(phlpPrice).div(expandDecimals(1, PHLP_DECIMALS))
      : undefined;

  let isSwapTokenCapReached;
  if (swapTokenInfo.managedUsd && swapTokenInfo.maxUsdphAmount) {
    isSwapTokenCapReached = swapTokenInfo.managedUsd.gt(
      adjustForDecimals(
        swapTokenInfo.maxUsdphAmount,
        USDPH_DECIMALS,
        USD_DECIMALS
      )
    );
  }

  const onSwapValueChange = (e) => {
    setAnchorOnSwapAmount(true);
    setSwapValue(e.target.value);
  };

  const onPhlpValueChange = (e) => {
    setAnchorOnSwapAmount(false);
    setPhlpValue(e.target.value);
  };

  const onSelectSwapToken = (token) => {
    setSwapTokenAddress(token.address);
    setIsWaitingForApproval(false);
  };

  useEffect(() => {
    const updateSwapAmounts = () => {
      if (anchorOnSwapAmount) {
        if (!swapAmount) {
          setPhlpValue("");
          setFeeBasisPoints("");
          return;
        }

        if (isBuying) {
          const { amount: nextAmount, feeBasisPoints: feeBps } =
            getBuyPhlpToAmount(
              swapAmount,
              swapTokenAddress,
              infoTokens,
              phlpPrice,
              usdphSupply,
              totalTokenWeights
            );
          const nextValue = formatAmountFree(
            nextAmount,
            PHLP_DECIMALS,
            PHLP_DECIMALS
          );
          setPhlpValue(nextValue);
          setFeeBasisPoints(feeBps);
        } else {
          const { amount: nextAmount, feeBasisPoints: feeBps } =
            getSellPhlpFromAmount(
              swapAmount,
              swapTokenAddress,
              infoTokens,
              phlpPrice,
              usdphSupply,
              totalTokenWeights
            );
          const nextValue = formatAmountFree(
            nextAmount,
            PHLP_DECIMALS,
            PHLP_DECIMALS
          );
          setPhlpValue(nextValue);
          setFeeBasisPoints(feeBps);
        }

        return;
      }

      if (!phlpAmount) {
        setSwapValue("");
        setFeeBasisPoints("");
        return;
      }

      if (swapToken) {
        if (isBuying) {
          const { amount: nextAmount, feeBasisPoints: feeBps } =
            getBuyPhlpFromAmount(
              phlpAmount,
              swapTokenAddress,
              infoTokens,
              phlpPrice,
              usdphSupply,
              totalTokenWeights
            );
          const nextValue = formatAmountFree(
            nextAmount,
            swapToken.decimals,
            swapToken.decimals
          );
          setSwapValue(nextValue);
          setFeeBasisPoints(feeBps);
        } else {
          const { amount: nextAmount, feeBasisPoints: feeBps } =
            getSellPhlpToAmount(
              phlpAmount,
              swapTokenAddress,
              infoTokens,
              phlpPrice,
              usdphSupply,
              totalTokenWeights,
              true
            );

          const nextValue = formatAmountFree(
            nextAmount,
            swapToken.decimals,
            swapToken.decimals
          );
          setSwapValue(nextValue);
          setFeeBasisPoints(feeBps);
        }
      }
    };

    updateSwapAmounts();
  }, [
    isBuying,
    anchorOnSwapAmount,
    swapAmount,
    phlpAmount,
    swapToken,
    swapTokenAddress,
    infoTokens,
    phlpPrice,
    usdphSupply,
    totalTokenWeights,
  ]);

  const switchSwapOption = (hash = "") => {
    history.push(`${history.location.pathname}#${hash}`);
    props.setIsBuying(hash !== "redeem");
  };

  const fillMaxAmount = () => {
    if (isBuying) {
      setAnchorOnSwapAmount(true);
      setSwapValue(
        formatAmountFree(
          swapTokenBalance,
          swapToken.decimals,
          swapToken.decimals
        )
      );
      return;
    }

    setAnchorOnSwapAmount(false);
    setPhlpValue(formatAmountFree(maxSellAmount, PHLP_DECIMALS, PHLP_DECIMALS));
  };

  const getError = () => {
    if (!isBuying && inCooldownWindow) {
      return [`Redemption time not yet reached`];
    }

    if (!swapAmount || swapAmount.eq(0)) {
      return ["Enter an amount"];
    }
    if (!phlpAmount || phlpAmount.eq(0)) {
      return ["Enter an amount"];
    }

    if (isBuying) {
      const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
      if (
        swapTokenInfo &&
        swapTokenInfo.balance &&
        swapAmount &&
        swapAmount.gt(swapTokenInfo.balance)
      ) {
        return [`Insufficient ${swapTokenInfo.symbol} balance`];
      }

      if (
        swapTokenInfo.maxUsdphAmount &&
        swapTokenInfo.managedUsd &&
        swapUsdMin
      ) {
        const nextUsdphAmount = adjustForDecimals(
          swapUsdMin.add(swapTokenInfo.managedUsd),
          USD_DECIMALS,
          USDPH_DECIMALS
        );
        if (
          swapTokenInfo.maxUsdphAmount.gt(0) &&
          nextUsdphAmount.gt(swapTokenInfo.maxUsdphAmount)
        ) {
          return [`${swapTokenInfo.symbol} pool exceeded`];
        }
      }
    }

    if (!isBuying) {
      if (maxSellAmount && phlpAmount && phlpAmount.gt(maxSellAmount)) {
        return [`Insufficient PHLP balance`];
      }

      const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
      if (
        swapTokenInfo &&
        swapTokenInfo.availableAmount &&
        swapAmount &&
        swapAmount.gt(swapTokenInfo.availableAmount)
      ) {
        return [`Insufficient liquidity`];
      }
    }

    return [false];
  };

  const isPrimaryEnabled = () => {
    if (!active) {
      return true;
    }
    const [error, modal] = getError();
    if (error && !modal) {
      return false;
    }
    if ((needApproval && isWaitingForApproval) || isApproving) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isSubmitting) {
      return false;
    }
    if (isBuying && isSwapTokenCapReached) {
      return false;
    }

    return true;
  };

  const getPrimaryText = () => {
    if (!active) {
      return "Connect Wallet";
    }
    const [error, modal] = getError();
    if (error && !modal) {
      return error;
    }
    if (isBuying && isSwapTokenCapReached) {
      return `Max Capacity for ${swapToken.symbol} Reached`;
    }

    if (needApproval && isWaitingForApproval) {
      return "Waiting for Approval";
    }
    if (isApproving) {
      return `Approving ${swapToken.symbol}...`;
    }
    if (needApproval) {
      return `Approve ${swapToken.symbol}`;
    }

    if (isSubmitting) {
      return isBuying ? `Buying...` : `Selling...`;
    }

    return isBuying ? "Buy PHLP" : "Sell PHLP";
  };

  const approveFromToken = () => {
    approveTokens({
      setIsApproving,
      library,
      tokenAddress: swapToken.address,
      spender: phlpManagerAddress,
      chainId: chainId,
      onApproveSubmitted: () => {
        setIsWaitingForApproval(true);
      },
      infoTokens,
      getTokenInfo,
    });
  };

  const buyPhlp = () => {
    setIsSubmitting(true);

    const minPhlp = phlpAmount
      .mul(BASIS_POINTS_DIVISOR - savedSlippageAmount)
      .div(BASIS_POINTS_DIVISOR);

    const contract = new ethers.Contract(
      phlpManagerAddress,
      PhlpManager.abi,
      library.getSigner()
    );
    const method =
      swapTokenAddress === AddressZero ? "addLiquidityETH" : "addLiquidity";
    const params =
      swapTokenAddress === AddressZero
        ? [0, minPhlp]
        : [swapTokenAddress, swapAmount, 0, minPhlp];
    const value = swapTokenAddress === AddressZero ? swapAmount : 0;

    callContract(chainId, contract, method, params, {
      value,
      sentMsg: "Buy submitted.",
      failMsg: "Buy failed.",
      successMsg: `${formatAmount(
        phlpAmount,
        PHLP_DECIMALS,
        4,
        true,
        undefined,
        0
      )} PHLP bought with ${formatAmount(
        swapAmount,
        swapTokenInfo.decimals,
        4,
        true,
        undefined,
        0
      )} ${swapTokenInfo.symbol}!`,
      setPendingTxns,
    })
      .then(async () => {})
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const sellPhlp = () => {
    setIsSubmitting(true);

    const minOut = swapAmount
      .mul(BASIS_POINTS_DIVISOR - savedSlippageAmount)
      .div(BASIS_POINTS_DIVISOR);

    const contract = new ethers.Contract(
      phlpManagerAddress,
      PhlpManager.abi,
      library.getSigner()
    );
    const method =
      swapTokenAddress === AddressZero
        ? "removeLiquidityETH"
        : "removeLiquidity";
    const params =
      swapTokenAddress === AddressZero
        ? [phlpAmount, minOut, account]
        : [swapTokenAddress, phlpAmount, minOut, account];

    callContract(chainId, contract, method, params, {
      sentMsg: "Sell submitted!",
      failMsg: "Sell failed.",
      successMsg: `${formatAmount(
        phlpAmount,
        PHLP_DECIMALS,
        4,
        true,
        undefined,
        0
      )} PHLP sold for ${formatAmount(
        swapAmount,
        swapTokenInfo.decimals,
        4,
        true,
        undefined,
        0
      )} ${swapTokenInfo.symbol}!`,
      setPendingTxns,
    })
      .then(async () => {})
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const onClickPrimary = () => {
    if (!active) {
      connectWallet();
      return;
    }

    if (needApproval) {
      approveFromToken();
      return;
    }

    const [, modal] = getError();

    if (modal) {
      return;
    }

    if (isBuying) {
      buyPhlp();
    } else {
      sellPhlp();
    }
  };

  const payLabel = "Pay";
  const receiveLabel = "Receive";
  let payBalance = "$0.00";
  let receiveBalance = "$0.00";
  if (isBuying) {
    if (swapUsdMin) {
      payBalance = `$${formatAmount(
        swapUsdMin,
        USD_DECIMALS,
        2,
        true,
        undefined,
        0
      )}`;
    }
    if (phlpUsdMax) {
      receiveBalance = `$${formatAmount(
        phlpUsdMax,
        USD_DECIMALS,
        2,
        true,
        undefined,
        0
      )}`;
    }
  } else {
    if (phlpUsdMax) {
      payBalance = `$${formatAmount(
        phlpUsdMax,
        USD_DECIMALS,
        2,
        true,
        undefined,
        0
      )}`;
    }
    if (swapUsdMin) {
      receiveBalance = `$${formatAmount(
        swapUsdMin,
        USD_DECIMALS,
        2,
        true,
        undefined,
        0
      )}`;
    }
  }

  const selectToken = (token) => {
    setAnchorOnSwapAmount(false);
    setSwapTokenAddress(token.address);
    setIsWaitingForApproval(false);
    helperToast.success(`${token.symbol} selected in order form`);
  };

  let feePercentageText = formatAmount(feeBasisPoints, 2, 2, true, "-", 0);
  if (feeBasisPoints !== undefined && feeBasisPoints.toString().length > 0) {
    feePercentageText += "%";
  }

  const onSwapOptionChange = (opt) => {
    if (opt === "Sell PHLP") {
      switchSwapOption("redeem");
    } else {
      switchSwapOption();
    }
  };

  return (
    <div className="PhlpSwap">
      <Title>{getPageTitle("PHLP")}</Title>
      <div className="PhlpSwap-content">
        <div className="App-card PhlpSwap-stats-card">
          <div className="App-card-title">
            <div className="App-card-title-mark">
              <div className="App-card-title-mark-icon">
                <img src={phlp40Icon} alt="PHLP" />
                {chainId === PLS_TESTNET_V2 ? (
                  <img
                    src={pls16Icon}
                    alt="PLS"
                    className="selected-network-symbol"
                  />
                ) : (
                  <img
                    src={pls16Icon}
                    alt="PLS"
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
              <div className="value">
                ${formatAmount(phlpPrice, USD_DECIMALS, 4, true)}
              </div>
            </div>
            <div className="App-card-row">
              <div className="label">Wallet</div>
              <div className="value">
                {formatAmount(
                  phlpBalance,
                  PHLP_DECIMALS,
                  4,
                  true,
                  undefined,
                  0
                )}{" "}
                PHLP ($
                {formatAmount(
                  phlpBalanceUsd,
                  USD_DECIMALS,
                  2,
                  true,
                  undefined,
                  0
                )}
                )
              </div>
            </div>
          </div>
          <div className="App-card-divider"></div>
          <div className="App-card-content">
            {/* <div className="App-card-row">
              <div className="label">APR</div>
              <div className="value">
                <Tooltip
                  handle={`${formatAmount(totalApr, 2, 2, true, undefined, 0)}%`}
                  position="right-bottom"
                  renderContent={() => {
                    return (
                      <>
                        <div className="Tooltip-row">
                          <span className="label">
                            {nativeTokenSymbol} ({wrappedTokenSymbol}) APR
                          </span>
                          <span>{formatAmount(0, 2, 2, true, undefined, 0)}%</span>
                        </div>
                      </>
                    );
                  }}
                />
              </div>
            </div> */}
            <div className="App-card-row">
              <div className="label">Total Supply</div>
              <div className="value">
                {formatAmount(phlpSupply, PHLP_DECIMALS, 4, true, undefined, 0)}{" "}
                PHLP ($
                {formatAmount(
                  phlpSupplyUsd,
                  USD_DECIMALS,
                  2,
                  true,
                  undefined,
                  0
                )}
                )
              </div>
            </div>
          </div>
        </div>
        <div className="PhlpSwap-box App-box">
          <Tab
            options={["Buy PHLP", "Sell PHLP"]}
            option={tabLabel}
            onChange={onSwapOptionChange}
            className="Exchange-swap-option-tabs"
          />
          {isBuying && (
            <BuyInputSection
              topLeftLabel={payLabel}
              topRightLabel={`Balance: `}
              tokenBalance={`${formatAmount(
                swapTokenBalance,
                swapToken.decimals,
                4,
                true,
                undefined,
                0
              )}`}
              inputValue={swapValue}
              onInputValueChange={onSwapValueChange}
              showMaxButton={
                swapValue !==
                formatAmountFree(
                  swapTokenBalance,
                  swapToken.decimals,
                  swapToken.decimals
                )
              }
              onClickTopRightLabel={fillMaxAmount}
              onClickMax={fillMaxAmount}
              selectedToken={swapToken}
              balance={payBalance}
            >
              <TokenSelector
                label="Pay"
                chainId={chainId}
                tokenAddress={swapTokenAddress}
                onSelectToken={onSelectSwapToken}
                tokens={whitelistedTokens}
                infoTokens={infoTokens}
                className="PhlpSwap-from-token"
                showSymbolImage={true}
                showTokenImgInDropdown={true}
              />
            </BuyInputSection>
          )}

          {!isBuying && (
            <BuyInputSection
              topLeftLabel={payLabel}
              topRightLabel={`Available: `}
              tokenBalance={`${formatAmount(
                maxSellAmount,
                PHLP_DECIMALS,
                4,
                true,
                undefined,
                0
              )}`}
              inputValue={phlpValue}
              onInputValueChange={onPhlpValueChange}
              showMaxButton={
                phlpValue !==
                formatAmountFree(maxSellAmount, PHLP_DECIMALS, PHLP_DECIMALS)
              }
              onClickTopRightLabel={fillMaxAmount}
              onClickMax={fillMaxAmount}
              balance={payBalance}
              defaultTokenName={"PHLP"}
            >
              <div className="selected-token">
                PHLP <img src={phlp24Icon} alt="PHLP" />
              </div>
            </BuyInputSection>
          )}

          <div className="AppOrder-ball-container">
            <div className="AppOrder-ball">
              <img
                src={arrowIcon}
                alt="arrowIcon"
                onClick={() => {
                  setIsBuying(!isBuying);
                  switchSwapOption(isBuying ? "redeem" : "");
                }}
              />
            </div>
          </div>

          {isBuying && (
            <BuyInputSection
              topLeftLabel={receiveLabel}
              topRightLabel={`Balance: `}
              tokenBalance={`${formatAmount(
                phlpBalance,
                PHLP_DECIMALS,
                4,
                true,
                undefined,
                0
              )}`}
              inputValue={phlpValue}
              onInputValueChange={onPhlpValueChange}
              balance={receiveBalance}
              defaultTokenName={"PHLP"}
            >
              <div className="selected-token">
                PHLP <img src={phlp24Icon} alt="PHLP" />
              </div>
            </BuyInputSection>
          )}

          {!isBuying && (
            <BuyInputSection
              topLeftLabel={receiveLabel}
              topRightLabel={`Balance: `}
              tokenBalance={`${formatAmount(
                swapTokenBalance,
                swapToken.decimals,
                4,
                true,
                undefined,
                0
              )}`}
              inputValue={swapValue}
              onInputValueChange={onSwapValueChange}
              balance={receiveBalance}
              selectedToken={swapToken}
            >
              <TokenSelector
                label="Receive"
                chainId={chainId}
                tokenAddress={swapTokenAddress}
                onSelectToken={onSelectSwapToken}
                tokens={whitelistedTokens}
                infoTokens={infoTokens}
                className="PhlpSwap-from-token"
                showSymbolImage={true}
                showTokenImgInDropdown={true}
              />
            </BuyInputSection>
          )}
          <div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">
                {feeBasisPoints > 50 ? "WARNING: High Fees" : "Fees"}
              </div>
              <div className="align-right fee-block">
                {isBuying && (
                  <Tooltip
                    handle={
                      isBuying && isSwapTokenCapReached
                        ? "NA"
                        : feePercentageText
                    }
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          {feeBasisPoints > 50 && (
                            <div>
                              To reduce fees, select a different asset to pay
                              with.
                            </div>
                          )}
                          Check the "Save on Fees" section below to get the
                          lowest fee percentages.
                        </>
                      );
                    }}
                  />
                )}
                {!isBuying && (
                  <Tooltip
                    handle={feePercentageText}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          {feeBasisPoints > 50 && (
                            <div>
                              To reduce fees, select a different asset to
                              receive.
                            </div>
                          )}
                          Check the "Save on Fees" section below to get the
                          lowest fee percentages.
                        </>
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="PhlpSwap-cta Exchange-swap-button-container">
            <button
              className="App-cta Exchange-swap-button"
              onClick={onClickPrimary}
              disabled={!isPrimaryEnabled()}
            >
              {getPrimaryText()}
            </button>
          </div>
        </div>
      </div>
      <div className="Tab-title-section">
        <div className="Page-title">Save on Fees</div>
        {isBuying && (
          <div className="Page-description">
            Fees may vary depending on which asset you use to buy PHLP.
            <br /> Enter the amount of PHLP you want to purchase in the order
            form, then check here to compare fees.
          </div>
        )}
        {!isBuying && (
          <div className="Page-description">
            Fees may vary depending on which asset you sell PHLP for.
            <br /> Enter the amount of PHLP you want to redeem in the order
            form, then check here to compare fees.
          </div>
        )}
      </div>
      <div className="PhlpSwap-token-list">
        {/* <div className="PhlpSwap-token-list-content"> */}
        <table className="token-table">
          <thead>
            <tr>
              <th>TOKEN</th>
              <th>PRICE</th>
              <th>
                {isBuying ? (
                  <Tooltip
                    handle={"AVAILABLE"}
                    tooltipIconPosition="right"
                    position="right-bottom text-none"
                    renderContent={() =>
                      "Available amount to deposit into PHLP."
                    }
                  />
                ) : (
                  <Tooltip
                    handle={"AVAILABLE"}
                    tooltipIconPosition="right"
                    position="right-bottom text-none"
                    renderContent={() => {
                      return (
                        <>
                          <div>Available amount to withdraw from PHLP.</div>
                          <div>
                            Funds not utilized by current open positions.
                          </div>
                        </>
                      );
                    }}
                  />
                )}
              </th>
              <th>WALLET</th>
              <th>
                <Tooltip
                  handle={"FEES"}
                  tooltipIconPosition="right"
                  position="right-bottom text-none"
                  renderContent={() => {
                    return (
                      <>
                        <div>
                          Fees will be shown once you have entered an amount in
                          the order form.
                        </div>
                      </>
                    );
                  }}
                />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tokenList.map((token) => {
              let tokenFeeBps;
              if (isBuying) {
                const { feeBasisPoints: feeBps } = getBuyPhlpFromAmount(
                  phlpAmount,
                  token.address,
                  infoTokens,
                  phlpPrice,
                  usdphSupply,
                  totalTokenWeights
                );
                tokenFeeBps = feeBps;
              } else {
                const { feeBasisPoints: feeBps } = getSellPhlpToAmount(
                  phlpAmount,
                  token.address,
                  infoTokens,
                  phlpPrice,
                  usdphSupply,
                  totalTokenWeights
                );
                tokenFeeBps = feeBps;
              }
              const tokenInfo = getTokenInfo(infoTokens, token.address);
              let managedUsd;
              if (tokenInfo && tokenInfo.managedUsd) {
                managedUsd = tokenInfo.managedUsd;
              }
              let availableAmountUsd;
              if (
                tokenInfo &&
                tokenInfo.minPrice &&
                tokenInfo.availableAmount
              ) {
                availableAmountUsd = tokenInfo.availableAmount
                  .mul(tokenInfo.minPrice)
                  .div(expandDecimals(1, token.decimals));
              }
              let balanceUsd;
              if (tokenInfo && tokenInfo.minPrice && tokenInfo.balance) {
                balanceUsd = tokenInfo.balance
                  .mul(tokenInfo.minPrice)
                  .div(expandDecimals(1, token.decimals));
              }
              const tokenImage = importTokenImage(token.symbol);
              const isCapReached = tokenInfo.managedUsd?.gt(
                tokenInfo.maxUsdphAmount.mul(
                  expandDecimals(1, USD_DECIMALS - USDPH_DECIMALS)
                )
              );

              let amountLeftToDeposit;
              if (tokenInfo.maxUsdphAmount && tokenInfo.maxUsdphAmount.gt(0)) {
                amountLeftToDeposit = adjustForDecimals(
                  tokenInfo.maxUsdphAmount,
                  USDPH_DECIMALS,
                  USD_DECIMALS
                ).sub(tokenInfo.managedUsd);
              }
              function renderFees() {
                switch (true) {
                  case (isBuying && isCapReached) ||
                    (!isBuying && managedUsd?.lt(1)):
                    return (
                      <Tooltip
                        handle="NA"
                        position="right-bottom"
                        renderContent={() => (
                          <div>
                            Max pool capacity reached for {tokenInfo.symbol}
                          </div>
                        )}
                      />
                    );
                  case (isBuying && !isCapReached) ||
                    (!isBuying && managedUsd?.gt(0)):
                    return `${formatAmount(tokenFeeBps, 2, 2, true, "-", 0)}${
                      tokenFeeBps !== undefined &&
                      tokenFeeBps.toString().length > 0
                        ? "%"
                        : ""
                    }`;
                  default:
                    return "";
                }
              }

              return (
                <tr key={token.symbol}>
                  <td>
                    <div className="App-card-title-info">
                      <div className="App-card-title-info-icon">
                        <img
                          src={tokenImage}
                          alt={token.symbol}
                          width="40px"
                          height="40px"
                        />
                      </div>
                      <div className="App-card-title-info-text">
                        <div className="App-card-info-title">{token.name}</div>
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
                    {isBuying && (
                      <div>
                        <Tooltip
                          handle={
                            amountLeftToDeposit && amountLeftToDeposit.lt(0)
                              ? "$0.00"
                              : `$${formatAmount(
                                  amountLeftToDeposit,
                                  USD_DECIMALS,
                                  2,
                                  true,
                                  undefined,
                                  0
                                )}`
                          }
                          position="right-bottom"
                          tooltipIconPosition="right"
                          renderContent={() => {
                            return (
                              <>
                                <div className="Tooltip-row">
                                  <span className="label">
                                    Current Pool Amount:
                                  </span>
                                  $
                                  {formatAmount(
                                    managedUsd,
                                    USD_DECIMALS,
                                    2,
                                    true,
                                    undefined,
                                    0
                                  )}{" "}
                                  (
                                  {formatKeyAmount(
                                    tokenInfo,
                                    "poolAmount",
                                    token.decimals,
                                    2,
                                    true,
                                    0
                                  )}{" "}
                                  {token.symbol})
                                </div>
                                <div className="Tooltip-row">
                                  <span className="label">
                                    Max Pool Capacity:
                                  </span>
                                  $
                                  {formatAmount(
                                    tokenInfo.maxUsdphAmount,
                                    USDPH_DECIMALS,
                                    0,
                                    true,
                                    undefined,
                                    0
                                  )}
                                </div>
                              </>
                            );
                          }}
                        />
                      </div>
                    )}
                    {!isBuying && (
                      <div>
                        <Tooltip
                          handle={
                            amountLeftToDeposit && amountLeftToDeposit.lt(0)
                              ? "$0.00"
                              : `$${formatAmount(
                                  availableAmountUsd,
                                  USD_DECIMALS,
                                  2,
                                  true,
                                  undefined,
                                  0
                                )}`
                          }
                          position="right-bottom"
                          tooltipIconPosition="right"
                          renderContent={() => {
                            return (
                              <>
                                <div className="Tooltip-row">
                                  <span className="label">
                                    Current Pool Amount:
                                  </span>
                                  {formatKeyAmount(
                                    tokenInfo,
                                    "poolAmount",
                                    token.decimals,
                                    2,
                                    true
                                  )}
                                  {token.symbol}
                                </div>
                                <div className="Tooltip-row">
                                  <span className="label">
                                    Max Pool Capacity:
                                  </span>
                                  $
                                  {formatAmount(
                                    tokenInfo.maxUsdphAmount,
                                    USDPH_DECIMALS,
                                    0,
                                    true,
                                    undefined,
                                    0
                                  )}
                                </div>
                              </>
                            );
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td>
                    {formatKeyAmount(
                      tokenInfo,
                      "balance",
                      tokenInfo.decimals,
                      2,
                      true
                    )}{" "}
                    {tokenInfo.symbol} ($
                    {formatAmount(
                      balanceUsd,
                      USD_DECIMALS,
                      2,
                      true,
                      undefined,
                      0
                    )}
                    )
                  </td>
                  <td>{renderFees()}</td>
                  <td>
                    <button
                      className={cx(
                        "App-button-option action-btn",
                        isBuying ? "buying" : "selling"
                      )}
                      onClick={() => selectToken(token)}
                    >
                      {isBuying
                        ? "Buy with " + token.symbol
                        : "Sell for " + token.symbol}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="token-grid">
          {tokenList.map((token) => {
            let tokenFeeBps;
            if (isBuying) {
              const { feeBasisPoints: feeBps } = getBuyPhlpFromAmount(
                phlpAmount,
                token.address,
                infoTokens,
                phlpPrice,
                usdphSupply,
                totalTokenWeights
              );
              tokenFeeBps = feeBps;
            } else {
              const { feeBasisPoints: feeBps } = getSellPhlpToAmount(
                phlpAmount,
                token.address,
                infoTokens,
                phlpPrice,
                usdphSupply,
                totalTokenWeights
              );
              tokenFeeBps = feeBps;
            }
            const tokenInfo = getTokenInfo(infoTokens, token.address);
            let managedUsd;
            if (tokenInfo && tokenInfo.managedUsd) {
              managedUsd = tokenInfo.managedUsd;
            }
            let availableAmountUsd;
            if (tokenInfo && tokenInfo.minPrice && tokenInfo.availableAmount) {
              availableAmountUsd = tokenInfo.availableAmount
                .mul(tokenInfo.minPrice)
                .div(expandDecimals(1, token.decimals));
            }
            let balanceUsd;
            if (tokenInfo && tokenInfo.minPrice && tokenInfo.balance) {
              balanceUsd = tokenInfo.balance
                .mul(tokenInfo.minPrice)
                .div(expandDecimals(1, token.decimals));
            }

            let amountLeftToDeposit;
            if (tokenInfo.maxUsdphAmount && tokenInfo.maxUsdphAmount.gt(0)) {
              amountLeftToDeposit = adjustForDecimals(
                tokenInfo.maxUsdphAmount,
                USDPH_DECIMALS,
                USD_DECIMALS
              ).sub(tokenInfo.managedUsd);
            }
            const isCapReached = tokenInfo.managedAmount?.gt(
              tokenInfo.maxUsdphAmount
            );

            function renderFees() {
              switch (true) {
                case (isBuying && isCapReached) ||
                  (!isBuying && managedUsd?.lt(1)):
                  return (
                    <Tooltip
                      handle="NA"
                      position="right-bottom"
                      renderContent={() =>
                        `Max pool capacity reached for ${tokenInfo.symbol}.`
                      }
                    />
                  );
                case (isBuying && !isCapReached) ||
                  (!isBuying && managedUsd?.gt(0)):
                  return `${formatAmount(tokenFeeBps, 2, 2, true, "-", 0)}${
                    tokenFeeBps !== undefined &&
                    tokenFeeBps.toString().length > 0
                      ? "%"
                      : ""
                  }`;
                default:
                  return "";
              }
            }
            const tokenImage = importTokenImage(token.symbol);
            return (
              <div className="App-card" key={token.symbol}>
                <div className="mobile-token-card">
                  <img
                    src={tokenImage}
                    alt={token.symbol}
                    width="20px"
                    height="20px"
                  />
                  <div className="token-symbol-text">{token.symbol}</div>
                  <div>
                    <AssetDropdown
                      assetSymbol={token.symbol}
                      assetInfo={token}
                    />
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
                  {isBuying && (
                    <div className="App-card-row">
                      <Tooltip
                        className="label"
                        handle="Available"
                        position="left-bottom"
                        renderContent={() =>
                          "Available amount to deposit into PHLP."
                        }
                      />
                      <div>
                        <Tooltip
                          handle={
                            amountLeftToDeposit &&
                            `$${formatAmount(
                              amountLeftToDeposit,
                              USD_DECIMALS,
                              2,
                              true,
                              undefined,
                              0
                            )}`
                          }
                          position="right-bottom"
                          tooltipIconPosition="right"
                          renderContent={() => {
                            return (
                              <>
                                <div className="Tooltip-row">
                                  <span className="label">
                                    Current Pool Amount:
                                  </span>
                                  $
                                  {formatAmount(
                                    managedUsd,
                                    USD_DECIMALS,
                                    2,
                                    true,
                                    undefined,
                                    0
                                  )}{" "}
                                  (
                                  {formatKeyAmount(
                                    tokenInfo,
                                    "poolAmount",
                                    token.decimals,
                                    2,
                                    true
                                  )}{" "}
                                  {token.symbol})
                                </div>
                                <div className="Tooltip-row">
                                  <span className="label">
                                    Max Pool Capacity:
                                  </span>
                                  $
                                  {formatAmount(
                                    tokenInfo.maxUsdphAmount,
                                    USDPH_DECIMALS,
                                    0,
                                    true,
                                    undefined,
                                    0
                                  )}
                                </div>
                              </>
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {!isBuying && (
                    <div className="App-card-row">
                      <div className="label">
                        <Tooltip
                          handle="Available"
                          position="left-bottom"
                          renderContent={() => {
                            return (
                              <>
                                <div>
                                  Available amount to withdraw from PHLP.
                                </div>
                                <div>
                                  Funds not utilized by current open positions.
                                </div>
                              </>
                            );
                          }}
                        />
                      </div>
                      <div>
                        <Tooltip
                          handle={
                            amountLeftToDeposit && amountLeftToDeposit.lt(0)
                              ? "$0.00"
                              : `$${formatAmount(
                                  availableAmountUsd,
                                  USD_DECIMALS,
                                  2,
                                  true,
                                  undefined,
                                  0
                                )}`
                          }
                          position="right-bottom"
                          tooltipIconPosition="right"
                          renderContent={() => {
                            return (
                              <>
                                <div className="Tooltip-row">
                                  <span className="label">
                                    Current Pool Amount:
                                  </span>
                                  {formatKeyAmount(
                                    tokenInfo,
                                    "poolAmount",
                                    token.decimals,
                                    2,
                                    true
                                  )}
                                  {token.symbol}
                                </div>
                                <div className="Tooltip-row">
                                  <span className="label">
                                    Max Pool Capacity:
                                  </span>
                                  $
                                  {formatAmount(
                                    tokenInfo.maxUsdphAmount,
                                    USDPH_DECIMALS,
                                    0,
                                    true,
                                    undefined,
                                    0
                                  )}
                                </div>
                              </>
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="App-card-row">
                    <div className="label">Wallet</div>
                    <div>
                      {formatKeyAmount(
                        tokenInfo,
                        "balance",
                        tokenInfo.decimals,
                        2,
                        true
                      )}{" "}
                      {tokenInfo.symbol} ($
                      {formatAmount(
                        balanceUsd,
                        USD_DECIMALS,
                        2,
                        true,
                        undefined,
                        0
                      )}
                      )
                    </div>
                  </div>
                  <div className="App-card-row">
                    <div className="label">
                      {tokenFeeBps ? (
                        "Fees"
                      ) : (
                        <Tooltip
                          handle="Fees"
                          renderContent={() =>
                            `Please enter an amount to see fee percentages`
                          }
                        />
                      )}
                    </div>
                    <div>{renderFees()}</div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-options">
                    {isBuying && (
                      <button
                        className="App-button-option App-card-option"
                        onClick={() => selectToken(token)}
                      >
                        Buy with {token.symbol}
                      </button>
                    )}
                    {!isBuying && (
                      <button
                        className="App-button-option App-card-option"
                        onClick={() => selectToken(token)}
                      >
                        Sell for {token.symbol}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
