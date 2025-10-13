import React, { useState } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';

interface User {
  phone: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <div className="logo">淘</div>
          <div className="title-text">淘宝</div>
        </div>
        <div className="subtitle">用户注册</div>
      </header>
      
      <div className="login-container">
        {user ? (
          <div className="user-info">
            <h2 className="welcome-message">欢迎回来！</h2>
            <p className="user-phone">手机号：{user.phone}</p>
            <button className="logout-button" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        ) : (
          <LoginPage onLogin={handleLogin} />
        )}
      </div>
      
      <div className="terms">
        已阅读并同意《淘宝网服务协议》、《隐私权政策》、《支付宝用户服务协议》
      </div>
    </div>
  );
}

export default App;