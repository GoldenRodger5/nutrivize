import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext';
import { isAuthenticated } from '../../utils/auth';

interface AuthRequiredProps {
  children: React.ReactNode;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({ children }) => {
  const { user, isLoading } = useUserContext();
  const location = useLocation();

  // Check if user is authenticated
  const loggedIn = user !== null && isAuthenticated();
  
  useEffect(() => {
    console.log('AuthRequired: Current path:', location.pathname);
    console.log('AuthRequired: User state:', user ? 'Logged in' : 'Not logged in');
    console.log('AuthRequired: Token present:', isAuthenticated() ? 'Yes' : 'No');
    console.log('AuthRequired: Is loading:', isLoading ? 'Yes' : 'No');
  }, [user, isLoading, location]);

  // If loading, show loading indicator
  if (isLoading) {
    console.log('AuthRequired: Still loading user data');
    return <div className="loading-spinner">Loading...</div>;
  }

  // If not authenticated, redirect to login page
  if (!loggedIn) {
    console.log('AuthRequired: Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render children
  console.log('AuthRequired: User authenticated, rendering children');
  return <>{children}</>;
};

export default AuthRequired; 