import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LoginForm from '../../src/components/LoginForm';

// Mock API
vi.mock('../../src/services/api', () => ({
  authApi: {
    sendVerificationCode: vi.fn(),
    login: vi.fn()
  }
}));

describe('LoginForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnGetVerificationCode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该包含所有必需的表单元素', () => {
    render(
      <LoginForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    // 验证表单元素存在
    expect(screen.getByLabelText(/手机号/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/验证码/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /获取验证码/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  });

  it('应该验证手机号格式', async () => {
    render(
      <LoginForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    const codeInput = screen.getByLabelText(/验证码/i);
    const submitButton = screen.getByRole('button', { name: /登录/i });
    
    // 输入无效手机号和验证码并提交
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    // 验证onSubmit没有被调用（因为手机号格式无效）
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('应该在点击获取验证码后调用回调函数', async () => {
    render(
      <LoginForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    const getCodeButton = screen.getByRole('button', { name: /获取验证码/i });

    // 输入有效手机号
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    
    // 点击获取验证码
    fireEvent.click(getCodeButton);

    await waitFor(() => {
      expect(mockOnGetVerificationCode).toHaveBeenCalledWith('13800138000');
    });
  });

  it('应该验证验证码不能为空', async () => {
    render(
      <LoginForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    const submitButton = screen.getByRole('button', { name: /登录/i });

    // 填写手机号但不填验证码
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });

    // 尝试提交
    fireEvent.click(submitButton);

    // 验证onSubmit没有被调用（因为验证失败）
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('应该在表单验证通过时调用onSubmit', async () => {
    render(
      <LoginForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    const codeInput = screen.getByLabelText(/验证码/i);
    const submitButton = screen.getByRole('button', { name: /登录/i });

    // 填写所有必需信息
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });

    // 提交表单
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('13800138000', '123456');
    });
  });

  it('应该在表单提交时调用onSubmit回调', async () => {
    render(
      <LoginForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    const codeInput = screen.getByLabelText(/验证码/i);
    const submitButton = screen.getByRole('button', { name: /登录/i });

    // 填写所有必需信息
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });

    // 提交表单
    fireEvent.click(submitButton);

    // 验证onSubmit被正确调用
    expect(mockOnSubmit).toHaveBeenCalledWith('13800138000', '123456');
  });


});