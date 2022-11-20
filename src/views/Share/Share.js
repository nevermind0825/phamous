import React from "react";
import { useParams } from "react-router-dom";
import { useEffectOnce } from "react-use";
import SEO from "../../components/Common/SEO";
import Footer from "../../Footer";

import { getHomeUrl, getPageTitle } from "../../Helpers";
import { shareUrl } from "../../lib/uploadImage";

export default function Share() {
  const { id } = useParams();

  useEffectOnce(() => {
    setTimeout(() => {
      window.location.href = `${getHomeUrl()}`;
    }, 100);
  });

  return (
    <SEO title={getPageTitle("Phamous Position Share")}>
      <div>
        <img src={shareUrl(id)} alt="Phamous" />
      </div>
      <Footer />
    </SEO>
  );
}
