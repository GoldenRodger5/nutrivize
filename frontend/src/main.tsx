import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import AuthRequired from './components/auth/AuthRequired'
import './index.css'
import './styles/auth.css'
import { ToastProvider } from './context/ToastContext'
import { UserProvider } from './context/UserContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard/*" element={
              <AuthRequired>
                <App />
              </AuthRequired>
            } />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={
              <AuthRequired>
                <App />
              </AuthRequired>
            } />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </UserProvider>
  </React.StrictMode>,
)
