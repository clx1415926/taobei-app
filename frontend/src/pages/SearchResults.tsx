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
    <div className="search-results-page">
      <Header />
      
      <main className="search-results-main">
        <div className="search-results-container">
          <div className="search-section">
            <SearchBar 
              onSearch={handleSearch}
              defaultValue={keyword}
            />
          </div>
          
          <div className="search-results-header">
            <div className="search-results-info">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <span className="search-info-text">
                {keyword && `搜索 "${keyword}" `}
                {category && `分类筛选 `}
                共找到 {searchResult.total} 个商品
              </span>
            </div>
            
            <div className="search-sort-controls">
              <span className="sort-label">排序：</span>
              <select 
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                <option value="relevance">相关度</option>
                <option value="price_asc">价格从低到高</option>
                <option value="price_desc">价格从高到低</option>
                <option value="sales_desc">销量从高到低</option>
              </select>
            </div>
          </div>
          
          {error && (
            <div className="error-section">
              <ErrorMessage 
                message={error} 
                onRetry={searchProducts}
                onClose={() => setError('')}
              />
            </div>
          )}
          
          {loading ? (
            <div className="loading-container">
              <LoadingSpinner size="large" text="搜索中..." />
            </div>
          ) : (
            <>
              <div className="products-section">
                <ProductGrid 
                  products={searchResult.products}
                  onProductClick={handleProductClick}
                />
              </div>
              
              {searchResult.totalPages > 1 && (
                <div className="pagination-section">
                  {Array.from({ length: searchResult.totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`pagination-btn ${pageNum === page ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchResults;