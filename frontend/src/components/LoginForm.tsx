import React, { useState } from 'react';
import { FormState } from '../types';

interface LoginFormProps {
  onSubmit?: (phoneNumber: string, verificationCode: string) => void;
  onGetVerificationCode?: (phoneNumber: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onSubmit = () => {}, 
  onGetVerificationCode = () => {} 
}) => {
  const [formState, setFormState] = useState<FormState>({
    phoneNumber: '',
    verificationCode: '',
    isLoading: false,
    countdown: 0,
    error: '',
    canGetCode: true
  });

  const handleSubmit = (e: React.FormEvent) => {
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
    
    if (!formState.verificationCode) {
      setFormState(prev => ({ ...prev, error: '请输入验证码' }));
      return;
    }
    
    if (formState.verificationCode.length !== 6) {
      setFormState(prev => ({ ...prev, error: '验证码应为6位数字' }));
      return;
    }
    
    setFormState(prev => ({ ...prev, error: '', isLoading: true }));
    onSubmit(formState.phoneNumber, formState.verificationCode);
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
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>用户登录</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">手机号</label>
          <input
            type="tel"
            className="form-input"
            value={formState.phoneNumber}
            onChange={(e) => setFormState(prev => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="请输入手机号"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">验证码</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-input"
              value={formState.verificationCode}
              onChange={(e) => setFormState(prev => ({ ...prev, verificationCode: e.target.value }))}
              placeholder="请输入验证码"
              required
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGetCode}
              disabled={!formState.canGetCode || formState.countdown > 0}
              style={{ minWidth: '100px' }}
            >
              {formState.countdown > 0 ? `${formState.countdown}s` : '获取验证码'}
            </button>
          </div>
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
          {formState.isLoading ? <span className="loading"></span> : '登录'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;