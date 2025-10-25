import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium',
  color = '#ff6b35',
  text = ''
}) => {
  const sizeMap = {
    small: '16px',
    medium: '32px',
    large: '48px'
  };

  const spinnerSize = sizeMap[size];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `3px solid #f3f3f3`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {text && (
        <span style={{ 
          color: '#666', 
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;