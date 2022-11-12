import React, { useState } from "react";
import { useWeb3React } from "@web3-react/core";

import Modal from "../../components/Modal/Modal";
import Footer from "../../Footer";

import IERC20Metadata from "../../abis/IERC20Metadata.json";
import PhamousUiStakeDataProvider from "../../abis/PhamousUiStakeDataProvider.json";
import PhamousFeeDistribution from "../../abis/PhamousFeeDistribution.json";

import { ethers } from "ethers";
import {
  toBigNumber,
  fetcher,
  formatAmount,
  formatAmountFree,
  parseValue,
  approveTokens,
  useChainId,
  PLACEHOLDER_ACCOUNT,
  USD_DECIMALS,
  importImage,
} from "../../Helpers";
import { useInfoTokens, callContract } from "../../Api";

import useSWR from "swr";

import { getContract } from "../../Addresses";

import "./Stake.css";

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
  if (stakingData) {
    stakingData.userData.claimableRewards.forEach(({ token, amount }) => {
      const tokenInfo = infoTokens[token];
      const tokenAmount = toBigNumber(amount).dividedBy(
        toBigNumber(10).exponentiatedBy(tokenInfo.decimals)
      );
      rewards.push({
        tokenSymbol: tokenInfo.symbol,
        amount: formatAmount(amount, tokenInfo.decimals, 4, true, undefined, 2),
      });
      if (tokenInfo.maxPrice) {
        const price = toBigNumber(tokenInfo.maxPrice).dividedBy(
          toBigNumber(10).exponentiatedBy(USD_DECIMALS)
        );
        totalRewardsInUsd = totalRewardsInUsd.plus(
          tokenAmount.multipliedBy(price)
        );
      }
    });
  }

  return {
    stakingTokenPrecision: stakingTokenPrecision,
    totalSupply: stakingData
      ? formatAmount(
          stakingData.data.totalSupply,
          stakingTokenPrecision,
          4,
          true,
          undefined,
          2
        )
      : "55,555,000.00",
    totalStakedSupply: stakingData
      ? formatAmount(
          stakingData.data.totalStakedSupply,
          stakingTokenPrecision,
          4,
          true,
          undefined,
          2
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
          4,
          true,
          undefined,
          2
        )
      : "-",
    userStakedBalance: stakingData
      ? formatAmount(
          stakingData.userData.stakedBalance,
          stakingTokenPrecision,
          4,
          true,
          undefined,
          2
        )
      : "-",
    userStakedPct: userStakedPct,
    userSeaCreature: userSeaCreature,
    userUnstakedBalance: stakingData
      ? formatAmount(
          stakingData.userData.unstakedBalance,
          stakingTokenPrecision,
          4,
          true,
          undefined,
          2
        )
      : "-",
    userWithdrawableBalance: stakingData
      ? formatAmount(
          stakingData.userData.withdrawableBalance,
          stakingTokenPrecision,
          4,
          true,
          undefined,
          2
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
    userTotalRewardsInUsd: totalRewardsInUsd.toFixed(10),
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

export default function Stake({ setPendingTxns, connectWallet }) {
  const { active, library, account } = useWeb3React();
  const { chainId } = useChainId();

  const dataProviderAddress = getContract(
    chainId,
    "PhamousUiStakeDataProvider"
  );
  const feeDistributionAddress = getContract(chainId, "PhamousFeeDistribution");
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
  const { infoTokens } = useInfoTokens(
    library,
    chainId,
    active,
    undefined,
    undefined
  );
  const processedStakingData = processStakingData(stakingData, infoTokens);

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
      <div className="Stake-content">
        <div className="Stake-cards">
          <div className="App-card">
            <div className="App-card-title">PHAME</div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Total Supply</div>
                <div>
                  {processedStakingData.totalSupply}
                  {" PHAME"}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Total Staked</div>
                <div>
                  {processedStakingData.totalStakedSupply}
                  {" PHAME"}
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
                  {" PHAME"}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Staked</div>
                <div>
                  {processedStakingData.userStakedBalance}
                  {" PHAME"}
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
                      {" PHAME"}
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
                      {" PHAME"}
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
                  <a
                    href="https://app.v2b.testnet.pulsex.com/swap?inputCurrency=0x8a810ea8b121d08342e9e7696f4a9915cbe494b7&outputCurrency=0xA6Cac6290681Ba0e2582746D76947670D2aBD28B"
                    target="_blank"
                    rel="noreferrer"
                    className="default-btn staking-btn"
                  >
                    Buy PHAME on PulseX
                  </a>
                  {active && (
                    <button className="default-btn staking-btn">Stake</button>
                  )}
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
                  <a
                    href="https://app.v2b.testnet.pulsex.com/swap?inputCurrency=0x8a810ea8b121d08342e9e7696f4a9915cbe494b7&outputCurrency=0xA6Cac6290681Ba0e2582746D76947670D2aBD28B"
                    target="_blank"
                    rel="noreferrer"
                    className="default-btn staking-btn"
                  >
                    Buy PHAME on PulseX
                  </a>
                  {active && (
                    <button
                      className="default-btn staking-btn"
                      onClick={() => showStakeModal()}
                      disabled={!processedStakingData.userCanStake}
                    >
                      Stake
                    </button>
                  )}
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
            <div className="App-card-title">Total Rewards</div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              {processedStakingData.userRewards.map((reward) => (
                <div className="App-card-row" key={reward.tokenSymbol}>
                  <div className="label">
                    <div className="mobile-token-card">
                      <img
                        src={importImage(
                          "ic_" + reward.tokenSymbol.toLowerCase() + "_24.svg"
                        )}
                        alt={reward.tokenSymbol}
                        width="20px"
                      />
                      <div className="token-symbol-text">
                        {reward.tokenSymbol}
                      </div>
                    </div>
                  </div>
                  <div>{reward.amount}</div>
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
        </div>
      </div>
      <Footer />
    </div>
  );
}
