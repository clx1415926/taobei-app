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
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '15px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px'
      }}>
        {/* 默认分类占位符 */}
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '15px',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#f0f0f0',
              borderRadius: '50%',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}>
              📦
            </div>
            <span style={{ fontSize: '12px', color: '#666' }}>
              分类{index + 1}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '15px',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px'
    }}>
      {categories.map((category) => (
        <div
          key={category.id}
          onClick={() => onCategoryClick(category)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '15px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#ff6b35',
            borderRadius: '50%',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px'
          }}>
            {category.icon || '📦'}
          </div>
          <span style={{ fontSize: '12px', color: '#333' }}>
            {category.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CategoryNavigation;