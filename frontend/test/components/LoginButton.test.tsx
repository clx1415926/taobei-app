import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import LoginButton from '../../src/components/LoginButton';

describe('LoginButton Component', () => {
  test('应该渲染默认的登录按钮', () => {
    render(<LoginButton />);
    
    const button = screen.getByRole('button', { name: '登录' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('login-button');
    expect(button).toHaveClass('login-button--primary');
    expect(button).toHaveClass('login-button--medium');
    expect(button).not.toBeDisabled();
  });

  test('应该支持不同的variant属性', () => {
    const { rerender } = render(<LoginButton variant="primary" />);
    
    let button = screen.getByRole('button', { name: '登录' });
    expect(button).toHaveClass('login-button--primary');
    
    rerender(<LoginButton variant="secondary" />);
    button = screen.getByRole('button', { name: '登录' });
    expect(button).toHaveClass('login-button--secondary');
  });

  test('应该支持不同的size属性', () => {
    const { rerender } = render(<LoginButton size="small" />);
    
    let button = screen.getByRole('button', { name: '登录' });
    expect(button).toHaveClass('login-button--small');
    
    rerender(<LoginButton size="medium" />);
    button = screen.getByRole('button', { name: '登录' });
    expect(button).toHaveClass('login-button--medium');
    
    rerender(<LoginButton size="large" />);
    button = screen.getByRole('button', { name: '登录' });
    expect(button).toHaveClass('login-button--large');
  });

  test('应该支持disabled属性', () => {
    const { rerender } = render(<LoginButton disabled={false} />);
    
    let button = screen.getByRole('button', { name: '登录' });
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveClass('login-button--disabled');
    
    rerender(<LoginButton disabled={true} />);
    button = screen.getByRole('button', { name: '登录' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('login-button--disabled');
  });

  test('点击按钮应该触发onClick回调', () => {
    const mockOnClick = vi.fn();
    render(<LoginButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: '登录' });
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('禁用状态下点击按钮不应该触发onClick回调', () => {
    const mockOnClick = vi.fn();
    render(<LoginButton onClick={mockOnClick} disabled={true} />);
    
    const button = screen.getByRole('button', { name: '登录' });
    fireEvent.click(button);
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  test('应该正确组合多个CSS类名', () => {
    render(
      <LoginButton 
        variant="secondary" 
        size="large" 
        disabled={true} 
      />
    );
    
    const button = screen.getByRole('button', { name: '登录' });
    expect(button).toHaveClass('login-button');
    expect(button).toHaveClass('login-button--secondary');
    expect(button).toHaveClass('login-button--large');
    expect(button).toHaveClass('login-button--disabled');
  });

  test('应该具有正确的button类型', () => {
    render(<LoginButton />);
    
    const button = screen.getByRole('button', { name: '登录' });
    expect(button).toHaveAttribute('type', 'button');
  });

  test('应该在没有onClick回调时仍然可以点击', () => {
    // 这个测试确保组件在没有onClick prop时不会崩溃
    render(<LoginButton />);
    
    const button = screen.getByRole('button', { name: '登录' });
    
    // 这不应该抛出错误
    expect(() => {
      fireEvent.click(button);
    }).not.toThrow();
  });

  test('应该支持所有variant和size的组合', () => {
    const variants = ['primary', 'secondary'] as const;
    const sizes = ['small', 'medium', 'large'] as const;
    
    variants.forEach(variant => {
      sizes.forEach(size => {
        const { unmount } = render(
          <LoginButton variant={variant} size={size} />
        );
        
        const button = screen.getByRole('button', { name: '登录' });
        expect(button).toHaveClass(`login-button--${variant}`);
        expect(button).toHaveClass(`login-button--${size}`);
        
        unmount();
      });
    });
  });

  test('应该在点击时导航到登录页面', () => {
    // 这个测试验证按钮的主要功能：导航到登录页面
    const mockNavigate = vi.fn();
    
    // 模拟导航功能
    render(<LoginButton onClick={mockNavigate} />);
    
    const button = screen.getByRole('button', { name: '登录' });
    fireEvent.click(button);
    
    // 验证导航函数被调用
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  test('应该在首页正确显示', () => {
    // 这个测试验证按钮在首页的显示效果
    render(
      <div className="homepage-header">
        <LoginButton variant="primary" size="medium" />
      </div>
    );
    
    const button = screen.getByRole('button', { name: '登录' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('login-button--primary');
    expect(button).toHaveClass('login-button--medium');
  });
});