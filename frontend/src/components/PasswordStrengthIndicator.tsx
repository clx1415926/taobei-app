import React, { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showSuggestions?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showSuggestions = true
}) => {
  const { strength, suggestions } = useMemo(() => {
    const analysis = analyzePassword(password);
    return analysis;
  }, [password]);

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'strong': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'weak': return '弱';
      case 'medium': return '中';
      case 'strong': return '强';
      default: return '';
    }
  };

  return (
    <div className="password-strength-indicator">
      <div className="strength-bar">
        <div className="strength-level">
          <span>密码强度: </span>
          <span 
            className="strength-text"
            style={{ color: getStrengthColor(strength) }}
          >
            {getStrengthText(strength)}
          </span>
        </div>
        <div className="strength-visual">
          <div 
            className="strength-fill"
            style={{ 
              width: getStrengthWidth(strength),
              backgroundColor: getStrengthColor(strength)
            }}
          />
        </div>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="strength-suggestions">
          <p>改进建议:</p>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

function analyzePassword(password: string) {
  if (!password) {
    return {
      strength: 'weak' as const,
      suggestions: ['请输入密码']
    };
  }

  const suggestions: string[] = [];
  let score = 0;

  // 长度检查
  if (password.length >= 8) {
    score += 1;
  } else {
    suggestions.push('密码长度至少8位');
  }

  // 包含数字
  if (/\d/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含数字');
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含小写字母');
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含大写字母');
  }

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含特殊字符');
  }

  let strength: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 3) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return { strength, suggestions };
}

function getStrengthWidth(strength: string) {
  switch (strength) {
    case 'weak': return '33%';
    case 'medium': return '66%';
    case 'strong': return '100%';
    default: return '0%';
  }
}

export default PasswordStrengthIndicator;