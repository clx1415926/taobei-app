import React, { useEffect, useState } from 'react';

interface SuccessModalProps {
  isVisible: boolean;
  title: string;
  message?: string;
  onConfirm: () => void;
  onClose: () => void;
  autoCloseDelay?: number; // 自动关闭延迟时间（毫秒）
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isVisible,
  title,
  message,
  onConfirm,
  onClose,
  autoCloseDelay = 3000
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(autoCloseDelay / 1000));

  useEffect(() => {
    if (!isVisible) return;

    // 重置倒计时
    setCountdown(Math.ceil(autoCloseDelay / 1000));

    // 倒计时逻辑
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isVisible, autoCloseDelay, onClose]);

  if (!isVisible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content success-modal">
        <div className="modal-header">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#28a745"/>
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="modal-title">{title}</h3>
        </div>
        
        {message && (
          <div className="modal-body">
            <p className="modal-message">{message}</p>
          </div>
        )}
        
        <div className="modal-footer">
          <div className="countdown-text">
            {countdown > 0 && `${countdown}秒后自动关闭`}
          </div>
          <div className="modal-actions">
            <button 
              className="btn btn-primary"
              onClick={onConfirm}
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;