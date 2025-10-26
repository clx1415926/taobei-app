import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import PasswordSetupForm from '../components/PasswordSetupForm';
import SuccessModal from '../components/SuccessModal';

const PasswordSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // 从路由状态获取手机号
  const phoneNumber = location.state?.phoneNumber || '';

  const handlePasswordSetupSuccess = () => {
    setShowSuccessModal(true);
  };

  const handlePasswordSetupCancel = () => {
    // 返回注册页面或首页
    navigate('/register');
  };

  const handleSuccessModalConfirm = () => {
    setShowSuccessModal(false);
    // 跳转到登录页面
    navigate('/login');
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // 自动跳转到登录页面
    navigate('/login');
  };

  return (
    <div className="password-setup-page">
      <Header />
      
      <main className="password-setup-main">
        <div className="password-setup-background">
          <div className="password-setup-background-pattern"></div>
          <div className="password-setup-background-gradient"></div>
        </div>
        
        <div className="password-setup-content">
          <div className="password-setup-container">
            <div className="password-setup-header">
              <div className="password-setup-title">
                <svg className="password-setup-title-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
                </svg>
                设置登录密码
              </div>
              <div className="password-setup-subtitle">
                为了您的账户安全，请设置一个强密码
              </div>
            </div>
            
            <PasswordSetupForm
              phoneNumber={phoneNumber}
              onSuccess={handlePasswordSetupSuccess}
              onCancel={handlePasswordSetupCancel}
            />
          </div>
        </div>
        
        {/* 密码设置成功模态弹窗 */}
        <SuccessModal
          isVisible={showSuccessModal}
          title="设置密码成功"
          message="恭喜您，密码设置成功！即将跳转到登录页面。"
          onConfirm={handleSuccessModalConfirm}
          onClose={handleSuccessModalClose}
          autoCloseDelay={3000}
        />
      </main>
    </div>
  );
};

export default PasswordSetupPage;