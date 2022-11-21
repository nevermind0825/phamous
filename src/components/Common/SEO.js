import { HeadProvider, Meta, Title } from "react-head";

function SEO(props) {
  const { children, ...customMeta } = props;
  const meta = {
    title: "Phamous | Decentralized Perpetual Exchange",
    description: `Trade spot or perpetual tPLS, HEX, USDC and other top cryptocurrencies with up to 50x leverage directly from your wallet on PulseChain.`,
    image: "https://phiat.io/public/images/phamous.jpeg",
    type: "exchange",
    ...customMeta,
  };

  return (
    <HeadProvider>
      <Title>{meta.title}</Title>
      <Meta name="robots" content="follow, index" />
      <Meta name="description" content={meta.description} />
      <Meta property="og:type" content={meta.type} />
      <Meta property="og:site_name" content="Phamous" />
      <Meta property="og:description" content={meta.description} />
      <Meta property="og:title" content={meta.title} />
      <Meta property="og:image" content={meta.image} />
      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:site" content="@Phamouscrypto" />
      <Meta name="twitter:title" content={meta.title} />
      <Meta name="twitter:description" content={meta.description} />
      <Meta name="twitter:image" content={meta.image} />
      {children}
    </HeadProvider>
  );
}

export default SEO;
