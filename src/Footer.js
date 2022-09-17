import React from "react";

import "./Footer.css";

import logoImg from "./img/ic_phamous_footer.svg";
import twitterIcon from "./img/ic_twitter.svg";
import discordIcon from "./img/ic_discord.svg";
import telegramIcon from "./img/ic_telegram.svg";
import githubIcon from "./img/ic_github.svg";
import mediumIcon from "./img/ic_medium.svg";
import { NavLink } from "react-router-dom";
// import { isHomeSite } from "./Helpers";

export default function Footer() {
  const isHome = true;
  // const isHome = isHomeSite();

  return (
    <div className="Footer">
      <div className="Footer-wrapper">
        <div className="Footer-logo">
          <img src={logoImg} alt="MetaMask" />
        </div>
        <div className="Footer-social-link-block">
          <a
            className="App-social-link"
            href="https://twitter.com/PHAMOUS_IO"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={twitterIcon} alt="Twitter" />
          </a>
          <a
            className="App-social-link"
            href="https://medium.com/@phamous.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={mediumIcon} alt="Medium" />
          </a>
          <a
            className="App-social-link"
            href="https://github.com/phamous-io"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={githubIcon} alt="Github" />
          </a>
          <a
            className="App-social-link"
            href="https://t.me/PHAMOUS_IO"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={telegramIcon} alt="Telegram" />
          </a>
          <a
            className="App-social-link"
            href="https://discord.gg/cxjZYR4gQK"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={discordIcon} alt="Discord" />
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
