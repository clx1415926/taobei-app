import React from 'react';

interface PasswordSetupGuideProps {
  isVisible: boolean;
  onSetupNow: () => void;
  onSetupLater: () => void;
  onClose: () => void;
}

const PasswordSetupGuide: React.FC<PasswordSetupGuideProps> = ({
  isVisible,
  onSetupNow,
  onSetupLater,
  onClose
}) => {
  if (!isVisible) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="password-setup-guide-overlay"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="password-setup-guide-modal">
        <h2>设置登录密码</h2>
        <p>为了提升账户安全性，建议您设置登录密码</p>
        <div className="password-setup-guide-actions">
          <button onClick={onSetupNow}>立即设置</button>
          <button onClick={onSetupLater}>稍后设置</button>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default PasswordSetupGuide;