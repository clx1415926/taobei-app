import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Homepage from '../../src/pages/Homepage';

// Mock API
vi.mock('../../src/services/api', () => ({
  homepageApi: {
    getHomepageData: vi.fn()
  }
}));

// Mock子组件
vi.mock('../../src/components/Header', () => ({
  default: ({ userInfo, onSearch, onLoginClick, onRegisterClick }: any) => (
    <div data-testid="header">
      <span>Header Component</span>
      {userInfo && <span>User: {userInfo.phoneNumber}</span>}
      <button onClick={onSearch}>Search</button>
      <button onClick={onLoginClick}>Login</button>
      <button onClick={onRegisterClick}>Register</button>
    </div>
  )
}));

vi.mock('../../src/components/SearchBar', () => ({
  default: ({ onSearch }: any) => (
    <div data-testid="search-bar">
      <input placeholder="搜索商品" />
      <button onClick={() => onSearch('test')}>搜索</button>
    </div>
  )
}));

vi.mock('../../src/components/CategoryNavigation', () => ({
  default: ({ categories, onCategoryClick }: any) => (
    <div data-testid="category-nav">
      {categories?.map((cat: any) => (
        <button key={cat.id} onClick={() => onCategoryClick(cat)}>
          {cat.name}
        </button>
      ))}
    </div>
  )
}));

vi.mock('../../src/components/ProductGrid', () => ({
  default: ({ products, loading, onProductClick }: any) => (
    <div data-testid="product-grid">
      {loading ? (
        <div>Loading products...</div>
      ) : (
        products?.map((product: any) => (
          <button key={product.id} onClick={() => onProductClick(product)}>
            {product.title}
          </button>
        ))
      )}
    </div>
  )
}));

describe('Homepage Component', () => {
  const mockHomepageData = {
    hotProducts: [
      { id: '1', title: '热门商品1', price: 99.99 },
      { id: '2', title: '热门商品2', price: 199.99 }
    ],
    categories: [
      { id: '1', name: '手机数码', icon: 'phone' },
      { id: '2', name: '服装鞋包', icon: 'clothes' }
    ],
    userInfo: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API响应
    const { homepageApi } = require('../../src/services/api');
    homepageApi.getHomepageData.mockResolvedValue({
      success: true,
      data: mockHomepageData
    });
  });

  const renderHomepage = () => {
    return render(
      <BrowserRouter>
        <Homepage />
      </BrowserRouter>
    );
  };

  it('应该在页面加载时自动获取首页数据', async () => {
    renderHomepage();

    const { homepageApi } = require('../../src/services/api');
    
    await waitFor(() => {
      expect(homepageApi.getHomepageData).toHaveBeenCalled();
    });
  });

  it('应该根据用户登录状态显示不同的头部内容', async () => {
    renderHomepage();

    await waitFor(() => {
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    // 验证头部组件被正确渲染
    expect(screen.getByText('Header Component')).toBeInTheDocument();
  });

  it('应该展示热门商品网格和分类导航', async () => {
    renderHomepage();

    await waitFor(() => {
      expect(screen.getByTestId('product-grid')).toBeInTheDocument();
      expect(screen.getByTestId('category-nav')).toBeInTheDocument();
    });

    // 验证热门商品显示
    expect(screen.getByText('热门商品1')).toBeInTheDocument();
    expect(screen.getByText('热门商品2')).toBeInTheDocument();

    // 验证分类导航显示
    expect(screen.getByText('手机数码')).toBeInTheDocument();
    expect(screen.getByText('服装鞋包')).toBeInTheDocument();
  });

  it('应该在页面加载时间不超过3秒内完成', async () => {
    const startTime = Date.now();
    
    renderHomepage();

    await waitFor(() => {
      expect(screen.getByTestId('product-grid')).toBeInTheDocument();
    }, { timeout: 3000 });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  it('应该在加载过程中显示加载状态', () => {
    // Mock延迟的API响应
    const { homepageApi } = require('../../src/services/api');
    homepageApi.getHomepageData.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: mockHomepageData
      }), 1000))
    );

    renderHomepage();

    // 验证加载状态
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('应该处理API错误并显示错误信息', async () => {
    // Mock API错误
    const { homepageApi } = require('../../src/services/api');
    homepageApi.getHomepageData.mockRejectedValue(new Error('网络错误'));

    renderHomepage();

    await waitFor(() => {
      expect(screen.getByText(/加载失败/i)).toBeInTheDocument();
    });
  });

  it('应该支持搜索功能', async () => {
    renderHomepage();

    await waitFor(() => {
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });

    const searchButton = screen.getByText('搜索');
    fireEvent.click(searchButton);

    // 验证搜索处理逻辑
    // 这里应该验证路由跳转或搜索状态更新
  });

  it('应该支持分类点击跳转', async () => {
    renderHomepage();

    await waitFor(() => {
      expect(screen.getByText('手机数码')).toBeInTheDocument();
    });

    const categoryButton = screen.getByText('手机数码');
    fireEvent.click(categoryButton);

    // 验证分类点击处理逻辑
    // 这里应该验证路由跳转或分类筛选
  });

  it('应该支持商品点击查看详情', async () => {
    renderHomepage();

    await waitFor(() => {
      expect(screen.getByText('热门商品1')).toBeInTheDocument();
    });

    const productButton = screen.getByText('热门商品1');
    fireEvent.click(productButton);

    // 验证商品点击处理逻辑
    // 这里应该验证路由跳转到商品详情页
  });

  it('应该支持移动端响应式布局', () => {
    // 模拟移动端视口
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    renderHomepage();

    const homepageContainer = screen.getByTestId('homepage');
    expect(homepageContainer).toHaveClass('mobile-layout');
  });

  it('应该支持下拉刷新功能', async () => {
    renderHomepage();

    const homepageContainer = screen.getByTestId('homepage');

    // 模拟下拉刷新手势
    fireEvent.touchStart(homepageContainer, {
      touches: [{ clientY: 0 }]
    });
    fireEvent.touchMove(homepageContainer, {
      touches: [{ clientY: 100 }]
    });
    fireEvent.touchEnd(homepageContainer);

    const { homepageApi } = require('../../src/services/api');
    
    await waitFor(() => {
      expect(homepageApi.getHomepageData).toHaveBeenCalledTimes(2);
    });
  });

  it('应该支持无障碍访问', async () => {
    renderHomepage();

    await waitFor(() => {
      expect(screen.getByTestId('homepage')).toBeInTheDocument();
    });

    const homepageContainer = screen.getByTestId('homepage');
    
    // 验证语义化标签
    expect(homepageContainer).toHaveAttribute('role', 'main');
    
    // 验证标题层级
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('应该支持键盘导航', async () => {
    renderHomepage();

    await waitFor(() => {
      expect(screen.getByText('手机数码')).toBeInTheDocument();
    });

    const firstCategory = screen.getByText('手机数码');
    const firstProduct = screen.getByText('热门商品1');

    // 验证Tab键导航
    firstCategory.focus();
    expect(firstCategory).toHaveFocus();

    fireEvent.keyDown(firstCategory, { key: 'Tab' });
    expect(firstProduct).toHaveFocus();
  });

  it('应该缓存首页数据以提高性能', async () => {
    renderHomepage();

    const { homepageApi } = require('../../src/services/api');
    
    await waitFor(() => {
      expect(homepageApi.getHomepageData).toHaveBeenCalledTimes(1);
    });

    // 重新渲染组件
    renderHomepage();

    // 验证缓存机制，不应该重复请求
    expect(homepageApi.getHomepageData).toHaveBeenCalledTimes(1);
  });

  it('应该支持图片懒加载优化', async () => {
    renderHomepage();

    await waitFor(() => {
      expect(screen.getByTestId('product-grid')).toBeInTheDocument();
    });

    // 验证图片懒加载属性
    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });
});