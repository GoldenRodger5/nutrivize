import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom'
import App from './App'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import AuthRequired from './components/auth/AuthRequired'
import SetupWizard from './components/wizard/SetupWizard.jsx'
import './index.css'
import './styles/auth.css'
import { ToastProvider } from './context/ToastContext'
import { UserProvider } from './context/UserContext'
// Import mock data but don't enable it by default
import { useMockData } from './mockData.js' 

// Enable mock data only if VITE_USE_MOCK_DATA env variable is set
const useMockDataEnabled = import.meta.env.VITE_USE_MOCK_DATA === 'true';
console.log(`Mock data ${useMockDataEnabled ? 'enabled' : 'disabled'}`);

if (useMockDataEnabled) {
  const cleanupMockData = useMockData(true);
}

// Use React 17 compatible rendering method
ReactDOM.render(
  <React.StrictMode>
    <UserProvider>
      <ToastProvider>
        <BrowserRouter>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/setup" render={() => (
              <AuthRequired>
                <SetupWizard />
              </AuthRequired>
            )} />
            <Route path="/dashboard" render={() => (
              <AuthRequired>
                <App />
              </AuthRequired>
            )} />
            <Route exact path="/" render={() => <Redirect to="/login" />} />
            <Route path="*" render={() => (
              <AuthRequired>
                <App />
              </AuthRequired>
            )} />
          </Switch>
        </BrowserRouter>
      </ToastProvider>
    </UserProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
