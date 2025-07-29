import { useState, useEffect } from 'react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'nutrivize_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'nutrivize_cookie_preferences';

export const useCookieConsent = () => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (consent) {
      setHasConsented(JSON.parse(consent));
    }

    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const acceptAllCookies = () => {
    const newPreferences = {
      essential: true,
      analytics: true,
      marketing: false, // Keep conservative for health app
    };

    setHasConsented(true);
    setPreferences(newPreferences);
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(true));
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences));
    
    // Initialize analytics if accepted
    if (newPreferences.analytics) {
      initializeAnalytics();
    }
  };

  const acceptEssentialOnly = () => {
    const newPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    };

    setHasConsented(true);
    setPreferences(newPreferences);
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(true));
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences));
  };

  const updatePreferences = (newPreferences: Partial<CookiePreferences>) => {
    const updatedPreferences = {
      ...preferences,
      ...newPreferences,
      essential: true, // Always true
    };

    setPreferences(updatedPreferences);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(updatedPreferences));

    // Initialize or disable analytics based on preference
    if (updatedPreferences.analytics) {
      initializeAnalytics();
    } else {
      disableAnalytics();
    }
  };

  const resetConsent = () => {
    setHasConsented(null);
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    disableAnalytics();
  };

  return {
    hasConsented,
    preferences,
    acceptAllCookies,
    acceptEssentialOnly,
    updatePreferences,
    resetConsent,
    showConsentBanner: hasConsented === null,
  };
};

// Analytics initialization functions
const initializeAnalytics = () => {
  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      analytics_storage: 'granted'
    });
  }

  // You can add other analytics services here
  console.log('Analytics initialized');
};

const disableAnalytics = () => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      analytics_storage: 'denied'
    });
  }

  console.log('Analytics disabled');
};

export default useCookieConsent;
