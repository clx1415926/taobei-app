import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import RegisterForm from '../../src/components/RegisterForm';

// Mock API
vi.mock('../../src/services/api', () => ({
  authApi: {
    sendVerificationCode: vi.fn(),
    register: vi.fn()
  }
}));

describe('RegisterForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnGetVerificationCode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该包含所有必需的表单元素', () => {
    render(
      <RegisterForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    // 验证表单元素存在
    expect(screen.getByLabelText(/手机号/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/验证码/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /获取验证码/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /注册/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/同意用户协议/i)).toBeInTheDocument();
  });

  it('应该验证手机号格式', async () => {
    render(
      <RegisterForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    
    // 输入无效手机号
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText(/请输入正确的手机号/i)).toBeInTheDocument();
    });
  });

  it('应该在手机号有效时启用获取验证码按钮', async () => {
    render(
      <RegisterForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    const getCodeButton = screen.getByRole('button', { name: /获取验证码/i });

    // 初始状态按钮应该被禁用
    expect(getCodeButton).toBeDisabled();

    // 输入有效手机号
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });

    await waitFor(() => {
      expect(getCodeButton).toBeEnabled();
    });
  });

  it('应该在点击获取验证码后开始倒计时', async () => {
    render(
      <RegisterForm 
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
      <RegisterForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    const agreeCheckbox = screen.getByLabelText(/同意用户协议/i);
    const submitButton = screen.getByRole('button', { name: /注册/i });

    // 填写手机号和勾选协议
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.click(agreeCheckbox);

    // 不填写验证码直接提交
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/请输入验证码/i)).toBeInTheDocument();
    });
  });

  it('应该要求用户同意协议才能注册', async () => {
    render(
      <RegisterForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    const codeInput = screen.getByLabelText(/验证码/i);
    const submitButton = screen.getByRole('button', { name: /注册/i });

    // 填写手机号和验证码，但不勾选协议
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });

    // 尝试提交
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/请同意用户协议/i)).toBeInTheDocument();
    });
  });

  it('应该在表单验证通过时调用onSubmit', async () => {
    render(
      <RegisterForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    const codeInput = screen.getByLabelText(/验证码/i);
    const agreeCheckbox = screen.getByLabelText(/同意用户协议/i);
    const submitButton = screen.getByRole('button', { name: /注册/i });

    // 填写所有必需信息
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(agreeCheckbox);

    // 提交表单
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('13800138000', '123456');
    });
  });

  it('应该在加载状态时禁用提交按钮', async () => {
    render(
      <RegisterForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    const codeInput = screen.getByLabelText(/验证码/i);
    const agreeCheckbox = screen.getByLabelText(/同意用户协议/i);
    const submitButton = screen.getByRole('button', { name: /注册/i });

    // 填写所有必需信息
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(agreeCheckbox);

    // 模拟加载状态
    fireEvent.click(submitButton);

    // 在加载期间按钮应该被禁用
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('应该显示错误信息', async () => {
    render(
      <RegisterForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    
    // 输入无效手机号触发错误
    fireEvent.change(phoneInput, { target: { value: 'invalid' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText(/请输入正确的手机号/i)).toBeInTheDocument();
    });
  });

  it('应该清除错误信息当用户重新输入时', async () => {
    render(
      <RegisterForm 
        onSubmit={mockOnSubmit}
        onGetVerificationCode={mockOnGetVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText(/手机号/i);
    
    // 先触发错误
    fireEvent.change(phoneInput, { target: { value: 'invalid' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText(/请输入正确的手机号/i)).toBeInTheDocument();
    });

    // 重新输入有效值
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });

    await waitFor(() => {
      expect(screen.queryByText(/请输入正确的手机号/i)).not.toBeInTheDocument();
    });
  });
});