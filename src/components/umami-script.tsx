"use client";

import { useEffect } from "react";

const analyticsHostnames = new Set(["docs.routemarket.ai"]);

type UmamiScriptProps = {
  scriptUrl: string;
  websiteId: string;
};

export function UmamiScript({ scriptUrl, websiteId }: UmamiScriptProps) {
  useEffect(() => {
    if (!analyticsHostnames.has(window.location.hostname)) {
      return;
    }

    if (document.querySelector(`script[data-website-id="${websiteId}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = scriptUrl;
    script.dataset.websiteId = websiteId;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [scriptUrl, websiteId]);

  return null;
}
