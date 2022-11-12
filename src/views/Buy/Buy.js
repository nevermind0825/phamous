import React from "react";
import Footer from "../../Footer";
import "./Buy.css";
import TokenCard from "../../components/TokenCard/TokenCard";
import SEO from "../../components/Common/SEO";
import { getPageTitle } from "../../Helpers";

export default function BuyPHAMEPHLP() {
  return (
    <SEO title={getPageTitle("Buy PHAME or PHLP")}>
      <div className="BuyPHAMEPHLP page-layout">
        <div className="BuyPHAMEPHLP-container default-container">
          <div className="section-title-block">
            <div className="section-title-content">
              <div className="Page-title">Buy PHAME or PHLP</div>
            </div>
          </div>
          <TokenCard />
        </div>
        <Footer />
      </div>
    </SEO>
  );
}
