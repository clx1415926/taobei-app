const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor() {
    const dbPath = process.env.NODE_ENV === 'test' 
      ? process.env.DB_PATH || path.join(__dirname, '../../database/test.db')
      : path.join(__dirname, '../../database/taobei.db');
    
    this.db = new Database(dbPath);
    this.initTables();
  }

  initTables() {
    // 用户表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone_number TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME,
        status TEXT DEFAULT 'active',
        password_hash TEXT,
        password_salt TEXT,
        password_set_time DATETIME,
        password_history TEXT,
        password_fail_count INTEGER DEFAULT 0,
        account_locked_until DATETIME
      )
    `);

    // 验证码表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id TEXT PRIMARY KEY,
        phone_number TEXT NOT NULL,
        code TEXT NOT NULL,
        type TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT
      )
    `);

    // 用户会话表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 创建登录失败记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS login_failures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        failed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // 创建用户
  createUser(phoneNumber) {
    const userId = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO users (id, phone_number) 
      VALUES (?, ?)
    `);
    
    try {
      stmt.run(userId, phoneNumber);
      return this.getUserById(userId);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('该手机号已注册');
      }
      throw error;
    }
  }

  // 根据ID获取用户
  getUserById(userId) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(userId);
  }

  // 根据手机号获取用户
  getUserByPhoneNumber(phoneNumber) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE phone_number = ?');
    return stmt.get(phoneNumber);
  }

  // 为了兼容authService，添加别名方法
  getUserByPhone(phoneNumber) {
    return this.getUserByPhoneNumber(phoneNumber);
  }

  // 更新用户最后登录时间
  updateLastLoginTime(userId) {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(userId);
  }

  // 为了兼容authService，添加别名方法
  updateLastLogin(userId) {
    return this.updateLastLoginTime(userId);
  }

  // 保存验证码
  saveVerificationCode(phoneNumber, code, type, expiresAt, ipAddress) {
    this.db.prepare(`
      INSERT INTO verification_codes (id, phone_number, code, type, expires_at, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), phoneNumber, code, type, expiresAt, ipAddress);
  }

  // 获取最新的验证码
  getLatestVerificationCode(phoneNumber, type) {
    return this.db.prepare(`
      SELECT * FROM verification_codes 
      WHERE phone_number = ? AND type = ? AND used = 0 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(phoneNumber, type);
  }

  // 验证验证码
  verifyCode(phoneNumber, code, type) {
    const verificationCode = this.getLatestVerificationCode(phoneNumber, type);
    
    if (!verificationCode) {
      return { success: false, error: 'INVALID_CODE' };
    }
    
    if (verificationCode.code !== code) {
      return { success: false, error: 'INVALID_CODE' };
    }
    
    if (new Date() > new Date(verificationCode.expires_at)) {
      return { success: false, error: 'EXPIRED_CODE' };
    }
    
    // 标记验证码为已使用
    this.markVerificationCodeAsUsed(verificationCode.id);
    return { success: true };
  }

  // 检查验证码（不消费验证码）
  checkVerificationCode(phoneNumber, code, type) {
    const verificationCode = this.getLatestVerificationCode(phoneNumber, type);
    
    if (!verificationCode) {
      return { success: false, error: 'INVALID_CODE' };
    }
    
    if (verificationCode.code !== code) {
      return { success: false, error: 'INVALID_CODE' };
    }
    
    if (new Date() > new Date(verificationCode.expires_at)) {
      return { success: false, error: 'EXPIRED_CODE' };
    }
    
    // 不标记验证码为已使用，只验证有效性
    return { success: true };
  }

  // 标记验证码为已使用
  markVerificationCodeAsUsed(id) {
    const stmt = this.db.prepare('UPDATE verification_codes SET used = TRUE WHERE id = ?');
    stmt.run(id);
  }

  // 检查IP地址的验证码发送频率
  getLastVerificationCodeByIP(ipAddress) {
    const stmt = this.db.prepare(`
      SELECT * FROM verification_codes 
      WHERE ip_address = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    return stmt.get(ipAddress);
  }

  // 获取今日验证码发送次数
  getTodayCodeCount(phoneNumber) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM verification_codes 
      WHERE phone_number = ? AND date(created_at) = date('now')
    `);
    const result = stmt.get(phoneNumber);
    return result.count;
  }

  // 保存用户会话
  saveUserSession(userId, token, expiresAt) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO user_sessions (id, user_id, token, expires_at) 
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, userId, token, expiresAt);
    return id;
  }

  // 为了兼容authService，添加别名方法
  createSession(userId, token) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24小时后过期
    return this.saveUserSession(userId, token, expiresAt);
  }

  // 获取用户会话
  getUserSession(token) {
    const stmt = this.db.prepare(`
      SELECT us.*, u.phone_number 
      FROM user_sessions us 
      JOIN users u ON us.user_id = u.id 
      WHERE us.token = ? AND us.expires_at > CURRENT_TIMESTAMP
    `);
    return stmt.get(token);
  }

  // 删除用户会话
  deleteUserSession(token) {
    const stmt = this.db.prepare('DELETE FROM user_sessions WHERE token = ?');
    stmt.run(token);
  }

  // 为了兼容authService，添加别名方法
  deleteSession(token) {
    return this.deleteUserSession(token);
  }

  // 记录登录失败
  recordLoginFailure(ipAddress) {
    const stmt = this.db.prepare(`
      INSERT INTO login_failures (ip_address) 
      VALUES (?)
    `);
    stmt.run(ipAddress);
  }

  // 获取IP地址的登录失败次数
  getLoginFailureCount(ipAddress, timeWindow = 15) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM login_failures 
      WHERE ip_address = ? AND failed_at > datetime('now', '-${timeWindow} minutes')
    `);
    const result = stmt.get(ipAddress);
    return result.count;
  }

  // 清除登录失败记录
  clearLoginFailures(ipAddress) {
    const stmt = this.db.prepare('DELETE FROM login_failures WHERE ip_address = ?');
    stmt.run(ipAddress);
  }

  // 清理过期的登录失败记录
  cleanupExpiredLoginFailures(timeWindow = 15) {
    const stmt = this.db.prepare(`
      DELETE FROM login_failures 
      WHERE failed_at <= datetime('now', '-${timeWindow} minutes')
    `);
    stmt.run();
  }

  // 清理过期的验证码
  cleanupExpiredVerificationCodes() {
    const stmt = this.db.prepare('DELETE FROM verification_codes WHERE expires_at <= CURRENT_TIMESTAMP');
    stmt.run();
  }

  // 清理过期的用户会话
  cleanupExpiredUserSessions() {
    const stmt = this.db.prepare('DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP');
    stmt.run();
  }

  // 关闭数据库连接
  close() {
    this.db.close();
  }

  // 密码相关方法
  
  // 设置用户密码
  setUserPassword(userId, passwordHash, passwordSalt) {
    const user = this.getUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 获取历史密码
    let passwordHistory = [];
    if (user.password_history) {
      try {
        passwordHistory = JSON.parse(user.password_history);
      } catch (e) {
        passwordHistory = [];
      }
    }

    // 添加当前密码到历史记录（如果存在）
    if (user.password_hash) {
      passwordHistory.unshift({
        hash: user.password_hash,
        salt: user.password_salt,
        set_time: user.password_set_time
      });
      
      // 只保留最近3次密码
      passwordHistory = passwordHistory.slice(0, 3);
    }

    const stmt = this.db.prepare(`
      UPDATE users 
      SET password_hash = ?, 
          password_salt = ?, 
          password_set_time = CURRENT_TIMESTAMP,
          password_history = ?,
          password_fail_count = 0,
          account_locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(passwordHash, passwordSalt, JSON.stringify(passwordHistory), userId);
    return this.getUserById(userId);
  }

  // 验证用户密码
  verifyUserPassword(userId, passwordHash) {
    const user = this.getUserById(userId);
    if (!user || !user.password_hash) {
      return false;
    }
    
    return user.password_hash === passwordHash;
  }

  // 检查密码历史
  checkPasswordHistory(userId, passwordHash) {
    const user = this.getUserById(userId);
    if (!user) {
      return false;
    }

    // 检查当前密码
    if (user.password_hash === passwordHash) {
      return true;
    }

    // 检查历史密码
    if (user.password_history) {
      try {
        const passwordHistory = JSON.parse(user.password_history);
        return passwordHistory.some(p => p.hash === passwordHash);
      } catch (e) {
        return false;
      }
    }

    return false;
  }

  // 获取密码失败次数
  getPasswordFailCount(userId) {
    const user = this.getUserById(userId);
    if (!user) {
      return 0;
    }
    
    // 检查账户是否被锁定
    if (user.account_locked_until) {
      const lockTime = new Date(user.account_locked_until);
      if (lockTime > new Date()) {
        return { 
          failCount: user.password_fail_count || 0, 
          isLocked: true, 
          lockedUntil: lockTime 
        };
      } else {
        // 锁定时间已过，重置锁定状态
        this.resetPasswordFailCount(userId);
        return { failCount: 0, isLocked: false };
      }
    }
    
    return { 
      failCount: user.password_fail_count || 0, 
      isLocked: false 
    };
  }

  // 更新密码失败次数
  updatePasswordFailCount(userId, increment = true) {
    const user = this.getUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    let newFailCount = (user.password_fail_count || 0);
    let lockedUntil = null;

    if (increment) {
      newFailCount += 1;
      // 失败5次后锁定账户15分钟
      if (newFailCount >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15分钟后
      }
    } else {
      newFailCount = 0;
    }

    const stmt = this.db.prepare(`
      UPDATE users 
      SET password_fail_count = ?, 
          account_locked_until = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(newFailCount, lockedUntil ? lockedUntil.toISOString() : null, userId);
    return this.getUserById(userId);
  }

  // 重置密码失败次数
  resetPasswordFailCount(userId) {
    return this.updatePasswordFailCount(userId, false);
  }

  // 检查用户是否设置了密码
  hasPassword(userId) {
    const user = this.getUserById(userId);
    return user && !!user.password_hash;
  }

  // 根据手机号检查密码状态
  getPasswordStatusByPhone(phoneNumber) {
    const user = this.getUserByPhoneNumber(phoneNumber);
    if (!user) {
      return { 
        hasPassword: false, 
        passwordSetTime: null,
        passwordUpdateTime: null,
        needPasswordUpdate: false,
        isLocked: false,
        lockedUntil: null,
        failCount: 0
      };
    }

    const failInfo = this.getPasswordFailCount(user.id);
    return {
      hasPassword: !!user.password_hash,
      passwordSetTime: user.password_set_time || null,
      passwordUpdateTime: user.password_set_time || null, // 如果没有更新时间，使用设置时间
      needPasswordUpdate: false, // 根据业务需求设置
      isLocked: failInfo.isLocked || false,
      lockedUntil: failInfo.lockedUntil || null,
      failCount: failInfo.failCount || 0
    };
  }
}

module.exports = User;