const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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
      success: true,
      message: '登录成功',
      token: token,
      user: {
        id: user.id,
        phoneNumber: user.phone_number
      }
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
      
      // 验证用户是否存在
      const user = this.userModel.getUserById(decoded.userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      return {
        userId: decoded.userId,
        phoneNumber: decoded.phoneNumber,
        user: user
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

  // 密码相关方法

  // 设置用户密码
  async setPassword(phoneNumber, password, confirmPassword) {
    if (password !== confirmPassword) {
      throw new Error('两次输入的密码不一致');
    }

    // 密码强度检查
    if (!this.isPasswordStrong(password)) {
      throw new Error('密码强度不足，请包含大小写字母、数字和特殊字符，长度至少8位');
    }

    const user = this.userModel.getUserByPhoneNumber(phoneNumber);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 生成盐值和哈希
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // 检查是否与历史密码重复
    if (this.userModel.checkPasswordHistory(user.id, passwordHash)) {
      throw new Error('不能使用最近使用过的密码');
    }

    // 设置密码
    this.userModel.setUserPassword(user.id, passwordHash, salt);

    return { 
      success: true,
      message: '密码设置成功' 
    };
  }

  // 密码登录
  async loginWithPassword(phoneNumber, password, ipAddress) {
    const user = this.userModel.getUserByPhoneNumber(phoneNumber);
    if (!user) {
      throw new Error('该手机号未注册');
    }

    if (!user.password_hash) {
      throw new Error('该账户未设置密码，请使用验证码登录');
    }

    // 检查账户是否被锁定
    const failInfo = this.userModel.getPasswordFailCount(user.id);
    if (failInfo.isLocked) {
      throw new Error('账户已被锁定');
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      // 密码错误，增加失败次数
      this.userModel.updatePasswordFailCount(user.id, true);
      
      // 重新检查是否被锁定
      const newFailInfo = this.userModel.getPasswordFailCount(user.id);
      if (newFailInfo.isLocked) {
        throw new Error('账户已被锁定');
      }
      
      throw new Error('密码错误');
    }

    // 密码正确，重置失败次数
    this.userModel.updatePasswordFailCount(user.id, false);

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
      success: true,
      message: '登录成功',
      token: token,
      user: {
        id: user.id,
        phoneNumber: user.phone_number
      }
    };
  }

  // 验证重置密码验证码（不消费验证码）
  async verifyResetCode(phoneNumber, verificationCode) {
    // 验证验证码但不标记为已使用
    const codeResult = this.userModel.checkVerificationCode(phoneNumber, verificationCode, 'reset');
    if (!codeResult.success) {
      if (codeResult.error === 'EXPIRED_CODE') {
        throw new Error('验证码已过期');
      } else {
        throw new Error('验证码无效');
      }
    }

    return { 
      success: true,
      message: '验证码验证成功' 
    };
  }

  // 重置密码
  async resetPassword(phoneNumber, verificationCode, newPassword, confirmPassword) {
    if (newPassword !== confirmPassword) {
      throw new Error('两次输入的密码不一致');
    }

    // 密码强度检查
    if (!this.isPasswordStrong(newPassword)) {
      throw new Error('密码强度不足，请包含大小写字母、数字和特殊字符，长度至少8位');
    }

    // 验证验证码
    const codeResult = this.userModel.verifyCode(phoneNumber, verificationCode, 'reset');
    if (!codeResult.success) {
      if (codeResult.error === 'EXPIRED_CODE') {
        throw new Error('验证码已过期');
      } else {
        throw new Error('验证码无效');
      }
    }

    const user = this.userModel.getUserByPhoneNumber(phoneNumber);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 生成盐值和哈希
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // 检查是否与历史密码重复
    if (this.userModel.checkPasswordHistory(user.id, passwordHash)) {
      throw new Error('不能使用最近使用过的密码');
    }

    // 设置新密码
    this.userModel.setUserPassword(user.id, passwordHash, salt);

    return { 
      success: true,
      message: '密码重置成功' 
    };
  }

  // 修改密码
  async changePassword(userId, currentPassword, newPassword, confirmPassword) {
    if (newPassword !== confirmPassword) {
      throw new Error('两次输入的新密码不一致');
    }

    // 密码强度检查
    if (!this.isPasswordStrong(newPassword)) {
      throw new Error('密码强度不足，请包含大小写字母、数字和特殊字符，长度至少8位');
    }

    const user = this.userModel.getUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    if (!user.password_hash) {
      throw new Error('该账户未设置密码');
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('当前密码错误');
    }

    // 生成新密码的盐值和哈希
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // 检查是否与当前密码相同
    const isSameAsCurrent = await bcrypt.compare(newPassword, user.password_hash);
    if (isSameAsCurrent) {
      throw new Error('新密码不能与历史密码相同');
    }

    // 检查是否与历史密码重复
    if (this.userModel.checkPasswordHistory(user.id, passwordHash)) {
      throw new Error('新密码不能与历史密码相同');
    }

    // 设置新密码
    this.userModel.setUserPassword(user.id, passwordHash, salt);

    return { 
      success: true,
      message: '密码修改成功' 
    };
  }

  // 获取密码状态
  getPasswordStatus(phoneNumber) {
    const status = this.userModel.getPasswordStatusByPhone(phoneNumber);
    return {
      hasPassword: status.hasPassword,
      passwordSetTime: status.passwordSetTime,
      passwordUpdateTime: status.passwordUpdateTime,
      needPasswordUpdate: status.needPasswordUpdate || false,
      isLocked: status.isLocked,
      lockedUntil: status.lockedUntil,
      failCount: status.failCount
    };
  }

  // 检查密码强度
  isPasswordStrong(password) {
    // 至少8位，包含大小写字母、数字和特殊字符
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  // 分析密码强度
  analyzePasswordStrength(password) {
    if (!password) {
      return { strength: 'weak', score: 0, suggestions: ['请输入密码'] };
    }

    let score = 0;
    const suggestions = [];

    // 长度检查
    if (password.length >= 8) {
      score += 25;
    } else {
      suggestions.push('密码长度至少8位');
    }

    // 大写字母
    if (/[A-Z]/.test(password)) {
      score += 25;
    } else {
      suggestions.push('包含大写字母');
    }

    // 小写字母
    if (/[a-z]/.test(password)) {
      score += 25;
    } else {
      suggestions.push('包含小写字母');
    }

    // 数字
    if (/\d/.test(password)) {
      score += 15;
    } else {
      suggestions.push('包含数字');
    }

    // 特殊字符
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 10;
    } else {
      suggestions.push('包含特殊字符');
    }

    let strength = 'weak';
    if (score >= 80) {
      strength = 'strong';
    } else if (score >= 50) {
      strength = 'medium';
    }

    return { strength, score, suggestions };
  }
}

module.exports = AuthService;