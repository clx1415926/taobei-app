import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import RegisterForm from '../components/RegisterForm';
import PasswordSetupForm from '../components/PasswordSetupForm';
import PasswordSetupGuide from '../components/PasswordSetupGuide';
import ErrorMessage from '../components/ErrorMessage';
import SuccessModal from '../components/SuccessModal';
import { authApi } from '../services/api';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [registeredPhoneNumber, setRegisteredPhoneNumber] = useState('');
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showPasswordGuide, setShowPasswordGuide] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleRegister = async (phoneNumber: string, verificationCode: string) => {
    try {
      setError('');
      const response = await authApi.register(phoneNumber, verificationCode, true);
      if (response.token) {
        // Token已在authApi.register中保存到localStorage
        console.log('Registration successful');
        setRegisteredPhoneNumber(phoneNumber);
        setShowSuccessModal(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败，请重试';
      setError(errorMessage);
      console.error('Register failed:', error);
      
      // 重新抛出错误，让RegisterForm能够重置loading状态
      throw error;
    }
  };

  const handleSuccessModalConfirm = () => {
    setShowSuccessModal(false);
    // 跳转到设置密码页面
    navigate('/password-setup', { 
      state: { phoneNumber: registeredPhoneNumber } 
    });
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // 自动跳转到设置密码页面
    navigate('/password-setup', { 
      state: { phoneNumber: registeredPhoneNumber } 
    });
  };

  const handleSetupNow = () => {
    setShowPasswordGuide(false);
    setShowPasswordSetup(true);
  };

  const handleSetupLater = () => {
    setShowPasswordGuide(false);
    // 跳转到首页
    navigate('/');
    window.location.reload();
  };

  const handlePasswordSetupSuccess = () => {
    setShowPasswordSetup(false);
    // 密码设置成功，跳转到首页
    navigate('/');
    window.location.reload();
  };

  const handlePasswordSetupCancel = () => {
    setShowPasswordSetup(false);
    setShowPasswordGuide(true);
  };

  const handleGetVerificationCode = async (phoneNumber: string) => {
    try {
      setError('');
      await authApi.sendVerificationCode(phoneNumber, 'register');
      console.log('Verification code sent successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发送验证码失败，请重试';
      setError(errorMessage);
      console.error('Send verification code failed:', error);
    }
  };

  return (
    <div className="register-page">
      <Header />
      
      <main className="register-main">
        <div className="register-container">
          <div className="register-background">
            <div className="register-background-pattern"></div>
            <div className="register-background-gradient"></div>
          </div>
          
          <div className="register-content">
            {/* 页面标题 */}
            <div className="register-header">
              <h1 className="register-title">
                {showPasswordSetup ? '设置密码' : showPasswordGuide ? '密码设置' : '欢迎加入'}
              </h1>
              <p className="register-subtitle">
                {showPasswordSetup ? '为您的账户设置安全密码' : showPasswordGuide ? '立即设置密码，享受更便捷的登录体验' : '创建您的淘贝账户'}
              </p>
            </div>

            {/* 错误消息 */}
            {error && (
              <div className="message-container">
                <ErrorMessage message={error} />
              </div>
            )}
            
            {/* 表单区域 */}
            <div className="form-container">
              {showPasswordSetup ? (
                <PasswordSetupForm
                  phoneNumber={registeredPhoneNumber}
                  onSuccess={handlePasswordSetupSuccess}
                  onCancel={handlePasswordSetupCancel}
                />
              ) : showPasswordGuide ? (
                <PasswordSetupGuide
                  isVisible={true}
                  onSetupNow={handleSetupNow}
                  onSetupLater={handleSetupLater}
                  onClose={handleSetupLater}
                />
              ) : (
                <>
                  <RegisterForm 
                    onSubmit={handleRegister}
                    onGetVerificationCode={handleGetVerificationCode}
                  />
                  
                  <div className="login-prompt">
                    <span className="login-text">已有账号？</span>
                    <Link to="/login" className="login-link">
                      立即登录
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 成功模态框 */}
      {showSuccessModal && (
        <SuccessModal
          isVisible={showSuccessModal}
          title="注册成功"
          message="恭喜您成功注册淘贝账户！"
          onConfirm={handleSuccessModalConfirm}
          onClose={handleSuccessModalClose}
        />
      )}
    </div>
  );
};

export default RegisterPage;