import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';

import cx from 'classnames';

import phameBigIcon from '../../img/ic_phame_custom.svg';
import phlpBigIcon from '../../img/ic_phlp_custom.svg';

import { getContract } from '../../config/Addresses';
import { PLS_TESTNET_V2 } from '../../config/Constants';
import {
  switchNetwork,
  useChainId,
  // isHomeSite
} from '../../utils/Helpers';

import { useWeb3React } from '@web3-react/core';
import { ChainId } from '../../utils/types';

// import APRLabel from "../APRLabel/APRLabel";

interface IProps {
  showRedirectModal?: boolean;
}

export default function TokenCard({ showRedirectModal }: IProps) {
  // const isHome = isHomeSite();
  const { chainId } = useChainId();
  const { active } = useWeb3React();

  const changeNetwork = useCallback(
    (network: ChainId) => {
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
    [chainId, active],
  );

  const BuyLink = ({
    className,
    to,
    children,
    network,
  }: {
    className: string;
    to: string;
    children: string | JSX.Element | JSX.Element[];
    network: ChainId;
  }) => {
    // if (isHome && showRedirectModal) {
    //   return (
    //     <div
    //       className={cx("a", className)}
    //       onClick={() => showRedirectModal(to)}
    //     >
    //       {children}
    //     </div>
    //   );
    // }

    return (
      <Link to={to} className={cx(className)} onClick={() => changeNetwork(network)}>
        {children}
      </Link>
    );
  };

  return (
    <div className="Home-token-card-options">
      <div className="Home-token-card-option">
        <div className="Home-token-card-option-icon">
          <img src={phameBigIcon} alt="PHAME" /> PHAME
        </div>
        <div className="Home-token-card-option-info">
          <div className="Home-token-card-option-title">
            PHAME is the staking token. Accrues 40% of the platform's generated fees.
          </div>
          {/* <div className="Home-token-card-option-apr">
            PulseChain Testnet v2 APR:{" "}
            <APRLabel chainId={PLS_TESTNET_V2} label="phameAprTotal" />
          </div> */}
          <div className="Home-token-card-option-action">
            <div className="buy">
              <a
                href={`https://app.v2b.testnet.pulsex.com/swap?inputCurrency=0x8a810ea8b121d08342e9e7696f4a9915cbe494b7&outputCurrency=${getContract(
                  chainId,
                  'PHAME',
                )}`}
                target="_blank"
                rel="noreferrer"
                className="default-btn"
              >
                Buy on PulseX
              </a>
            </div>
            <a
              href="https://ph-defi.gitbook.io/home/phamous-protocol-tokenomics"
              target="_blank"
              rel="noreferrer"
              className="default-btn read-more"
            >
              Read more
            </a>
          </div>
        </div>
      </div>
      <div className="Home-token-card-option">
        <div className="Home-token-card-option-icon">
          <img src={phlpBigIcon} alt="PHLP" /> PHLP
        </div>
        <div className="Home-token-card-option-info">
          <div className="Home-token-card-option-title">
            PHLP is the liquidity provider token. Accrues 60% of the platform's generated fees.
          </div>
          {/* <div className="Home-token-card-option-apr">
            PulseChain Testnet v2 APR: <APRLabel chainId={PLS_TESTNET_V2} label="phlpAprTotal" key="PLS_TESTNET_V2" />
          </div> */}
          <div className="Home-token-card-option-action">
            <div className="buy">
              <BuyLink to="/buy_phlp" className="default-btn" network={PLS_TESTNET_V2}>
                Provide Liquidity on Phamous
              </BuyLink>
            </div>
            <a
              href="https://ph-defi.gitbook.io/home/phamous-protocol-tokenomics"
              target="_blank"
              rel="noreferrer"
              className="default-btn read-more"
            >
              Read more
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
