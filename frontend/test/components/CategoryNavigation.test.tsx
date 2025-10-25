import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import CategoryNavigation from '../../src/components/CategoryNavigation';
import { Category } from '../../src/types';

describe('CategoryNavigation Component', () => {
  const mockOnCategoryClick = vi.fn();

  const mockCategories: Category[] = [
    { id: '1', name: '手机数码', icon: 'phone' },
    { id: '2', name: '服装鞋包', icon: 'clothes' },
    { id: '3', name: '家居用品', icon: 'home' },
    { id: '4', name: '美妆护肤', icon: 'beauty' },
    { id: '5', name: '运动户外', icon: 'sports' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该展示商品分类列表', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    // 验证所有分类都被渲染
    mockCategories.forEach(category => {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });
  });

  it('应该支持分类项点击', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    // 点击第一个分类
    const firstCategory = screen.getByText('手机数码');
    fireEvent.click(firstCategory);

    expect(mockOnCategoryClick).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('应该在没有分类数据时显示占位内容', () => {
    render(
      <CategoryNavigation 
        categories={[]}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    // 验证显示占位符分类
    expect(screen.getByText('分类1')).toBeInTheDocument();
    expect(screen.getByText('分类2')).toBeInTheDocument();
  });
});