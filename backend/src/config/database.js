// 简化的内存数据库实现，用于测试和演示
class DatabaseManager {
  constructor() {
    this.users = new Map(); // 存储用户数据
    this.verificationCodes = new Map(); // 存储验证码数据
    this.connected = false;
  }

  async connect() {
    try {
      this.connected = true;
      console.log('内存数据库连接成功');
    } catch (error) {
      console.error('数据库连接失败:', error);
      throw error;
    }
  }

  getDatabase() {
    if (!this.connected) {
      throw new Error('数据库未连接');
    }
    
    return {
      // 模拟SQL查询接口
      get: (sql, params) => {
        if (sql.includes('users') && sql.includes('phone_number')) {
          const phoneNumber = params[0];
          const user = Array.from(this.users.values()).find(u => u.phone_number === phoneNumber);
          return Promise.resolve(user || null);
        }
        
        if (sql.includes('verification_codes') && sql.includes('phone_number')) {
          const phoneNumber = params[0];
          const code = this.verificationCodes.get(phoneNumber);
          return Promise.resolve(code || null);
        }
        
        return Promise.resolve(null);
      },
      
      all: (sql, params) => {
        if (sql.includes('verification_codes') && sql.includes('phone_number')) {
          const phoneNumber = params[0];
          const code = this.verificationCodes.get(phoneNumber);
          return Promise.resolve(code ? [code] : []);
        }
        
        return Promise.resolve([]);
      },
      
      run: (sql, params) => {
        if (sql.includes('INSERT INTO users')) {
          const phoneNumber = params[0];
          const user = {
            id: Date.now(),
            phone_number: phoneNumber,
            created_at: new Date().toISOString()
          };
          this.users.set(user.id, user);
          return Promise.resolve({ lastID: user.id, changes: 1 });
        }
        
        if (sql.includes('INSERT INTO verification_codes')) {
          const [phoneNumber, code, expiresAt] = params;
          const codeData = {
            id: Date.now(),
            phone_number: phoneNumber,
            code: code,
            expires_at: expiresAt,
            created_at: new Date().toISOString()
          };
          this.verificationCodes.set(phoneNumber, codeData);
          return Promise.resolve({ lastID: codeData.id, changes: 1 });
        }
        
        if (sql.includes('DELETE FROM users')) {
          this.users.clear();
          return Promise.resolve({ changes: this.users.size });
        }
        
        if (sql.includes('DELETE FROM verification_codes')) {
          this.verificationCodes.clear();
          return Promise.resolve({ changes: this.verificationCodes.size });
        }
        
        return Promise.resolve({ changes: 0 });
      }
    };
  }

  close() {
    if (this.connected) {
      this.users.clear();
      this.verificationCodes.clear();
      this.connected = false;
      console.log('数据库连接已关闭');
    }
  }
}

// 单例模式
const databaseManager = new DatabaseManager();

module.exports = databaseManager;