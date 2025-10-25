import { render, screen, fireEvent } from '@testing-library/react';
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

  it('应该展示商品列表', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    // 验证所有商品都被渲染
    expect(screen.getByText('测试商品1')).toBeInTheDocument();
    expect(screen.getByText('测试商品2')).toBeInTheDocument();
  });

  it('应该显示商品基本信息', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    // 验证商品信息
    expect(screen.getByText('测试商品1')).toBeInTheDocument();
    expect(screen.getByText('¥99.99')).toBeInTheDocument();
    expect(screen.getByText('销量 1000')).toBeInTheDocument();
  });

  it('应该在加载时显示加载状态', () => {
    render(
      <ProductGrid 
        products={[]}
        loading={true}
        onProductClick={mockOnProductClick}
      />
    );

    // 验证加载状态
    const loadingElement = document.querySelector('.loading');
    expect(loadingElement).toBeInTheDocument();
  });

  it('应该在没有商品时显示空状态', () => {
    render(
      <ProductGrid 
        products={[]}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    // 验证空状态
    expect(screen.getByText('暂无商品')).toBeInTheDocument();
  });

  it('应该在点击商品时调用回调函数', () => {
    render(
      <ProductGrid 
        products={mockProducts}
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    // 点击第一个商品
    const firstProduct = screen.getByText('测试商品1').closest('div');
    fireEvent.click(firstProduct!);

    // 验证回调被调用
    expect(mockOnProductClick).toHaveBeenCalledWith(mockProducts[0]);
  });
});