import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { loginUser, directFirebaseLogin } from '../../utils/auth';
import { useUserContext } from '../../context/UserContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useDirectLogin, setUseDirectLogin] = useState(false);
  const history = useHistory();
  const { setUser } = useUserContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login: Attempting to log in user');
      let response;
      
      // First try the backend login, then fall back to direct Firebase login if it fails
      if (!useDirectLogin) {
        try {
          response = await loginUser(email, password);
          console.log('Login: User logged in successfully via backend', response);
        } catch (err: any) {
          console.warn('Login: Backend login failed, falling back to direct Firebase login', err);
          // Fall back to direct Firebase login
          response = await directFirebaseLogin(email, password);
          console.log('Login: User logged in successfully via direct Firebase', response);
          // Remember this choice for next time
          setUseDirectLogin(true);
        }
      } else {
        // Use direct Firebase login if that's what worked last time
        response = await directFirebaseLogin(email, password);
        console.log('Login: User logged in successfully via direct Firebase', response);
      }
      
      setUser({
        uid: response.uid,
        name: response.name,
        email: response.email
      });
      
      console.log('Login: User context updated, redirecting to dashboard');
      setTimeout(() => {
        history.replace('/dashboard');
        console.log('Login: Navigation triggered to dashboard');
      }, 500);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else {
        setError('Failed to login. Please check your credentials.');
      }
      setIsLoading(false);
    }
  };

  const loginAsTestUser = async () => {
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';
    
    setEmail(testEmail);
    setPassword(testPassword);
    setError('');
    setIsLoading(true);

    try {
      console.log('Login: Attempting to log in as test user');
      let response;
      
      // First try the backend login, then fall back to direct Firebase login if it fails
      if (!useDirectLogin) {
        try {
          response = await loginUser(testEmail, testPassword);
          console.log('Login: Test user logged in successfully via backend', response);
        } catch (err: any) {
          console.warn('Login: Backend login failed for test user, falling back to direct Firebase login', err);
          // Fall back to direct Firebase login
          response = await directFirebaseLogin(testEmail, testPassword);
          console.log('Login: Test user logged in successfully via direct Firebase', response);
          // Remember this choice for next time
          setUseDirectLogin(true);
        }
      } else {
        // Use direct Firebase login if that's what worked last time
        response = await directFirebaseLogin(testEmail, testPassword);
        console.log('Login: Test user logged in successfully via direct Firebase', response);
      }
      
      setUser({
        uid: response.uid,
        name: response.name,
        email: response.email
      });
      
      console.log('Login: User context updated, redirecting to dashboard');
      setTimeout(() => {
        history.replace('/dashboard');
        console.log('Login: Navigation triggered to dashboard');
      }, 500);
    } catch (err: any) {
      console.error('Test login error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password for test user');
      } else {
        setError('Failed to login as test user. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-gradient"></div>
        <div className="auth-circles">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>
      </div>
      
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L15.5 4.5M12 1L8.5 4.5M12 1V8.5M17 3L19.5 7.5M7 3L4.5 7.5M21 9L17 12M3 9L7 12M12 23C16.4183 23 20 19.4183 20 15C20 10.5817 16.4183 7 12 7C7.58172 7 4 10.5817 4 15C4 19.4183 7.58172 23 12 23Z" stroke="url(#authLogo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="15" r="3" stroke="url(#authLogo)" strokeWidth="2"/>
              <defs>
                <linearGradient id="authLogo" x1="3" y1="1" x2="21" y2="23" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8E2DE2"/>
                  <stop offset="1" stopColor="#4A00E0"/>
                </linearGradient>
              </defs>
            </svg>
            <h1>Nutrivize</h1>
          </div>
          
          <div className="auth-header">
            <h2>Sign In</h2>
            <p>Welcome back! Sign in to continue your nutrition journey</p>
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-with-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 17V19M8 21H16C17.1046 21 18 20.1046 18 19V13C18 11.8954 17.1046 11 16 11H8C6.89543 11 6 11.8954 6 13V19C6 20.1046 6.89543 21 8 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? (
                <div className="button-loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : 'Sign In'}
            </button>
            
            <div className="auth-divider">
              <span>or</span>
            </div>
            
            <button 
              type="button" 
              className="demo-user-button" 
              onClick={loginAsTestUser}
              disabled={isLoading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Try Demo Account
            </button>
          </form>
          
          <div className="auth-links">
            <p>Don't have an account? <Link to="/register">Sign up</Link></p>
          </div>
          
          <div className="auth-footer">
            <div className="ai-powered-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>AI-Powered Nutrition Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 