import React from 'react';
import { Product } from '../types';

interface ProductGridProps {
  products?: Product[];
  loading?: boolean;
  onProductClick?: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  products = [], 
  loading = false,
  onProductClick = () => {}
}) => {
  if (loading) {
    return (
      <div className="product-grid-loading">
        <div className="loading" style={{ width: '32px', height: '32px' }}></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="product-grid-empty">
        <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        <span className="empty-text">暂无商品</span>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => onProductClick(product)}
          className="product-card"
        >
          <div className="product-image">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.title}
                className="product-img"
              />
            ) : (
              <div className="product-placeholder">
                <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
                <span className="placeholder-text">商品图片</span>
              </div>
            )}
          </div>
          
          <div className="product-info">
            <h3 className="product-title">
              {product.title || '商品标题'}
            </h3>
            
            <div className="product-details">
              <span className="product-price">
                ¥{product.price || 0}
              </span>
              
              <span className="product-sales">
                销量 {product.sales || 0}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;