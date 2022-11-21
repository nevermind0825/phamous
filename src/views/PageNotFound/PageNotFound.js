import { Title } from "react-head";
import Footer from "../../Footer";
import { getPageTitle, getHomeUrl, getTradePageUrl } from "../../Helpers";
import "./PageNotFound.css";

function PageNotFound() {
  const homeUrl = getHomeUrl();
  const tradePageUrl = getTradePageUrl();

  return (
    <div className="page-layout">
      <Title>{getPageTitle("Page not found")}</Title>
      <div className="page-not-found-container">
        <div className="page-not-found">
          <h2>Page not found</h2>
          <p className="go-back">
            <span>Return to </span>
            <a href={homeUrl}>Homepage</a> <span>or </span>{" "}
            <a href={tradePageUrl}>Trade</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PageNotFound;
