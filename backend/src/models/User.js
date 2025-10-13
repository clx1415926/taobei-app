const database = require('../config/database');

class User {
  constructor(id, phoneNumber) {
    this.id = id;
    this.phoneNumber = phoneNumber;
  }

  // DB-FindUserByPhone: 根据手机号查找用户记录
  static async findByPhone(phoneNumber) {
    try {
      const db = database.getDatabase();
      const user = await db.get(
        'SELECT * FROM users WHERE phone_number = ?',
        [phoneNumber]
      );
      return user || null;
    } catch (error) {
      console.error('查找用户失败:', error);
      throw error;
    }
  }

  static async create(phoneNumber) {
    try {
      // 检查用户是否已存在
      const existingUser = await this.findByPhone(phoneNumber);
      if (existingUser) {
        throw new Error('用户已存在');
      }

      const db = database.getDatabase();
      const result = await db.run(
        'INSERT INTO users (phone_number) VALUES (?)',
        [phoneNumber]
      );

      return {
        id: result.lastID,
        phone_number: phoneNumber,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }
}

module.exports = User;