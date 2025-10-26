import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordSetupGuide from '../../src/components/PasswordSetupGuide';

describe('PasswordSetupGuide Component Tests', () => {
  const mockOnSetupNow = vi.fn();
  const mockOnSetupLater = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 测试用例9: UI-PasswordSetupGuide - 密码设置引导功能
  it('应该在可见时显示引导信息', () => {
    render(
      <PasswordSetupGuide 
        isVisible={true}
        onSetupNow={mockOnSetupNow}
        onSetupLater={mockOnSetupLater}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('设置登录密码')).toBeInTheDocument();
    expect(screen.getByText('为了提升账户安全性，建议您设置登录密码')).toBeInTheDocument();
    expect(screen.getByText('立即设置')).toBeInTheDocument();
    expect(screen.getByText('稍后设置')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('应该在不可见时不渲染任何内容', () => {
    render(
      <PasswordSetupGuide 
        isVisible={false}
        onSetupNow={mockOnSetupNow}
        onSetupLater={mockOnSetupLater}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('设置登录密码')).not.toBeInTheDocument();
  });

  it('应该在点击"立即设置"时调用onSetupNow回调', async () => {
    const user = userEvent.setup();
    render(
      <PasswordSetupGuide 
        isVisible={true}
        onSetupNow={mockOnSetupNow}
        onSetupLater={mockOnSetupLater}
        onClose={mockOnClose}
      />
    );

    const setupNowButton = screen.getByText('立即设置');
    await user.click(setupNowButton);

    expect(mockOnSetupNow).toHaveBeenCalledTimes(1);
  });

  it('应该在点击"稍后设置"时调用onSetupLater回调', async () => {
    const user = userEvent.setup();
    render(
      <PasswordSetupGuide 
        isVisible={true}
        onSetupNow={mockOnSetupNow}
        onSetupLater={mockOnSetupLater}
        onClose={mockOnClose}
      />
    );

    const setupLaterButton = screen.getByText('稍后设置');
    await user.click(setupLaterButton);

    expect(mockOnSetupLater).toHaveBeenCalledTimes(1);
  });

  it('应该在点击关闭按钮时调用onClose回调', async () => {
    const user = userEvent.setup();
    render(
      <PasswordSetupGuide 
        isVisible={true}
        onSetupNow={mockOnSetupNow}
        onSetupLater={mockOnSetupLater}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('×');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('应该支持ESC键关闭弹窗', async () => {
    render(
      <PasswordSetupGuide 
        isVisible={true}
        onSetupNow={mockOnSetupNow}
        onSetupLater={mockOnSetupLater}
        onClose={mockOnClose}
      />
    );

    const modal = screen.getByText('设置登录密码').closest('.password-setup-guide-overlay');
    
    // 模拟ESC键按下
    fireEvent.keyDown(modal!, { key: 'Escape', code: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});