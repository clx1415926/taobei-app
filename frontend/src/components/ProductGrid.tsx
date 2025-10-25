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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        <div className="loading" style={{ width: '32px', height: '32px' }}></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#666'
      }}>
        暂无商品
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '20px',
      padding: '20px 0'
    }}>
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => onProductClick(product)}
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{
            width: '100%',
            height: '150px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              '商品图片'
            )}
          </div>
          
          <div style={{ padding: '12px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {product.title || '商品标题'}
            </h3>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ 
                color: '#ff6b35', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                ¥{product.price || 0}
              </span>
              
              <span style={{ 
                color: '#999', 
                fontSize: '12px'
              }}>
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