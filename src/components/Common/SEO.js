import { Helmet, HelmetProvider } from "react-helmet-async";

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
    <HelmetProvider>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="robots" content="follow, index" />
        <meta content={meta.description} name="description" />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content="Phamous" />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Phamouscrypto" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Helmet>
      {children}
    </HelmetProvider>
  );
}

export default SEO;
