import React, { useState, useEffect } from "react";
import cx from "classnames";

import {
  adjustForDecimals,
  formatAmount,
  expandDecimals,
  bigNumberify,
  USD_DECIMALS,
  USDPH_DECIMALS,
} from "../../Helpers";

import { getToken } from "../../data/Tokens";

import { BiChevronDown } from "react-icons/bi";

import Modal from "../Modal/Modal";

import dropDownIcon from "../../img/DROP_DOWN.svg";
import "./TokenSelector.css";

export default function TokenSelector(props) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const tokenInfo = getToken(props.chainId, props.tokenAddress);
  const {
    tokens,
    mintingCap,
    infoTokens,
    showMintingCap,
    disabled,
    showTokenImgInDropdown = false,
    showSymbolImage = false,
    showNewCaret = false,
  } = props;

  const onSelectToken = (token) => {
    setIsModalVisible(false);
    props.onSelectToken(token);
  };

  useEffect(() => {
    if (isModalVisible) {
      setSearchKeyword("");
    }
  }, [isModalVisible]);

  if (!tokenInfo) {
    return null;
  }

  let tokenImage = null;

  try {
    tokenImage = require("../../img/ic_" +
      tokenInfo.symbol.toLowerCase() +
      "_24.svg");
  } catch (error) {
    console.error(error);
  }

  const onSearchKeywordChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  const filteredTokens = tokens.filter((item) => {
    return (
      item.name.toLowerCase().indexOf(searchKeyword.toLowerCase()) > -1 ||
      item.symbol.toLowerCase().indexOf(searchKeyword.toLowerCase()) > -1
    );
  });

  const _handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredTokens.length > 0) {
      onSelectToken(filteredTokens[0]);
    }
  };

  return (
    <div className={cx("TokenSelector", { disabled }, props.className)}>
      <Modal
        isVisible={isModalVisible}
        setIsVisible={setIsModalVisible}
        label={props.label}
      >
        <div className="TokenSelector-tokens">
          <div className="TokenSelector-token-row TokenSelector-token-input-row">
            <input
              type="text"
              placeholder="Search Token"
              value={searchKeyword}
              onChange={(e) => onSearchKeywordChange(e)}
              onKeyDown={_handleKeyDown}
              autoFocus
            />
          </div>
          {filteredTokens.map((token) => {
            let tokenPopupImage;
            try {
              tokenPopupImage = require("../../img/ic_" +
                token.symbol.toLowerCase() +
                "_40.svg");
            } catch (_) {
              try {
                tokenPopupImage = require("../../img/ic_" +
                  token.symbol.toLowerCase() +
                  "_40.png");
              } catch (_) {
                tokenPopupImage = require("../../img/ic_pls_40.svg");
              }
            }
            const info = infoTokens ? infoTokens[token.address] : {};
            let mintAmount;
            const balance = info.balance;
            if (showMintingCap && mintingCap && info.managedUsd) {
              mintAmount = mintingCap.sub(
                adjustForDecimals(info.managedUsd, USD_DECIMALS, USDPH_DECIMALS)
              );
            }
            if (mintAmount && mintAmount.lt(0)) {
              mintAmount = bigNumberify(0);
            }
            let balanceUsd;
            if (balance && info.maxPrice) {
              balanceUsd = balance
                .mul(info.maxPrice)
                .div(expandDecimals(1, token.decimals));
            }
            return (
              <div
                className="TokenSelector-token-row"
                onClick={() => onSelectToken(token)}
                key={token.address}
              >
                <div className="Token-info">
                  {showTokenImgInDropdown && (
                    <img
                      src={tokenPopupImage?.default}
                      alt={token.name}
                      className="token-logo"
                    />
                  )}
                  <div className="Token-symbol">
                    <div className="Token-text">{token.symbol}</div>
                    <span className="text-accent">{token.name}</span>
                  </div>
                </div>
                <div className="Token-balance">
                  {balance && (
                    <div className="Token-text">
                      {balance.gt(0) &&
                        formatAmount(
                          balance,
                          token.decimals,
                          4,
                          true,
                          undefined,
                          0
                        )}
                      {balance.eq(0) && "-"}
                    </div>
                  )}
                  <span className="text-accent">
                    {mintAmount && (
                      <div>
                        Mintable:{" "}
                        {formatAmount(
                          mintAmount,
                          token.decimals,
                          2,
                          true,
                          undefined,
                          0
                        )}{" "}
                        USDPH
                      </div>
                    )}
                    {showMintingCap && !mintAmount && <div>-</div>}
                    {!showMintingCap && balanceUsd && balanceUsd.gt(0) && (
                      <div>
                        $
                        {formatAmount(
                          balanceUsd,
                          USD_DECIMALS,
                          2,
                          true,
                          undefined,
                          0
                        )}
                      </div>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <div
        className="TokenSelector-box"
        onClick={() => setIsModalVisible(true)}
      >
        {tokenInfo.symbol}
        {showSymbolImage && (
          <img
            src={tokenImage && tokenImage.default}
            alt={tokenInfo.symbol}
            className="TokenSelector-box-symbol"
          />
        )}
        {showNewCaret && (
          <img
            src={dropDownIcon}
            alt="dropDownIcon"
            className="TokenSelector-box-caret"
          />
        )}
        {!showNewCaret && <BiChevronDown className="TokenSelector-caret" />}
      </div>
    </div>
  );
}
