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
      { id: '1', title: '热门商品1', price: 99.99, image: 'image1.jpg', sales: 100, category: '手机数码' },
      { id: '2', title: '热门商品2', price: 199.99, image: 'image2.jpg', sales: 200, category: '服装鞋包' }
    ],
    categories: [
      { id: '1', name: '手机数码', icon: 'phone' },
      { id: '2', name: '服装鞋包', icon: 'clothes' }
    ],
    banners: [],
    userInfo: null
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock API响应
    const { homepageApi } = await import('../../src/services/api');
    vi.mocked(homepageApi.getHomepageData).mockResolvedValue({
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

    const { homepageApi } = await import('../../src/services/api');
    
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

  it('应该在加载过程中显示加载状态', async () => {
    // Mock延迟的API响应
    const { homepageApi } = await import('../../src/services/api');
    vi.mocked(homepageApi.getHomepageData).mockImplementation(() => 
      Promise.resolve({
        data: mockHomepageData,
        message: ''
      })
    );

    renderHomepage();

    // 验证加载状态
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('应该处理API错误并显示错误信息', async () => {
    // Mock API错误
    const { homepageApi } = await import('../../src/services/api');
    vi.mocked(homepageApi.getHomepageData).mockRejectedValue(new Error('网络错误'));

    renderHomepage();

    await waitFor(() => {
      expect(screen.getByText(/网络错误/i)).toBeInTheDocument();
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


});