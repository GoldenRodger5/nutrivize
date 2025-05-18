import React, { useEffect, useState } from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext';
import { isAuthenticated, getToken, removeToken, removeUserData } from '../../utils/auth';
import api from '../../utils/api';

interface AuthRequiredProps {
  children: React.ReactNode;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({ children }) => {
  const { user, isLoading } = useUserContext();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is authenticated - directly check token for more immediate validation
  const hasToken = !!getToken();
  const loggedIn = user !== null && hasToken;
  
  // Check if user is on the setup page
  const isSetupPage = location.pathname === '/setup';
  
  // Check if user has completed setup
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);
  
  // Effect to validate token on mount and then check user profile
  useEffect(() => {
    const validateToken = async () => {
      try {
        if (hasToken) {
          console.log('AuthRequired: Validating token');
          // Quick token validation via /auth/me endpoint
          await api.get('/auth/me');
          setIsCheckingAuth(false);
        } else {
          console.log('AuthRequired: No token to validate');
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        // Clear invalid tokens
        removeToken();
        removeUserData();
        setIsCheckingAuth(false);
      }
    };
    
    validateToken();
  }, [hasToken]);
  
  useEffect(() => {
    const checkUserSetup = async () => {
      if (loggedIn && user?.uid && !isSetupPage && !isCheckingAuth) {
        try {
          console.log('Checking user profile at URL:', `${api.defaults.baseURL}/user/profile`);
          // Add timeout and better error handling
          const profileResponse = await api.get(`/user/profile`, { 
            timeout: 8000,
            headers: { 
              'Cache-Control': 'no-cache'
            }
          });
          
          console.log('Profile response:', profileResponse.data);
          // If we get a successful response with data, consider setup complete
          setHasCompletedSetup(true);
          setCheckingSetup(false);
        } catch (error: any) {
          console.error('Error checking user profile:', error);
          
          // Log the error URL
          if (error.config) {
            console.error('Failed URL:', error.config.url);
            console.error('Full request URL:', `${api.defaults.baseURL}${error.config.url}`);
          }
          
          // Check specific error conditions
          if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            
            if (error.response.status === 401) {
              console.log('Authentication failed in profile check. Token may be invalid.');
              // Don't automatically clear token here - let the getCurrentUser handle that
            }
          } else if (error.request) {
            console.error('No response received:', error.request);
          }
          
          // Always assume setup is complete on error (even 404) to prevent redirect loops
          // This is a failsafe to ensure users can access the dashboard even if profile API fails
          console.log('Error occurred but assuming user has completed setup');
          setHasCompletedSetup(true);
          setCheckingSetup(false);
        }
      } else {
        setCheckingSetup(false);
      }
    };
    
    checkUserSetup();
  }, [user, loggedIn, isSetupPage, isCheckingAuth]);
  
  // Debug logging for authentication state
  useEffect(() => {
    console.log('AuthRequired: Current path:', location.pathname);
    console.log('AuthRequired: User state:', user ? 'Logged in' : 'Not logged in');
    console.log('AuthRequired: Token present:', hasToken ? 'Yes' : 'No');
    console.log('AuthRequired: Is loading:', isLoading ? 'Yes' : 'No');
    console.log('AuthRequired: Setup completed:', hasCompletedSetup === null ? 'Checking' : hasCompletedSetup ? 'Yes' : 'No');
    
    if (hasToken && !user) {
      console.log('AuthRequired: Token exists but user is null - potential sync issue');
    }
  }, [user, isLoading, location, hasCompletedSetup, hasToken]);

  // If loading, show loading indicator
  if (isLoading || checkingSetup || isCheckingAuth) {
    console.log('AuthRequired: Still loading user data or checking setup status');
    return <div className="loading-spinner">Loading...</div>;
  }

  // If not authenticated, redirect to login page
  if (!loggedIn) {
    console.log('AuthRequired: Not authenticated, redirecting to login');
    return <Redirect to={{
      pathname: "/login",
      state: { from: location }
    }} />;
  }
  
  // If authenticated but hasn't completed setup, and not already on setup page
  if (loggedIn && hasCompletedSetup === false && !isSetupPage) {
    console.log('AuthRequired: User needs to complete setup, redirecting to setup');
    return <Redirect to="/setup" />;
  }
  
  // If authenticated, on setup page, but has already completed setup
  if (loggedIn && hasCompletedSetup === true && isSetupPage) {
    console.log('AuthRequired: Setup already completed, redirecting to dashboard');
    return <Redirect to="/dashboard" />;
  }

  // If authenticated, render children
  console.log('AuthRequired: User authenticated, rendering children');
  return <>{children}</>;
};

export default AuthRequired; 