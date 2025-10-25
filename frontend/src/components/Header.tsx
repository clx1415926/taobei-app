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
    <header style={{ 
      backgroundColor: '#ff6b35', 
      padding: '10px 0',
      color: 'white'
    }}>
      <div className="container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Link to="/" style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: 'white', 
          textDecoration: 'none' 
        }}>
          淘贝
        </Link>
        
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {isLoggedIn ? (
            <>
              <span>欢迎，{userInfo?.phoneNumber}</span>
              <button 
                onClick={onLogout}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid white', 
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                退出登录
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>
                登录
              </Link>
              <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;