const AuthService = require('../services/AuthService');

// 使用单例模式确保所有请求使用同一个AuthService实例
let authServiceInstance = null;
const getAuthService = () => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
};

// 验证JWT token的中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  try {
    const userInfo = getAuthService().verifyToken(token);
    req.user = userInfo;
    next();
  } catch (error) {
    return res.status(401).json({ error: '未授权访问' });
  }
};

// 可选的认证中间件（用户可能登录也可能未登录）
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const userInfo = getAuthService().verifyToken(token);
      req.user = userInfo;
    } catch (error) {
      // 忽略token验证错误，继续处理请求
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};