const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 使用单例User模型确保所有AuthService实例使用同一个数据库连接
let userModelInstance = null;
const getUserModel = () => {
  if (!userModelInstance) {
    userModelInstance = new User();
  }
  return userModelInstance;
};

class AuthService {
  constructor() {
    this.userModel = getUserModel();
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiration = process.env.JWT_EXPIRATION || '7d';
  }

  // 生成6位数字验证码
  generateVerificationCode() {
    // 测试环境使用固定验证码
    if (process.env.NODE_ENV === 'test') {
      return '123456';
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 发送验证码
  async sendVerificationCode(phoneNumber, type, ipAddress) {
    // 检查今日发送次数限制
    const todayCount = this.userModel.getTodayCodeCount(phoneNumber);
    if (todayCount >= 50) {
      throw new Error('今日获取验证码次数已达上限，请明天再试');
    }

    // 检查IP频率限制（60秒内只能发送一次）- 测试环境跳过
    if (process.env.NODE_ENV !== 'test') {
      const lastVerificationCode = this.userModel.getLastVerificationCodeByIP(ipAddress);
      if (lastVerificationCode) {
        const lastTime = new Date(lastVerificationCode.created_at).getTime();
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTime;
        if (timeDiff < 60000) { // 60秒
          throw new Error('请求过于频繁，请稍后再试');
        }
      }
    }

    // 生成验证码
    const code = this.generateVerificationCode();
    
    // 计算过期时间（5分钟后）
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    // 存储验证码
    this.userModel.saveVerificationCode(phoneNumber, code, type, expiresAt, ipAddress);
    
    // 开发环境打印验证码
    if (process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'development') {
      console.log(`验证码 [${phoneNumber}]: ${code}`);
    }

    return { message: '验证码已发送', countdown: 60 };
  }

  // 用户登录
  async login(phoneNumber, verificationCode, ipAddress) {
    // 检查IP登录失败次数（测试环境跳过）
    if (process.env.NODE_ENV !== 'test') {
      const failureCount = this.userModel.getLoginFailureCount(ipAddress);
      if (failureCount >= 5) {
        throw new Error('登录失败次数过多，请15分钟后再试');
      }
    }

    // 检查用户是否存在
    const user = this.userModel.getUserByPhone(phoneNumber);
    if (!user) {
      // 如果用户不存在，直接返回错误，不需要验证验证码
      throw new Error('该手机号未注册，请先完成注册');
    }

    // 验证验证码
    const codeResult = this.userModel.verifyCode(phoneNumber, verificationCode, 'login');
    if (!codeResult.success) {
      // 记录登录失败
      this.userModel.recordLoginFailure(ipAddress);
      throw new Error('验证码错误或已过期');
    }

    // 登录成功，清除失败记录
    this.userModel.clearLoginFailures(ipAddress);

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phone_number },
      this.jwtSecret,
      { expiresIn: this.jwtExpiration }
    );

    // 创建会话
    this.userModel.createSession(user.id, token);
    
    // 更新最后登录时间
    this.userModel.updateLastLogin(user.id);

    return {
      message: '登录成功',
      userId: user.id,
      token: token,
      redirectUrl: '/'
    };
  }

  // 用户注册
  async register(phoneNumber, verificationCode, agreeToTerms) {
    if (!agreeToTerms) {
      throw new Error('请同意用户协议');
    }

    // 验证验证码
    const codeResult = this.userModel.verifyCode(phoneNumber, verificationCode, 'register');
    
    if (!codeResult.success) {
      if (codeResult.error === 'EXPIRED_CODE') {
        throw new Error('验证码已过期，请重新获取');
      } else {
        throw new Error('验证码无效或已过期');
      }
    }

    // 检查用户是否已存在
    const existingUser = this.userModel.getUserByPhone(phoneNumber);
    if (existingUser) {
      // 如果用户已存在，直接登录
      const token = jwt.sign(
        { userId: existingUser.id, phoneNumber: existingUser.phone_number },
        this.jwtSecret,
        { expiresIn: this.jwtExpiration }
      );

      // 创建会话
      this.userModel.createSession(existingUser.id, token);
      
      // 更新最后登录时间
      this.userModel.updateLastLogin(existingUser.id);

      const error = new Error('该手机号已注册，将直接为您登录');
      error.isExistingUser = true;
      error.userData = {
        message: '该手机号已注册，将直接为您登录',
        userId: existingUser.id,
        token: token,
        redirectUrl: '/'
      };
      throw error;
    }

    // 创建用户
    const user = this.userModel.createUser(phoneNumber);

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phone_number },
      this.jwtSecret,
      { expiresIn: this.jwtExpiration }
    );

    // 创建会话
    this.userModel.createSession(user.id, token);

    return {
      message: '注册成功',
      userId: user.id,
      token: token,
      redirectUrl: '/'
    };
  }

  // 用户登出
  async logout(token) {
    if (!token) {
      throw new Error('未提供有效的token');
    }

    // 删除会话
    this.userModel.deleteSession(token);

    return { message: '登出成功' };
  }

  // 验证token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      const session = this.userModel.validateSession(token);
      
      if (!session) {
        throw new Error('会话已过期');
      }

      return {
        userId: decoded.userId,
        phoneNumber: decoded.phoneNumber,
        user: {
          id: session.id,
          phone_number: session.phone_number,
          created_at: session.created_at,
          last_login_at: session.last_login_at
        }
      };
    } catch (error) {
      throw new Error('无效的token');
    }
  }

  // 获取用户信息
  getUserInfo(userId) {
    const user = this.userModel.getUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 脱敏手机号
    const maskedPhone = user.phone_number.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

    return {
      id: user.id,
      phoneNumber: maskedPhone,
      registrationTime: user.created_at,
      lastLoginTime: user.last_login_at
    };
  }
}

module.exports = AuthService;