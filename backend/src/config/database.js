const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  connect(isTest = false) {
    const dbPath = isTest 
      ? path.join(__dirname, '../../database/taobei_test.db')
      : path.join(__dirname, '../../database/taobei.db');
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
      } else {
        console.log(`已连接到 ${isTest ? '测试' : '开发'} 数据库`);
        this.initTables();
      }
    });

    return this.db;
  }

  initTables() {
    console.log('开始初始化数据库表...');
    
    // 创建用户表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone_number TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
      )
    `, (err) => {
      if (err) {
        console.error('创建用户表失败:', err.message);
      } else {
        console.log('用户表创建成功');
      }
    });

    // 创建验证码表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id TEXT PRIMARY KEY,
        phone_number TEXT NOT NULL,
        code TEXT NOT NULL,
        type TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        ip_address TEXT,
        used BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('创建验证码表失败:', err.message);
      } else {
        console.log('验证码表创建成功');
      }
    });

    // 创建会话表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) {
        console.error('创建会话表失败:', err.message);
      } else {
        console.log('会话表创建成功');
      }
    });

    // 创建登录失败记录表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS login_failures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        failed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('创建登录失败记录表失败:', err.message);
      } else {
        console.log('登录失败记录表创建成功');
      }
    });

    console.log('数据库表初始化完成');
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('关闭数据库连接失败:', err.message);
        } else {
          console.log('数据库连接已关闭');
        }
      });
    }
  }
}

module.exports = new Database();