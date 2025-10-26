import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CategoryNavigation from '../components/CategoryNavigation';
import ProductGrid from '../components/ProductGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { homepageApi } from '../services/api';
import { HomepageData, Product, Category, User } from '../types';

interface HomepageProps {
  isLoggedIn?: boolean;
  userInfo?: User | null;
  onLogout?: () => void;
}

const Homepage: React.FC<HomepageProps> = ({ isLoggedIn = false, userInfo, onLogout }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<HomepageData>({
    hotProducts: [],
    categories: [],
    banners: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHomepageData();
  }, []);

  const loadHomepageData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await homepageApi.getHomepageData();
      if (response.data) {
        setData(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载首页数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (keyword: string) => {
    if (keyword.trim()) {
      navigate(`/search?q=${encodeURIComponent(keyword.trim())}`);
    }
  };

  const handleCategoryClick = (category: Category) => {
    navigate(`/search?category=${category.id}&name=${encodeURIComponent(category.name)}`);
  };

  const handleProductClick = (product: Product) => {
    // TODO: 实现商品点击逻辑
    console.log('Product clicked:', product);
  };

  if (loading) {
    return (
      <div className="homepage">
        <Header isLoggedIn={isLoggedIn} userInfo={userInfo || undefined} onLogout={onLogout} />
        <div className="loading-container">
          <LoadingSpinner size="large" text="加载中..." />
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      <Header isLoggedIn={isLoggedIn} userInfo={userInfo || undefined} onLogout={onLogout} />
      
      <main className="homepage-main">
        <div className="homepage-container">
          <div className="search-section">
            <SearchBar onSearch={handleSearch} />
          </div>
          
          {error && (
            <div className="error-section">
              <ErrorMessage 
                message={error} 
                onRetry={loadHomepageData}
                onClose={() => setError('')}
              />
            </div>
          )}
          
          <section className="categories-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                商品分类
              </h2>
            </div>
            <CategoryNavigation 
              categories={data.categories}
              onCategoryClick={handleCategoryClick}
            />
          </section>
          
          <section className="products-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                热门商品
              </h2>
            </div>
            <ProductGrid 
              products={data.hotProducts}
              onProductClick={handleProductClick}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Homepage;