const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const AuthService = require('../services/authService');

// API-GET-UserProfile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userInfo = await AuthService.getUserInfo(userId);
    
    if (!userInfo) {
      return res.status(404).json({ error: '用户信息不存在' });
    }

    // 脱敏处理手机号
    const maskedPhone = userInfo.phone_number.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    
    const response = {
      userId: userInfo.id,
      phoneNumber: maskedPhone,
      registerTime: userInfo.created_at,
      lastLoginTime: userInfo.last_login_at
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

module.exports = router;