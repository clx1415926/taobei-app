import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import RegisterForm from '../components/RegisterForm';
import ErrorMessage from '../components/ErrorMessage';
import { authApi } from '../services/api';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleRegister = async (phoneNumber: string, verificationCode: string) => {
    try {
      setError('');
      const response = await authApi.register(phoneNumber, verificationCode, true);
      if (response.token) {
        // Token已在authApi.register中保存到localStorage
        // 跳转到首页并刷新以更新全局状态
        navigate('/');
        window.location.reload();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败，请重试';
      setError(errorMessage);
      console.error('Register failed:', error);
      // 重新抛出错误，让RegisterForm能够重置loading状态
      throw error;
    }
  };

  const handleGetVerificationCode = async (phoneNumber: string) => {
    try {
      setError('');
      await authApi.sendVerificationCode(phoneNumber, 'register');
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
        
        <RegisterForm 
          onSubmit={handleRegister}
          onGetVerificationCode={handleGetVerificationCode}
        />
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          color: '#666'
        }}>
          已有账号？
          <Link 
            to="/login" 
            style={{ 
              color: '#ff6b35', 
              textDecoration: 'none',
              marginLeft: '8px'
            }}
          >
            立即登录
          </Link>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;