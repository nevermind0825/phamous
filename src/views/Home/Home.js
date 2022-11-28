import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";

import Footer from "../../Footer";

import cx from "classnames";

import "./Home.css";

import simpleSwapIcon from "../../img/ic_simpleswaps.svg";
import costIcon from "../../img/ic_cost.svg";
import liquidityIcon from "../../img/ic_liquidity.svg";
// import totaluserIcon from "../../img/ic_totaluser.svg";
// import statsIcon from "../../img/ic_stats.svg";
// import tradingIcon from "../../img/ic_trading.svg";

import plsIcon from "../../img/ic_pulsechain_96.svg";

// import useSWR from "swr";

// import { PLS_TESTNET_V2 } from "../../Constants";
import {
  // formatAmount,
  // bigNumberify,
  // numberWithCommas,
  // getServerUrl,
  // USD_DECIMALS,
  // getTotalVolumeSum,
  switchNetwork,
  useChainId,
} from "../../Helpers";

// import { useUserStat } from "../../Api";

import TokenCard from "../../components/TokenCard/TokenCard";
import { PLS_TESTNET_V2 } from "../../Constants";

export default function Home({ showRedirectModal }) {
  // const [openedFAQIndex, setOpenedFAQIndex] = useState(null)
  // const faqContent = [{
  //   id: 1,
  //   question: "What is Phamous?",
  //   answer: "Phamous is a decentralized spot and perpetual exchange that supports low swap fees and zero price impact trades.<br><br>Trading is supported by a unique multi-asset pool that earns liquidity providers fees from market making, swap fees, leverage trading (spreads, funding fees & liquidations), and asset rebalancing.<br><br>Dynamic pricing is supported by Oracles along with pricing from leading volume DEXs."
  // }, {
  //   id: 2,
  //   question: "What is the PHAME Governance Token? ",
  //   answer: "The PHAME token is the staking token of the Phamous platform. When PHAME is staked you will earn 70% of the platform-generated fees."
  // }, {
  //   id: 3,
  //   question: "What is the PHLP Token? ",
  //   answer: "The PHLP token represents the liquidity users provide to the Phamous platform for Swaps and Margin Trading.<br><br>To provide liquidity to PHLP you <a href='https://phamous.io/buy_phlp' target='_blank'>trade</a> your crypto asset to the liquidity pool, in exchange, you gain exposure to a diversified index of tokens while earning 30% of the platform trading fees."
  // }, {
  //   id: 4,
  //   question: "What can I trade on Phamous? ",
  //   answer: "On Phamous you can swap or margin trade any of the following assets: tPLS, HEX, USDC, with others to be added. "
  // }]

  // const toggleFAQContent = function(index) {
  //   if (openedFAQIndex === index) {
  //     setOpenedFAQIndex(null)
  //   } else {
  //     setOpenedFAQIndex(index)
  //   }
  // }

  // const plsTestnetV2PositionStatsUrl = getServerUrl(PLS_TESTNET_V2, "/position_stats");
  // const { data: plsTestnetV2PositionStats } = useSWR([plsTestnetV2PositionStatsUrl], {
  //   fetcher: (...args) => fetch(...args).then((res) => res.json()),
  // });
  // const plsTestnetV2PositionStats = undefined;

  // const plsTestnetV2TotalVolumeUrl = getServerUrl(PLS_TESTNET_V2, "/total_volume");
  // const { data: plsTestnetV2TotalVolume } = useSWR([plsTestnetV2TotalVolumeUrl], {
  //   fetcher: (...args) => fetch(...args).then((res) => res.json()),
  // });
  // const plsTestnetV2TotalVolume = undefined;

  // Total Volume
  // const plsTestnetV2TotalVolumeSum = getTotalVolumeSum(plsTestnetV2TotalVolume);

  // let totalVolumeSum = bigNumberify(0);
  // if (plsTestnetV2TotalVolumeSum) {
  //   totalVolumeSum = totalVolumeSum.add(plsTestnetV2TotalVolumeSum);
  // }

  // Open Interest
  // let openInterest = bigNumberify(0);
  // if (
  //   plsTestnetV2PositionStats &&
  //   plsTestnetV2PositionStats.totalLongPositionSizes &&
  //   plsTestnetV2PositionStats.totalShortPositionSizes
  // ) {
  //   openInterest = openInterest.add(
  //     plsTestnetV2PositionStats.totalLongPositionSizes
  //   );
  //   openInterest = openInterest.add(
  //     plsTestnetV2PositionStats.totalShortPositionSizes
  //   );
  // }

  // user stat
  // const plsTestnetV2UserStats = useUserStat(PLS_TESTNET_V2);
  // let totalUsers = 0;

  const LaunchExchangeButton = () => {
    const { chainId } = useChainId();
    const { active } = useWeb3React();

    const changeNetwork = useCallback(
      (network) => {
        if (network === chainId) {
          return;
        }
        if (!active) {
          setTimeout(() => {
            return switchNetwork(network, active);
          }, 500);
        } else {
          return switchNetwork(network, active);
        }
      },
      [chainId, active]
    );

    return (
      <Link
        to="/trade"
        className={cx("default-btn")}
        onClick={() => changeNetwork(PLS_TESTNET_V2)}
      >
        Launch Exchange
      </Link>
    );
  };

  return (
    <div className="Home">
      <div className="Home-top">
        {/* <div className="Home-top-image"></div> */}
        <div className="Home-title-section-container default-container">
          <div className="Home-title-section">
            <div className="Home-title">
              Decentralized
              <br />
              Perpetual Exchange
            </div>
            <div className="Home-description">
              Trade tPLS, HEX, USDC, and other top cryptocurrencies with up to
              50x leverage directly from your wallet
            </div>
            <LaunchExchangeButton />
          </div>
        </div>
        {/* <div className="Home-latest-info-container default-container">
          <div className="Home-latest-info-block">
            <img
              src={tradingIcon}
              alt="trading"
              className="Home-latest-info__icon"
            />
            <div className="Home-latest-info-content">
              <div className="Home-latest-info__title">
                Total Trading Volume
              </div>
              <div className="Home-latest-info__value">
                ${formatAmount(totalVolumeSum, USD_DECIMALS, 0, true, undefined, 0)}
              </div>
            </div>
          </div>
          <div className="Home-latest-info-block">
            <img
              src={statsIcon}
              alt="stats"
              className="Home-latest-info__icon"
            />
            <div className="Home-latest-info-content">
              <div className="Home-latest-info__title">Open Interest</div>
              <div className="Home-latest-info__value">
                ${formatAmount(openInterest, USD_DECIMALS, 0, true, undefined, 0)}
              </div>
            </div>
          </div>
          <div className="Home-latest-info-block">
            <img
              src={totaluserIcon}
              alt="total user"
              className="Home-latest-info__icon"
            />
            <div className="Home-latest-info-content">
              <div className="Home-latest-info__title">Total Users</div>
              <div className="Home-latest-info__value">
                {numberWithCommas(totalUsers.toFixed(0))}
              </div>
            </div>
          </div>
        </div> */}
      </div>
      <div className="Home-benefits-section">
        <div className="Home-benefits default-container">
          <div className="Home-benefit">
            <div className="Home-benefit-icon">
              <img
                src={liquidityIcon}
                alt="liquidity"
                className="Home-benefit-icon-symbol"
              />
              <div className="Home-benefit-title">Reduce Liquidation Risks</div>
            </div>
            <div className="Home-benefit-description">
              An aggregate of high-quality price feeds determine when
              liquidations occur. This keeps positions safe from temporary
              wicks.
            </div>
          </div>
          <div className="Home-benefit">
            <div className="Home-benefit-icon">
              <img
                src={costIcon}
                alt="cost"
                className="Home-benefit-icon-symbol"
              />
              <div className="Home-benefit-title">Save on Costs</div>
            </div>
            <div className="Home-benefit-description">
              Enter and exit positions with minimal spread and zero price
              impact. Get the optimal price without incurring additional costs.
            </div>
          </div>
          <div className="Home-benefit">
            <div className="Home-benefit-icon">
              <img
                src={simpleSwapIcon}
                alt="swap"
                className="Home-benefit-icon-symbol"
              />
              <div className="Home-benefit-title">Simple Swaps</div>
            </div>
            <div className="Home-benefit-description">
              Open positions through a simple swap interface. Conveniently swap
              from any supported asset into the position of your choice.
            </div>
          </div>
        </div>
      </div>
      <div className="Home-cta-section">
        <div className="Home-cta-container default-container">
          <div className="Home-cta-info">
            <div className="Home-cta-info__title">
              Available on your preferred network
            </div>
            <div className="Home-cta-info__description">
              Phamous is currently live on PulseChain Testnet v2.
            </div>
          </div>
          <div className="Home-cta-options">
            <div className="Home-cta-option Home-cta-option-pls">
              <div className="Home-cta-option-icon">
                <img src={plsIcon} alt="PLS" />
              </div>
              <div className="Home-cta-option-info">
                <div className="Home-cta-option-title">
                  PulseChain Testnet v2
                </div>
                <div className="Home-cta-option-action">
                  <LaunchExchangeButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="Home-token-card-section">
        <div className="Home-token-card-container default-container">
          <div className="Home-token-card-info">
            <div className="Home-token-card-info__title">
              Two tokens create our ecosystem
            </div>
          </div>
          <TokenCard showRedirectModal={showRedirectModal} />
        </div>
      </div>

      {/* <div className="Home-faqs-section">
        <div className="Home-faqs-container default-container">
          <div className="Home-faqs-introduction">
            <div className="Home-faqs-introduction__title">FAQs</div>
            <div className="Home-faqs-introduction__description">Most asked questions. If you wish to learn more, please head to our Documentation page.</div>
            <a href="https://phamousio.gitbook.io/phamous/" className="default-btn Home-faqs-documentation">Documentation</a>
          </div>
          <div className="Home-faqs-content-block">
            {
              faqContent.map((content, index) => (
                <div className="Home-faqs-content" key={index} onClick={() => toggleFAQContent(index)}>
                  <div className="Home-faqs-content-header">
                    <div className="Home-faqs-content-header__icon">
                      {
                        openedFAQIndex === index ? <FiMinus className="opened" /> : <FiPlus className="closed" />
                      }
                    </div>
                    <div className="Home-faqs-content-header__text">
                      { content.question }
                    </div>
                  </div>
                  <div className={ openedFAQIndex === index ? "Home-faqs-content-main opened" : "Home-faqs-content-main" }>
                    <div className="Home-faqs-content-main__text">
                      <div dangerouslySetInnerHTML={{__html: content.answer}} >
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div> */}
      <Footer />
    </div>
  );
}
