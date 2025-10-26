import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import SuccessMessage from '../components/SuccessMessage';
import EnhancedErrorMessage from '../components/EnhancedErrorMessage';
import { authApi } from '../services/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'sms' | 'password'>('sms');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockEndTime, setLockEndTime] = useState<number | null>(null);

  // 检查账户锁定状态
  const checkLockStatus = () => {
    if (lockEndTime && Date.now() < lockEndTime) {
      const remainingTime = Math.ceil((lockEndTime - Date.now()) / 1000 / 60);
      setError(`账户已锁定，请${remainingTime}分钟后重试`);
      return true;
    } else if (lockEndTime && Date.now() >= lockEndTime) {
      // 锁定时间已过，重置状态
      setIsLocked(false);
      setLockEndTime(null);
      setFailedAttempts(0);
      return false;
    }
    return isLocked;
  };

  const handleLoginFailure = (errorMessage: string) => {
    const newFailedAttempts = failedAttempts + 1;
    setFailedAttempts(newFailedAttempts);
    
    if (newFailedAttempts >= 5) {
      // 锁定15分钟
      const lockTime = Date.now() + 15 * 60 * 1000;
      setIsLocked(true);
      setLockEndTime(lockTime);
      setError('连续登录失败5次，账户已锁定15分钟');
    } else {
      setError(`${errorMessage} (剩余尝试次数: ${5 - newFailedAttempts})`);
    }
  };

  const handleLogin = async (phoneNumber: string, verificationCode: string) => {
    if (checkLockStatus()) {
      // 如果账户被锁定，抛出错误让LoginForm重置loading状态
      throw new Error('账户已锁定');
    }
    
    try {
      setError('');
      setSuccess('');
      const response = await authApi.login(phoneNumber, verificationCode);
      if (response.token) {
        // 重置失败次数
        setFailedAttempts(0);
        setIsLocked(false);
        setLockEndTime(null);
        
        // 显示成功消息
        setSuccess('登录成功');
        setWelcomeMessage(`欢迎回来，${phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`);
        
        // 3秒后跳转
        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 3000);
        
        // 返回成功，让LoginForm组件知道登录已完成
        return;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败，请重试';
      handleLoginFailure(errorMessage);
      console.error('Login failed:', error);
      // 重新抛出错误，让LoginForm组件能够捕获并重置loading状态
      throw error;
    }
  };

  const handlePasswordLogin = async (phoneNumber: string, password: string) => {
    if (checkLockStatus()) {
      // 如果账户被锁定，抛出错误让LoginForm重置loading状态
      throw new Error('账户已锁定');
    }
    
    try {
      setError('');
      setSuccess('');
      const response = await authApi.loginWithPassword(phoneNumber, password);
      if (response.token) {
        // 重置失败次数
        setFailedAttempts(0);
        setIsLocked(false);
        setLockEndTime(null);
        
        // 显示成功消息
        setSuccess('登录成功');
        setWelcomeMessage(`欢迎回来，${phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`);
        
        // 3秒后跳转
        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 3000);
        
        // 返回成功，让LoginForm组件知道登录已完成
        return;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '密码登录失败，请重试';
      handleLoginFailure(errorMessage);
      console.error('Password login failed:', error);
      // 重新抛出错误，让LoginForm组件能够捕获并重置loading状态
      throw error;
    }
  };

  const handleGetVerificationCode = async (phoneNumber: string) => {
    if (checkLockStatus()) return;
    
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

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setError('');
    setSuccess('');
  };

  const handleResetSuccess = () => {
    setShowForgotPassword(false);
    setError('');
    // 可以显示成功提示
    alert('密码重置成功，请使用新密码登录');
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setError('');
    setSuccess('');
  };

  const handleRetry = () => {
    setError('');
    setSuccess('');
  };

  const handleRegetCode = () => {
    setError('');
    // 这里可以触发重新获取验证码的逻辑
  };

  return (
    <div className="login-page">
      <Header />
      
      <main className="login-main">
        <div className="login-container">
          <div className="login-background">
            <div className="login-background-pattern"></div>
            <div className="login-background-gradient"></div>
          </div>
          
          <div className="login-content">
            {/* 页面标题 */}
            <div className="login-header">
              <h1 className="login-title">
                {showForgotPassword ? '重置密码' : '欢迎回来'}
              </h1>
              <p className="login-subtitle">
                {showForgotPassword ? '请按照步骤重置您的密码' : '登录您的淘贝账户'}
              </p>
            </div>

            {/* 成功消息 */}
            {success && (
              <div className="message-container">
                <SuccessMessage 
                  message={success}
                  welcomeMessage={welcomeMessage}
                  countdown={3}
                />
              </div>
            )}
            
            {/* 增强错误消息 */}
            {error && !success && (
              <div className="message-container">
                <EnhancedErrorMessage 
                  message={error}
                  onRetry={handleRetry}
                  onForgotPassword={loginMode === 'password' ? handleForgotPassword : undefined}
                  onGetVerificationCode={loginMode === 'sms' ? handleRegetCode : undefined}
                  showRetryButton={!isLocked}
                />
              </div>
            )}
            
            {/* 表单区域 */}
            <div className="form-container">
              {showForgotPassword ? (
                <ForgotPasswordForm
                  onResetSuccess={handleResetSuccess}
                  onBackToLogin={handleBackToLogin}
                />
              ) : (
                <>
                  <LoginForm 
                    onSubmit={handleLogin}
                    onGetVerificationCode={handleGetVerificationCode}
                    onPasswordLogin={handlePasswordLogin}
                    onForgotPassword={handleForgotPassword}
                    isLocked={isLocked}
                    onLoginModeChange={setLoginMode}
                  />
                  
                  <div className="register-prompt">
                    <span className="register-text">还没有账号？</span>
                    <Link to="/register" className="register-link">
                      立即注册
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;