import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardRedirect: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('DashboardRedirect: Attempting to redirect to /dashboard');
    navigate('/dashboard');
  }, [navigate]);
  
  return <div>Redirecting to dashboard...</div>;
};

export default DashboardRedirect; 