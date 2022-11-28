import React from "react";

import { formatKeyAmount } from "../../Helpers";

export default function APRLabel({ chainId, label }) {
  const apr = 0.0;
  return <>{`${formatKeyAmount(apr, label, 2, 2, true, 0)}%`}</>;
}
