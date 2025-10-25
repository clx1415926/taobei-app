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
      <div>
        <Header isLoggedIn={isLoggedIn} userInfo={userInfo || undefined} onLogout={onLogout} />
        <div style={{ padding: '50px 0', textAlign: 'center' }}>
          <LoadingSpinner size="large" text="加载中..." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isLoggedIn={isLoggedIn} userInfo={userInfo || undefined} onLogout={onLogout} />
      
      <main className="container" style={{ paddingTop: '20px' }}>
        <SearchBar onSearch={handleSearch} />
        
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={loadHomepageData}
            onClose={() => setError('')}
          />
        )}
        
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
            商品分类
          </h2>
          <CategoryNavigation 
            categories={data.categories}
            onCategoryClick={handleCategoryClick}
          />
        </section>
        
        <section>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
            热门商品
          </h2>
          <ProductGrid 
            products={data.hotProducts}
            onProductClick={handleProductClick}
          />
        </section>
      </main>
    </div>
  );
};

export default Homepage;