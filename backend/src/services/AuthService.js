const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');

class AuthService {
  // 发送验证码
  static async sendVerificationCode(phoneNumber) {
    try {
      // 验证手机号格式
      if (!this.validatePhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: '请输入正确的手机号码'
        };
      }

      // 生成验证码
      const code = VerificationCode.generateCode();
      
      // 设置过期时间（5分钟后）
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      // 存储验证码
      await VerificationCode.store(phoneNumber, code, expiresAt);
      
      // TODO: 这里应该调用短信服务发送验证码
      // 目前只是模拟发送成功
      console.log(`模拟发送验证码 ${code} 到手机号 ${phoneNumber}`);
      
      return {
        success: true,
        message: '验证码发送成功'
      };
    } catch (error) {
      console.error('发送验证码失败:', error);
      return {
        success: false,
        error: '发送验证码失败，请稍后重试'
      };
    }
  }

  // 用户登录
  static async login(phoneNumber, verificationCode) {
    try {
      // 验证手机号格式
      if (!this.validatePhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: '请输入正确的手机号码'
        };
      }

      // 查找用户
      let user = await User.findByPhone(phoneNumber);
      
      // 如果用户不存在，返回错误（根据API规范）
      if (!user) {
        return {
          success: false,
          error: '该手机号未注册，请先完成注册'
        };
      }

      // 验证验证码
      const codeVerification = await VerificationCode.verify(phoneNumber, verificationCode);
      if (!codeVerification.valid) {
        return {
          success: false,
          error: codeVerification.reason
        };
      }

      // TODO: 这里应该生成JWT token
      // 目前返回简单的用户信息
      return {
        success: true,
        message: '登录成功',
        user: {
          id: user.id,
          phoneNumber: user.phone_number
        }
      };
    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        error: '登录失败，请稍后重试'
      };
    }
  }

  // 验证手机号格式
  static validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    
    // 中国大陆手机号正则表达式
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }
}

module.exports = AuthService;