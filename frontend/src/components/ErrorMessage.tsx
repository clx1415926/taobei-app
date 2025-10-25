import React from 'react';

interface ErrorMessageProps {
  message?: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onClose?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message = '发生了未知错误',
  type = 'error',
  onRetry,
  onClose
}) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'error': return '#fee';
      case 'warning': return '#fff3cd';
      case 'info': return '#d1ecf1';
      default: return '#fee';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#dc3545';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error': return '#721c24';
      case 'warning': return '#856404';
      case 'info': return '#0c5460';
      default: return '#721c24';
    }
  };

  return (
    <div style={{
      backgroundColor: getBackgroundColor(),
      border: `1px solid ${getBorderColor()}`,
      borderRadius: '4px',
      padding: '12px 16px',
      margin: '10px 0',
      color: getTextColor(),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ flex: 1 }}>
        <span>{message}</span>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: 'transparent',
              border: `1px solid ${getBorderColor()}`,
              color: getTextColor(),
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            重试
          </button>
        )}
        
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: getTextColor(),
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0 4px'
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;