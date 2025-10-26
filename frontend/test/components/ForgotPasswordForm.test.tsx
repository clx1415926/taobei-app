import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordForm from '../../src/components/ForgotPasswordForm';

describe('ForgotPasswordForm Component Tests', () => {
  const mockOnResetSuccess = vi.fn();
  const mockOnBackToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 测试用例7: UI-ForgotPasswordForm - 忘记密码表单分步骤显示
  it('应该分步骤显示身份验证和密码重置', () => {
    render(
      <ForgotPasswordForm 
        onResetSuccess={mockOnResetSuccess}
        onBackToLogin={mockOnBackToLogin}
      />
    );

    // 初始应该显示身份验证步骤
    expect(screen.getByText('忘记密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入11位手机号')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入6位验证码')).toBeInTheDocument();
    expect(screen.getByText('获取验证码')).toBeInTheDocument();
    expect(screen.getByText('下一步')).toBeInTheDocument();
    expect(screen.getByText('返回登录')).toBeInTheDocument();
  });

  it('应该支持验证码获取倒计时功能', async () => {
    const user = userEvent.setup();
    render(
      <ForgotPasswordForm 
        onResetSuccess={mockOnResetSuccess}
        onBackToLogin={mockOnBackToLogin}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入11位手机号');
    const getCodeButton = screen.getByText('获取验证码');

    await user.type(phoneInput, '13800138000');
    await user.click(getCodeButton);

    // 应该显示倒计时
    await waitFor(() => {
      expect(screen.getByText(/\d+s/)).toBeInTheDocument();
    });

    // 按钮应该被禁用
    expect(getCodeButton).toBeDisabled();
  });

  it('应该在验证成功后切换到密码重置步骤', async () => {
    const user = userEvent.setup();
    render(
      <ForgotPasswordForm 
        onResetSuccess={mockOnResetSuccess}
        onBackToLogin={mockOnBackToLogin}
      />
    );

    const phoneInput = screen.getByPlaceholderText('请输入11位手机号');
    const codeInput = screen.getByPlaceholderText('请输入6位验证码');
    const nextButton = screen.getByText('下一步');

    await user.type(phoneInput, '13800138000');
    await user.type(codeInput, '123456');
    await user.click(nextButton);

    // 应该切换到密码重置步骤
    await waitFor(() => {
      expect(screen.getByText('设置新密码')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入新密码（至少8位）')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请再次输入新密码')).toBeInTheDocument();
      expect(screen.getByText('确认重置')).toBeInTheDocument();
      expect(screen.getByText('返回上一步')).toBeInTheDocument();
    });
  });

  it('应该验证新密码的强度', async () => {
    const user = userEvent.setup();
    render(
      <ForgotPasswordForm 
        onResetSuccess={mockOnResetSuccess}
        onBackToLogin={mockOnBackToLogin}
      />
    );

    // 先完成验证步骤
    const phoneInput = screen.getByPlaceholderText('请输入11位手机号');
    const codeInput = screen.getByPlaceholderText('请输入6位验证码');
    const nextButton = screen.getByText('下一步');

    await user.type(phoneInput, '13800138000');
    await user.type(codeInput, '123456');
    await user.click(nextButton);

    // 在密码重置步骤测试密码验证
    await waitFor(async () => {
      const newPasswordInput = screen.getByPlaceholderText('请输入新密码（至少8位）');
      const confirmPasswordInput = screen.getByPlaceholderText('请再次输入新密码');
      const resetButton = screen.getByText('确认重置');

      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');
      await user.click(resetButton);

      expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument();
    });
  });

  it('应该支持返回登录页面', async () => {
    const user = userEvent.setup();
    render(
      <ForgotPasswordForm 
        onResetSuccess={mockOnResetSuccess}
        onBackToLogin={mockOnBackToLogin}
      />
    );

    const backButton = screen.getByText('返回登录');
    await user.click(backButton);

    expect(mockOnBackToLogin).toHaveBeenCalledTimes(1);
  });
});