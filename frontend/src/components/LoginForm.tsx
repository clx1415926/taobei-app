import React, { useState, useEffect } from 'react';
import { FormState } from '../types';
import { authApi } from '../services/api';

interface LoginFormProps {
  onSubmit?: (phoneNumber: string, verificationCode: string) => Promise<void>;
  onGetVerificationCode?: (phoneNumber: string) => void;
  onPasswordLogin?: (phoneNumber: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
  isLocked?: boolean;
  onLoginModeChange?: (mode: 'sms' | 'password') => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onSubmit = async () => {}, 
  onGetVerificationCode = () => {},
  onPasswordLogin = async () => {},
  onForgotPassword = () => {},
  isLocked = false,
  onLoginModeChange
}) => {
  const [loginMode, setLoginMode] = useState<'sms' | 'password'>('sms');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    phoneNumber: '',
    verificationCode: '',
    isLoading: false,
    countdown: 0,
    error: '',
    canGetCode: true
  });

  // 检查用户是否设置了密码
  const checkPasswordStatus = async (phoneNumber: string) => {
    if (!phoneNumber || !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      return;
    }
    
    try {
      await authApi.getPasswordStatus(phoneNumber);
      // 这里可以根据需要处理密码状态
    } catch (error) {
      // 处理错误
    }
  };

  // 当手机号变化时检查密码状态
  useEffect(() => {
    const timer = setTimeout(() => {
      checkPasswordStatus(formState.phoneNumber);
    }, 500); // 防抖处理
    
    return () => clearTimeout(timer);
  }, [formState.phoneNumber]);

  // 检查localStorage中的倒计时状态
  useEffect(() => {
    const savedCountdownData = localStorage.getItem('verificationCodeCountdown');
    if (savedCountdownData) {
      try {
        const { endTime, phoneNumber } = JSON.parse(savedCountdownData);
        const now = Date.now();
        const remainingTime = Math.max(0, Math.ceil((endTime - now) / 1000));
        
        if (remainingTime > 0) {
          setFormState(prev => ({
            ...prev,
            phoneNumber: phoneNumber || prev.phoneNumber,
            countdown: remainingTime,
            canGetCode: false
          }));
          
          // 启动倒计时
          const timer = setInterval(() => {
            setFormState(prev => {
              const newCountdown = prev.countdown - 1;
              if (newCountdown <= 0) {
                clearInterval(timer);
                localStorage.removeItem('verificationCodeCountdown');
                return { ...prev, countdown: 0, canGetCode: true };
              }
              return { ...prev, countdown: newCountdown };
            });
          }, 1000);
          
          return () => clearInterval(timer);
        } else {
          localStorage.removeItem('verificationCodeCountdown');
        }
      } catch (error) {
        localStorage.removeItem('verificationCodeCountdown');
      }
    }
  }, []);

  // 切换登录方式时重置表单字段
  const handleLoginModeChange = (mode: 'sms' | 'password') => {
    setLoginMode(mode);
    // 重置相关字段
    setPassword('');
    setShowPassword(false);
    setFormState(prev => ({
      ...prev,
      verificationCode: '',
      error: '',
      isLoading: false
    }));
    // 通知父组件登录方式变化
    onLoginModeChange?.(mode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formState.phoneNumber) {
      setFormState(prev => ({ ...prev, error: '请输入手机号' }));
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(formState.phoneNumber)) {
      setFormState(prev => ({ ...prev, error: '请输入正确的手机号' }));
      return;
    }
    
    if (loginMode === 'password') {
      if (!password) {
        setFormState(prev => ({ ...prev, error: '请输入密码' }));
        return;
      }
      
      setFormState(prev => ({ ...prev, error: '', isLoading: true }));
      
      try {
        await onPasswordLogin(formState.phoneNumber, password);
        // 密码登录成功后重置loading状态
        setFormState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        setFormState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      if (!formState.verificationCode) {
        setFormState(prev => ({ ...prev, error: '请输入验证码' }));
        return;
      }
      
      if (formState.verificationCode.length !== 6) {
        setFormState(prev => ({ ...prev, error: '验证码应为6位数字' }));
        return;
      }
      
      setFormState(prev => ({ ...prev, error: '', isLoading: true }));
      
      try {
        await onSubmit(formState.phoneNumber, formState.verificationCode);
        // 登录成功后重置loading状态
        setFormState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        setFormState(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  const handleGetCode = () => {
    // 手机号验证
    if (!formState.phoneNumber) {
      setFormState(prev => ({ ...prev, error: '请输入手机号' }));
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(formState.phoneNumber)) {
      setFormState(prev => ({ ...prev, error: '请输入正确的手机号' }));
      return;
    }
    
    // 保存倒计时状态到localStorage
    const endTime = Date.now() + 60 * 1000; // 60秒后的时间戳
    localStorage.setItem('verificationCodeCountdown', JSON.stringify({
      endTime,
      phoneNumber: formState.phoneNumber
    }));
    
    // 开始倒计时
    setFormState(prev => ({ 
      ...prev, 
      error: '', 
      canGetCode: false, 
      countdown: 60 
    }));
    
    // 倒计时逻辑
    const timer = setInterval(() => {
      setFormState(prev => {
        if (prev.countdown <= 1) {
          clearInterval(timer);
          localStorage.removeItem('verificationCodeCountdown');
          return { ...prev, countdown: 0, canGetCode: true };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    
    onGetVerificationCode(formState.phoneNumber);
  };

  return (
    <div className="unified-form-container">
      {/* 登录方式选项卡切换 */}
      <div className="form-tabs">
        <button
          type="button"
          className={`form-tab ${loginMode === 'sms' ? 'active' : ''}`}
          onClick={() => handleLoginModeChange('sms')}
        >
          <svg className="form-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          验证码登录
        </button>
        <button
          type="button"
          className={`form-tab ${loginMode === 'password' ? 'active' : ''}`}
          onClick={() => handleLoginModeChange('password')}
        >
          <svg className="form-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          密码登录
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="unified-form">
        {/* 手机号输入 */}
        <div className="form-group">
          <label className="form-label" htmlFor="phoneNumber">
            <svg className="form-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            手机号
          </label>
          <div className="form-input-wrapper">
            <input
              id="phoneNumber"
              type="tel"
              className="form-input"
              value={formState.phoneNumber}
              onChange={(e) => setFormState(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="请输入手机号"
              required
            />
          </div>
        </div>

        {loginMode === 'password' ? (
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              <svg className="form-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              密码
            </label>
            <div className="form-input-wrapper password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="password-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                记住密码
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="forgot-password-link"
              >
                忘记密码？
              </button>
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label" htmlFor="verificationCode">
              <svg className="form-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              验证码
            </label>
            <div className="verification-code-container">
              <div className="form-input-wrapper">
                <input
                  id="verificationCode"
                  type="text"
                  className="form-input"
                  value={formState.verificationCode}
                  onChange={(e) => setFormState(prev => ({ ...prev, verificationCode: e.target.value }))}
                  placeholder="请输入验证码"
                  required
                />
              </div>
              <button
                type="button"
                className={`verification-code-btn ${!formState.canGetCode || formState.countdown > 0 ? 'disabled' : ''}`}
                onClick={handleGetCode}
                disabled={!formState.canGetCode || formState.countdown > 0}
              >
                {formState.countdown > 0 ? `${formState.countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>
        )}

        {formState.error && (
          <div className="form-error-message">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {formState.error}
          </div>
        )}

        <button
          type="submit"
          className={`form-submit-btn ${formState.isLoading ? 'loading' : ''} ${isLocked ? 'locked' : ''}`}
          disabled={formState.isLoading || isLocked}
        >
          {formState.isLoading ? (
            <>
              <span className="loading-spinner"></span>
              登录中...
            </>
          ) : isLocked ? (
            <>
              <svg className="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              账户已锁定
            </>
          ) : (
            <>
              <svg className="login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              登录
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;