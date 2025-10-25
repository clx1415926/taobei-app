import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ProductGrid from '../components/ProductGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { homepageApi } from '../services/api';
import { SearchResult, Product } from '../types';

const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchResult, setSearchResult] = useState<SearchResult>({
    products: [],
    total: 0,
    page: 1,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const keyword = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'relevance';

  useEffect(() => {
    if (keyword || category) {
      searchProducts();
    }
  }, [keyword, category, page, sort]);

  const searchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await homepageApi.searchProducts(keyword, page, sort);
      if (response.data) {
        setSearchResult(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newKeyword: string) => {
    setSearchParams({ q: newKeyword, page: '1' });
  };

  const handleSortChange = (newSort: string) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('sort', newSort);
      params.set('page', '1');
      return params;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('page', newPage.toString());
      return params;
    });
  };

  const handleProductClick = (product: Product) => {
    // 可以导航到商品详情页面
    console.log('Product clicked:', product);
    // 这里可以添加导航逻辑，例如：
    // navigate(`/product/${product.id}`);
  };

  return (
    <div>
      <Header />
      
      <main className="container" style={{ paddingTop: '20px' }}>
        <SearchBar 
          onSearch={handleSearch}
          defaultValue={keyword}
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          padding: '10px 0',
          borderBottom: '1px solid #eee'
        }}>
          <div style={{ color: '#666' }}>
            {keyword && `搜索 "${keyword}" `}
            {category && `分类筛选 `}
            共找到 {searchResult.total} 个商品
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#666' }}>排序：</span>
            <select 
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{
                padding: '5px 10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="relevance">相关度</option>
              <option value="price_asc">价格从低到高</option>
              <option value="price_desc">价格从高到低</option>
              <option value="sales_desc">销量从高到低</option>
            </select>
          </div>
        </div>
        
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={searchProducts}
            onClose={() => setError('')}
          />
        )}
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <LoadingSpinner size="large" text="搜索中..." />
          </div>
        ) : (
          <>
            <ProductGrid 
              products={searchResult.products}
              onProductClick={handleProductClick}
            />
            
            {searchResult.totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                gap: '10px',
                marginTop: '30px',
                paddingBottom: '30px'
              }}>
                {Array.from({ length: searchResult.totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      backgroundColor: pageNum === page ? '#ff6b35' : 'white',
                      color: pageNum === page ? 'white' : '#333',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SearchResults;