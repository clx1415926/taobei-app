import React from 'react';
import { Category } from '../types';

interface CategoryNavigationProps {
  categories?: Category[];
  onCategoryClick?: (category: Category) => void;
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({ 
  categories = [],
  onCategoryClick = () => {}
}) => {
  if (categories.length === 0) {
    return (
      <div className="category-navigation">
        {/* 默认分类占位符 */}
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="category-item placeholder">
            <div className="category-icon placeholder-icon">
              📦
            </div>
            <span className="category-name">
              分类{index + 1}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="category-navigation">
      {categories.map((category) => (
        <div
          key={category.id}
          onClick={() => onCategoryClick(category)}
          className="category-item"
        >
          <div className="category-icon">
            {category.icon || '📦'}
          </div>
          <span className="category-name">
            {category.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CategoryNavigation;