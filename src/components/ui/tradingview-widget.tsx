"use client";

import React, { useEffect, useRef, memo } from "react";

function TradingViewWidget() {
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!container.current) return;

    const render = () => {
      if (!container.current) return;
      const isDark = document.documentElement.classList.contains("dark");

      // Clear any previous script/content to avoid duplicates on re-render
      container.current.innerHTML = "<div class=\"tradingview-widget-container__widget\"></div>";

      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "colorTheme": "${isDark ? "dark" : "light"}",
          "isTransparent": true,
          "locale": "en",
          "countryFilter": "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
          "importanceFilter": "-1,0,1",
          "width": "100%",
          "height": 550
        }
      `;

      container.current.appendChild(script);
    };

    // Initial render
    render();

    // Observe theme changes (class changes on <html>)
    const observer = new MutationObserver(() => render());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container w-full" ref={container}>
      <div className="tradingview-widget-container__widget" />
      <div className="tradingview-widget-copyright text-[10px] text-gray-500 dark:text-gray-400">
        <a
          href="https://www.tradingview.com/economic-calendar/"
          rel="noopener nofollow"
          target="_blank"
          className="text-blue-500"
        >
          Economic calendar by TradingView
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
