const database = require('../config/database');

class VerificationCode {
  // DB-StoreVerificationCode: 存储验证码
  static async store(phoneNumber, code, expiresAt) {
    try {
      const db = database.getDatabase();
      
      // 删除该手机号的旧验证码
      await db.run(
        'DELETE FROM verification_codes WHERE phone_number = ?',
        [phoneNumber]
      );
      
      // 存储新验证码
      const result = await db.run(
        'INSERT INTO verification_codes (phone_number, code, expires_at) VALUES (?, ?, ?)',
        [phoneNumber, code, expiresAt]
      );

      return {
        id: result.lastID,
        phone_number: phoneNumber,
        code: code,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('存储验证码失败:', error);
      throw error;
    }
  }

  // DB-VerifyCode: 验证验证码
  static async verify(phoneNumber, code) {
    try {
      const db = database.getDatabase();
      const storedCode = await db.get(
        'SELECT * FROM verification_codes WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1',
        [phoneNumber]
      );

      if (!storedCode) {
        return { valid: false, reason: '验证码不存在' };
      }

      // 检查验证码是否匹配
      if (storedCode.code !== code) {
        return { valid: false, reason: '验证码错误或已过期' };
      }

      // 检查验证码是否过期
      const now = new Date();
      const expiresAt = new Date(storedCode.expires_at);
      if (now > expiresAt) {
        return { valid: false, reason: '验证码错误或已过期' };
      }

      return { valid: true, reason: '验证成功' };
    } catch (error) {
      console.error('验证验证码失败:', error);
      throw error;
    }
  }

  // 生成6位数字验证码
  static generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

module.exports = VerificationCode;