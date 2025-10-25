import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import ErrorMessage from '../components/ErrorMessage';
import { authApi } from '../services/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async (phoneNumber: string, verificationCode: string) => {
    try {
      setError('');
      const response = await authApi.login(phoneNumber, verificationCode);
      if (response.token) {
        // Token已在authApi.login中保存到localStorage
        // 跳转到首页并刷新以更新全局状态
        navigate('/');
        window.location.reload();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败，请重试';
      setError(errorMessage);
      console.error('Login failed:', error);
    }
  };

  const handleGetVerificationCode = async (phoneNumber: string) => {
    try {
      setError('');
      await authApi.sendVerificationCode(phoneNumber, 'login');
      // 可以显示成功提示
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取验证码失败，请重试';
      setError(errorMessage);
      console.error('Get verification code failed:', error);
    }
  };

  return (
    <div>
      <Header />
      
      <main style={{ 
        minHeight: 'calc(100vh - 60px)',
        backgroundColor: '#f5f5f5',
        paddingTop: '50px'
      }}>
        {error && (
          <div style={{ maxWidth: '400px', margin: '0 auto 20px' }}>
            <ErrorMessage message={error} />
          </div>
        )}
        
        <LoginForm 
          onSubmit={handleLogin}
          onGetVerificationCode={handleGetVerificationCode}
        />
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          color: '#666'
        }}>
          还没有账号？
          <Link 
            to="/register" 
            style={{ 
              color: '#ff6b35', 
              textDecoration: 'none',
              marginLeft: '8px'
            }}
          >
            立即注册
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;