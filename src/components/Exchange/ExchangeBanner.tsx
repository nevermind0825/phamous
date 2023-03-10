import React from 'react';

import './ExchangeBanner.css';

interface IProps {
  hideBanner: () => void;
}

export default function ExchangeBanner(props: IProps) {
  const { hideBanner } = props;

  return (
    <div className="ExchangeBanner">
      <p className="ExchangeBanner-text">Welcome to Phamous!</p>
      <span
        className="ExchangeBanner-close"
        onClick={(e) => {
          hideBanner();
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="11.25" height="11.25" viewBox="0 0 11.25 11.25">
          <path
            id="ic_close"
            d="M11-2.565,6.818-6.75,11-10.935a.844.844,0,0,0,0-1.193.844.844,0,0,0-1.193,0L5.625-7.943,1.44-12.128a.844.844,0,0,0-1.193,0,.844.844,0,0,0,0,1.193L4.432-6.75.247-2.565a.844.844,0,0,0,0,1.193.844.844,0,0,0,1.193,0L5.625-5.557,9.81-1.372a.844.844,0,0,0,1.193,0A.844.844,0,0,0,11-2.565Z"
            transform="translate(0 12.375)"
            fill="#fff"
          />
        </svg>
      </span>
    </div>
  );
}
