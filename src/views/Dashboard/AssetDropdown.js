import { Menu } from "@headlessui/react";
import { FiChevronDown } from "react-icons/fi";
import "./AssetDropdown.css";
// import coingeckoIcon from "../../img/ic_coingecko_16.svg";
import plsIcon from "../../img/ic_pulsechain_16.svg";
import metamaskIcon from "../../img/ic_metamask_16.svg";
import {
  addTokenToMetamask,
  ICONLINKS,
  platformTokens,
  useChainId,
} from "../../Helpers";
import { useWeb3React } from "@web3-react/core";
import { PLS_TESTNET_V2 } from "../../Constants";

function AssetDropdown({ assetSymbol, assetInfo }) {
  const { active } = useWeb3React();
  const { chainId } = useChainId();
  const {
    // coingecko,
    plstestv2,
  } = ICONLINKS[chainId][assetSymbol];
  const unavailableTokenSymbols = {
    [PLS_TESTNET_V2]: ["tPLS"],
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
              <a
                href={plstestv2}
                className="asset-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={plsIcon} alt="Open in explorer" />
                <p>Open in Explorer</p>
              </a>
            )}
          </>
        </Menu.Item>
        <Menu.Item>
          <>
            {active &&
              unavailableTokenSymbols[chainId].indexOf(assetSymbol) < 0 && (
                <div
                  onClick={() => {
                    const token = assetInfo
                      ? { ...assetInfo, image: assetInfo.imageUrl }
                      : platformTokens[chainId][assetSymbol];
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
