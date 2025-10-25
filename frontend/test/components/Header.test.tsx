import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../src/components/Header';
import { User } from '../../src/types';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any;
  return {
    ...actual,
    Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>
  };
});

describe('Header Component', () => {
  const mockOnLogout = vi.fn();

  const mockUser: User = {
    id: '1',
    phoneNumber: '13800138000',
    registeredAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-02T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('应该显示淘贝Logo和网站标识', () => {
    renderWithRouter(
      <Header 
        isLoggedIn={false}
        userInfo={undefined}
      />
    );

    expect(screen.getByText('淘贝')).toBeInTheDocument();
  });

  it('应该在用户登录时显示用户信息', () => {
    renderWithRouter(
      <Header 
        isLoggedIn={true}
        userInfo={mockUser}
        onLogout={mockOnLogout}
      />
    );

    // 验证显示用户手机号
    expect(screen.getByText(mockUser.phoneNumber)).toBeInTheDocument();
    
    // 验证显示退出登录按钮
    expect(screen.getByText(/退出登录/i)).toBeInTheDocument();
  });

  it('应该在用户未登录时显示登录注册链接', () => {
    renderWithRouter(
      <Header 
        isLoggedIn={false}
        userInfo={undefined}
      />
    );

    const loginLink = screen.getByText(/登录/i);
    const registerLink = screen.getByText(/注册/i);

    expect(loginLink).toBeInTheDocument();
    expect(registerLink).toBeInTheDocument();
  });

  it('应该在退出登录时调用回调函数', () => {
    renderWithRouter(
      <Header 
        isLoggedIn={true}
        userInfo={mockUser}
        onLogout={mockOnLogout}
      />
    );

    const logoutButton = screen.getByText(/退出登录/i);
    fireEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalled();
  });

  it('应该响应式适配移动端', () => {
    // 模拟移动端屏幕尺寸
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    renderWithRouter(
      <Header 
        isLoggedIn={false}
        userInfo={undefined}
      />
    );

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });
});