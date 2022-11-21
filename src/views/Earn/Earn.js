import React, { useState } from "react";
import { Title } from "react-head";
import { useWeb3React } from "@web3-react/core";

import phameBigIcon from "../../img/ic_phame_custom.svg";
import phlpBigIcon from "../../img/ic_phlp_custom.svg";

import Modal from "../../components/Modal/Modal";
import TokenCard from "../../components/TokenCard/TokenCard";
import TooltipComponent from "../../components/Tooltip/Tooltip";
import Footer from "../../Footer";

import IERC20Metadata from "../../abis/IERC20Metadata.json";
import PhamousUiStakeDataProvider from "../../abis/PhamousUiStakeDataProvider.json";
import PhamousFeeDistribution from "../../abis/PhamousFeeDistribution.json";

import { ethers } from "ethers";
import {
  bigNumberify,
  toBigNumber,
  fetcher,
  formatAmount,
  formatAmountFree,
  parseValue,
  approveTokens,
  useChainId,
  PLACEHOLDER_ACCOUNT,
  USD_DECIMALS,
  importTokenImage,
  PHLP_DECIMALS,
  BASIS_POINTS_DIVISOR,
  getPageTitle,
} from "../../Helpers";
import { useInfoTokens, callContract } from "../../Api";

import useSWR from "swr";

import { getContract } from "../../Addresses";

import "./Earn.css";

export function processStakingData(stakingData, infoTokens) {
  const stakingTokenPrecision = stakingData
    ? stakingData.data.stakingTokenPrecision.toString().length - 1
    : 18;

  let userStakedPct = "";
  const userSeaCreature = {
    icon: "",
    name: "",
  };
  if (stakingData) {
    const pct = toBigNumber(stakingData.userData.stakedBalance)
      .div(toBigNumber(stakingData.data.totalSupply))
      .multipliedBy(100);
    if (pct.lte(0.000001)) {
      userSeaCreature.icon = "🐚";
      userSeaCreature.name = "Shell";
      userStakedPct = pct.toFixed(7);
    } else if (pct.lte(0.00001)) {
      userSeaCreature.icon = "🦐";
      userSeaCreature.name = "Shrimp";
      userStakedPct = pct.toFixed(6);
    } else if (pct.lte(0.0001)) {
      userSeaCreature.icon = "🦀";
      userSeaCreature.name = "Crab";
      userStakedPct = pct.toFixed(5);
    } else if (pct.lte(0.001)) {
      userSeaCreature.icon = "🐢";
      userSeaCreature.name = "Turtle";
      userStakedPct = pct.toFixed(4);
    } else if (pct.lte(0.01)) {
      userSeaCreature.icon = "🦑";
      userSeaCreature.name = "Squid";
      userStakedPct = pct.toFixed(3);
    } else if (pct.lte(0.1)) {
      userSeaCreature.icon = "🐬";
      userSeaCreature.name = "Dolphin";
      userStakedPct = pct.toFixed(2);
    } else if (pct.lte(1)) {
      userSeaCreature.icon = "🦈";
      userSeaCreature.name = "Shark";
      userStakedPct = pct.toFixed(2);
    } else if (pct.lte(10)) {
      userSeaCreature.icon = "🐋";
      userSeaCreature.name = "Whale";
      userStakedPct = pct.toFixed(2);
    } else {
      userSeaCreature.icon = "🔱";
      userSeaCreature.name = "Poseidon";
      userStakedPct = pct.toFixed(2);
    }
  }

  const rewards = [];
  let totalRewardsInUsd = toBigNumber(0);
  let plsUsdPrice;
  if (stakingData) {
    Object.values(infoTokens).forEach((tokenInfo) => {
      if (!tokenInfo.isNative) {
        let amount;
        if (stakingData) {
          const tokenReward = stakingData.userData.claimableRewards.filter(
            ({ token }) => token === tokenInfo.address
          );
          amount = tokenReward.length === 1 ? tokenReward[0].amount : undefined;
        }
        const tokenAmount = amount
          ? toBigNumber(amount).dividedBy(
              toBigNumber(10).exponentiatedBy(tokenInfo.decimals)
            )
          : undefined;
        const reward = {
          tokenSymbol: tokenInfo.symbol,
          amount: amount
            ? formatAmount(amount, tokenInfo.decimals, 2, true, undefined, 0)
            : "-",
          amountInUsd: "-",
        };
        if (tokenInfo.maxPrice && tokenAmount) {
          const price = toBigNumber(tokenInfo.maxPrice).dividedBy(
            toBigNumber(10).exponentiatedBy(USD_DECIMALS)
          );
          if (tokenInfo.symbol === "PLS") {
            plsUsdPrice = price;
          }
          const amountInUsd = tokenAmount.multipliedBy(price);
          reward.amountInUsd = formatAmount(
            amountInUsd.multipliedBy(1e4).toFixed(0),
            4,
            2,
            true,
            undefined,
            0
          );
          totalRewardsInUsd = totalRewardsInUsd.plus(amountInUsd);
        }
        rewards.push(reward);
      }
    });
  }
  let stakingTokenPrice;
  if (
    plsUsdPrice &&
    stakingData &&
    stakingData.data.stakingTokenTotalSupplyInPls.gt(0)
  ) {
    stakingTokenPrice = toBigNumber(
      stakingData.data.stakingTokenTotalSupplyInPls
    )
      .dividedBy(toBigNumber(stakingData.data.totalSupply))
      .dividedBy(toBigNumber(10).exponentiatedBy(18 - stakingTokenPrecision))
      .multipliedBy(plsUsdPrice);
  }
  return {
    stakingTokenPrecision: stakingTokenPrecision,
    stakingTokenPrice: stakingTokenPrice
      ? formatAmount(
          stakingTokenPrice.multipliedBy(1e4).toFixed(0),
          4,
          3,
          true,
          undefined,
          2
        )
      : "-",
    totalSupply: stakingData
      ? formatAmount(
          stakingData.data.totalSupply,
          stakingTokenPrecision,
          0,
          true,
          undefined,
          0
        )
      : "55,555,000",
    totalSupplyInUsd: stakingTokenPrice
      ? formatAmount(
          toBigNumber(stakingData ? stakingData.data.totalSupply : 55_555_000)
            .multipliedBy(stakingTokenPrice)
            .toFixed(0),
          stakingTokenPrecision,
          0,
          true,
          undefined,
          0
        )
      : "-",
    totalStakedSupply: stakingData
      ? formatAmount(
          stakingData.data.totalStakedSupply,
          stakingTokenPrecision,
          0,
          true,
          undefined,
          0
        )
      : "-",
    totalStakedSupplyInUsd:
      stakingTokenPrice && stakingData
        ? formatAmount(
            toBigNumber(stakingData.data.totalStakedSupply)
              .multipliedBy(stakingTokenPrice)
              .toFixed(0),
            stakingTokenPrecision,
            0,
            true,
            undefined,
            0
          )
        : "-",
    totalStakedPercentage: stakingData
      ? toBigNumber(stakingData.data.totalStakedSupply)
          .dividedBy(toBigNumber(stakingData.data.totalSupply))
          .multipliedBy(100)
          .toFixed(2)
      : "-",
    stakeAPR: stakingData
      ? toBigNumber(stakingData.data.rewardDurationReturn)
          .multipliedBy(3600 * 24 * 365)
          .dividedBy(toBigNumber(stakingData.data.rewardDuration))
          .dividedBy("1e16")
          .toFixed(2)
      : "-",
    stakeUnlockDays: stakingData
      ? stakingData.data.unstakeDuration.toNumber() / 24 / 3600
      : 14,
    stakeWithdrawDays: stakingData
      ? stakingData.data.withdrawDuration.toNumber() / 24 / 3600
      : 7,

    userWalletBalance: stakingData
      ? formatAmount(
          stakingData.userData.walletBalance,
          stakingTokenPrecision,
          2,
          true,
          undefined,
          0
        )
      : "-",
    userWalletBalanceInUsd:
      stakingTokenPrice && stakingData
        ? formatAmount(
            toBigNumber(stakingData.userData.walletBalance)
              .multipliedBy(stakingTokenPrice)
              .toFixed(0),
            stakingTokenPrecision,
            2,
            true,
            undefined,
            0
          )
        : "-",
    userStakedBalance: stakingData
      ? formatAmount(
          stakingData.userData.stakedBalance,
          stakingTokenPrecision,
          2,
          true,
          undefined,
          0
        )
      : "-",
    userStakedBalanceInUsd:
      stakingTokenPrice && stakingData
        ? formatAmount(
            toBigNumber(stakingData.userData.stakedBalance)
              .multipliedBy(stakingTokenPrice)
              .toFixed(0),
            stakingTokenPrecision,
            2,
            true,
            undefined,
            0
          )
        : "-",
    userStakeBalanceInUsdValue:
      stakingTokenPrice && stakingData
        ? toBigNumber(stakingData.userData.stakedBalance)
            .multipliedBy(stakingTokenPrice)
            .dividedBy(toBigNumber(10).exponentiatedBy(stakingTokenPrecision))
        : undefined,
    userStakedPct: userStakedPct,
    userSeaCreature: userSeaCreature,
    userUnstakedBalance: stakingData
      ? formatAmount(
          stakingData.userData.unstakedBalance,
          stakingTokenPrecision,
          2,
          true,
          undefined,
          0
        )
      : "-",
    userUnstakedBalanceInUsd:
      stakingTokenPrice && stakingData
        ? formatAmount(
            toBigNumber(stakingData.userData.unstakedBalance)
              .multipliedBy(stakingTokenPrice)
              .toFixed(0),
            stakingTokenPrecision,
            2,
            true,
            undefined,
            0
          )
        : "-",
    userWithdrawableBalance: stakingData
      ? formatAmount(
          stakingData.userData.withdrawableBalance,
          stakingTokenPrecision,
          2,
          true,
          undefined,
          0
        )
      : "-",
    userWithdrawableBalanceInUsd:
      stakingTokenPrice && stakingData
        ? formatAmount(
            toBigNumber(stakingData.userData.withdrawableBalance)
              .multipliedBy(stakingTokenPrice)
              .toFixed(0),
            stakingTokenPrecision,
            2,
            true,
            undefined,
            0
          )
        : "-",
    userCanClaim: stakingData
      ? stakingData.userData.claimableRewards.some(({ amount }) => amount.gt(0))
      : false,
    userCanStake: stakingData
      ? stakingData.userData.walletBalance.gt(0)
      : false,
    userCanUnstake: stakingData
      ? stakingData.userData.stakedBalance.gt(0) &&
        stakingData.userData.unstakedBalance.eq(0) &&
        stakingData.userData.withdrawableBalance.eq(0)
      : false,
    userCanCancel: stakingData
      ? stakingData.userData.unstakedBalance.gt(0)
      : false,
    userCanWithdraw: stakingData
      ? stakingData.userData.withdrawableBalance.gt(0)
      : false,
    userWithdrawTimestamp: stakingData
      ? new Date(
          stakingData.userData.withdrawTimestamp.toNumber() * 1000
        ).toLocaleString()
      : "-",
    userExpirationTimestamp: stakingData
      ? new Date(
          stakingData.userData.expirationTimestamp.toNumber() * 1000
        ).toLocaleString()
      : "-",
    userRewards: rewards,
    userTotalRewardsInUsd: formatAmount(
      totalRewardsInUsd
        .multipliedBy(toBigNumber(10).exponentiatedBy(USD_DECIMALS))
        .toFixed(0),
      USD_DECIMALS,
      totalRewardsInUsd.gt(1) ? 2 : 10,
      true,
      undefined,
      0
    ),
  };
}

export function processPhlpData(phlpData, infoTokens) {
  let pct;
  let userPct = "";
  const userSeaCreature = {
    icon: "",
    name: "",
  };
  if (phlpData) {
    pct = toBigNumber(phlpData.walletBalance)
      .div(toBigNumber(phlpData.totalSupply))
      .multipliedBy(100);
    if (pct.lte(0.000001)) {
      userSeaCreature.icon = "🐚";
      userSeaCreature.name = "Shell";
      userPct = pct.toFixed(7);
    } else if (pct.lte(0.00001)) {
      userSeaCreature.icon = "🦐";
      userSeaCreature.name = "Shrimp";
      userPct = pct.toFixed(6);
    } else if (pct.lte(0.0001)) {
      userSeaCreature.icon = "🦀";
      userSeaCreature.name = "Crab";
      userPct = pct.toFixed(5);
    } else if (pct.lte(0.001)) {
      userSeaCreature.icon = "🐢";
      userSeaCreature.name = "Turtle";
      userPct = pct.toFixed(4);
    } else if (pct.lte(0.01)) {
      userSeaCreature.icon = "🦑";
      userSeaCreature.name = "Squid";
      userPct = pct.toFixed(3);
    } else if (pct.lte(0.1)) {
      userSeaCreature.icon = "🐬";
      userSeaCreature.name = "Dolphin";
      userPct = pct.toFixed(2);
    } else if (pct.lte(1)) {
      userSeaCreature.icon = "🦈";
      userSeaCreature.name = "Shark";
      userPct = pct.toFixed(2);
    } else if (pct.lte(10)) {
      userSeaCreature.icon = "🐋";
      userSeaCreature.name = "Whale";
      userPct = pct.toFixed(2);
    } else {
      userSeaCreature.icon = "🔱";
      userSeaCreature.name = "Poseidon";
      userPct = pct.toFixed(2);
    }
  }

  let price;
  if (phlpData && phlpData.totalSupply.gt(0) && phlpData.aums[0].gt(0)) {
    price = toBigNumber(phlpData.aums[0])
      .multipliedBy(toBigNumber(10).exponentiatedBy(PHLP_DECIMALS))
      .dividedBy(toBigNumber(phlpData.totalSupply));
  }
  const compositions = [];
  if (infoTokens) {
    let totalUsdphSupply = bigNumberify(0);
    Object.values(infoTokens).forEach((tokenInfo) => {
      if (!tokenInfo.isNative && tokenInfo.usdphAmount) {
        totalUsdphSupply = totalUsdphSupply.add(tokenInfo.usdphAmount);
      }
    });
    Object.values(infoTokens).forEach((tokenInfo) => {
      if (!tokenInfo.isNative) {
        compositions.push({
          tokenSymbol: tokenInfo.symbol,
          amount:
            tokenInfo.managedAmount && pct
              ? formatAmount(
                  toBigNumber(tokenInfo.managedAmount)
                    .multipliedBy(pct)
                    .dividedBy(100)
                    .toFixed(0),
                  tokenInfo.decimals,
                  2,
                  true,
                  undefined,
                  0
                )
              : "-",
          amountInUsd:
            tokenInfo.managedUsd && pct
              ? formatAmount(
                  toBigNumber(tokenInfo.managedUsd)
                    .multipliedBy(pct)
                    .dividedBy(100)
                    .toFixed(0),
                  USD_DECIMALS,
                  2,
                  true,
                  undefined,
                  0
                )
              : "-",
          weight:
            tokenInfo.usdphAmount && totalUsdphSupply.gt(0)
              ? formatAmount(
                  tokenInfo.usdphAmount
                    .mul(BASIS_POINTS_DIVISOR)
                    .div(totalUsdphSupply),
                  2,
                  2,
                  true,
                  undefined,
                  0
                )
              : "-",
        });
      }
    });
  }

  return {
    price: price
      ? formatAmount(price.toFixed(0), USD_DECIMALS, 3, true, undefined, 2)
      : "1.000",
    totalSupply: phlpData
      ? formatAmount(phlpData.totalSupply, PHLP_DECIMALS, 0, true, undefined, 0)
      : "-",
    totalSupplyInUsd:
      price && phlpData
        ? formatAmount(
            toBigNumber(phlpData.totalSupply).multipliedBy(price).toFixed(0),
            USD_DECIMALS + PHLP_DECIMALS,
            0,
            true,
            undefined,
            0
          )
        : "-",
    userWalletBalance: phlpData
      ? formatAmount(
          phlpData.walletBalance,
          PHLP_DECIMALS,
          2,
          true,
          undefined,
          0
        )
      : "-",
    userWalletBalanceInUsd:
      price && phlpData
        ? formatAmount(
            toBigNumber(phlpData.walletBalance).multipliedBy(price).toFixed(0),
            USD_DECIMALS + PHLP_DECIMALS,
            2,
            true,
            undefined,
            0
          )
        : "-",
    userWalletBalanceInUsdValue:
      price && phlpData
        ? toBigNumber(phlpData.walletBalance)
            .multipliedBy(price)
            .dividedBy(
              toBigNumber(10).exponentiatedBy(USD_DECIMALS + PHLP_DECIMALS)
            )
        : undefined,
    userPct: userPct,
    userSeaCreature: userSeaCreature,
    compositions: compositions,
  };
}

function StakeInfo(props) {
  return (
    <>
      Unstaking Your PHAME token will incur a two-week unlocking period. You can
      only withdraw your PHAME after the unlocking period ends and the withdraw
      window is then activated.
      <br></br>
      <br></br>
      Once unstaking is initiated no additional unstaking is permitted until the
      end of the unstaking period. You may cancel unstaking at anytime, but you
      would then need to restart the two-week period to adjust your unstake
      amount.
      <br></br>
      <br></br>
      Should you forget and not withdraw your PHAME during the withdraw window,
      unstaking will end automatically.
      <br></br>
      <br></br>
      Locked and withdrawable PHAME are still staked, counted in the staked
      balance, and earning fees.
    </>
  );
}

function StakeModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    description,
    maxAmount,
    value,
    setValue,
    active,
    account,
    library,
    stakingTokenSymbol,
    stakingTokenAddress,
    feeDistributionAddress,
    setPendingTxns,
  } = props;
  const [isStaking, setIsStaking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const { data: tokenAllowance } = useSWR(
    active &&
      stakingTokenAddress && [
        active,
        chainId,
        stakingTokenAddress,
        "allowance",
        account,
        feeDistributionAddress,
      ],
    {
      fetcher: fetcher(library, IERC20Metadata),
    }
  );

  let amount = parseValue(value, 18);
  const needApproval = tokenAllowance && amount && amount.gt(tokenAllowance);

  const getError = () => {
    if (!amount || amount.eq(0)) {
      return "Enter an amount";
    }
    if (maxAmount && amount.gt(maxAmount)) {
      return "Max amount exceeded";
    }
  };

  const onClickPrimary = () => {
    if (needApproval) {
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: stakingTokenAddress,
        spender: feeDistributionAddress,
        chainId,
      });
      return;
    }

    setIsStaking(true);
    const contract = new ethers.Contract(
      feeDistributionAddress,
      PhamousFeeDistribution.abi,
      library.getSigner()
    );

    callContract(chainId, contract, "stake", [amount], {
      sentMsg: "Stake submitted!",
      failMsg: "Stake failed.",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsStaking(false);
      });
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isStaking) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isApproving) {
      return `Approving ${stakingTokenSymbol}...`;
    }
    if (needApproval) {
      return `Approve ${stakingTokenSymbol}`;
    }
    if (isStaking) {
      return "Staking...";
    }
    return "Stake";
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <div style={{ marginBottom: "1rem" }}>{description}</div>
        <div className="Exchange-swap-section">
          <div className="Exchange-swap-section-top">
            <div className="muted">
              <div className="Exchange-swap-usd">Stake</div>
            </div>
            <div
              className="muted align-right clickable"
              onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}
            >
              Max: {formatAmount(maxAmount, 18, 4, true)}
            </div>
          </div>
          <div className="Exchange-swap-section-bottom">
            <div>
              <input
                type="number"
                placeholder="0.0"
                className="Exchange-swap-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="PositionEditor-token-symbol">
              {stakingTokenSymbol}
            </div>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button
            className="App-cta Exchange-swap-button"
            onClick={onClickPrimary}
            disabled={!isPrimaryEnabled()}
          >
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function UnstakeModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    description,
    maxAmount,
    value,
    setValue,
    library,
    unstakingTokenSymbol,
    feeDistributionAddress,
    setPendingTxns,
  } = props;
  const [isUnstaking, setIsUnstaking] = useState(false);

  let amount = parseValue(value, 18);
  const getError = () => {
    if (!amount) {
      return "Enter an amount";
    }
    if (amount.gt(maxAmount)) {
      return "Max amount exceeded";
    }
  };

  const onClickPrimary = () => {
    setIsUnstaking(true);
    const contract = new ethers.Contract(
      feeDistributionAddress,
      PhamousFeeDistribution.abi,
      library.getSigner()
    );
    callContract(chainId, contract, "unstake", [amount], {
      sentMsg: "Unstake submitted!",
      failMsg: "Unstake failed.",
      successMsg: "Unstake completed!",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsUnstaking(false);
      });
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isUnstaking) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isUnstaking) {
      return "Unstaking...";
    }
    return "Unstake";
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <div style={{ marginBottom: "1rem" }}>{description}</div>
        <div className="Exchange-swap-section">
          <div className="Exchange-swap-section-top">
            <div className="muted">
              <div className="Exchange-swap-usd">Unstake</div>
            </div>
            <div
              className="muted align-right clickable"
              onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}
            >
              Max: {formatAmount(maxAmount, 18, 4, true)}
            </div>
          </div>
          <div className="Exchange-swap-section-bottom">
            <div>
              <input
                type="number"
                placeholder="0.0"
                className="Exchange-swap-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="PositionEditor-token-symbol">
              {unstakingTokenSymbol}
            </div>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button
            className="App-cta Exchange-swap-button"
            onClick={onClickPrimary}
            disabled={!isPrimaryEnabled()}
          >
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function CancelUnlockingModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    description,
    library,
    feeDistributionAddress,
    setPendingTxns,
  } = props;
  const [isCanceling, setIsCanceling] = useState(false);

  const onClickPrimary = () => {
    setIsCanceling(true);
    const contract = new ethers.Contract(
      feeDistributionAddress,
      PhamousFeeDistribution.abi,
      library.getSigner()
    );

    callContract(chainId, contract, "cancelUnstake", [], {
      sentMsg: "Unlocking cancellation submitted.",
      failMsg: "Unlocking cancellation failed.",
      successMsg: "Canceled!",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsCanceling(false);
      });
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <div style={{ marginBottom: "1rem" }}>{description}</div>
        <div className="Exchange-swap-button-container">
          <button
            className="App-cta Exchange-swap-button"
            onClick={onClickPrimary}
            disabled={isCanceling}
          >
            {!isCanceling && "Confirm Cancellation"}
            {isCanceling && "Confirming..."}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function WithdrawModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    description,
    library,
    feeDistributionAddress,
    setPendingTxns,
  } = props;
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const onClickPrimary = () => {
    setIsWithdrawing(true);
    const contract = new ethers.Contract(
      feeDistributionAddress,
      PhamousFeeDistribution.abi,
      library.getSigner()
    );

    callContract(chainId, contract, "withdraw", [], {
      sentMsg: "Withdraw submitted.",
      failMsg: "Withdraw failed.",
      successMsg: "Withdrawn!",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsWithdrawing(false);
      });
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <div style={{ marginBottom: "1rem" }}>{description}</div>
        <div className="Exchange-swap-button-container">
          <button
            className="App-cta Exchange-swap-button"
            onClick={onClickPrimary}
            disabled={isWithdrawing}
          >
            {!isWithdrawing && "Confirm withdraw"}
            {isWithdrawing && "Confirming..."}
          </button>
        </div>
      </Modal>
    </div>
  );
}
function ClaimModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    description,
    library,
    feeDistributionAddress,
    setPendingTxns,
  } = props;
  const [isClaiming, setIsClaiming] = useState(false);

  const onClickPrimary = () => {
    setIsClaiming(true);
    const contract = new ethers.Contract(
      feeDistributionAddress,
      PhamousFeeDistribution.abi,
      library.getSigner()
    );

    callContract(chainId, contract, "getReward", [], {
      sentMsg: "Claim submitted.",
      failMsg: "Claim failed.",
      successMsg: "Claim completed!",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsClaiming(false);
      });
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <div style={{ marginBottom: "1rem" }}>{description}</div>
        <div className="Exchange-swap-button-container">
          <button
            className="App-cta Exchange-swap-button"
            onClick={onClickPrimary}
            disabled={isClaiming}
          >
            {!isClaiming && "Claim"}
            {isClaiming && "Claiming..."}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function Earn({ setPendingTxns, connectWallet }) {
  const { active, library, account } = useWeb3React();
  const { chainId } = useChainId();

  const dataProviderAddress = getContract(
    chainId,
    "PhamousUiStakeDataProvider"
  );
  const feeDistributionAddress = getContract(chainId, "PhamousFeeDistribution");
  const addressesProviderAddress = getContract(chainId, "AddressesProvider");
  const phameAddress = getContract(chainId, "PHAME");

  const { data: stakingData } = useSWR(
    [
      `Stake:data:${active}`,
      chainId,
      dataProviderAddress,
      "getStakingUserData",
      feeDistributionAddress,
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, PhamousUiStakeDataProvider),
    }
  );
  const { data: phlpData } = useSWR(
    [
      `Stake:phlp:${active}`,
      chainId,
      dataProviderAddress,
      "getPhlpUserData",
      addressesProviderAddress,
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, PhamousUiStakeDataProvider),
    }
  );
  const { infoTokens } = useInfoTokens(
    library,
    chainId,
    active,
    undefined,
    undefined
  );
  const processedStakingData = processStakingData(stakingData, infoTokens);
  const processedPhlpData = processPhlpData(phlpData, infoTokens);

  const [isStakeModalVisible, setIsStakeModalVisible] = useState(false);
  const [stakeModalMaxAmount, setStakeModalMaxAmount] = useState(undefined);
  const [stakeValue, setStakeValue] = useState("");
  const showStakeModal = () => {
    setIsStakeModalVisible(true);
    setStakeModalMaxAmount(
      stakingData ? stakingData.userData.walletBalance : 0
    );
  };

  const [isUnstakeModalVisible, setIsUnstakeModalVisible] = useState(false);
  const [unstakeModalMaxAmount, setUnstakeModalMaxAmount] = useState(undefined);
  const [unstakeValue, setUnstakeValue] = useState("");
  const showUnstakeModal = () => {
    setIsUnstakeModalVisible(true);
    setUnstakeModalMaxAmount(
      stakingData ? stakingData.userData.stakedBalance : 0
    );
  };

  const [isCancelUnlockingModalVisible, setIsCancelUnlockingModalVisible] =
    useState(false);
  const showCancelUnlockingModal = () => {
    setIsCancelUnlockingModalVisible(true);
  };

  const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false);
  const showWithdrawModal = () => {
    setIsWithdrawModalVisible(true);
  };

  const [isClaimModalVisible, setIsClaimModalVisible] = useState(false);
  const showClaimModal = () => {
    setIsClaimModalVisible(true);
  };

  return (
    <div className="default-container page-layout">
      <Title>{getPageTitle("Earn")}</Title>
      <StakeModal
        isVisible={isStakeModalVisible}
        setIsVisible={setIsStakeModalVisible}
        chainId={chainId}
        title={"Stake PHAME"}
        description={"You can stake PHAME for protocol revenue sharing."}
        maxAmount={stakeModalMaxAmount}
        value={stakeValue}
        setValue={setStakeValue}
        active={active}
        account={account}
        library={library}
        stakingTokenSymbol={"PHAME"}
        stakingTokenAddress={phameAddress}
        feeDistributionAddress={feeDistributionAddress}
        setPendingTxns={setPendingTxns}
      />
      <UnstakeModal
        isVisible={isUnstakeModalVisible}
        setIsVisible={setIsUnstakeModalVisible}
        chainId={chainId}
        title={"Unstake PHAME"}
        description={<StakeInfo />}
        maxAmount={unstakeModalMaxAmount}
        value={unstakeValue}
        setValue={setUnstakeValue}
        library={library}
        unstakingTokenSymbol={"PHAME"}
        feeDistributionAddress={feeDistributionAddress}
        setPendingTxns={setPendingTxns}
      />
      <CancelUnlockingModal
        isVisible={isCancelUnlockingModalVisible}
        setIsVisible={setIsCancelUnlockingModalVisible}
        chainId={chainId}
        title={"Cancel Unlocking PHAME"}
        description={<StakeInfo />}
        library={library}
        feeDistributionAddress={feeDistributionAddress}
        setPendingTxns={setPendingTxns}
      />
      <WithdrawModal
        isVisible={isWithdrawModalVisible}
        setIsVisible={setIsWithdrawModalVisible}
        chainId={chainId}
        title={"Withdraw PHAME"}
        description={<StakeInfo />}
        library={library}
        feeDistributionAddress={feeDistributionAddress}
        setPendingTxns={setPendingTxns}
      />
      <ClaimModal
        isVisible={isClaimModalVisible}
        setIsVisible={setIsClaimModalVisible}
        chainId={chainId}
        title={"Claim Rewards"}
        description={
          "Claiming will transfer any pending rewards to your wallet."
        }
        library={library}
        feeDistributionAddress={feeDistributionAddress}
        setPendingTxns={setPendingTxns}
      />
      <div className="BuyPHAMEPHLP-container default-container">
        <TokenCard />
        <div className="PHAMEPHLP-Assets">
          Your Assets on Phamous:{" "}
          {processedStakingData.userStakeBalanceInUsdValue &&
          processedPhlpData.userWalletBalanceInUsdValue ? (
            <TooltipComponent
              handle={`$${formatAmount(
                processedStakingData.userStakeBalanceInUsdValue
                  .plus(processedPhlpData.userWalletBalanceInUsdValue)
                  .multipliedBy(toBigNumber(10).exponentiatedBy(USD_DECIMALS))
                  .toFixed(0),
                USD_DECIMALS,
                2,
                true,
                undefined,
                0
              )}`}
              position="right-bottom"
              renderContent={() => {
                return (
                  <>
                    <div className="Tooltip-row">
                      <span className="label">Staked PHAME:</span>$
                      {formatAmount(
                        processedStakingData.userStakeBalanceInUsdValue
                          .multipliedBy(
                            toBigNumber(10).exponentiatedBy(USD_DECIMALS)
                          )
                          .toFixed(0),
                        USD_DECIMALS,
                        2,
                        true,
                        undefined,
                        0
                      )}
                    </div>
                    <div className="Tooltip-row">
                      <span className="label">PHLP in Wallet:</span>$
                      {formatAmount(
                        processedPhlpData.userWalletBalanceInUsdValue
                          .multipliedBy(
                            toBigNumber(10).exponentiatedBy(USD_DECIMALS)
                          )
                          .toFixed(0),
                        USD_DECIMALS,
                        2,
                        true,
                        undefined,
                        0
                      )}
                    </div>
                  </>
                );
              }}
            />
          ) : (
            "-"
          )}
        </div>
      </div>
      <div className="Stake-content">
        <div className="Stake-cards">
          <div className="App-card">
            <div className="App-card-title">
              PHAME
              <img src={phameBigIcon} alt={"PHAME"} width="21px" />
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Price</div>
                <div>${processedStakingData.stakingTokenPrice}</div>
              </div>
              <div className="App-card-row">
                <div className="label">Total Supply</div>
                <div>
                  {processedStakingData.totalSupply}
                  {" PHAME ($"}
                  {processedStakingData.totalSupplyInUsd}
                  {")"}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Total Staked</div>
                <div>
                  {processedStakingData.totalStakedSupply}
                  {" PHAME ($"}
                  {processedStakingData.totalStakedSupplyInUsd}
                  {")"}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Staked Percentage</div>
                <div>
                  {processedStakingData.totalStakedPercentage}
                  {" %"}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Staking APR</div>
                <div>
                  {processedStakingData.stakeAPR}
                  {" %"}
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">Unlocking Period</div>
                <div>
                  {processedStakingData.stakeUnlockDays}
                  {" Days"}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Withdraw Window</div>
                <div>
                  {processedStakingData.stakeWithdrawDays}
                  {" Days"}
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">Wallet</div>
                <div>
                  {processedStakingData.userWalletBalance}
                  {" PHAME ($"}
                  {processedStakingData.userWalletBalanceInUsd}
                  {")"}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Staked</div>
                <div>
                  {processedStakingData.userStakedBalance}
                  {" PHAME ($"}
                  {processedStakingData.userStakedBalanceInUsd}
                  {")"}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label sublabel">
                  {processedStakingData.userSeaCreature.icon}
                  {processedStakingData.userSeaCreature.name}
                </div>
                <div>
                  {processedStakingData.userStakedPct}
                  {" %"}
                </div>
              </div>
              {processedStakingData.userCanCancel && (
                <>
                  <div className="App-card-row">
                    <div className="label">Unlocking</div>
                    <div>
                      {processedStakingData.userUnstakedBalance}
                      {" PHAME ($"}
                      {processedStakingData.userUnstakedBalanceInUsd}
                      {")"}
                    </div>
                  </div>
                  <div className="App-card-row">
                    <div className="label sublabel">Withdrawable After</div>
                    <div>{processedStakingData.userWithdrawTimestamp}</div>
                  </div>
                </>
              )}
              {processedStakingData.userCanWithdraw && (
                <>
                  <div className="App-card-row">
                    <div className="label">Withdrawable</div>
                    <div>
                      {processedStakingData.userWithdrawableBalance}
                      {" PHAME ($"}
                      {processedStakingData.userWithdrawableBalanceInUsd}
                      {")"}
                    </div>
                  </div>
                  <div className="App-card-row">
                    <div className="label sublabel">Expire After</div>
                    <div>{processedStakingData.userExpirationTimestamp}</div>
                  </div>
                </>
              )}
              <div className="App-card-bottom-placeholder">
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  <button className="default-btn staking-btn">Stake</button>
                  {active && processedStakingData.userCanUnstake && (
                    <button className="default-btn staking-btn">Unstake</button>
                  )}
                  {active && processedStakingData.userCanCancel && (
                    <button className="default-btn staking-btn">
                      Cancel Unlocking
                    </button>
                  )}
                  {active && processedStakingData.userCanWithdraw && (
                    <button className="default-btn staking-btn">
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
              <div className="App-card-bottom">
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  <button
                    className="default-btn staking-btn"
                    onClick={() => showStakeModal()}
                    disabled={!active || !processedStakingData.userCanStake}
                  >
                    Stake
                  </button>
                  {active && processedStakingData.userCanUnstake && (
                    <button
                      className="default-btn staking-btn"
                      onClick={() => showUnstakeModal()}
                    >
                      Unstake
                    </button>
                  )}
                  {active && processedStakingData.userCanCancel && (
                    <button
                      className="default-btn staking-btn"
                      onClick={() => showCancelUnlockingModal()}
                    >
                      Cancel Unlocking
                    </button>
                  )}
                  {active && processedStakingData.userCanWithdraw && (
                    <button
                      className="default-btn staking-btn"
                      onClick={() => showWithdrawModal()}
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="App-card primary Stake-total-rewards-card">
            <div className="App-card-title">PHAME Staking Rewards</div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              {processedStakingData.userRewards.map((reward) => (
                <div className="App-card-row" key={reward.tokenSymbol}>
                  <div className="label">
                    <div className="mobile-token-card">
                      <img
                        src={importTokenImage(reward.tokenSymbol)}
                        alt={reward.tokenSymbol}
                        width="20px"
                        height="20px"
                      />
                      <div className="token-symbol-text">
                        {reward.tokenSymbol}
                      </div>
                    </div>
                  </div>
                  <div>
                    {reward.amount}
                    {" ($"}
                    {reward.amountInUsd ? reward.amountInUsd : "-"}
                    {")"}
                  </div>
                </div>
              ))}
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">Total in USD (Est.)</div>
                <div>${processedStakingData.userTotalRewardsInUsd}</div>
              </div>
              <div className="App-card-bottom-placeholder">
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  {active && (
                    <button className="default-btn staking-btn">
                      Claim Rewards
                    </button>
                  )}
                  {!active && (
                    <button className="default-btn staking-btn">
                      Connect Wallet
                    </button>
                  )}
                </div>
              </div>
              <div className="App-card-bottom">
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  {active && (
                    <button
                      className="default-btn staking-btn"
                      onClick={() => showClaimModal()}
                      disabled={!processedStakingData.userCanClaim}
                    >
                      Claim Rewards
                    </button>
                  )}
                  {!active && (
                    <button
                      className="default-btn staking-btn"
                      onClick={() => connectWallet()}
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="App-card">
            <div className="App-card-title">
              PHLP
              <img src={phlpBigIcon} alt={"PHLP"} width="21px" />
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Price</div>
                <div>${processedPhlpData.price}</div>
              </div>
              <div className="App-card-row">
                <div className="label">Total Supply</div>
                <div>
                  {processedPhlpData.totalSupply}
                  {" PHLP ($"}
                  {processedPhlpData.totalSupplyInUsd}
                  {")"}
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">Wallet</div>
                <div>
                  {processedPhlpData.userWalletBalance}
                  {" PHLP ($"}
                  {processedPhlpData.userWalletBalanceInUsd}
                  {")"}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label sublabel">
                  {processedPhlpData.userSeaCreature.icon}
                  {processedPhlpData.userSeaCreature.name}
                </div>
                <div>
                  {processedPhlpData.userPct}
                  {" %"}
                </div>
              </div>
            </div>
          </div>
          <div className="App-card primary Stake-total-rewards-card">
            <div className="App-card-title">PHLP Composition</div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              {processedPhlpData.compositions.map((composition) => (
                <div className="App-card-row" key={composition.tokenSymbol}>
                  <div className="label">
                    <div className="mobile-token-card">
                      <img
                        src={importTokenImage(composition.tokenSymbol)}
                        alt={composition.tokenSymbol}
                        width="20px"
                        height="20px"
                      />
                      <div className="token-symbol-text">
                        {composition.tokenSymbol}
                      </div>
                    </div>
                  </div>
                  <div>
                    ${composition.amountInUsd}
                    {" ("}
                    {composition.weight}
                    {"%)"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
