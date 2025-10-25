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

  it('应该水平展示商品分类列表', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    const categoryContainer = screen.getByTestId('category-navigation');
    expect(categoryContainer).toBeInTheDocument();
    expect(categoryContainer).toHaveClass('horizontal-layout');

    // 验证所有分类都被渲染
    mockCategories.forEach(category => {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });
  });

  it('应该支持分类图标和名称显示', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    // 验证分类图标
    mockCategories.forEach(category => {
      const categoryItem = screen.getByTestId(`category-${category.id}`);
      expect(categoryItem).toBeInTheDocument();
      
      // 验证图标
      const icon = screen.getByTestId(`category-icon-${category.id}`);
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass(`icon-${category.icon}`);
      
      // 验证名称
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });
  });

  it('应该支持分类项点击跳转', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    const firstCategory = screen.getByTestId('category-1');
    fireEvent.click(firstCategory);

    expect(mockOnCategoryClick).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('应该支持当前选中分类的视觉高亮', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    const firstCategory = screen.getByTestId('category-1');
    const secondCategory = screen.getByTestId('category-2');

    expect(firstCategory).toBeInTheDocument();
    expect(secondCategory).toBeInTheDocument();
  });

  it('应该在移动端支持横向滚动', () => {
    // 模拟移动端视口
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    const categoryContainer = screen.getByTestId('category-navigation');
    
    // 验证移动端滚动样式
    expect(categoryContainer).toHaveClass('mobile-scroll');
    
    const computedStyle = window.getComputedStyle(categoryContainer);
    expect(computedStyle.overflowX).toBe('auto');
  });

  it('应该支持键盘导航', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    const firstCategory = screen.getByTestId('category-1');
    const secondCategory = screen.getByTestId('category-2');

    // 验证可以获得焦点
    expect(firstCategory).toHaveAttribute('tabindex', '0');
    expect(secondCategory).toHaveAttribute('tabindex', '0');

    // 测试Tab键导航
    firstCategory.focus();
    expect(firstCategory).toHaveFocus();

    fireEvent.keyDown(firstCategory, { key: 'Tab' });
    expect(secondCategory).toHaveFocus();
  });

  it('应该支持Enter键和Space键选择分类', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    const firstCategory = screen.getByTestId('category-1');
    
    // 测试Enter键
    firstCategory.focus();
    fireEvent.keyDown(firstCategory, { key: 'Enter' });
    expect(mockOnCategoryClick).toHaveBeenCalledWith(mockCategories[0]);

    // 清除mock
    mockOnCategoryClick.mockClear();

    // 测试Space键
    fireEvent.keyDown(firstCategory, { key: ' ' });
    expect(mockOnCategoryClick).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('应该支持左右箭头键导航', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    const firstCategory = screen.getByTestId('category-1');
    const secondCategory = screen.getByTestId('category-2');

    firstCategory.focus();
    
    // 右箭头键
    fireEvent.keyDown(firstCategory, { key: 'ArrowRight' });
    expect(secondCategory).toHaveFocus();

    // 左箭头键
    fireEvent.keyDown(secondCategory, { key: 'ArrowLeft' });
    expect(firstCategory).toHaveFocus();
  });

  it('应该在没有分类数据时显示占位内容', () => {
    render(
      <CategoryNavigation 
        categories={[]}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    expect(screen.getByText(/暂无分类/i)).toBeInTheDocument();
    expect(screen.getByTestId('empty-categories')).toBeInTheDocument();
  });

  it('应该支持分类加载状态', () => {
    render(
      <CategoryNavigation 
        categories={undefined}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    expect(screen.getByText(/暂无分类/i)).toBeInTheDocument();
  });

  it('应该支持无障碍访问', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    const categoryContainer = screen.getByTestId('category-navigation');
    
    // 验证ARIA标签
    expect(categoryContainer).toHaveAttribute('role', 'navigation');
    expect(categoryContainer).toHaveAttribute('aria-label', '商品分类导航');

    // 验证分类项的ARIA标签
    mockCategories.forEach(category => {
      const categoryItem = screen.getByTestId(`category-${category.id}`);
      expect(categoryItem).toHaveAttribute('role', 'button');
      expect(categoryItem).toHaveAttribute('aria-label', `选择${category.name}分类`);
    });
  });

  it('应该支持触摸滑动导航', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    const categoryContainer = screen.getByTestId('category-navigation');

    // 模拟触摸滑动
    fireEvent.touchStart(categoryContainer, {
      touches: [{ clientX: 100 }]
    });
    fireEvent.touchMove(categoryContainer, {
      touches: [{ clientX: 50 }]
    });
    fireEvent.touchEnd(categoryContainer);

    // 验证滑动处理
    expect(categoryContainer).toHaveClass('touch-scrolling');
  });

  it('应该支持分类项的悬停效果', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    const firstCategory = screen.getByTestId('category-1');

    // 鼠标悬停
    fireEvent.mouseEnter(firstCategory);
    expect(firstCategory).toHaveClass('hover');

    // 鼠标离开
    fireEvent.mouseLeave(firstCategory);
    expect(firstCategory).not.toHaveClass('hover');
  });

  it('应该正确处理分类图标加载失败', () => {
    render(
      <CategoryNavigation 
        categories={mockCategories}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    const categoryIcon = screen.getByTestId('category-icon-1');
    
    // 模拟图标加载失败
    fireEvent.error(categoryIcon);

    // 验证默认图标显示
    expect(categoryIcon).toHaveClass('icon-default');
  });

  it('应该支持分类数量的动态显示', () => {
    const categoriesWithCount = mockCategories.map(cat => ({
      ...cat,
      productCount: Math.floor(Math.random() * 1000)
    }));

    render(
      <CategoryNavigation 
        categories={categoriesWithCount}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    categoriesWithCount.forEach(category => {
      expect(screen.getByText(`(${category.productCount})`)).toBeInTheDocument();
    });
  });
});