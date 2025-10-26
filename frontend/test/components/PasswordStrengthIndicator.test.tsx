import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PasswordStrengthIndicator from '../../src/components/PasswordStrengthIndicator';

describe('PasswordStrengthIndicator Component Tests', () => {

  // 测试用例8: UI-PasswordStrengthIndicator - 密码强度实时分析
  it('应该正确分析并显示弱密码强度', () => {
    render(<PasswordStrengthIndicator password="123" showSuggestions={true} />);

    expect(screen.getByText('密码强度:')).toBeInTheDocument();
    expect(screen.getByText('弱')).toBeInTheDocument();
    expect(screen.getByText('改进建议:')).toBeInTheDocument();
    expect(screen.getByText('密码长度至少8位')).toBeInTheDocument();
  });

  it('应该正确分析并显示中等密码强度', () => {
    render(<PasswordStrengthIndicator password="password123" showSuggestions={true} />);

    expect(screen.getByText('中')).toBeInTheDocument();
    expect(screen.getByText('包含大写字母')).toBeInTheDocument();
    expect(screen.getByText('包含特殊字符')).toBeInTheDocument();
  });

  it('应该正确分析并显示强密码强度', () => {
    render(<PasswordStrengthIndicator password="StrongPassword123!" showSuggestions={true} />);

    expect(screen.getByText('强')).toBeInTheDocument();
    // 强密码不应该有改进建议
    expect(screen.queryByText('改进建议:')).not.toBeInTheDocument();
  });

  it('应该使用颜色区分强度等级', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="123" />);
    
    let strengthText = screen.getByText('弱');
    expect(strengthText).toHaveStyle({ color: '#ff4d4f' }); // 红色

    rerender(<PasswordStrengthIndicator password="password123" />);
    strengthText = screen.getByText('中');
    expect(strengthText).toHaveStyle({ color: '#faad14' }); // 橙色

    rerender(<PasswordStrengthIndicator password="StrongPassword123!" />);
    strengthText = screen.getByText('强');
    expect(strengthText).toHaveStyle({ color: '#52c41a' }); // 绿色
  });

  it('应该支持隐藏改进建议', () => {
    render(<PasswordStrengthIndicator password="123" showSuggestions={false} />);

    expect(screen.getByText('弱')).toBeInTheDocument();
    expect(screen.queryByText('改进建议:')).not.toBeInTheDocument();
    expect(screen.queryByText('密码长度至少8位')).not.toBeInTheDocument();
  });

  it('应该提供具体的密码改进建议', () => {
    render(<PasswordStrengthIndicator password="abc" showSuggestions={true} />);

    expect(screen.getByText('密码长度至少8位')).toBeInTheDocument();
    expect(screen.getByText('包含数字')).toBeInTheDocument();
    expect(screen.getByText('包含大写字母')).toBeInTheDocument();
    expect(screen.getByText('包含特殊字符')).toBeInTheDocument();
  });

  it('应该正确处理空密码', () => {
    render(<PasswordStrengthIndicator password="" showSuggestions={true} />);

    expect(screen.getByText('弱')).toBeInTheDocument();
    expect(screen.getByText('请输入密码')).toBeInTheDocument();
  });
});