import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LoginPage from '../../src/components/LoginPage';

// Mock fetch API
global.fetch = vi.fn();

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应该渲染登录表单的所有必要元素', () => {
    render(<LoginPage />);
    
    // 验证标题
    expect(screen.getByText('用户登录')).toBeInTheDocument();
    
    // 验证手机号输入框
    const phoneInput = screen.getByLabelText('手机号码');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('type', 'tel');
    expect(phoneInput).toHaveAttribute('maxLength', '11');
    expect(phoneInput).toHaveAttribute('placeholder', '请输入手机号码');
    
    // 验证验证码输入框
    const codeInput = screen.getByLabelText('验证码');
    expect(codeInput).toBeInTheDocument();
    expect(codeInput).toHaveAttribute('type', 'text');
    expect(codeInput).toHaveAttribute('maxLength', '6');
    expect(codeInput).toHaveAttribute('placeholder', '请输入验证码');
    
    // 验证获取验证码按钮
    const sendCodeBtn = screen.getByText('获取验证码');
    expect(sendCodeBtn).toBeInTheDocument();
    expect(sendCodeBtn).toBeDisabled(); // 初始状态应该禁用
    
    // 验证登录按钮
    const loginBtn = screen.getByText('登录');
    expect(loginBtn).toBeInTheDocument();
    expect(loginBtn).toBeDisabled(); // 初始状态应该禁用
  });

  test('手机号输入应该启用获取验证码按钮', () => {
    render(<LoginPage />);
    
    const phoneInput = screen.getByLabelText('手机号码');
    const sendCodeBtn = screen.getByText('获取验证码');
    
    // 初始状态按钮禁用
    expect(sendCodeBtn).toBeDisabled();
    
    // 输入手机号后按钮启用
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    expect(sendCodeBtn).not.toBeDisabled();
  });

  test('手机号和验证码都输入后应该启用登录按钮', () => {
    render(<LoginPage />);
    
    const phoneInput = screen.getByLabelText('手机号码');
    const codeInput = screen.getByLabelText('验证码');
    const loginBtn = screen.getByText('登录');
    
    // 初始状态登录按钮禁用
    expect(loginBtn).toBeDisabled();
    
    // 只输入手机号，登录按钮仍然禁用
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    expect(loginBtn).toBeDisabled();
    
    // 输入验证码后，登录按钮启用
    fireEvent.change(codeInput, { target: { value: '123456' } });
    expect(loginBtn).not.toBeDisabled();
  });

  test('点击获取验证码应该发送API请求并显示倒计时', async () => {
    // Mock成功的API响应
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: '验证码发送成功',
        expiresIn: 60
      })
    });

    render(<LoginPage />);
    
    const phoneInput = screen.getByLabelText('手机号码');
    const sendCodeBtn = screen.getByText('获取验证码');
    
    // 输入手机号
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    
    // 点击获取验证码
    fireEvent.click(sendCodeBtn);
    
    // 验证API调用
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: '13800138000' })
      });
    });
    
    // 验证倒计时显示
    await waitFor(() => {
      expect(screen.getByText(/\d+s/)).toBeInTheDocument();
    });
    
    // 验证按钮在倒计时期间禁用
    expect(sendCodeBtn).toBeDisabled();
  });

  test('获取验证码失败应该显示错误信息', async () => {
    const mockOnError = vi.fn();
    
    // Mock失败的API响应
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: '请输入正确的手机号码'
      })
    });

    render(<LoginPage onError={mockOnError} />);
    
    const phoneInput = screen.getByLabelText('手机号码');
    const sendCodeBtn = screen.getByText('获取验证码');
    
    // 输入无效手机号
    fireEvent.change(phoneInput, { target: { value: 'invalid' } });
    
    // 点击获取验证码
    fireEvent.click(sendCodeBtn);
    
    // 验证错误回调被调用
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('请输入正确的手机号码');
    });
  });

  test('登录成功应该调用onLoginSuccess回调', async () => {
    const mockOnLoginSuccess = vi.fn();
    
    // Mock成功的登录响应
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: 'user123',
        token: 'jwt-token-123'
      })
    });

    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} />);
    
    const phoneInput = screen.getByLabelText('手机号码');
    const codeInput = screen.getByLabelText('验证码');
    const loginBtn = screen.getByText('登录');
    
    // 输入登录信息
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    
    // 点击登录
    fireEvent.click(loginBtn);
    
    // 验证API调用
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: '13800138000',
          verificationCode: '123456'
        })
      });
    });
    
    // 验证成功回调被调用
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith('user123', 'jwt-token-123');
    });
  });

  test('登录失败应该显示错误信息', async () => {
    const mockOnError = vi.fn();
    
    // Mock失败的登录响应
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: '该手机号未注册，请先完成注册'
      })
    });

    render(<LoginPage onError={mockOnError} />);
    
    const phoneInput = screen.getByLabelText('手机号码');
    const codeInput = screen.getByLabelText('验证码');
    const loginBtn = screen.getByText('登录');
    
    // 输入登录信息
    fireEvent.change(phoneInput, { target: { value: '13999999999' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    
    // 点击登录
    fireEvent.click(loginBtn);
    
    // 验证错误回调被调用
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('该手机号未注册，请先完成注册');
    });
  });

  test('登录过程中应该显示加载状态', async () => {
    // Mock延迟的API响应
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ userId: 'user123', token: 'token123' })
        }), 100)
      )
    );

    render(<LoginPage />);
    
    const phoneInput = screen.getByLabelText('手机号码');
    const codeInput = screen.getByLabelText('验证码');
    const loginBtn = screen.getByText('登录');
    
    // 输入登录信息
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    
    // 点击登录
    fireEvent.click(loginBtn);
    
    // 验证加载状态
    expect(screen.getByText('登录中...')).toBeInTheDocument();
    expect(loginBtn).toBeDisabled();
    
    // 等待请求完成
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    });
  });

  test('应该限制手机号输入长度为11位', () => {
    render(<LoginPage />);
    
    const phoneInput = screen.getByLabelText('手机号码') as HTMLInputElement;
    
    // 尝试输入超过11位的手机号
    fireEvent.change(phoneInput, { target: { value: '138001380001234' } });
    
    // 验证输入被限制在11位
    expect(phoneInput.value.length).toBeLessThanOrEqual(11);
  });

  test('应该限制验证码输入长度为6位', () => {
    render(<LoginPage />);
    
    const codeInput = screen.getByLabelText('验证码') as HTMLInputElement;
    
    // 尝试输入超过6位的验证码
    fireEvent.change(codeInput, { target: { value: '1234567890' } });
    
    // 验证输入被限制在6位
    expect(codeInput.value.length).toBeLessThanOrEqual(6);
  });
});