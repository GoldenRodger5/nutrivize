import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../utils/auth';
import { useUserContext } from '../../context/UserContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUserContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login: Attempting to log in user');
      const response = await loginUser(email, password);
      console.log('Login: User logged in successfully', response);
      
      setUser({
        uid: response.uid,
        name: response.name,
        email: response.email
      });
      
      console.log('Login: User context updated, redirecting to /dashboard');
      // Use a timeout to ensure the user context is updated before navigation
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
        console.log('Login: Navigation triggered');
      }, 100);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to login. Please check your credentials.');
      }
    } finally {
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
      const response = await loginUser(testEmail, testPassword);
      console.log('Login: Test user logged in successfully', response);
      
      setUser({
        uid: response.uid,
        name: response.name,
        email: response.email
      });
      
      console.log('Login: User context updated, redirecting to /dashboard');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
        console.log('Login: Navigation triggered');
      }, 100);
    } catch (err: any) {
      console.error('Test login error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to login as test user. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login to Nutrivize</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          <button 
            type="button" 
            className="test-user-button" 
            onClick={loginAsTestUser}
            disabled={isLoading}
          >
            Login as Test User
          </button>
        </form>
        <div className="auth-links">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login; 