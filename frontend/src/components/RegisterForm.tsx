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
    <div style={{ 
      maxWidth: '400px', 
      margin: '50px auto', 
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>用户注册</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="phoneNumber">手机号</label>
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

        <div className="form-group">
          <label className="form-label" htmlFor="verificationCode">验证码</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              id="verificationCode"
              type="text"
              className="form-input"
              value={formState.verificationCode}
              onChange={(e) => setFormState(prev => ({ ...prev, verificationCode: e.target.value }))}
              placeholder="请输入验证码"
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGetCode}
              disabled={!formState.canGetCode || formState.countdown > 0 || !!validatePhoneNumber(formState.phoneNumber)}
              style={{ minWidth: '100px' }}
            >
              {formState.countdown > 0 ? `${formState.countdown}s` : '获取验证码'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="agreeToTerms" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              id="agreeToTerms"
              type="checkbox"
              checked={formState.agreeToTerms}
              onChange={(e) => setFormState(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
            />
            <span>我已阅读并同意用户协议</span>
          </label>
        </div>

        {formState.error && (
          <div className="error-message" style={{ marginBottom: '16px' }}>
            {formState.error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={formState.isLoading}
          style={{ width: '100%' }}
        >
          {formState.isLoading ? <span className="loading"></span> : '注册'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;