// iOS PWA Authentication Helper
// This script helps maintain authentication state in iOS PWA mode

// Wait for document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're running in standalone mode (PWA)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  if (isPWA && isIOS) {
    console.log('🔒 iOS PWA mode detected - enabling enhanced auth persistence');
    
    // Add iOS PWA specific meta tags
    const metaViewport = document.querySelector('meta[name=viewport]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
    
    // Listen for visibility changes to refresh token
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        console.log('📱 App resumed - checking auth status');
        // Send a custom event that our auth context can listen for
        const event = new CustomEvent('pwa:resumed');
        window.dispatchEvent(event);
      }
    });
    
    // Intercept page unload to store current navigation state
    window.addEventListener('beforeunload', function() {
      // Store the current path so we can restore it
      sessionStorage.setItem('pwa:lastPath', window.location.pathname);
    });
    
    // Sync localStorage and sessionStorage for better iOS PWA persistence
    window.addEventListener('storage', function(e) {
      if (e.key && e.key.startsWith('auth')) {
        if (e.newValue !== null) {
          sessionStorage.setItem(e.key, e.newValue);
        } else {
          sessionStorage.removeItem(e.key);
        }
      }
    });
    
    // Create a custom event when token is about to expire
    setInterval(function() {
      const tokenExpiry = localStorage.getItem('authTokenExpiry') || sessionStorage.getItem('authTokenExpiry');
      if (tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        const now = Date.now();
        // If token expires in less than 2 minutes
        if (expiryTime - now < 2 * 60 * 1000) {
          console.log('⚠️ Token expiring soon - triggering refresh');
          const event = new CustomEvent('auth:tokenExpiring');
          window.dispatchEvent(event);
        }
      }
    }, 60000); // Check every minute
  }
});
