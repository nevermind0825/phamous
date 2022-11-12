import React from "react";

import "./Footer.css";

import { NavLink } from "react-router-dom";
import logo from "./assets/logo.png";
// import discordIcon from "./img/ic_discord.svg";
// import githubIcon from "./img/ic_github.svg";
// import mediumIcon from "./img/ic_medium.svg";
import telegramIcon from "./img/ic_telegram.svg";
import twitterIcon from "./img/ic_twitter.svg";
// import { isHomeSite } from "./Helpers";

export default function Footer() {
  const isHome = false;
  // const isHome = isHomeSite();

  return (
    <div className="Footer">
      <div className="Footer-wrapper">
        <div className="Footer-logo">
          <img src={logo} alt="MetaMask" />
        </div>
        <div className="Footer-social-link-block">
          <a
            className="App-social-link"
            href="https://twitter.com/Phamouscrypto"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={twitterIcon} alt="Twitter" />
          </a>
          <a
            className="App-social-link"
            href="https://t.me/phamousX"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={telegramIcon} alt="Telegram" />
          </a>
        </div>
        {isHome && (
          <div className="Footer-links">
            <div>
              <NavLink
                to="/terms-and-conditions"
                className="Footer-link"
                activeClassName="active"
              >
                Terms and Conditions
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
