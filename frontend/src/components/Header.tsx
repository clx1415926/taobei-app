import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  isLoggedIn?: boolean;
  userInfo?: {
    phoneNumber: string;
  };
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isLoggedIn = false, 
  userInfo,
  onLogout 
}) => {
  return (
    <header className="app-header">
      <div className="container header-container">
        <Link to="/" className="brand-logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="white" fillOpacity="0.2"/>
              <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h12v2H8v-2z" fill="white"/>
            </svg>
          </div>
          <span className="brand-text">淘贝</span>
        </Link>
        
        <nav className="header-nav">
          {isLoggedIn ? (
            <div className="user-section">
              <div className="user-info">
                <div className="user-avatar">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="7" r="3" fill="currentColor"/>
                    <path d="M4 18c0-4 2.7-6 6-6s6 2 6 6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  </svg>
                </div>
                <span className="user-phone">欢迎，{userInfo?.phoneNumber}</span>
              </div>
              <button 
                onClick={onLogout}
                className="logout-btn"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 6l4 2-4 2M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                退出登录
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="auth-link login-link">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3M6 10l4-2-4-2M10 8H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                登录
              </Link>
              <Link to="/register" className="auth-link register-link">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 14c0-3 2.2-5 5-5s5 2 5 5M12 2v4M14 4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                注册
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;