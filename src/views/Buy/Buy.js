import React from "react";
import Footer from "../../Footer";
import "./Buy.css";
import TokenCard from "../../components/TokenCard/TokenCard";
// import buyPHAMEIcon from "../../img/buy_phame.svg";
import SEO from "../../components/Common/SEO";
import { getPageTitle } from "../../Helpers";

export default function BuyPHLP() {
  return (
    <SEO title={getPageTitle("Buy PHLP")}>
      <div className="BuyPHAMEPHLP page-layout">
        <div className="BuyPHAMEPHLP-container default-container">
          <div className="section-title-block">
            {/* <div className="section-title-icon">
              <img src={buyPHAMEIcon} alt="buyPHAMEIcon" />
            </div> */}
            <div className="section-title-content">
              <div className="Page-title">Buy PHLP</div>
            </div>
          </div>
          <TokenCard />
        </div>
        <Footer />
      </div>
    </SEO>
  );
}
