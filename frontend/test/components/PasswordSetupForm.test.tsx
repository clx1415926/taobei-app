import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordSetupForm from '../../src/components/PasswordSetupForm';

// Mock the API
vi.mock('../../src/services/api', () => ({
  authApi: {
    setPassword: vi.fn()
  }
}));

describe('PasswordSetupForm Component Tests', () => {
  const mockOnSetupSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const testPhoneNumber = '13800138000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 测试用例6: UI-PasswordSetupForm - 密码设置表单基本功能
  it('应该渲染密码设置表单的所有必要元素', () => {
    render(
      <PasswordSetupForm 
        phoneNumber={testPhoneNumber}
        onSuccess={mockOnSetupSuccess}
        onCancel={mockOnCancel}
      />
    );

    // 根据acceptanceCriteria验证表单元素
    expect(screen.getByText('密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入密码（至少8位）')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请再次输入密码')).toBeInTheDocument();
    expect(screen.getByText('确认设置')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('应该实时显示密码强度', async () => {
    const user = userEvent.setup();
    render(
      <PasswordSetupForm 
        phoneNumber={testPhoneNumber}
        onSuccess={mockOnSetupSuccess}
        onCancel={mockOnCancel}
      />
    );

    const passwordInput = screen.getByPlaceholderText('请输入密码（至少8位）');
    
    // 输入弱密码
    await user.type(passwordInput, '123');
    expect(screen.getByText('弱')).toBeInTheDocument();

    // 输入强密码
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPassword123!');
    expect(screen.getByText('强')).toBeInTheDocument();
  });

  it('应该支持密码显示/隐藏切换', async () => {
    const user = userEvent.setup();
    render(
      <PasswordSetupForm 
        phoneNumber={testPhoneNumber}
        onSuccess={mockOnSetupSuccess}
        onCancel={mockOnCancel}
      />
    );

    const passwordInput = screen.getByPlaceholderText('请输入密码（至少8位）');
    const toggleButtons = screen.getAllByRole('button', { name: '' });
    const toggleButton = toggleButtons.find(btn => btn.className === 'password-toggle-btn');

    // 初始状态应该是password类型
    expect(passwordInput).toHaveAttribute('type', 'password');

    // 点击显示按钮
    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  it('应该验证两次密码输入的一致性', async () => {
    const user = userEvent.setup();
    render(
      <PasswordSetupForm 
        phoneNumber={testPhoneNumber}
        onSuccess={mockOnSetupSuccess}
        onCancel={mockOnCancel}
      />
    );

    const passwordInput = screen.getByPlaceholderText('请输入密码（至少8位）');
    const confirmPasswordInput = screen.getByPlaceholderText('请再次输入密码');
    const submitButton = screen.getByText('确认设置');

    await user.type(passwordInput, 'TestPassword123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');
    await user.click(submitButton);

    expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument();
    expect(mockOnSetupSuccess).not.toHaveBeenCalled();
  });

  it('应该在设置过程中显示加载状态', async () => {
    const { authApi } = await import('../../src/services/api');
    (authApi.setPassword as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const user = userEvent.setup();
    render(
      <PasswordSetupForm 
        phoneNumber={testPhoneNumber}
        onSuccess={mockOnSetupSuccess}
        onCancel={mockOnCancel}
      />
    );

    const passwordInput = screen.getByPlaceholderText('请输入密码（至少8位）');
    const confirmPasswordInput = screen.getByPlaceholderText('请再次输入密码');
    const submitButton = screen.getByText('确认设置');

    await user.type(passwordInput, 'TestPassword123!');
    await user.type(confirmPasswordInput, 'TestPassword123!');
    await user.click(submitButton);

    // 应该显示加载状态
    expect(screen.getByText('设置中...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('应该在取消时调用onCancel回调', async () => {
    const user = userEvent.setup();
    render(
      <PasswordSetupForm 
        phoneNumber={testPhoneNumber}
        onSuccess={mockOnSetupSuccess}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('取消');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});