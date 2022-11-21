import React, { useEffect, useState } from "react";
import {
  // Link,
  useHistory,
} from "react-router-dom";

import PhlpSwap from "../../components/Phlp/PhlpSwap";
import buyPHLPIcon from "../../img/ic_buy_phlp.svg";
import Footer from "../../Footer";
import "./BuyPhlp.css";

export default function BuyPhlp(props) {
  const history = useHistory();
  const [isBuying, setIsBuying] = useState(true);

  useEffect(() => {
    const hash = history.location.hash.replace("#", "");
    const buying = hash !== "redeem";
    setIsBuying(buying);
  }, [history.location.hash]);

  return (
    <div className="default-container page-layout">
      <div className="section-title-block">
        <div className="section-title-icon">
          <img src={buyPHLPIcon} alt="Buy PHLP" />
        </div>
        <div className="section-title-content">
          <div className="Page-title">Buy / Sell PHLP</div>
          <div className="Page-description">
            Purchase PHLP tokens{" "}
            {/* <a href="https://phamousio.gitbook.io/phamous/phlp" target="_blank" rel="noopener noreferrer">
              PHLP tokens
            </a>{" "} */}
            to earn fees from swaps and leverages trading.
            <br />
            Note that there is a minimum holding time of 15 minutes after a
            purchase.
          </div>
        </div>
      </div>
      <PhlpSwap {...props} isBuying={isBuying} setIsBuying={setIsBuying} />
      <Footer />
    </div>
  );
}
