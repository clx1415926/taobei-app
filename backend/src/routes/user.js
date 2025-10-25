const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const AuthService = require('../services/authService');

// 使用单例模式确保所有请求使用同一个AuthService实例
let authServiceInstance = null;
const getAuthService = () => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
};

// API-GET-UserProfile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userInfo = getAuthService().getUserInfo(userId);
    
    if (!userInfo) {
      return res.status(404).json({ error: '用户信息不存在' });
    }

    const response = {
      userId: userInfo.id,
      phoneNumber: userInfo.phoneNumber,
      registerTime: userInfo.registrationTime,
      lastLoginTime: userInfo.lastLoginTime
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

module.exports = router;