import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (user: { phone: string }) => void;
  onError?: (error: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onError }) => {
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 手机号验证
  const validatePhone = (phoneNumber: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('验证码已发送');
        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.message || '发送验证码失败');
      }
    } catch (err) {
      const errorMessage = '网络错误，请重试';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('登录成功');
        onLogin({ phone });
      } else {
        const errorMessage = data.message || data.error || '登录失败';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理手机号输入
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // 只保留数字
    if (value.length <= 11) {
      setPhone(value);
      setError('');
    }
  };

  // 处理验证码输入
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // 只保留数字
    if (value.length <= 6) {
      setVerificationCode(value);
      setError('');
    }
  };

  return (
    <div className="login-page">
      <h2 className="login-title">手机号登录</h2>
      
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label className="form-label" htmlFor="phone-number">手机号码</label>
          <div className="phone-input-group">
            <select className="country-code" defaultValue="+86">
              <option value="+86">中国大陆 +86</option>
            </select>
            <input
              id="phone-number"
              type="tel"
              className="phone-input"
              placeholder="请输入手机号"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={11}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="verification-code">验证码</label>
          <div className="verification-input-group">
            <input
              id="verification-code"
              type="text"
              className="verification-input"
              placeholder="请输入验证码"
              value={verificationCode}
              onChange={handleCodeChange}
              maxLength={6}
              required
            />
            <button
              type="button"
              className="send-code-button"
              onClick={handleSendCode}
              disabled={!validatePhone(phone) || countdown > 0 || isLoading}
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button
          type="submit"
          className={`login-button ${isLoading ? 'loading' : ''}`}
          disabled={!validatePhone(phone) || verificationCode.length !== 6 || isLoading}
        >
          {isLoading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;