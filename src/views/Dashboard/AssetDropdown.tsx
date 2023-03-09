import { Menu } from '@headlessui/react';
import { FiChevronDown } from 'react-icons/fi';
import './AssetDropdown.css';
// import coingeckoIcon from "../../img/ic_coingecko_16.svg";
import plsIcon from '../../img/ic_pulsechain_16.svg';
import metamaskIcon from '../../img/ic_metamask_16.svg';
import { addTokenToMetamask, useChainId } from '../../utils/Helpers';
import { useWeb3React } from '@web3-react/core';
import { ChainId, ITokenInfo } from '../../utils/types';
import { PLS_TESTNET_V2 } from '../../config/Constants';
import { getTokenBySymbol } from '../../data/Tokens';

interface IProps {
  assetSymbol: string;
  assetInfo?: ITokenInfo;
}

function AssetDropdown({ assetSymbol, assetInfo }: IProps): JSX.Element {
  const { active } = useWeb3React();
  const { chainId } = useChainId();
  const {
    // coingecko,
    plstestv2,
  } = getTokenBySymbol(chainId as ChainId, assetSymbol);
  const unavailableTokenSymbols = {
    [PLS_TESTNET_V2]: ['tPLS'],
  };

  return (
    <Menu>
      <Menu.Button as="div" className="dropdown-arrow center-both">
        <FiChevronDown size={20} />
      </Menu.Button>
      <Menu.Items as="div" className="asset-menu-items">
        {/* <Menu.Item>
          <>
            {coingecko && (
              <a href={coingecko} className="asset-item" target="_blank" rel="noopener noreferrer">
                <img src={coingeckoIcon} alt="Open in Coingecko" />
                <p>Open in Coingecko</p>
              </a>
            )}
          </>
        </Menu.Item> */}
        <Menu.Item>
          <>
            {plstestv2 && (
              <a href={plstestv2} className="asset-item" target="_blank" rel="noopener noreferrer">
                <img src={plsIcon} alt="Open in explorer" />
                <p>Open in Explorer</p>
              </a>
            )}
          </>
        </Menu.Item>
        <Menu.Item>
          <>
            {active && unavailableTokenSymbols[chainId as ChainId].indexOf(assetSymbol) < 0 && (
              <div
                onClick={() => {
                  const token = assetInfo
                    ? { ...assetInfo, image: assetInfo.imageUrl }
                    : getTokenBySymbol(chainId as ChainId, assetSymbol);
                  addTokenToMetamask(token);
                }}
                className="asset-item"
              >
                <img src={metamaskIcon} alt="Add to Metamask" />
                <p>Add to Metamask</p>
              </div>
            )}
          </>
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}

export default AssetDropdown;
