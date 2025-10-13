import React from 'react';

interface LoginButtonProps {
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const LoginButton: React.FC<LoginButtonProps> = ({ 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false 
}) => {
  const handleClick = () => {
    // TODO: 实现点击跳转到登录页面的逻辑
    // 当前不执行任何操作，测试应该失败
    console.log('登录按钮点击功能未实现');
    if (onClick) {
      onClick();
    }
  };

  const getButtonClass = () => {
    let className = 'login-button';
    className += ` login-button--${variant}`;
    className += ` login-button--${size}`;
    if (disabled) {
      className += ' login-button--disabled';
    }
    return className;
  };

  return (
    <button
      className={getButtonClass()}
      onClick={handleClick}
      disabled={disabled}
      type="button"
    >
      登录
    </button>
  );
};

export default LoginButton;