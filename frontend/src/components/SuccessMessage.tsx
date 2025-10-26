import React, { useEffect, useState } from 'react';

interface SuccessMessageProps {
  message: string;
  welcomeMessage?: string;
  countdown?: number;
  onCountdownComplete?: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  welcomeMessage,
  countdown = 3,
  onCountdownComplete
}) => {
  const [timeLeft, setTimeLeft] = useState(countdown);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (onCountdownComplete) {
      onCountdownComplete();
    }
  }, [timeLeft, onCountdownComplete]);

  return (
    <div style={{
      backgroundColor: '#f6ffed',
      border: '1px solid #b7eb8f',
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '16px',
      color: '#52c41a',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: '#52c41a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        ✓
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {message}
        </div>
        {welcomeMessage && (
          <div style={{ fontSize: '14px', color: '#389e0d' }}>
            {welcomeMessage}
          </div>
        )}
        {timeLeft > 0 && (
          <div style={{ fontSize: '14px', color: '#389e0d', marginTop: '4px' }}>
            {timeLeft}秒后自动跳转至首页
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessMessage;