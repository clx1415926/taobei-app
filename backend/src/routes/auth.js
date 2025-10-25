const express = require('express');
const { body, validationResult } = require('express-validator');
const AuthService = require('../services/authService');
const router = express.Router();

// 使用单例模式确保所有请求使用同一个AuthService实例
let authServiceInstance = null;
const getAuthService = () => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
};

// API-POST-SendVerificationCode
router.post('/send-verification-code', [
  body('phoneNumber').isMobilePhone('zh-CN').withMessage('请输入正确的手机号码'),
  body('type').isIn(['login', 'register']).withMessage('类型参数无效')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: '请输入正确的手机号码' });
  }

  try {
    const { phoneNumber, type } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    const result = await getAuthService().sendVerificationCode(phoneNumber, type, ipAddress);
    res.json(result);
  } catch (error) {
    if (error.message.includes('今日获取验证码次数已达上限')) {
      return res.status(429).json({ error: error.message });
    }
    if (error.message.includes('请求过于频繁')) {
      return res.status(429).json({ error: error.message });
    }
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// API-POST-Login
router.post('/login', [
  body('phoneNumber').isMobilePhone('zh-CN').withMessage('请输入正确的手机号码'),
  body('verificationCode').isLength({ min: 6, max: 6 }).withMessage('验证码格式错误')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const { phoneNumber, verificationCode } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: '请输入手机号' });
    }
    if (!verificationCode) {
      return res.status(400).json({ error: '请输入验证码' });
    }
    return res.status(400).json({ error: '请输入正确的手机号码或验证码' });
  }

  try {
    const { phoneNumber, verificationCode } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    console.log('Login request:', { phoneNumber, verificationCode: verificationCode ? '***' : 'missing', ipAddress });
    const result = await getAuthService().login(phoneNumber, verificationCode, ipAddress);
    console.log('Login success:', { userId: result.userId, message: result.message });
    res.json(result);
  } catch (error) {
    console.error('Login error:', error.message);
    if (error.message.includes('该手机号未注册')) {
      return res.status(404).json({ error: error.message, redirectUrl: '/register' });
    }
    if (error.message.includes('验证码错误') || error.message.includes('验证码已过期')) {
      return res.status(400).json({ error: '验证码错误或已过期，请重新获取' });
    }
    if (error.message.includes('登录失败次数过多')) {
      return res.status(429).json({ error: error.message });
    }
    console.error('Unexpected login error:', error.message, error.stack);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// API-POST-Register
router.post('/register', [
  body('phoneNumber').isMobilePhone('zh-CN').withMessage('请输入正确的手机号码'),
  body('verificationCode').isLength({ min: 6, max: 6 }).withMessage('验证码格式错误'),
  body('agreeToTerms').isBoolean().withMessage('请同意用户协议')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // 检查具体的验证错误类型
    const phoneError = errors.array().find(err => err.path === 'phoneNumber');
    if (phoneError) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }
    return res.status(400).json({ error: '请输入正确的手机号码或验证码' });
  }

  try {
    const { phoneNumber, verificationCode, agreeToTerms } = req.body;
    console.log('Register request:', { phoneNumber, verificationCode: verificationCode ? '***' : 'missing', agreeToTerms });
    const result = await getAuthService().register(phoneNumber, verificationCode, agreeToTerms);
    console.log('Register success:', { userId: result.userId, message: result.message });
    res.status(201).json(result);
  } catch (error) {
    console.error('Register error:', error);
    if (error.isExistingUser) {
      console.log('User already exists, returning auto-login response');
      return res.status(409).json({ 
        error: '手机号已注册',
        message: '该手机号已注册，请直接登录',
        ...error.userData 
      });
    }
    if (error.message.includes('请同意用户协议')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('验证码错误') || error.message.includes('验证码已过期') || error.message.includes('验证码无效')) {
      return res.status(400).json({ error: '验证码错误或已过期，请重新获取' });
    }
    console.error('Unexpected register error:', error.message, error.stack);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// API-POST-Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未授权访问' });
    }
    await getAuthService().logout(token);
    res.json({ message: '退出登录成功' });
  } catch (error) {
    if (error.message.includes('无效的token') || error.message.includes('token已过期')) {
      return res.status(401).json({ error: '未授权访问' });
    }
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;