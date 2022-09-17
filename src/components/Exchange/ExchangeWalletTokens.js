import React from "react";

import { formatAmount, expandDecimals, bigNumberify } from "../../Helpers";

import "./ExchangeWalletTokens.css";

export default function ExchangeWalletTokens(props) {
  const { tokens, mintingCap, infoTokens, onSelectToken } = props;

  return (
    <div className="ExchangeWalletTokens App-box">
      {tokens.map((token) => {
        const info = infoTokens ? infoTokens[token.address] : {};
        let mintAmount;
        const balance = info.balance;
        if (mintingCap && info.usdphAmount) {
          mintAmount = mintingCap.sub(info.usdphAmount);
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
            className="ExchangeWalletTokens-token-row"
            onClick={() => onSelectToken(token)}
            key={token.address}
          >
            <div className="ExchangeWalletTokens-top-row">
              <div>{token.symbol}</div>
              {balance && (
                <div className="align-right">
                  {balance.gt(0) &&
                    formatAmount(balance, token.decimals, 4, true)}
                  {balance.eq(0) && "-"}
                </div>
              )}
            </div>
            <div className="ExchangeWalletTokens-content-row">
              <div className="ExchangeWalletTokens-token-name">
                {token.name}
              </div>
              {balanceUsd && balanceUsd.gt(0) && (
                <div className="align-right">
                  ${formatAmount(balanceUsd, 30, 2, true)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
