// iOS PWA Authentication Helper - FORCE LOGIN MODE
// This script ensures users must login every time, even in PWA mode

// Wait for document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're running in standalone mode (PWA)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  if (isPWA && isIOS) {
    console.log('🔒 iOS PWA mode detected - FORCE LOGIN MODE enabled');
    
    // Clear all authentication storage on app launch in PWA mode
    console.log('🧹 Clearing all auth storage for iOS PWA force login');
    
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth') || key.includes('token') || key.includes('firebase') || key.includes('user')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('auth') || key.includes('token') || key.includes('firebase') || key.includes('user')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Add iOS PWA specific meta tags
    const metaViewport = document.querySelector('meta[name=viewport]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
    
    // When app resumes, clear auth and force login
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        console.log('📱 App resumed - forcing fresh login');
        
        // Clear all auth storage again on resume
        Object.keys(localStorage).forEach(key => {
          if (key.includes('auth') || key.includes('token') || key.includes('firebase') || key.includes('user')) {
            localStorage.removeItem(key);
          }
        });
        
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('auth') || key.includes('token') || key.includes('firebase') || key.includes('user')) {
            sessionStorage.removeItem(key);
          }
        });
        
        // Send a custom event that our auth context can listen for
        const event = new CustomEvent('pwa:resumed');
        window.dispatchEvent(event);
        
        // Force redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          console.log('🔄 Forcing redirect to login page');
          window.location.replace('/login');
        }
      }
    });
    
    // Clear storage on page unload
    window.addEventListener('beforeunload', function() {
      console.log('🧹 App closing - clearing all auth storage');
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('token') || key.includes('firebase') || key.includes('user')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('auth') || key.includes('token') || key.includes('firebase') || key.includes('user')) {
          sessionStorage.removeItem(key);
        }
      });
    });
    
    console.log('✅ iOS PWA Force Login Mode configured');
  }
});
