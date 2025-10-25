import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Homepage from './pages/Homepage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SearchResults from './pages/SearchResults'
import { authApi } from './services/api'
import { User } from './types'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 检查本地存储中的登录状态
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setIsLoggedIn(true);
        setUserInfo(user);
      } catch (error) {
        // 如果解析失败，清除无效数据
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 无论API调用是否成功，都清除本地状态
      setIsLoggedIn(false);
      setUserInfo(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Homepage isLoggedIn={isLoggedIn} userInfo={userInfo} onLogout={handleLogout} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchResults />} />
      </Routes>
    </div>
  )
}

export default App