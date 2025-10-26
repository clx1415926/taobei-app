import React, { useState, useEffect } from 'react';
import { FormState } from '../types';

interface RegisterFormProps {
  onSubmit?: (phoneNumber: string, verificationCode: string) => Promise<void>;
  onGetVerificationCode?: (phoneNumber: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSubmit = () => {}, 
  onGetVerificationCode = () => {} 
}) => {
  const [formState, setFormState] = useState<FormState>({
    phoneNumber: '',
    verificationCode: '',
    agreeToTerms: false,
    isLoading: false,
    countdown: 0,
    error: '',
    canGetCode: true
  });

  // 检查localStorage中的倒计时状态
  useEffect(() => {
    const savedCountdownData = localStorage.getItem('registerVerificationCodeCountdown');
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
                localStorage.removeItem('registerVerificationCodeCountdown');
                return { ...prev, countdown: 0, canGetCode: true };
              }
              return { ...prev, countdown: newCountdown };
            });
          }, 1000);
          
          return () => clearInterval(timer);
        } else {
          localStorage.removeItem('registerVerificationCodeCountdown');
        }
      } catch (error) {
        localStorage.removeItem('registerVerificationCodeCountdown');
      }
    }
  }, []);

  const validatePhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) {
      return '请输入手机号';
    }
    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      return '请输入正确的手机号';
    }
    return '';
  };

  const handlePhoneBlur = () => {
    const error = validatePhoneNumber(formState.phoneNumber);
    setFormState(prev => ({ ...prev, error }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;
    const phoneError = validatePhoneNumber(phoneNumber);
    setFormState(prev => ({ 
      ...prev, 
      phoneNumber,
      // 如果当前有手机号相关的错误，并且新输入的手机号是有效的，则清除错误
      error: (prev.error.includes('手机号') && !phoneError) ? '' : prev.error
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const phoneError = validatePhoneNumber(formState.phoneNumber);
    if (phoneError) {
      setFormState(prev => ({ ...prev, error: phoneError }));
      return;
    }

    if (!formState.verificationCode.trim()) {
      setFormState(prev => ({ ...prev, error: '请输入验证码' }));
      return;
    }

    if (!formState.agreeToTerms) {
      setFormState(prev => ({ ...prev, error: '请同意用户协议' }));
      return;
    }

    try {
      setFormState(prev => ({ ...prev, isLoading: true, error: '' }));
      
      if (onSubmit) {
        await onSubmit(formState.phoneNumber, formState.verificationCode);
      }
    } catch (error) {
      setFormState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '注册失败，请重试' 
      }));
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
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
    localStorage.setItem('registerVerificationCodeCountdown', JSON.stringify({
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
          localStorage.removeItem('registerVerificationCodeCountdown');
          return { ...prev, countdown: 0, canGetCode: true };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    
    onGetVerificationCode(formState.phoneNumber);
  };

  return (
    <div className="unified-form-container">
      <div className="form-header">
        <h2 className="form-title">
          <svg className="form-title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          用户注册
        </h2>
        <p className="form-subtitle">创建您的淘贝账户</p>
      </div>
      
      <form className="unified-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="phoneNumber">
            <svg className="form-label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            手机号
          </label>
          <div className="form-input-wrapper">
            <input
              id="phoneNumber"
              type="tel"
              className="form-input"
              value={formState.phoneNumber}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              placeholder="请输入手机号"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="verificationCode">
            <svg className="form-label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              />
            </div>
            <button
              type="button"
              className={`verification-code-btn ${(!formState.canGetCode || formState.countdown > 0 || !!validatePhoneNumber(formState.phoneNumber)) ? 'disabled' : ''}`}
              onClick={handleGetCode}
              disabled={!formState.canGetCode || formState.countdown > 0 || !!validatePhoneNumber(formState.phoneNumber)}
            >
              {formState.countdown > 0 ? `${formState.countdown}s` : '获取验证码'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label" htmlFor="agreeToTerms">
            <input
              id="agreeToTerms"
              type="checkbox"
              className="checkbox-input"
              checked={formState.agreeToTerms}
              onChange={(e) => setFormState(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
            />
            <span className="checkbox-custom"></span>
            我已阅读并同意用户协议
          </label>
        </div>

        {formState.error && (
          <div className="form-error-message">
            <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formState.error}
          </div>
        )}

        <button
          type="submit"
          className={`form-submit-btn ${formState.isLoading ? 'loading' : ''}`}
          disabled={formState.isLoading}
        >
          {formState.isLoading ? (
            <>
              <div className="loading-spinner"></div>
              注册中...
            </>
          ) : (
            <>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              注册
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;