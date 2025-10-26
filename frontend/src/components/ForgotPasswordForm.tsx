import React, { useState } from 'react';
import { authApi } from '../services/api';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

interface ForgotPasswordFormProps {
  onResetSuccess: () => void;
  onBackToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onResetSuccess,
  onBackToLogin
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [canGetCode, setCanGetCode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGetCode = async () => {
    if (!phoneNumber) {
      setError('请输入手机号');
      return;
    }

    // 简单的手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('请输入正确的手机号格式');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await authApi.sendVerificationCode(phoneNumber, 'reset');
      setCountdown(60);
      setCanGetCode(false);
      
      // 启动倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanGetCode(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setError(error.message || '发送验证码失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode) {
      setError('请输入验证码');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('验证码应为6位数字');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // 调用后端API验证验证码，但不消费验证码
      await authApi.verifyResetCode(phoneNumber, verificationCode);
      // 验证码验证通过，进入重置密码步骤
      setStep('reset');
    } catch (error: any) {
      setError(error.message || '验证码错误，请重新输入');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      setError('密码长度至少为8位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await authApi.resetPassword(phoneNumber, verificationCode, newPassword, confirmPassword);
      onResetSuccess();
    } catch (error: any) {
      setError(error.message || '密码重置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <div className="forgot-password-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21ZM23 15V13C23 11.9 22.1 11 21 11H15C13.9 11 13 11.9 13 13V15C12.4 15 12 15.4 12 16V20C12 20.6 12.4 21 13 21H23C23.6 21 24 20.6 24 20V16C24 15.4 23.6 15 23 15ZM21 15H15V13C15 12.4 15.4 12 16 12H20C20.6 12 21 12.4 21 13V15Z" fill="#ff6b35"/>
            </svg>
          </div>
          <h2 className="forgot-password-title">忘记密码</h2>
          <p className="forgot-password-subtitle">请输入您的手机号，我们将发送验证码帮助您重置密码</p>
        </div>

        <form onSubmit={handleVerify} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="phoneNumber" className="form-label">
              <span className="label-text">手机号</span>
              <span className="label-required">*</span>
            </label>
            <div className="input-wrapper">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="#666"/>
                </svg>
              </div>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="请输入11位手机号"
                className="form-input"
                maxLength={11}
                required
                aria-describedby="phoneNumber-error"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="verificationCode" className="form-label">
              <span className="label-text">验证码</span>
              <span className="label-required">*</span>
            </label>
            <div className="verification-code-container">
              <div className="input-wrapper verification-input">
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="请输入6位验证码"
                  className="form-input"
                  maxLength={6}
                  required
                  aria-describedby="verificationCode-error"
                />
              </div>
              <button
                type="button"
                onClick={handleGetCode}
                disabled={!canGetCode || isLoading || !phoneNumber}
                className="verification-code-btn"
                aria-label={countdown > 0 ? `${countdown}秒后可重新获取` : '获取验证码'}
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert" aria-live="polite">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#ff4757"/>
              </svg>
              {error}
            </div>
          )}

          <div className="security-tips">
            <div className="security-tip-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="#2ed573"/>
              </svg>
              <span>验证码有效期为5分钟，请及时输入</span>
            </div>
            <div className="security-tip-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="#2ed573"/>
              </svg>
              <span>请勿将验证码告知他人，保护账户安全</span>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={isLoading || !phoneNumber || !verificationCode}
              className="btn btn-primary"
              aria-describedby="submit-loading"
            >
              {isLoading && (
                <div className="loading-spinner" aria-hidden="true"></div>
              )}
              {isLoading ? '验证中...' : '下一步'}
            </button>
            <button 
              type="button" 
              onClick={onBackToLogin}
              className="btn btn-secondary"
            >
              返回登录
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-header">
        <div className="forgot-password-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 17C10.89 17 10 16.1 10 15C10 13.89 10.89 13 12 13C13.11 13 14 13.89 14 15C14 15.55 13.78 16.05 13.41 16.41C13.05 16.78 12.55 17 12 17ZM18 8C19.1 8 20 8.9 20 10V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V10C4 8.9 4.9 8 6 8H7V6C7 3.24 9.24 1 12 1C14.76 1 17 3.24 17 6V8H18ZM12 3C10.34 3 9 4.34 9 6V8H15V6C15 4.34 13.66 3 12 3Z" fill="#ff6b35"/>
          </svg>
        </div>
        <h2 className="forgot-password-title">设置新密码</h2>
        <p className="forgot-password-subtitle">请设置一个安全性较高的新密码</p>
      </div>

      <form onSubmit={handleReset} className="forgot-password-form">
        <div className="form-group">
          <label htmlFor="newPassword" className="form-label">
            <span className="label-text">新密码</span>
            <span className="label-required">*</span>
          </label>
          <div className="input-wrapper password-input-wrapper">
            <div className="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 17C10.89 17 10 16.1 10 15C10 13.89 10.89 13 12 13C13.11 13 14 13.89 14 15C14 15.55 13.78 16.05 13.41 16.41C13.05 16.78 12.55 17 12 17ZM18 8C19.1 8 20 8.9 20 10V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V10C4 8.9 4.9 8 6 8H7V6C7 3.24 9.24 1 12 1C14.76 1 17 3.24 17 6V8H18ZM12 3C10.34 3 9 4.34 9 6V8H15V6C15 4.34 13.66 3 12 3Z" fill="#666"/>
              </svg>
            </div>
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码（至少8位）"
              className="form-input"
              required
              aria-describedby="newPassword-strength"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle-btn"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM12 9C13.66 9 15 10.34 15 12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9ZM12 4.5C17 4.5 21.27 7.61 23 12C21.27 16.39 17 19.5 12 19.5C7 19.5 2.73 16.39 1 12C2.73 7.61 7 4.5 12 4.5Z" fill="#666"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 7C9.24 7 7 9.24 7 12C7 12.35 7.05 12.69 7.14 13.02L9.13 11.03C9.13 11.02 9.12 11.01 9.12 11C9.12 9.34 10.46 8 12.12 8C12.13 8 12.14 8.01 12.15 8.01L14.14 6.02C13.45 6.34 12.74 6.5 12 6.5C7 6.5 2.73 9.61 1 14C2.73 18.39 7 21.5 12 21.5C12.74 21.5 13.45 21.34 14.14 21.02L12.15 19.03C12.14 19.03 12.13 19.04 12.12 19.04C10.46 19.04 9.12 17.7 9.12 16.04C9.12 16.03 9.13 16.02 9.13 16.01L7.14 18C7.05 17.67 7 17.33 7 16.96C7 14.2 9.24 11.96 12 11.96ZM2.01 3.87L4.69 6.55C2.06 8.16 0.77 10.96 0.77 12C0.77 16.39 5.04 19.5 10.04 19.5C11.55 19.5 13.01 19.2 14.34 18.66L16.99 21.31L18.32 19.98L3.34 5L2.01 3.87ZM9.52 13.92L11.12 15.52C11.08 15.34 11.04 15.17 11.04 15C11.04 13.34 12.38 12 14.04 12C14.21 12 14.38 12.04 14.56 12.08L16.16 13.68C16.57 13.14 16.8 12.6 16.8 12C16.8 9.24 14.56 7 11.8 7C11.2 7 10.63 7.14 10.12 7.36L11.72 8.96C12.63 8.96 13.36 9.69 13.36 10.6C13.36 11.51 12.63 12.24 11.72 12.24C10.81 12.24 10.08 11.51 10.08 10.6C10.08 10.09 10.22 9.52 10.44 9.01L9.52 13.92Z" fill="#666"/>
                </svg>
              )}
            </button>
          </div>
          <div id="newPassword-strength">
            <PasswordStrengthIndicator password={newPassword} />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            <span className="label-text">确认新密码</span>
            <span className="label-required">*</span>
          </label>
          <div className="input-wrapper password-input-wrapper">
            <div className="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 17C10.89 17 10 16.1 10 15C10 13.89 10.89 13 12 13C13.11 13 14 13.89 14 15C14 15.55 13.78 16.05 13.41 16.41C13.05 16.78 12.55 17 12 17ZM18 8C19.1 8 20 8.9 20 10V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V10C4 8.9 4.9 8 6 8H7V6C7 3.24 9.24 1 12 1C14.76 1 17 3.24 17 6V8H18ZM12 3C10.34 3 9 4.34 9 6V8H15V6C15 4.34 13.66 3 12 3Z" fill="#666"/>
              </svg>
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
              className="form-input"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="password-toggle-btn"
              aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
            >
              {showConfirmPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM12 9C13.66 9 15 10.34 15 12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9ZM12 4.5C17 4.5 21.27 7.61 23 12C21.27 16.39 17 19.5 12 19.5C7 19.5 2.73 16.39 1 12C2.73 7.61 7 4.5 12 4.5Z" fill="#666"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 7C9.24 7 7 9.24 7 12C7 12.35 7.05 12.69 7.14 13.02L9.13 11.03C9.13 11.02 9.12 11.01 9.12 11C9.12 9.34 10.46 8 12.12 8C12.13 8 12.14 8.01 12.15 8.01L14.14 6.02C13.45 6.34 12.74 6.5 12 6.5C7 6.5 2.73 9.61 1 14C2.73 18.39 7 21.5 12 21.5C12.74 21.5 13.45 21.34 14.14 21.02L12.15 19.03C12.14 19.03 12.13 19.04 12.12 19.04C10.46 19.04 9.12 17.7 9.12 16.04C9.12 16.03 9.13 16.02 9.13 16.01L7.14 18C7.05 17.67 7 17.33 7 16.96C7 14.2 9.24 11.96 12 11.96ZM2.01 3.87L4.69 6.55C2.06 8.16 0.77 10.96 0.77 12C0.77 16.39 5.04 19.5 10.04 19.5C11.55 19.5 13.01 19.2 14.34 18.66L16.99 21.31L18.32 19.98L3.34 5L2.01 3.87ZM9.52 13.92L11.12 15.52C11.08 15.34 11.04 15.17 11.04 15C11.04 13.34 12.38 12 14.04 12C14.21 12 14.38 12.04 14.56 12.08L16.16 13.68C16.57 13.14 16.8 12.6 16.8 12C16.8 9.24 14.56 7 11.8 7C11.2 7 10.63 7.14 10.12 7.36L11.72 8.96C12.63 8.96 13.36 9.69 13.36 10.6C13.36 11.51 12.63 12.24 11.72 12.24C10.81 12.24 10.08 11.51 10.08 10.6C10.08 10.09 10.22 9.52 10.44 9.01L9.52 13.92Z" fill="#666"/>
                </svg>
              )}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <div className="password-mismatch-hint">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#ff4757"/>
              </svg>
              两次输入的密码不一致
            </div>
          )}
        </div>

        {error && (
          <div className="error-message" role="alert" aria-live="polite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#ff4757"/>
            </svg>
            {error}
          </div>
        )}

        <div className="security-tips">
          <div className="security-tip-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="#2ed573"/>
            </svg>
            <span>密码应包含字母、数字和特殊字符，提高安全性</span>
          </div>
          <div className="security-tip-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="#2ed573"/>
            </svg>
            <span>请妥善保管新密码，避免与他人共享</span>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="btn btn-primary"
          >
            {isLoading && (
              <div className="loading-spinner" aria-hidden="true"></div>
            )}
            {isLoading ? '重置中...' : '确认重置'}
          </button>
          <button 
            type="button" 
            onClick={() => setStep('verify')}
            className="btn btn-secondary"
          >
            返回上一步
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;