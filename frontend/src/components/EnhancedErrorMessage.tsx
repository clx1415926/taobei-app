import React from 'react';

interface EnhancedErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onForgotPassword?: () => void;
  onGetVerificationCode?: () => void;
  showRetryButton?: boolean;
  showForgotPassword?: boolean;
  showGetVerificationCode?: boolean;
  isPasswordLogin?: boolean;
}

const EnhancedErrorMessage: React.FC<EnhancedErrorMessageProps> = ({
  message,
  onRetry,
  onForgotPassword,
  onGetVerificationCode,
  showRetryButton = true,
  showForgotPassword = false,
  showGetVerificationCode = false,
  isPasswordLogin = false
}) => {
  return (
    <div style={{
      backgroundColor: '#fff2f0',
      border: '1px solid #ffccc7',
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '16px',
      color: '#ff4d4f'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#ff4d4f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          !
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            {message}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {showRetryButton && onRetry && (
              <button
                onClick={onRetry}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                重试
              </button>
            )}
            {showForgotPassword && onForgotPassword && isPasswordLogin && (
              <button
                onClick={onForgotPassword}
                style={{
                  padding: '4px 12px',
                  backgroundColor: 'transparent',
                  color: '#ff4d4f',
                  border: '1px solid #ff4d4f',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                忘记密码？
              </button>
            )}
            {showGetVerificationCode && onGetVerificationCode && !isPasswordLogin && (
              <button
                onClick={onGetVerificationCode}
                style={{
                  padding: '4px 12px',
                  backgroundColor: 'transparent',
                  color: '#ff4d4f',
                  border: '1px solid #ff4d4f',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                重新获取验证码
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedErrorMessage;