import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ProductGrid from '../../src/components/ProductGrid';
import { Product } from '../../src/types';

describe('ProductGrid Component', () => {
  const mockOnProductClick = vi.fn();

  const mockProducts: Product[] = [
    {
      id: '1',
      title: '测试商品1',
      price: 99.99,
      image: 'https://example.com/product1.jpg',
      sales: 1000,
      category: '手机数码'
    },
    {
      id: '2',
      title: '测试商品2',
      price: 199.99,
      image: 'https://example.com/product2.jpg',
      sales: 500,
      category: '服装鞋包'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该以网格形式展示商品列表', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    // 验证商品网格容器存在
    const gridContainer = screen.getByTestId('product-grid');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('product-grid');

    // 验证所有商品都被渲染
    expect(screen.getByText('测试商品1')).toBeInTheDocument();
    expect(screen.getByText('测试商品2')).toBeInTheDocument();
  });

  it('应该显示每个商品的完整信息', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    // 验证第一个商品的信息
    expect(screen.getByText('测试商品1')).toBeInTheDocument();
    expect(screen.getByText('¥99.99')).toBeInTheDocument();
    expect(screen.getByText('销量: 1000')).toBeInTheDocument();
    
    // 验证商品图片
    const productImage = screen.getByAltText('测试商品1');
    expect(productImage).toBeInTheDocument();
    expect(productImage).toHaveAttribute('src', 'https://example.com/product1.jpg');
  });

  it('应该支持商品图片懒加载', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    const productImages = screen.getAllByRole('img');
    
    productImages.forEach(img => {
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  it('应该在图片加载失败时显示默认占位图', async () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    const productImage = screen.getByAltText('测试商品1');
    
    // 模拟图片加载失败
    fireEvent.error(productImage);

    await waitFor(() => {
      expect(productImage).toHaveAttribute('src', '/images/placeholder.png');
    });
  });

  it('应该支持响应式布局', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    const gridContainer = screen.getByTestId('product-grid');
    
    // 验证响应式CSS类
    expect(gridContainer).toHaveClass('responsive-grid');
    
    // 验证CSS Grid属性
    const computedStyle = window.getComputedStyle(gridContainer);
    expect(computedStyle.display).toBe('grid');
  });

  it('应该支持商品卡片点击查看详情', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    const firstProductCard = screen.getByTestId('product-card-1');
    
    fireEvent.click(firstProductCard);
    
    expect(mockOnProductClick).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('应该在加载状态下显示加载指示器', () => {
    render(
      <ProductGrid 
        products={[]}
        loading={true}
        onProductClick={mockOnProductClick}
      />
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/加载中.../i)).toBeInTheDocument();
  });

  it('应该在没有商品时显示空状态', () => {
    render(
      <ProductGrid 
        products={[]}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    expect(screen.getByText(/暂无商品/i)).toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('应该支持键盘导航', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    const firstProductCard = screen.getByTestId('product-card-1');
    const secondProductCard = screen.getByTestId('product-card-2');

    // 验证商品卡片可以获得焦点
    expect(firstProductCard).toHaveAttribute('tabindex', '0');
    expect(secondProductCard).toHaveAttribute('tabindex', '0');

    // 测试键盘导航
    firstProductCard.focus();
    expect(firstProductCard).toHaveFocus();

    fireEvent.keyDown(firstProductCard, { key: 'Tab' });
    expect(secondProductCard).toHaveFocus();
  });

  it('应该支持Enter键选择商品', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    const firstProductCard = screen.getByTestId('product-card-1');
    
    firstProductCard.focus();
    fireEvent.keyDown(firstProductCard, { key: 'Enter' });
    
    expect(mockOnProductClick).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('应该正确处理价格显示', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    // 验证当前价格
    expect(screen.getByText('¥99.99')).toBeInTheDocument();
    expect(screen.getByText('¥199.99')).toBeInTheDocument();

    // 验证原价（如果有折扣）
    const originalPrices = screen.getAllByText(/¥199\.99/);
    expect(originalPrices.length).toBeGreaterThan(0);
  });

  it('应该显示销量信息', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    expect(screen.getByText('销量: 1000')).toBeInTheDocument();
    expect(screen.getByText('销量: 500')).toBeInTheDocument();
  });

  it('应该支持无障碍访问', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    const gridContainer = screen.getByTestId('product-grid');
    const productCards = screen.getAllByRole('button');

    // 验证ARIA标签
    expect(gridContainer).toHaveAttribute('role', 'grid');
    
    productCards.forEach((card, index) => {
      expect(card).toHaveAttribute('aria-label', `查看商品详情: ${mockProducts[index].title}`);
    });
  });

  it('应该在移动端正确显示', () => {
    // 模拟移动端视口
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    const gridContainer = screen.getByTestId('product-grid');
    
    // 验证移动端样式类
    expect(gridContainer).toHaveClass('mobile-grid');
  });
});