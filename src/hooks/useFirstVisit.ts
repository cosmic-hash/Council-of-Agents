"use client";

import { useEffect, useState } from "react";

const ONBOARDING_KEY = "council_onboarding_seen";

export function useFirstVisit(hasUserContext: boolean) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen && !hasUserContext) {
      setShowOnboarding(true);
    }
  }, [hasUserContext]);

  const dismissOnboarding = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "1");
    }
    setShowOnboarding(false);
  };

  return { showOnboarding, dismissOnboarding };
}
