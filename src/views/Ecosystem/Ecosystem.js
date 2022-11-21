import React from "react";
import { Title } from "react-head";

import Footer from "../../Footer";
import {
  getPageTitle,
  // PLS_TESTNET_V2
} from "../../Helpers";

// import plsIcon from "../../img/ic_pulsechain_16.svg";

import "./Ecosystem.css";

// const NETWORK_ICONS = {
//   [PLS_TESTNET_V2]: plsIcon,
// };

// const NETWORK_ICON_ALTS = {
//   [PLS_TESTNET_V2]: "PulseChain Icon",
// };

export default function Ecosystem() {
  const telegramGroups = [
    {
      title: "Phatty",
      link: "https://phatty.io",
      about: "DeFi and Web3 Dashboard",
    },
    {
      title: "Phiat",
      link: "https://phiat.io",
      about: "Decentralized Lending Protocol",
    },
    {
      title: "Phamous Telegram",
      link: "https://t.me/phamousX",
      about: "Telegram Group",
    },
  ];

  return (
    <div className="default-container page-layout">
      <Title>{getPageTitle("Ecosystem")}</Title>
      <div>
        <div className="section-title-block">
          <div className="section-title-icon"></div>
          <div className="section-title-content"></div>
        </div>
        {/* <div className="DashboardV2-projects">
            {officialPages.map((item) => {
              const linkLabel = item.linkLabel ? item.linkLabel : item.link;
              return (
                <div className="App-card">
                  <div className="App-card-title">
                    {item.title}
                    <div className="App-card-title-icon">
                      {item.chainIds.map((network) => (
                        <img src={NETWORK_ICONS[network]} alt={NETWORK_ICON_ALTS[network]} />
                      ))}
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">Link</div>
                      <div>
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          {linkLabel}
                        </a>
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">About</div>
                      <div>{item.about}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="Tab-title-section">
            <div className="Page-title">Community Projects</div>
            <div className="Page-description">Projects developed by the Phamous community.</div>
          </div>
          <div className="DashboardV2-projects">
            {communityProjects.map((item) => {
              const linkLabel = item.linkLabel ? item.linkLabel : item.link;
              return (
                <div className="App-card">
                  <div className="App-card-title">
                    {item.title}
                    <div className="App-card-title-icon">
                      {item.chainIds.map((network) => (
                        <img src={NETWORK_ICONS[network]} alt={NETWORK_ICON_ALTS[network]} />
                      ))}
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">Link</div>
                      <div>
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          {linkLabel}
                        </a>
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">About</div>
                      <div>{item.about}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Creator</div>
                      <div>
                        <a href={item.creatorLink} target="_blank" rel="noopener noreferrer">
                          {item.creatorLabel}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="Tab-title-section">
            <div className="Page-title">Partnerships and Integrations</div>
            <div className="Page-description">Projects integrated with Phamous.</div>
          </div>
          <div className="DashboardV2-projects">
            {integrations.map((item) => {
              const linkLabel = item.linkLabel ? item.linkLabel : item.link;
              return (
                <div className="App-card">
                  <div className="App-card-title">
                    {item.title}
                    <div className="App-card-title-icon">
                      {item.chainIds.map((network) => (
                        <img src={NETWORK_ICONS[network]} alt={NETWORK_ICON_ALTS[network]} />
                      ))}
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">Link</div>
                      <div>
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          {linkLabel}
                        </a>
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">About</div>
                      <div>{item.about}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">Announcement</div>
                      <div>
                        <a href={item.announcementLink} target="_blank" rel="noopener noreferrer">
                          {item.announcementLabel}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div> */}
        <div className="Tab-title-section">
          <div className="Page-title">Ecosystem Groups</div>
          <div className="Page-description">
            A true DeFi ecosystem for Hexicans
          </div>
        </div>
        <div className="DashboardV2-projects">
          {telegramGroups.map((item) => {
            const linkLabel = item.linkLabel ? item.linkLabel : item.link;
            return (
              <div className="App-card" key={item.link}>
                <div className="App-card-title">{item.title}</div>
                <div className="App-card-divider"></div>
                <div className="App-card-content">
                  <div className="App-card-row">
                    <div className="label">Link</div>
                    <div>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {linkLabel}
                      </a>
                    </div>
                  </div>
                  <div className="App-card-row">
                    <div className="label">About</div>
                    <div>{item.about}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
