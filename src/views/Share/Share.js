import React from "react";
import { useParams } from "react-router-dom";
import { useEffectOnce } from "react-use";
import Footer from "../../Footer";
import { Meta, Title } from "react-head";

import { getTradePageUrl, getPageTitle } from "../../Helpers";
import { shareUrl } from "../../lib/uploadImage";

export default function Share() {
  const { id } = useParams();
  const imgUrl = shareUrl(id);

  useEffectOnce(() => {
    setTimeout(() => {
      window.location.href = `${getTradePageUrl()}`;
    }, 100);
  });

  return (
    <>
      <div>
        <Title>{getPageTitle("Position Share")}</Title>
        <Meta property="og:image" content={imgUrl} />
        <Meta name="twitter:image" content={imgUrl} />
        <img src={imgUrl} alt="Phamous Open Position" />
      </div>
      <Footer />
    </>
  );
}
