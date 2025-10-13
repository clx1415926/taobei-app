const express = require('express');
const AuthService = require('../services/AuthService');

const router = express.Router();

// API-POST-SendVerificationCode: POST /api/auth/send-verification-code
router.post('/send-verification-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // 检查必要参数
    if (!phoneNumber) {
      return res.status(400).json({
        error: '请输入正确的手机号码'
      });
    }
    
    // 调用服务层发送验证码
    const result = await AuthService.sendVerificationCode(phoneNumber);
    
    if (result.success) {
      res.status(200).json({
        message: result.message,
        expiresIn: 60
      });
    } else {
      res.status(400).json({
        error: result.error
      });
    }
  } catch (error) {
    console.error('发送验证码API错误:', error);
    res.status(500).json({
      error: '服务器内部错误'
    });
  }
});

// API-POST-Login: POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;
    
    // 检查必要参数
    if (!phoneNumber) {
      return res.status(400).json({
        error: '请输入正确的手机号码'
      });
    }
    
    if (!verificationCode) {
      return res.status(400).json({
        error: '请提供验证码'
      });
    }
    
    // 调用服务层进行登录
    const result = await AuthService.login(phoneNumber, verificationCode);
    
    if (result.success) {
      res.status(200).json({
        message: result.message,
        userId: result.user.id,
        token: 'mock-jwt-token' // TODO: 实现真正的JWT token
      });
    } else {
      // 根据错误类型返回不同的状态码
      if (result.error.includes('未注册')) {
        res.status(404).json({ error: result.error });
      } else {
        res.status(400).json({ error: result.error });
      }
    }
  } catch (error) {
    console.error('登录API错误:', error);
    res.status(500).json({
      error: '服务器内部错误'
    });
  }
});

module.exports = router;