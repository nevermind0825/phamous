import { useEffect, useRef, useState } from "react";
import { toJpeg } from "html-to-image";
import cx from "classnames";
import { BiCopy } from "react-icons/bi";
import { RiFileDownloadLine } from "react-icons/ri";
import { FiTwitter } from "react-icons/fi";
import { useCopyToClipboard, useMedia } from "react-use";
import Modal from "../Modal/Modal";
import logo from "../../assets/logo.png";
import "./PositionShare.css";
import { QRCodeSVG } from "qrcode.react";
import {
  getHomeUrl,
  getShareBaseUrl,
  getTwitterIntentURL,
  USD_DECIMALS,
  formatAmount,
} from "../../Helpers";
import SpinningLoader from "../Common/SpinningLoader";
import { helperToast } from "../../lib/helperToast";
import downloadImage from "../../lib/downloadImage";
import uploadImage from "../../lib/uploadImage";

const config = {
  quality: 0.95,
  canvasWidth: 518,
  canvasHeight: 292,
  type: "image/jpeg",
};

function PositionShare({
  setIsPositionShareModalOpen,
  isPositionShareModalOpen,
  positionToShare,
  account,
  chainId,
}) {
  const [uploadedImageUrl, setUploadedImageUrl] = useState();
  const [uploadedImageError, setUploadedImageError] = useState();
  const [, copyToClipboard] = useCopyToClipboard();
  const positionRef = useRef();

  let id;
  if (uploadedImageUrl) {
    id = uploadedImageUrl.split("/");
    id = id[id.length - 1];
    id = id.slice(0, -6);
    console.log(id);
  }
  const shareUrl = getShareBaseUrl();
  const tweetLink = getTwitterIntentURL(
    `Latest $${positionToShare?.indexToken?.symbol} trade on @Phamouscrypto`,
    id ? `${shareUrl}/api/share?id=${id}` : ""
  );

  useEffect(() => {
    (async function () {
      const element = positionRef.current;
      if (element && positionToShare) {
        // We have to call the toJpeg function multiple times to make sure the canvas renders all the elements like background image
        // @refer https://github.com/tsayen/dom-to-image/issues/343#issuecomment-652831863
        const image = await toJpeg(element, config)
          .then(() => toJpeg(element, config))
          .then(() => toJpeg(element, config));
        const url = await uploadImage(image);
        if (url) {
          setUploadedImageUrl(url);
        } else {
          setUploadedImageUrl(null);
          setUploadedImageError(
            "Image generation error, please refresh and try again."
          );
        }
      }
    })();
  }, [positionToShare]);

  async function handleDownload() {
    const element = positionRef.current;
    if (!element) return;
    const imgBlob = await toJpeg(element, config)
      .then(() => toJpeg(element, config))
      .then(() => toJpeg(element, config));
    downloadImage(imgBlob, "share.jpeg");
  }

  function handleCopy() {
    if (!uploadedImageUrl) return;
    copyToClipboard(uploadedImageUrl);
    helperToast.success("Link copied to clipboard.");
  }
  return (
    <Modal
      className="position-share-modal"
      isVisible={isPositionShareModalOpen}
      setIsVisible={setIsPositionShareModalOpen}
      label={"Share Position"}
    >
      <PositionShareCard
        positionRef={positionRef}
        position={positionToShare}
        chainId={chainId}
        account={account}
        uploadedImageUrl={uploadedImageUrl}
        uploadedImageError={uploadedImageError}
      />
      {uploadedImageError && (
        <span className="error">{uploadedImageError}</span>
      )}

      <div className="actions">
        <button
          disabled={!uploadedImageUrl}
          className="mr-base App-button-option"
          onClick={handleCopy}
        >
          <BiCopy className="icon" />
          Copy
        </button>
        <button
          disabled={!uploadedImageUrl}
          className="mr-base App-button-option"
          onClick={handleDownload}
        >
          <RiFileDownloadLine className="icon" />
          Download
        </button>
        <div
          className={cx("tweet-link-container", {
            disabled: !uploadedImageUrl,
          })}
        >
          <a
            target="_blank"
            className={cx("tweet-link App-button-option", {
              disabled: !uploadedImageUrl,
            })}
            rel="noreferrer"
            href={tweetLink}
          >
            <FiTwitter className="icon" />
            Tweet
          </a>
        </div>
      </div>
    </Modal>
  );
}

function PositionShareCard({
  positionRef,
  position,
  uploadedImageUrl,
  uploadedImageError,
}) {
  const isMobile = useMedia("(max-width: 400px)");
  const {
    deltaAfterFeesPercentageStr,
    isLong,
    leverage,
    indexToken,
    averagePrice,
    markPrice,
  } = position;

  const homeURL = getHomeUrl();
  return (
    <div className="relative">
      <div
        ref={positionRef}
        className="position-share"
        style={{
          background: `linear-gradient(45deg, rgba(255, 192, 203, 1) 0%, rgba(147, 112, 219, 1) 70%)`,
        }}
      >
        <div>
          <img className="logo" src={logo} alt="Phamous" />
          <ul className="info">
            <li
              className={cx("side", {
                positive: isLong,
                negative: !isLong,
              })}
            >
              {isLong ? "LONG" : "SHORT"}
            </li>
            <li>{formatAmount(leverage, 4, 2, true)}x&nbsp;</li>
            <li>{indexToken.symbol} USD</li>
          </ul>
          <h3 className="pnl">{deltaAfterFeesPercentageStr}</h3>
          <div className="prices">
            <div>
              <p>Entry Price</p>
              <p className="price">
                ${formatAmount(averagePrice, USD_DECIMALS, 2, true)}
              </p>
            </div>
            <div>
              <p>Index Price</p>
              <p className="price">
                ${formatAmount(markPrice, USD_DECIMALS, 2, true)}
              </p>
            </div>
          </div>
          <div className="referral-code">
            <div>
              <QRCodeSVG size={isMobile ? 24 : 32} value={homeURL} />
            </div>
            <div className="referral-code-info">
              <p className="code">{homeURL}</p>
            </div>
          </div>
        </div>
      </div>
      {!uploadedImageUrl && !uploadedImageError && (
        <div className="image-overlay-wrapper">
          <div className="image-overlay">
            <SpinningLoader />
            <p className="loading-text">Generating shareable image...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PositionShare;
