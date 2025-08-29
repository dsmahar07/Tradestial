"use client";

import React, { useEffect, useRef, memo } from "react";

function TradingViewEventsWidget() {
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!container.current) return;

    // Avoid injecting multiple scripts if the component remounts
    if (container.current.querySelector("script[src^='https://s3.tradingview.com']")) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.textContent = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      locale: "en",
      countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
      importanceFilter: "-1,0,1",
      width: "100%",
      height: 550,
    });

    container.current.appendChild(script);

    return () => {
      // Best-effort cleanup: remove injected script on unmount
      if (!container.current) return;
      container.current.querySelectorAll("script").forEach((n) => n.remove());
    };
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget" />
      <div className="tradingview-widget-copyright">
        <a
          href="https://www.tradingview.com/economic-calendar/"
          rel="noopener nofollow"
          target="_blank"
        >
          <span className="blue-text">Economic calendar by TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewEventsWidget);
