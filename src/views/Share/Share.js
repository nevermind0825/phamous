import React from "react";
import { useParams } from "react-router-dom";
import { useEffectOnce } from "react-use";
import SEO from "../../components/Common/SEO";
import Footer from "../../Footer";

import { getTradePageUrl } from "../../Helpers";
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
    <SEO image={imgUrl}>
      <div>
        <img src={shareUrl(id)} alt="Phamous" />
      </div>
      <Footer />
    </SEO>
  );
}
