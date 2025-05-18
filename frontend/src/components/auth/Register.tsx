import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { registerUser } from '../../utils/auth';
import { useUserContext } from '../../context/UserContext';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();
  const { setUser } = useUserContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Register: Attempting to register user');
      const response = await registerUser(name, email, password);
      console.log('Register: User registered successfully', response);
      
      setUser({
        uid: response.uid,
        name: response.name,
        email: response.email
      });
      
      console.log('Register: User context updated, redirecting to setup wizard');
      // Use a timeout to ensure the user context is updated before navigation
      setTimeout(() => {
        history.replace('/setup');
        console.log('Register: Navigation triggered to setup wizard');
      }, 100);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to register. Please try again.');
      }
    } finally {
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
            <h2>Create Account</h2>
            <p>Start your personalized AI nutrition journey today</p>
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-with-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
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
              <div className="password-requirements">
                At least 6 characters
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-with-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 17V19M8 21H16C17.1046 21 18 20.1046 18 19V13C18 11.8954 17.1046 11 16 11H8C6.89543 11 6 11.8954 6 13V19C6 20.1046 6.89543 21 8 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              ) : 'Create Account'}
            </button>
          </form>
          
          <div className="auth-links">
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
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

export default Register; 