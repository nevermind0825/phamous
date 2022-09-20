import React, { useState, useEffect, useCallback, useRef } from "react";
import { SWRConfig } from "swr";
import { ethers } from "ethers";

import { motion, AnimatePresence } from "framer-motion";

import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";

import {
  Switch,
  Route,
  NavLink,
  HashRouter as Router,
  // Redirect,
  // useLocation,
  // useHistory
} from "react-router-dom";

import { PLS_TESTNET_V2 } from "./Constants";
import {
  DEFAULT_SLIPPAGE_AMOUNT,
  SLIPPAGE_BPS_KEY,
  IS_PNL_IN_LEVERAGE_KEY,
  SHOW_PNL_AFTER_FEES_KEY,
  BASIS_POINTS_DIVISOR,
  SHOULD_SHOW_POSITION_LINES_KEY,
  getHomeUrl,
  // getAppBaseUrl,
  // isHomeSite,
  clearWalletConnectData,
  switchNetwork,
  helperToast,
  getChainName,
  useChainId,
  getAccountUrl,
  getInjectedHandler,
  useEagerConnect,
  useLocalStorageSerializeKey,
  useInactiveListener,
  getExplorerUrl,
  getWalletConnectHandler,
  activateInjectedProvider,
  hasMetaMaskWalletExtension,
  // hasCoinBaseWalletExtension,
  isMobileDevice,
  clearWalletLinkData,
  SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY,
  CURRENT_PROVIDER_LOCALSTORAGE_KEY,
  isDevelopment,
  DISABLE_ORDER_VALIDATION_KEY,
} from "./Helpers";

import Home from "./views/Home/Home";
import Dashboard from "./views/Dashboard/Dashboard";
import Ecosystem from "./views/Ecosystem/Ecosystem";
import Stake from "./views/Stake/Stake";
import { Exchange } from "./views/Exchange/Exchange";
// import Actions from "./views/Actions/Actions";
// import OrdersOverview from "./views/OrdersOverview/OrdersOverview";
// import PositionsOverview from "./views/PositionsOverview/PositionsOverview";
import BuyPhlp from "./views/BuyPhlp/BuyPhlp";
import Buy from "./views/Buy/Buy";

import cx from "classnames";
import { cssTransition, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NetworkSelector from "./components/NetworkSelector/NetworkSelector";
import Modal from "./components/Modal/Modal";
import Checkbox from "./components/Checkbox/Checkbox";

import { RiMenuLine } from "react-icons/ri";
import { FaTimes } from "react-icons/fa";
import { FiX } from "react-icons/fi";

import "./Font.css";
import "./Shared.css";
import "./App.css";
import "./Input.css";
import "./AppOrder.css";

import logoImg from "./img/logo_phamous.svg";
import logoSmallImg from "./img/logo_phamous_small.svg";
import connectWalletImg from "./img/ic_wallet_24.svg";

import metamaskImg from "./img/metamask.png";
// import coinbaseImg from "./img/coinbaseWallet.png";
import walletConnectImg from "./img/walletconnect-circle-blue.svg";
import AddressDropdown from "./components/AddressDropdown/AddressDropdown";
import { ConnectWalletButton } from "./components/Common/Button";
import useEventToast from "./components/EventToast/useEventToast";
import EventToastContainer from "./components/EventToast/EventToastContainer";
import SEO from "./components/Common/SEO";
// import useRouteQuery from "./hooks/useRouteQuery";

import { getContract } from "./Addresses";
import Vault from "./abis/Vault.json";
import PositionRouter from "./abis/PositionRouter.json";
import PageNotFound from "./views/PageNotFound/PageNotFound";
import TermsAndConditions from "./views/TermsAndConditions/TermsAndConditions";
import useScrollToTop from "./hooks/useScrollToTop";

if ("ethereum" in window) {
  window.ethereum.autoRefreshOnNetworkChange = false;
}

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  return library;
}

const Zoom = cssTransition({
  enter: "zoomIn",
  exit: "zoomOut",
  appendPosition: false,
  collapse: true,
  collapseDuration: 200,
  duration: 200,
});

// const plsWsProvider = new ethers.providers.WebSocketProvider(
//   "wss://arb-mainnet.g.alchemy.com/v2/ha7CFsr1bx5ZItuR6VZBbhKozcKDY4LZ"
// );
// https://rpc.v2b.testnet.pulsechain.com

function getWsProvider(active, chainId) {
  if (!active) {
    return;
  }
  if (chainId === PLS_TESTNET_V2) {
    // return plsWsProvider;
  }
}

function AppHeaderLinks({ HeaderLink, small, openSettings, clickCloseIcon }) {
  return (
    <div className="App-header-links">
      {small && (
        <div className="App-header-links-header">
          <div
            className="App-header-menu-icon-block"
            onClick={() => clickCloseIcon()}
          >
            <FiX className="App-header-menu-icon" />
          </div>
          <HeaderLink isHomeLink={true} className="App-header-link-main" to="/">
            <img src={logoImg} alt="Phamous Logo" />
          </HeaderLink>
        </div>
      )}
      <div className="App-header-link-container App-header-link-home">
        <HeaderLink to="/" exact={true} isHomeLink={true}>
          Home
        </HeaderLink>
      </div>
      {!small && (
        <>
          <div className="App-header-link-container">
            <HeaderLink to="/dashboard">Dashboard</HeaderLink>
          </div>
          <div className="App-header-link-container">
            <HeaderLink to="/staking">Staking</HeaderLink>
          </div>
          <div className="App-header-link-container">
            <HeaderLink to="/buy">Buy</HeaderLink>
          </div>
          <div className="App-header-link-container">
            <HeaderLink to="/ecosystem">Ecosystem</HeaderLink>
          </div>
          <div className="App-header-link-container">
            <a
              href="https://phamousio.gitbook.io/phamous/"
              target="_blank"
              rel="noopener noreferrer"
            >
              About
            </a>
          </div>
        </>
      )}
      {small && (
        <>
          <div className="App-header-link-container">
            {/* eslint-disable-next-line */}
            <a href="http://phiat.io">
              Phiat
            </a>
          </div>
          <div className="App-header-link-container">
            {/* eslint-disable-next-line */}
            <a href="http://phatty.io">
              Phatty
            </a>
          </div>
          <div className="App-header-link-container">
            {/* eslint-disable-next-line */}
            <a href="#" onClick={openSettings}>
              Links
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function AppHeaderUser({
  HeaderLink,
  openSettings,
  small,
  setWalletModalVisible,
  showNetworkSelectorModal,
  disconnectAccountAndCloseSettings,
}) {
  const { chainId } = useChainId();
  const { active, account } = useWeb3React();
  const showConnectionOptions = true;
  // const showConnectionOptions = !isHomeSite();

  const networkOptions = [
    {
      label: "PulseChain Testnet v2",
      value: PLS_TESTNET_V2,
      icon: "ic_pulsechain_24.svg",
      color: "#264f79",
    },
  ];

  useEffect(() => {
    if (active) {
      setWalletModalVisible(false);
    }
  }, [active, setWalletModalVisible]);

  const onNetworkSelect = useCallback(
    (option) => {
      if (option.value === chainId) {
        return;
      }
      return switchNetwork(option.value, active);
    },
    [chainId, active]
  );

  const selectorLabel = getChainName(chainId);

  if (!active) {
    return (
      <div className="App-header-user">
        <div className="App-header-user-link">
          <HeaderLink
            activeClassName="active"
            className="default-btn"
            to="/trade"
          >
            Trade
          </HeaderLink>
        </div>
        {showConnectionOptions && (
          <NetworkSelector
            options={networkOptions}
            label={selectorLabel}
            onSelect={onNetworkSelect}
            className="App-header-user-netowork"
            showCaret={true}
            modalLabel="Select Network"
            small={small}
            showModal={showNetworkSelectorModal}
          />
        )}
        {showConnectionOptions && (
          <ConnectWalletButton
            onClick={() => setWalletModalVisible(true)}
            imgSrc={connectWalletImg}
          >
            {small ? "Connect" : "Connect Wallet"}
          </ConnectWalletButton>
        )}
      </div>
    );
  }

  const accountUrl = getAccountUrl(chainId, account);

  return (
    <div className="App-header-user">
      <div className="App-header-user-link">
        <HeaderLink
          activeClassName="active"
          className="default-btn"
          to="/trade"
        >
          Trade
        </HeaderLink>
      </div>
      {showConnectionOptions && (
        <NetworkSelector
          options={networkOptions}
          label={selectorLabel}
          onSelect={onNetworkSelect}
          className="App-header-user-netowork"
          showCaret={true}
          modalLabel="Select Network"
          small={small}
          showModal={showNetworkSelectorModal}
        />
      )}
      {showConnectionOptions && (
        <div className="App-header-user-address">
          <AddressDropdown
            account={account}
            small={small}
            accountUrl={accountUrl}
            disconnectAccountAndCloseSettings={
              disconnectAccountAndCloseSettings
            }
            openSettings={openSettings}
          />
        </div>
      )}
    </div>
  );
}

function FullApp() {
  // const isHome = isHomeSite();
  const exchangeRef = useRef();
  const { connector, library, deactivate, activate, active } = useWeb3React();
  const { chainId } = useChainId();
  // const location = useLocation();
  // const history = useHistory();
  useEventToast();
  const [activatingConnector, setActivatingConnector] = useState();
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector, chainId]);
  const triedEager = useEagerConnect(setActivatingConnector);
  useInactiveListener(!triedEager || !!activatingConnector);

  const [walletModalVisible, setWalletModalVisible] = useState(false);
  // const [redirectModalVisible, setRedirectModalVisible] = useState(false);
  // const [selectedToPage, setSelectedToPage] = useState("");

  const [isDrawerVisible, setIsDrawerVisible] = useState(undefined);
  const [isNativeSelectorModalVisible, setisNativeSelectorModalVisible] =
    useState(false);
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  const slideVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [savedSlippageAmount, setSavedSlippageAmount] =
    useLocalStorageSerializeKey(
      [chainId, SLIPPAGE_BPS_KEY],
      DEFAULT_SLIPPAGE_AMOUNT
    );
  const [slippageAmount, setSlippageAmount] = useState(0);
  const [isPnlInLeverage, setIsPnlInLeverage] = useState(false);
  const [shouldDisableOrderValidation, setShouldDisableOrderValidation] =
    useState(false);
  const [showPnlAfterFees, setShowPnlAfterFees] = useState(false);

  const [savedIsPnlInLeverage, setSavedIsPnlInLeverage] =
    useLocalStorageSerializeKey([chainId, IS_PNL_IN_LEVERAGE_KEY], false);

  const [savedShowPnlAfterFees, setSavedShowPnlAfterFees] =
    useLocalStorageSerializeKey([chainId, SHOW_PNL_AFTER_FEES_KEY], false);
  const [
    savedShouldDisableOrderValidation,
    setSavedShouldDisableOrderValidation,
  ] = useLocalStorageSerializeKey(
    [chainId, DISABLE_ORDER_VALIDATION_KEY],
    false
  );

  const [savedShouldShowPositionLines, setSavedShouldShowPositionLines] =
    useLocalStorageSerializeKey(
      [chainId, SHOULD_SHOW_POSITION_LINES_KEY],
      false
    );

  useEffect(() => {
    if (window.ethereum) {
      // hack
      // for some reason after network is changed to Avalanche through Metamask
      // it triggers event with chainId = 1
      // reload helps web3 to return correct chain data
      return window.ethereum.on("chainChanged", () => {
        document.location.reload();
      });
    }
  }, []);

  const disconnectAccount = useCallback(() => {
    // only works with WalletConnect
    clearWalletConnectData();
    // force clear localStorage connection for MM/CB Wallet (Brave legacy)
    clearWalletLinkData();
    deactivate();
  }, [deactivate]);

  const disconnectAccountAndCloseSettings = () => {
    disconnectAccount();
    localStorage.removeItem(SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY);
    localStorage.removeItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY);
    setIsSettingsVisible(false);
  };

  const connectInjectedWallet = getInjectedHandler(activate);
  const activateWalletConnect = () => {
    getWalletConnectHandler(activate, deactivate, setActivatingConnector)();
  };

  const userOnMobileDevice =
    "navigator" in window && isMobileDevice(window.navigator);

  const attemptActivateWallet = (providerName) => {
    localStorage.setItem(SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY, true);
    localStorage.setItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY, providerName);
    activateInjectedProvider(providerName);
    connectInjectedWallet();
  };

  const activateMetaMask = () => {
    if (!hasMetaMaskWalletExtension()) {
      helperToast.error(
        <div>
          MetaMask not detected.
          <br />
          <br />
          <a
            href="https://metamask.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            Install MetaMask
          </a>
          {userOnMobileDevice
            ? ", and use Phamous with its built-in browser"
            : " to start using Phamous"}
          .
        </div>
      );
      return false;
    }
    attemptActivateWallet("MetaMask");
  };

  // const activateCoinBase = () => {
  //   if (!hasCoinBaseWalletExtension()) {
  //     helperToast.error(
  //       <div>
  //         Coinbase Wallet not detected.
  //         <br />
  //         <br />
  //         <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">
  //           Install Coinbase Wallet
  //         </a>
  //         {userOnMobileDevice ? ", and use Phamous with its built-in browser" : " to start using Phamous"}.
  //       </div>
  //     );
  //     return false;
  //   }
  //   attemptActivateWallet("CoinBase");
  // };

  const connectWallet = () => setWalletModalVisible(true);

  const openSettings = () => {
    const slippage = parseInt(savedSlippageAmount);
    setSlippageAmount((slippage / BASIS_POINTS_DIVISOR) * 100);
    setIsPnlInLeverage(savedIsPnlInLeverage);
    setShowPnlAfterFees(savedShowPnlAfterFees);
    setShouldDisableOrderValidation(savedShouldDisableOrderValidation);
    setIsSettingsVisible(true);
  };

  const showNetworkSelectorModal = (val) => {
    setisNativeSelectorModalVisible(val);
  };

  const saveAndCloseSettings = () => {
    const slippage = parseFloat(slippageAmount);
    if (isNaN(slippage)) {
      helperToast.error("Invalid slippage value");
      return;
    }
    if (slippage > 5) {
      helperToast.error("Slippage should be less than 5%");
      return;
    }

    const basisPoints = (slippage * BASIS_POINTS_DIVISOR) / 100;
    if (parseInt(basisPoints) !== parseFloat(basisPoints)) {
      helperToast.error("Max slippage precision is 0.01%");
      return;
    }

    setSavedIsPnlInLeverage(isPnlInLeverage);
    setSavedShowPnlAfterFees(showPnlAfterFees);
    setSavedShouldDisableOrderValidation(shouldDisableOrderValidation);
    setSavedSlippageAmount(basisPoints);
    setIsSettingsVisible(false);
  };

  // const baseUrl = getAppBaseUrl();
  // const appRedirectUrl = baseUrl + selectedToPage;

  useEffect(() => {
    if (isDrawerVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => (document.body.style.overflow = "unset");
  }, [isDrawerVisible]);

  const [pendingTxns, setPendingTxns] = useState([]);

  // const showRedirectModal = (to) => {
  //   setRedirectModalVisible(true);
  //   setSelectedToPage(to);
  // };

  const HeaderLink = ({ isHomeLink, className, exact, to, children }) => {
    // const isOnHomePage = location.pathname === "/";

    // if (isHome && !(isHomeLink && !isOnHomePage)) {
    //   return (
    //     <div
    //       className={cx("a", className, { active: isHomeLink })}
    //       onClick={() => showRedirectModal(to)}
    //     >
    //       {children}
    //     </div>
    //   );
    // }

    if (isHomeLink) {
      return (
        <a href={getHomeUrl()} className={cx(className)}>
          {children}
        </a>
      );
    }

    return (
      <NavLink
        activeClassName="active"
        className={cx(className)}
        exact={exact}
        to={to}
      >
        {children}
      </NavLink>
    );
  };

  useEffect(() => {
    const checkPendingTxns = async () => {
      const updatedPendingTxns = [];
      for (let i = 0; i < pendingTxns.length; i++) {
        const pendingTxn = pendingTxns[i];
        const receipt = await library.getTransactionReceipt(pendingTxn.hash);
        if (receipt) {
          if (receipt.status === 0) {
            const txUrl = getExplorerUrl(chainId) + "tx/" + pendingTxn.hash;
            helperToast.error(
              <div>
                Txn failed.{" "}
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View
                </a>
                <br />
              </div>
            );
          }
          if (receipt.status === 1 && pendingTxn.message) {
            const txUrl = getExplorerUrl(chainId) + "tx/" + pendingTxn.hash;
            helperToast.success(
              <div>
                {pendingTxn.message}{" "}
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View
                </a>
                <br />
              </div>
            );
          }
          continue;
        }
        updatedPendingTxns.push(pendingTxn);
      }

      if (updatedPendingTxns.length !== pendingTxns.length) {
        setPendingTxns(updatedPendingTxns);
      }
    };

    const interval = setInterval(() => {
      checkPendingTxns();
    }, 2 * 1000);
    return () => clearInterval(interval);
  }, [library, pendingTxns, chainId]);

  const vaultAddress = getContract(chainId, "Vault");
  const positionRouterAddress = getContract(chainId, "PositionRouter");

  useEffect(() => {
    const wsProvider = getWsProvider(active, chainId);
    if (!wsProvider) {
      return;
    }

    const wsVault = new ethers.Contract(vaultAddress, Vault.abi, wsProvider);
    const wsPositionRouter = new ethers.Contract(
      positionRouterAddress,
      PositionRouter.abi,
      wsProvider
    );

    const callExchangeRef = (method, ...args) => {
      if (!exchangeRef || !exchangeRef.current) {
        return;
      }

      exchangeRef.current[method](...args);
    };

    // handle the subscriptions here instead of within the Exchange component to avoid unsubscribing and re-subscribing
    // each time the Exchange components re-renders, which happens on every data update
    const onUpdatePosition = (...args) =>
      callExchangeRef("onUpdatePosition", ...args);
    const onClosePosition = (...args) =>
      callExchangeRef("onClosePosition", ...args);
    const onIncreasePosition = (...args) =>
      callExchangeRef("onIncreasePosition", ...args);
    const onDecreasePosition = (...args) =>
      callExchangeRef("onDecreasePosition", ...args);
    const onCancelIncreasePosition = (...args) =>
      callExchangeRef("onCancelIncreasePosition", ...args);
    const onCancelDecreasePosition = (...args) =>
      callExchangeRef("onCancelDecreasePosition", ...args);

    wsVault.on("UpdatePosition", onUpdatePosition);
    wsVault.on("ClosePosition", onClosePosition);
    wsVault.on("IncreasePosition", onIncreasePosition);
    wsVault.on("DecreasePosition", onDecreasePosition);
    wsPositionRouter.on("CancelIncreasePosition", onCancelIncreasePosition);
    wsPositionRouter.on("CancelDecreasePosition", onCancelDecreasePosition);

    return function cleanup() {
      wsVault.off("UpdatePosition", onUpdatePosition);
      wsVault.off("ClosePosition", onClosePosition);
      wsVault.off("IncreasePosition", onIncreasePosition);
      wsVault.off("DecreasePosition", onDecreasePosition);
      wsPositionRouter.off("CancelIncreasePosition", onCancelIncreasePosition);
      wsPositionRouter.off("CancelDecreasePosition", onCancelDecreasePosition);
    };
  }, [active, chainId, vaultAddress, positionRouterAddress]);

  return (
    <>
      <div className="App">
        <div className="App-content">
          {isDrawerVisible && (
            <AnimatePresence>
              {isDrawerVisible && (
                <motion.div
                  className="App-header-backdrop"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={fadeVariants}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsDrawerVisible(!isDrawerVisible)}
                ></motion.div>
              )}
            </AnimatePresence>
          )}
          {isNativeSelectorModalVisible && (
            <AnimatePresence>
              {isNativeSelectorModalVisible && (
                <motion.div
                  className="selector-backdrop"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={fadeVariants}
                  transition={{ duration: 0.2 }}
                  onClick={() =>
                    setisNativeSelectorModalVisible(
                      !isNativeSelectorModalVisible
                    )
                  }
                ></motion.div>
              )}
            </AnimatePresence>
          )}
          <header>
            <div className="App-header large">
              {/* <div className="App-header-container-left">
                <HeaderLink
                  isHomeLink={true}
                  exact={true}
                  className="App-header-link-main"
                  to="/"
                >
                  <img src={logoImg} className="big" alt="Phamous Logo" />
                  <img
                    src={logoSmallImg}
                    className="small"
                    alt="Phamous Logo"
                  />
                </HeaderLink>
                <AppHeaderLinks HeaderLink={HeaderLink} />
              </div> */}
              <div className="App-header-container-left">
                  <div
                    className="App-header-menu-icon-block"
                    onClick={() => setIsDrawerVisible(!isDrawerVisible)}
                  >
                    {!isDrawerVisible && (
                      <RiMenuLine className="App-header-menu-icon" />
                    )}
                    {isDrawerVisible && (
                      <FaTimes className="App-header-menu-icon" />
                    )}
                  </div>
                  <div
                    className="App-header-link-main clickable"
                    onClick={() => setIsDrawerVisible(!isDrawerVisible)}
                  >
                    <img src={logoImg} className="big" alt="Phamous Logo" />
                    <img
                      src={logoSmallImg}
                      className="small"
                      alt="Phamous Logo"
                    />
                  </div>
                  <AppHeaderLinks HeaderLink={HeaderLink} />
                </div>
              <div className="App-header-container-right">
                <AppHeaderUser
                  HeaderLink={HeaderLink}
                  disconnectAccountAndCloseSettings={
                    disconnectAccountAndCloseSettings
                  }
                  openSettings={openSettings}
                  setActivatingConnector={setActivatingConnector}
                  walletModalVisible={walletModalVisible}
                  setWalletModalVisible={setWalletModalVisible}
                  showNetworkSelectorModal={showNetworkSelectorModal}
                />
              </div>
            </div>
            <div
              className={cx("App-header", "small", { active: true })}
            >
              <div
                className={cx("App-header-link-container", "App-header-top", {
                  active: isDrawerVisible,
                })}
              >
                <div className="App-header-container-left">
                  <div
                    className="App-header-menu-icon-block"
                    onClick={() => setIsDrawerVisible(!isDrawerVisible)}
                  >
                    {!isDrawerVisible && (
                      <RiMenuLine className="App-header-menu-icon" />
                    )}
                    {isDrawerVisible && (
                      <FaTimes className="App-header-menu-icon" />
                    )}
                  </div>
                  <div
                    className="App-header-link-main clickable"
                    onClick={() => setIsDrawerVisible(!isDrawerVisible)}
                  >
                    <img src={logoImg} className="big" alt="Phamous Logo" />
                    <img
                      src={logoSmallImg}
                      className="small"
                      alt="Phamous Logo"
                    />
                  </div>
                </div>
                <div className="App-header-container-right">
                  <AppHeaderUser
                    HeaderLink={HeaderLink}
                    disconnectAccountAndCloseSettings={
                      disconnectAccountAndCloseSettings
                    }
                    openSettings={openSettings}
                    small
                    setActivatingConnector={setActivatingConnector}
                    walletModalVisible={walletModalVisible}
                    setWalletModalVisible={setWalletModalVisible}
                    showNetworkSelectorModal={showNetworkSelectorModal}
                  />
                </div>
              </div>
            </div>
          </header>
          <AnimatePresence>
            {isDrawerVisible && (
              <motion.div
                onClick={() => setIsDrawerVisible(false)}
                className="App-header-links-container App-header-drawer"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={slideVariants}
                transition={{ duration: 0.2 }}
              >
                <AppHeaderLinks
                  HeaderLink={HeaderLink}
                  small
                  openSettings={openSettings}
                  clickCloseIcon={() => setIsDrawerVisible(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {
            // isHome && (
            <Switch>
              <Route exact path="/">
                <Home showRedirectModal={undefined} />
                {/* <Home showRedirectModal={showRedirectModal} /> */}
              </Route>
              <Route exact path="/terms-and-conditions">
                <TermsAndConditions />
              </Route>
              {/* <Route path="*">
                <PageNotFound />
              </Route>
            </Switch>
          )}
          {!isHome && (
            <Switch>
              <Route exact path="/">
                <Redirect to="/dashboard" />
              </Route> */}
              <Route exact path="/trade">
                <Exchange
                  ref={exchangeRef}
                  savedShowPnlAfterFees={savedShowPnlAfterFees}
                  savedIsPnlInLeverage={savedIsPnlInLeverage}
                  setSavedIsPnlInLeverage={setSavedIsPnlInLeverage}
                  savedSlippageAmount={savedSlippageAmount}
                  setPendingTxns={setPendingTxns}
                  pendingTxns={pendingTxns}
                  savedShouldShowPositionLines={savedShouldShowPositionLines}
                  setSavedShouldShowPositionLines={
                    setSavedShouldShowPositionLines
                  }
                  connectWallet={connectWallet}
                  savedShouldDisableOrderValidation={
                    savedShouldDisableOrderValidation
                  }
                />
              </Route>
              <Route exact path="/dashboard">
                <Dashboard />
              </Route>
              <Route exact path="/staking">
                <Stake
                  setPendingTxns={setPendingTxns}
                  connectWallet={connectWallet}
                />
              </Route>
              <Route exact path="/buy">
                <Buy
                  savedSlippageAmount={savedSlippageAmount}
                  setPendingTxns={setPendingTxns}
                  connectWallet={connectWallet}
                />
              </Route>
              <Route exact path="/buy_phlp">
                <BuyPhlp
                  savedSlippageAmount={savedSlippageAmount}
                  setPendingTxns={setPendingTxns}
                  connectWallet={connectWallet}
                />
              </Route>
              {/* <Route exact path="/buy_phame">
                <BuyPHAME />
              </Route> */}
              <Route exact path="/ecosystem">
                <Ecosystem />
              </Route>
              {/* <Route exact path="/orders_overview">
                <OrdersOverview />
              </Route>
              <Route exact path="/positions_overview">
                <PositionsOverview />
              </Route> */}
              <Route path="*">
                <PageNotFound />
              </Route>
            </Switch>
          }
        </div>
      </div>
      <ToastContainer
        limit={1}
        transition={Zoom}
        position="bottom-right"
        autoClose={7000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={false}
        draggable={false}
        pauseOnHover
      />
      <EventToastContainer />
      {/* <Modal
        className="RedirectModal"
        isVisible={redirectModalVisible}
        setIsVisible={setRedirectModalVisible}
        label="Launch App"
      >
        You are leaving Phamous.io and will be redirected to a third party,
        independent website.
        <br />
        <br />
        The website is a community deployed and maintained instance of the open
        source{" "}
        <a
          href="https://github.com/phamous-io/phamous-ui"
          target="_blank"
          rel="noopener noreferrer"
        >
          Phamous front end
        </a>
        , hosted and served on the distributed, peer-to-peer{" "}
        <a href="https://ipfs.io/" target="_blank" rel="noopener noreferrer">
          IPFS network
        </a>
        .
        <br />
        <br />
        <a href={appRedirectUrl} className="App-cta Exchange-swap-button">
          Agree
        </a>
      </Modal> */}
      <Modal
        className="Connect-wallet-modal"
        isVisible={walletModalVisible}
        setIsVisible={setWalletModalVisible}
        label="Connect Wallet"
      >
        <button className="Wallet-btn MetaMask-btn" onClick={activateMetaMask}>
          <img src={metamaskImg} alt="MetaMask" />
          <div>MetaMask</div>
        </button>
        {/* <button className="Wallet-btn CoinbaseWallet-btn" onClick={activateCoinBase}>
          <img src={coinbaseImg} alt="Coinbase Wallet" />
          <div>Coinbase Wallet</div>
        </button> */}
        <button
          className="Wallet-btn WalletConnect-btn"
          onClick={activateWalletConnect}
        >
          <img src={walletConnectImg} alt="WalletConnect" />
          <div>WalletConnect</div>
        </button>
      </Modal>
      <Modal
        className="App-settings"
        isVisible={isSettingsVisible}
        setIsVisible={setIsSettingsVisible}
        label="Settings"
      >
        <div className="App-settings-row">
          <div>Allowed Slippage</div>
          <div className="App-slippage-tolerance-input-container">
            <input
              type="number"
              className="App-slippage-tolerance-input"
              min="0"
              value={slippageAmount}
              onChange={(e) => setSlippageAmount(e.target.value)}
            />
            <div className="App-slippage-tolerance-input-percent">%</div>
          </div>
        </div>
        <div className="Exchange-settings-row">
          <Checkbox
            isChecked={showPnlAfterFees}
            setIsChecked={setShowPnlAfterFees}
          >
            Display PnL after fees
          </Checkbox>
        </div>
        <div className="Exchange-settings-row">
          <Checkbox
            isChecked={isPnlInLeverage}
            setIsChecked={setIsPnlInLeverage}
          >
            Include PnL in leverage display
          </Checkbox>
        </div>
        {isDevelopment() && (
          <div className="Exchange-settings-row">
            <Checkbox
              isChecked={shouldDisableOrderValidation}
              setIsChecked={setShouldDisableOrderValidation}
            >
              Disable order validations
            </Checkbox>
          </div>
        )}

        <button
          className="App-cta Exchange-swap-button"
          onClick={saveAndCloseSettings}
        >
          Save
        </button>
      </Modal>
    </>
  );
}

function App() {
  useScrollToTop();
  return (
    <SWRConfig value={{ refreshInterval: 5000 }}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <SEO>
          <Router>
            <FullApp />
          </Router>
        </SEO>
      </Web3ReactProvider>
    </SWRConfig>
  );
}

export default App;
